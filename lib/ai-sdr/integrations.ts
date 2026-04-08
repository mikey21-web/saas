import * as Sentry from '@sentry/node'
import Anthropic from '@anthropic-ai/sdk'
import { google } from 'googleapis'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import {
  AiSdrWebhookEvent,
  AISdrEnv,
  AnalyticsReportRecord,
  AnalyticsWindow,
  BookedMeetingRecord,
  CalendlyEventPayload,
  EngagementAnalysis,
  GeneratedVariant,
  LeadRecord,
  LeadScoreResult,
  LeadSearchFilters,
  OutreachChannel,
  OutreachSequenceRecord,
  QualificationAnalysis,
  RawLeadCandidate,
  TriggerContext,
  WorkflowMetrics,
  WorkflowReplyPayload,
} from './types'
import { extractJson, requireEnv, toScore, withRetry } from './utils'
import { acquireRateLimit } from './rate-limiter'

let anthropicClient: Anthropic | null = null
let supabaseClient: SupabaseClient | null = null

function getEnv(): AISdrEnv {
  return requireEnv()
}

export function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey: getEnv().anthropicApiKey })
  }
  return anthropicClient
}

export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseClient) {
    const env = getEnv()
    supabaseClient = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return supabaseClient
}

async function httpJson<T>(url: string, init: RequestInit, label: string, service?: string): Promise<T> {
  if (service) {
    await acquireRateLimit(service)
  }
  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
      signal: AbortSignal.timeout(45_000),
    })

    if (!response.ok) {
      const message = await response.text().catch(() => 'Unknown error')
      throw new Error(`${label} failed (${response.status}): ${message}`)
    }

    return (await response.json()) as T
  } catch (error) {
    Sentry.captureException(error, { tags: { service: service ?? 'unknown', label } })
    throw error
  }
}

async function httpText(url: string, init: RequestInit, label: string, service?: string): Promise<string> {
  if (service) {
    await acquireRateLimit(service)
  }
  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        ...(init.headers ?? {}),
      },
      signal: AbortSignal.timeout(45_000),
    })

    if (!response.ok) {
      const message = await response.text().catch(() => 'Unknown error')
      throw new Error(`${label} failed (${response.status}): ${message}`)
    }

    return response.text()
  } catch (error) {
    Sentry.captureException(error, { tags: { service: service ?? 'unknown', label } })
    throw error
  }
}

function anthropicTextFromResponse(message: Anthropic.Messages.Message): string {
  return message.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
}

export async function claudeJson<T>(system: string, prompt: string): Promise<T> {
  await acquireRateLimit('anthropic')
  try {
    const client = getAnthropicClient()
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2_048,
      temperature: 0.2,
      system,
      messages: [{ role: 'user', content: prompt }],
    })
    return extractJson<T>(anthropicTextFromResponse(message))
  } catch (error) {
    Sentry.captureException(error, { tags: { service: 'anthropic', operation: 'claudeJson' } })
    throw error
  }
}

export async function claudeText(system: string, prompt: string): Promise<string> {
  await acquireRateLimit('anthropic')
  try {
    const client = getAnthropicClient()
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2_048,
      temperature: 0.3,
      system,
      messages: [{ role: 'user', content: prompt }],
    })
    return anthropicTextFromResponse(message)
  } catch (error) {
    Sentry.captureException(error, { tags: { service: 'anthropic', operation: 'claudeText' } })
    throw error
  }
}

export async function groqJson<T>(system: string, prompt: string): Promise<T> {
  await acquireRateLimit('groq')
  try {
    const env = getEnv()
    const data = await httpJson<{
      choices: Array<{ message: { content: string } }>
    }>(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.groqApiKey}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          response_format: { type: 'json_object' },
          temperature: 0.1,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: prompt },
          ],
        }),
      },
      'Groq request',
      'groq',
    )

    return extractJson<T>(data.choices[0]?.message?.content ?? '')
  } catch (error) {
    Sentry.captureException(error, { tags: { service: 'groq', operation: 'groqJson' } })
    throw error
  }
}

export async function searchApolloLeads(filters: LeadSearchFilters): Promise<RawLeadCandidate[]> {
  await acquireRateLimit('apollo')
  try {
    const env = getEnv()
    const data = await httpJson<{
      people?: Array<Record<string, unknown>>
    }>(
      'https://api.apollo.io/api/v1/mixed_people/search',
      {
        method: 'POST',
        headers: {
          'X-Api-Key': env.apolloApiKey,
        },
        body: JSON.stringify({
          person_titles: ['Founder', 'CEO', 'Co-Founder', 'Director', 'Head of Growth'],
          organization_num_employees_ranges: [`${filters.companySizeMin},${filters.companySizeMax}`],
          organization_locations: [filters.country],
          page: 1,
          per_page: 25,
          q_organization_keyword_tags: filters.niche ? [filters.niche] : undefined,
        }),
      },
      'Apollo lead search',
      'apollo',
    )

    return (data.people ?? []).map((person) => ({
      company_name: String(readNested(person, 'organization.name') ?? ''),
      decision_maker: String(person.name ?? ''),
      linkedin_url: String(person.linkedin_url ?? ''),
      email: String(person.email ?? ''),
      phone: String(readNested(person, 'phone_numbers.0.sanitized_number') ?? ''),
      niche: String(readNested(person, 'organization.industry') ?? filters.niche ?? ''),
      company_size: Number(readNested(person, 'organization.estimated_num_employees') ?? 0),
      annual_revenue: Number(readNested(person, 'organization.estimated_annual_revenue') ?? 0),
      source: 'apollo',
      website: String(readNested(person, 'organization.website_url') ?? ''),
      company_location: String(readNested(person, 'organization.primary_domain') ? filters.country : readNested(person, 'organization.country') ?? filters.country),
      job_title: String(person.title ?? ''),
      domain: String(readNested(person, 'organization.primary_domain') ?? ''),
      metadata: { apollo_person_id: person.id, organization_id: person.organization_id },
    }))
  } catch (error) {
    Sentry.captureException(error, { tags: { service: 'apollo', operation: 'searchApolloLeads' } })
    throw error
  }
}

export async function searchGoogleLeads(filters: LeadSearchFilters): Promise<RawLeadCandidate[]> {
  const env = getEnv()
  const query = `${filters.niche ?? 'agency'} founder India ${filters.companySizeMin}-${filters.companySizeMax} employees`

  if (env.serpApiKey) {
    const data = await httpJson<{
      organic_results?: Array<Record<string, unknown>>
    }>(
      `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&api_key=${env.serpApiKey}`,
      { method: 'GET' },
      'SerpAPI search',
    )

    return (data.organic_results ?? []).slice(0, 15).map((result) => ({
      company_name: String(result.title ?? ''),
      decision_maker: '',
      source: 'google',
      website: String(result.link ?? ''),
      company_location: filters.country,
      niche: filters.niche,
      metadata: { snippet: result.snippet },
    }))
  }

  if (env.googleSearchApiKey && env.googleSearchEngineId) {
    const data = await httpJson<{
      items?: Array<Record<string, unknown>>
    }>(
      `https://www.googleapis.com/customsearch/v1?key=${env.googleSearchApiKey}&cx=${env.googleSearchEngineId}&q=${encodeURIComponent(query)}`,
      { method: 'GET' },
      'Google custom search',
    )

    return (data.items ?? []).slice(0, 15).map((item) => ({
      company_name: String(item.title ?? ''),
      decision_maker: '',
      source: 'google',
      website: String(item.link ?? ''),
      company_location: filters.country,
      niche: filters.niche,
      metadata: { snippet: item.snippet },
    }))
  }

  throw new Error('Google lead search requires SERPAPI_API_KEY or GOOGLE_SEARCH_API_KEY + GOOGLE_SEARCH_ENGINE_ID')
}

export async function searchLinkedInLeads(filters: LeadSearchFilters): Promise<RawLeadCandidate[]> {
  await acquireRateLimit('linkedin')
  try {
    const env = getEnv()

    if (env.linkedinScraperEndpoint) {
      return httpJson<RawLeadCandidate[]>(
        env.linkedinScraperEndpoint,
        {
          method: 'POST',
          body: JSON.stringify({
            country: filters.country,
            companySizeMin: filters.companySizeMin,
            companySizeMax: filters.companySizeMax,
            revenueMin: filters.annualRevenueMin,
            revenueMax: filters.annualRevenueMax,
            niche: filters.niche,
          }),
        },
        'LinkedIn scraper',
        'linkedin',
      )
    }

    if (env.linkedinApiToken) {
      const data = await httpJson<{
        elements?: Array<Record<string, unknown>>
      }>(
        'https://api.linkedin.com/v2/salesApiLeadSearch',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.linkedinApiToken}`,
          },
          body: JSON.stringify({
            country: filters.country,
            companyHeadcountRange: `${filters.companySizeMin}-${filters.companySizeMax}`,
            keyword: filters.niche,
          }),
        },
        'LinkedIn API search',
        'linkedin',
      )

      return (data.elements ?? []).map((element) => ({
        company_name: String(element.companyName ?? ''),
        decision_maker: String(element.fullName ?? ''),
        linkedin_url: String(element.profileUrl ?? ''),
        email: '',
        phone: '',
        niche: filters.niche,
        company_size: Number(element.companySize ?? 0),
        annual_revenue: Number(element.annualRevenue ?? 0),
        source: 'linkedin',
        website: String(element.companyWebsite ?? ''),
        company_location: String(element.location ?? filters.country),
        job_title: String(element.title ?? ''),
        domain: String(element.companyDomain ?? ''),
        metadata: { linkedin_id: element.id },
      }))
    }

    throw new Error('LinkedIn search requires LINKEDIN_SCRAPER_ENDPOINT or LINKEDIN_API_TOKEN')
  } catch (error) {
    Sentry.captureException(error, { tags: { service: 'linkedin', operation: 'searchLinkedInLeads' } })
    throw error
  }
}

export async function enrichLeadContact(lead: LeadRecord): Promise<LeadRecord> {
  const env = getEnv()
  const domain = lead.domain || lead.website.replace(/^https?:\/\//, '')

  if (!domain) {
    return { ...lead, enrichment_status: 'failed' }
  }

  const hunterData = await httpJson<{
    data?: {
      emails?: Array<Record<string, unknown>>
      organization?: string
      pattern?: string
    }
  }>(
    `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&api_key=${env.hunterApiKey}`,
    { method: 'GET' },
    'Hunter domain search',
  )

  const primaryEmail = String(hunterData.data?.emails?.[0]?.['value'] ?? lead.email)
  const metadata = { ...lead.metadata, hunter_pattern: hunterData.data?.pattern }

  return {
    ...lead,
    email: primaryEmail,
    enrichment_status: primaryEmail || lead.phone ? 'completed' : 'failed',
    metadata,
  }
}

export async function scoreLeadWithGroq(lead: LeadRecord): Promise<LeadScoreResult> {
  const result = await groqJson<{ score: number; reasoning: string }>(
    'Score B2B leads for an AI SDR agency. Return JSON with score 1-10 and reasoning.',
    `Lead: ${JSON.stringify(lead)}`,
  )

  return {
    score: toScore(result.score),
    reasoning: result.reasoning,
  }
}

export async function fetchTriggerContext(lead: LeadRecord): Promise<TriggerContext> {
  const query = `${lead.company_name} funding hiring post ${lead.domain || lead.website}`
  let summary = ''

  try {
    const results = await searchGoogleLeads({
      companySizeMin: 10,
      companySizeMax: 50,
      annualRevenueMin: 500_000,
      annualRevenueMax: 5_000_000,
      country: 'India',
      niche: lead.company_name,
    })

    summary = results
      .map((item) => String(item.metadata?.['snippet'] ?? item.company_name))
      .filter(Boolean)
      .slice(0, 3)
      .join(' | ')
  } catch {
    summary = query
  }

  return {
    summary,
    website_headline: lead.website,
    recent_post: summary,
  }
}

export async function generateOutreachVariants(lead: LeadRecord, trigger: TriggerContext, ctaLink: string): Promise<GeneratedVariant[]> {
  const payload = await claudeJson<{ variants: GeneratedVariant[] }>(
    'You personalize outbound SDR copy. Return JSON only. Each variant needs linkedin, whatsapp, and email copy.',
    `Lead: ${JSON.stringify(lead)}\nTrigger: ${JSON.stringify(trigger)}\nCTA: ${ctaLink}\nCreate 3 variants A/B/C. Keep them concise, specific, and India-friendly.`,
  )

  return payload.variants
}

export async function classifyReply(reply: WorkflowReplyPayload, sequence?: OutreachSequenceRecord): Promise<QualificationAnalysis> {
  return claudeJson<QualificationAnalysis>(
    'Classify inbound SDR replies. Return JSON only with classification, sentiment, intent, meeting_preference, objection_key, auto_reply.',
    `Reply: ${reply.reply_text}\nSequence: ${JSON.stringify(sequence ?? null)}`,
  )
}

export async function analyzeEngagement(reply: WorkflowReplyPayload, lead?: LeadRecord): Promise<EngagementAnalysis> {
  return claudeJson<EngagementAnalysis>(
    'Analyze engagement replies. Return JSON only with sentiment, intent, escalate, reply.',
    `Reply: ${JSON.stringify(reply)}\nLead: ${JSON.stringify(lead ?? null)}`,
  )
}

export async function generateAnalyticsInsights(metrics: WorkflowMetrics, reportContext: Record<string, unknown>): Promise<string[]> {
  const response = await claudeJson<{ insights: string[] }>(
    'You analyze SDR performance. Return JSON with an insights array of 3-6 concise findings.',
    `Metrics: ${JSON.stringify(metrics)}\nContext: ${JSON.stringify(reportContext)}`,
  )
  return response.insights
}

export async function saveQualifiedLeads(leads: LeadRecord[], userId: string, agentId: string): Promise<void> {
  if (leads.length === 0) {
    return
  }

  const supabase = getSupabaseAdmin()
  const rows = leads.map((lead) => ({
    ...lead,
    user_id: userId,
    agent_id: agentId,
    scraped_at: lead.scraped_at.toISOString(),
  }))
  const { error } = await supabase.from('qualified_leads').upsert(rows, { onConflict: 'id' })
  if (error) {
    throw new Error(`Failed to save qualified leads: ${error.message}`)
  }
}

export async function fetchFreshQualifiedLeads(userId: string, limit: number = 25): Promise<LeadRecord[]> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('qualified_leads')
    .select('*')
    .eq('status', 'new')
    .eq('user_id', userId)
    .order('scraped_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(`Failed to fetch fresh leads: ${error.message}`)
  }

  return (data ?? []).map(mapLeadRow)
}

export async function markLeadsContacted(leadIds: string[]): Promise<void> {
  if (leadIds.length === 0) {
    return
  }

  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from('qualified_leads').update({ status: 'contacted' }).in('id', leadIds)
  if (error) {
    throw new Error(`Failed to update lead status: ${error.message}`)
  }
}

export async function saveOutreachSequences(
  sequences: OutreachSequenceRecord[],
  userId: string,
  agentId: string,
): Promise<void> {
  if (sequences.length === 0) {
    return
  }

  const supabase = getSupabaseAdmin()
  const rows = sequences.map((sequence) => ({
    ...sequence,
    user_id: userId,
    agent_id: agentId,
    sent_at: sequence.sent_at.toISOString(),
  }))
  const { error } = await supabase.from('outreach_sequences').upsert(rows, { onConflict: 'id' })
  if (error) {
    throw new Error(`Failed to save outreach sequences: ${error.message}`)
  }
}

export async function fetchSequenceById(sequenceId: string): Promise<OutreachSequenceRecord | undefined> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.from('outreach_sequences').select('*').eq('id', sequenceId).maybeSingle()
  if (error) {
    throw new Error(`Failed to fetch outreach sequence: ${error.message}`)
  }
  return data ? mapSequenceRow(data) : undefined
}

export async function lookupSequenceContext(sequenceId: string): Promise<{ user_id: string; agent_id?: string; lead_id: string } | undefined> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('outreach_sequences')
    .select('user_id, agent_id, lead_id')
    .eq('id', sequenceId)
    .maybeSingle()
  if (error) {
    throw new Error(`Failed to lookup sequence context: ${error.message}`)
  }
  if (!data?.user_id || !data?.lead_id) {
    return undefined
  }
  return {
    user_id: String(data.user_id),
    agent_id: typeof data.agent_id === 'string' ? data.agent_id : undefined,
    lead_id: String(data.lead_id),
  }
}

export async function updateOutreachReply(payload: {
  sequenceId: string
  replyText: string
  sentiment: string
  intent: string
}): Promise<void> {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase
    .from('outreach_sequences')
    .update({
      reply_received: true,
      reply_text: payload.replyText,
      reply_sentiment: payload.sentiment,
      reply_intent: payload.intent,
      status: 'replied',
    })
    .eq('id', payload.sequenceId)
  if (error) {
    throw new Error(`Failed to update outreach reply: ${error.message}`)
  }
}

export async function fetchLeadById(leadId: string): Promise<LeadRecord | undefined> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.from('qualified_leads').select('*').eq('id', leadId).maybeSingle()
  if (error) {
    throw new Error(`Failed to fetch lead: ${error.message}`)
  }
  return data ? mapLeadRow(data) : undefined
}

export async function fetchObjectionHandler(key: string | undefined): Promise<string | undefined> {
  if (!key) {
    return undefined
  }

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.from('objection_handlers').select('response').eq('key', key).maybeSingle()
  if (error) {
    throw new Error(`Failed to fetch objection handler: ${error.message}`)
  }
  return data?.response as string | undefined
}

export async function saveBookedMeeting(meeting: BookedMeetingRecord, userId: string, agentId: string): Promise<void> {
  const supabase = getSupabaseAdmin()
  const row = {
    ...meeting,
    user_id: userId,
    agent_id: agentId,
    scheduled_at: meeting.scheduled_at.toISOString(),
  }
  const { error } = await supabase.from('booked_meetings').upsert(row, { onConflict: 'id' })
  if (error) {
    throw new Error(`Failed to save booked meeting: ${error.message}`)
  }
}

export async function saveEngagementLog(entry: {
  user_id: string
  agent_id?: string
  lead_id: string
  sequence_id: string
  sentiment: string
  intent: string
  escalate: boolean
  payload: Record<string, unknown>
}): Promise<void> {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from('engagement_logs').insert({
    id: `eng_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    ...entry,
    created_at: new Date().toISOString(),
  })
  if (error) {
    throw new Error(`Failed to save engagement log: ${error.message}`)
  }
}

export async function saveAnalyticsReport(report: AnalyticsReportRecord): Promise<void> {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from('analytics_reports').upsert({
    ...report,
    generated_at: report.generated_at.toISOString(),
    window_start: report.window_start.toISOString(),
    window_end: report.window_end.toISOString(),
  }, { onConflict: 'id' })
  if (error) {
    throw new Error(`Failed to save analytics report: ${error.message}`)
  }
}

export async function recordWebhookEvent(event: {
  source: 'reply' | 'calendly'
  external_event_id: string
  user_id: string
  agent_id?: string
  payload: Record<string, unknown>
}): Promise<{ accepted: boolean; event?: AiSdrWebhookEvent }> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('ai_sdr_webhook_events')
    .insert({
      source: event.source,
      external_event_id: event.external_event_id,
      user_id: event.user_id,
      agent_id: event.agent_id,
      status: 'received',
      payload: event.payload,
    })
    .select('*')
    .maybeSingle()

  if (!error && data) {
    return { accepted: true, event: mapWebhookEventRow(data) }
  }

  if (error?.code === '23505') {
    return { accepted: false }
  }

  throw new Error(`Failed to record webhook event: ${error?.message ?? 'Unknown error'}`)
}

export async function markWebhookEventStatus(
  externalEventId: string,
  source: 'reply' | 'calendly',
  status: 'processing' | 'processed' | 'failed',
  errorMessage?: string,
): Promise<void> {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase
    .from('ai_sdr_webhook_events')
    .update({
      status,
      processed_at: status === 'processed' ? new Date().toISOString() : null,
      error_message: errorMessage ?? null,
    })
    .eq('external_event_id', externalEventId)
    .eq('source', source)

  if (error) {
    throw new Error(`Failed to update webhook event status: ${error.message}`)
  }
}

export async function queryAnalyticsMetrics(userId: string, window: AnalyticsWindow): Promise<{
  leadsFound: number
  repliesReceived: number
  meetingsBooked: number
  channelPerformance: Record<OutreachChannel, number>
  variantPerformance: Record<'A' | 'B' | 'C', number>
  bestTimes: Array<{ hour: number; replies: number }>
}> {
  const supabase = getSupabaseAdmin()

  const [leadsRes, sequencesRes, meetingsRes] = await Promise.all([
    supabase
      .from('qualified_leads')
      .select('id, scraped_at', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('scraped_at', window.start)
      .lte('scraped_at', window.end),
    supabase
      .from('outreach_sequences')
      .select('channel, copy_variant, reply_received, sent_at')
      .eq('user_id', userId)
      .gte('sent_at', window.start)
      .lte('sent_at', window.end),
    supabase
      .from('booked_meetings')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('scheduled_at', window.start)
      .lte('scheduled_at', window.end),
  ])

  if (leadsRes.error) {
    throw new Error(`Failed to query leads analytics: ${leadsRes.error.message}`)
  }
  if (sequencesRes.error) {
    throw new Error(`Failed to query outreach analytics: ${sequencesRes.error.message}`)
  }
  if (meetingsRes.error) {
    throw new Error(`Failed to query meetings analytics: ${meetingsRes.error.message}`)
  }

  const channelPerformance: Record<OutreachChannel, number> = { linkedin: 0, whatsapp: 0, email: 0 }
  const variantPerformance: Record<'A' | 'B' | 'C', number> = { A: 0, B: 0, C: 0 }
  const bestTimesMap = new Map<number, number>()

  for (const row of sequencesRes.data ?? []) {
    const channel = row.channel as OutreachChannel
    const variant = row.copy_variant as 'A' | 'B' | 'C'
    if (row.reply_received) {
      channelPerformance[channel] += 1
      variantPerformance[variant] += 1
      const hour = new Date(String(row.sent_at)).getHours()
      bestTimesMap.set(hour, (bestTimesMap.get(hour) ?? 0) + 1)
    }
  }

  return {
    leadsFound: leadsRes.count ?? 0,
    repliesReceived: (sequencesRes.data ?? []).filter((row) => Boolean(row.reply_received)).length,
    meetingsBooked: meetingsRes.count ?? 0,
    channelPerformance,
    variantPerformance,
    bestTimes: [...bestTimesMap.entries()]
      .map(([hour, replies]) => ({ hour, replies }))
      .sort((a, b) => b.replies - a.replies)
      .slice(0, 5),
  }
}

export async function lookupLeadContext(leadId: string): Promise<{ user_id: string; agent_id?: string } | undefined> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('qualified_leads')
    .select('user_id, agent_id')
    .eq('id', leadId)
    .maybeSingle()
  if (error) {
    throw new Error(`Failed to lookup lead context: ${error.message}`)
  }
  if (!data?.user_id) {
    return undefined
  }
  return {
    user_id: String(data.user_id),
    agent_id: typeof data.agent_id === 'string' ? data.agent_id : undefined,
  }
}

export async function sendLinkedInMessage(url: string, body: string): Promise<void> {
  const env = getEnv()
  if (!env.linkedinScraperEndpoint && !env.linkedinApiToken) {
    throw new Error('LinkedIn delivery requires LINKEDIN_SCRAPER_ENDPOINT or LINKEDIN_API_TOKEN')
  }

  if (env.linkedinScraperEndpoint) {
    await httpJson(
      `${env.linkedinScraperEndpoint.replace(/\/$/, '')}/message`,
      {
        method: 'POST',
        body: JSON.stringify({ profileUrl: url, body }),
      },
      'LinkedIn message send',
    )
    return
  }

  await httpJson(
    'https://api.linkedin.com/v2/messages',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.linkedinApiToken}` },
      body: JSON.stringify({ recipientProfileUrl: url, body }),
    },
    'LinkedIn API message send',
  )
}

export async function sendWhatsAppMessage(to: string, body: string): Promise<void> {
  const env = getEnv()
  if (!env.whatsappAccessToken || !env.whatsappPhoneNumberId) {
    throw new Error('WhatsApp delivery requires WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID')
  }

  await httpJson(
    `https://graph.facebook.com/v21.0/${env.whatsappPhoneNumberId}/messages`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.whatsappAccessToken}` },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body },
      }),
    },
    'WhatsApp message send',
  )
}

export async function sendEmailMessage(to: string, subject: string, body: string): Promise<void> {
  const env = getEnv()
  if (!env.gmailClientId || !env.gmailClientSecret || !env.gmailRefreshToken || !env.gmailSender) {
    throw new Error('Email delivery requires Gmail OAuth environment variables')
  }

  const oauth2Client = new google.auth.OAuth2(env.gmailClientId, env.gmailClientSecret)
  oauth2Client.setCredentials({ refresh_token: env.gmailRefreshToken })
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client })
  const message = [
    `From: ${env.gmailSender}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    '',
    body,
  ].join('\n')

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: Buffer.from(message).toString('base64url'),
    },
  })
}

export async function deliverSequence(sequence: OutreachSequenceRecord, lead: LeadRecord): Promise<void> {
  if (sequence.channel === 'linkedin') {
    await sendLinkedInMessage(lead.linkedin_url, sequence.message_body)
    return
  }
  if (sequence.channel === 'whatsapp') {
    await sendWhatsAppMessage(lead.phone, sequence.message_body)
    return
  }
  await sendEmailMessage(lead.email, sequence.subject ?? 'Quick idea for your pipeline', sequence.message_body)
}

async function getZoomAccessToken(): Promise<string> {
  const env = getEnv()
  if (!env.zoomAccountId || !env.zoomClientId || !env.zoomClientSecret) {
    throw new Error('Zoom integration requires ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, and ZOOM_CLIENT_SECRET')
  }

  const responseText = await httpText(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(env.zoomAccountId)}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${env.zoomClientId}:${env.zoomClientSecret}`).toString('base64')}`,
      },
    },
    'Zoom token request',
  )

  return (JSON.parse(responseText) as { access_token: string }).access_token
}

export async function createZoomMeeting(event: CalendlyEventPayload): Promise<{ join_url: string; start_url?: string }> {
  const token = await getZoomAccessToken()
  return httpJson<{ join_url: string; start_url?: string }>(
    'https://api.zoom.us/v2/users/me/meetings',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        topic: `Sales call with ${event.invitee.name}`,
        type: 2,
        start_time: event.scheduled_at,
        duration: 30,
        timezone: event.invitee.timezone ?? 'Asia/Kolkata',
        settings: {
          waiting_room: true,
          join_before_host: false,
        },
      }),
    },
    'Zoom meeting creation',
  )
}

export async function sendCrmEvent(payload: Record<string, unknown>): Promise<void> {
  const env = getEnv()
  if (!env.crmWebhookUrl) {
    return
  }
  await httpJson(env.crmWebhookUrl, { method: 'POST', body: JSON.stringify(payload) }, 'CRM webhook')
}

export async function sendSlackEscalation(text: string): Promise<void> {
  const env = getEnv()
  if (!env.slackWebhookUrl) {
    return
  }
  await httpJson(env.slackWebhookUrl, { method: 'POST', body: JSON.stringify({ text }) }, 'Slack escalation')
}

function mapLeadRow(row: Record<string, unknown>): LeadRecord {
  return {
    id: String(row.id),
    company_name: String(row.company_name ?? ''),
    decision_maker: String(row.decision_maker ?? ''),
    linkedin_url: String(row.linkedin_url ?? ''),
    email: String(row.email ?? ''),
    phone: String(row.phone ?? ''),
    niche: String(row.niche ?? ''),
    company_size: Number(row.company_size ?? 0),
    annual_revenue: Number(row.annual_revenue ?? 0),
    icp_score: toScore(Number(row.icp_score ?? 1)),
    source: String(row.source ?? 'google') as LeadRecord['source'],
    scraped_at: new Date(String(row.scraped_at ?? new Date().toISOString())),
    status: String(row.status ?? 'new') as LeadRecord['status'],
    website: String(row.website ?? ''),
    company_location: String(row.company_location ?? ''),
    job_title: String(row.job_title ?? ''),
    domain: String(row.domain ?? ''),
    enrichment_status: String(row.enrichment_status ?? 'pending') as LeadRecord['enrichment_status'],
    trigger_summary: typeof row.trigger_summary === 'string' ? row.trigger_summary : undefined,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
  }
}

function mapSequenceRow(row: Record<string, unknown>): OutreachSequenceRecord {
  return {
    id: String(row.id),
    lead_id: String(row.lead_id),
    copy_variant: String(row.copy_variant) as OutreachSequenceRecord['copy_variant'],
    channel: String(row.channel) as OutreachSequenceRecord['channel'],
    sent_at: new Date(String(row.sent_at ?? new Date().toISOString())),
    reply_received: Boolean(row.reply_received),
    reply_text: typeof row.reply_text === 'string' ? row.reply_text : undefined,
    reply_sentiment: row.reply_sentiment as OutreachSequenceRecord['reply_sentiment'],
    reply_intent: typeof row.reply_intent === 'string' ? row.reply_intent : undefined,
    subject: typeof row.subject === 'string' ? row.subject : undefined,
    message_body: String(row.message_body ?? ''),
    icebreaker: String(row.icebreaker ?? ''),
    cta_link: String(row.cta_link ?? ''),
    trigger_summary: typeof row.trigger_summary === 'string' ? row.trigger_summary : undefined,
    status: String(row.status ?? 'draft') as OutreachSequenceRecord['status'],
    metadata: (row.metadata as Record<string, unknown>) ?? {},
  }
}

function mapWebhookEventRow(row: Record<string, unknown>): AiSdrWebhookEvent {
  return {
    id: String(row.id),
    source: String(row.source) as AiSdrWebhookEvent['source'],
    external_event_id: String(row.external_event_id),
    user_id: String(row.user_id),
    agent_id: typeof row.agent_id === 'string' ? row.agent_id : undefined,
    status: String(row.status) as AiSdrWebhookEvent['status'],
    payload: (row.payload as Record<string, unknown>) ?? {},
    processed_at: typeof row.processed_at === 'string' ? row.processed_at : undefined,
    error_message: typeof row.error_message === 'string' ? row.error_message : undefined,
  }
}

export { withRetry }

function readNested(input: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (Array.isArray(acc)) {
      const index = Number(key)
      return Number.isInteger(index) ? acc[index] : undefined
    }
    if (acc && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[key]
    }
    return undefined
  }, input)
}
