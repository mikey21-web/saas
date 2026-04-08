import { createHash, randomUUID } from 'crypto'
import {
  AISdrEnv,
  AnalyticsWindow,
  LeadRecord,
  LeadSearchFilters,
  RawLeadCandidate,
  RetryOptions,
  WorkflowMetrics,
} from './types'

export function createId(prefix: string): string {
  return `${prefix}_${randomUUID()}`
}

export function createLeadId(candidate: Pick<RawLeadCandidate, 'company_name' | 'decision_maker' | 'source'>): string {
  const raw = `${candidate.company_name}:${candidate.decision_maker}:${candidate.source}`.toLowerCase()
  return `lead_${createHash('sha256').update(raw).digest('hex').slice(0, 16)}`
}

export function createSequenceId(leadId: string, channel: string, variant: string): string {
  return `seq_${createHash('sha256').update(`${leadId}:${channel}:${variant}`).digest('hex').slice(0, 16)}`
}

export function normalizeString(value: string | undefined): string {
  return (value ?? '').trim()
}

export function normalizeDomain(input: string | undefined): string {
  const value = normalizeString(input)
  if (!value) {
    return ''
  }

  const normalized = value.replace(/^https?:\/\//, '').replace(/^www\./, '')
  return normalized.split('/')[0]?.toLowerCase() ?? ''
}

export function normalizeWebsite(input: string | undefined): string {
  const domain = normalizeDomain(input)
  return domain ? `https://${domain}` : ''
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions,
): Promise<T> {
  let lastError: unknown

  for (let attempt = 1; attempt <= options.attempts; attempt += 1) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      if (attempt >= options.attempts) {
        break
      }
      await sleep(options.backoffMs * attempt)
    }
  }

  throw new Error(`${options.label} failed after ${options.attempts} attempts: ${String(lastError)}`)
}

export function extractJson<T>(input: string): T {
  const trimmed = input.trim()
  const match = trimmed.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
  if (!match) {
    throw new Error('No JSON object found in model response')
  }
  return JSON.parse(match[0]) as T
}

export function buildLeadRecord(candidate: RawLeadCandidate): LeadRecord {
  return {
    id: createLeadId(candidate),
    company_name: candidate.company_name,
    decision_maker: candidate.decision_maker,
    linkedin_url: normalizeString(candidate.linkedin_url),
    email: normalizeString(candidate.email),
    phone: normalizeString(candidate.phone),
    niche: normalizeString(candidate.niche),
    company_size: candidate.company_size ?? 0,
    annual_revenue: candidate.annual_revenue ?? 0,
    icp_score: 1,
    source: candidate.source,
    scraped_at: new Date(),
    status: 'new',
    website: normalizeWebsite(candidate.website),
    company_location: normalizeString(candidate.company_location),
    job_title: normalizeString(candidate.job_title),
    domain: normalizeDomain(candidate.domain ?? candidate.website),
    enrichment_status: 'pending',
    metadata: candidate.metadata ?? {},
  }
}

export function isQualifiedLead(lead: LeadRecord, filters: LeadSearchFilters): boolean {
  const sizeMatch =
    lead.company_size >= filters.companySizeMin && lead.company_size <= filters.companySizeMax
  const revenueMatch =
    lead.annual_revenue >= filters.annualRevenueMin && lead.annual_revenue <= filters.annualRevenueMax
  const countryMatch = lead.company_location.toLowerCase().includes(filters.country.toLowerCase())
  const nicheMatch = filters.niche ? lead.niche.toLowerCase().includes(filters.niche.toLowerCase()) : true
  return sizeMatch && revenueMatch && countryMatch && nicheMatch
}

export function mergeUniqueLeads(existing: LeadRecord[], incoming: LeadRecord[]): LeadRecord[] {
  const map = new Map<string, LeadRecord>()
  for (const lead of existing) {
    map.set(lead.id, lead)
  }
  for (const lead of incoming) {
    const previous = map.get(lead.id)
    map.set(lead.id, previous ? { ...previous, ...lead, metadata: { ...previous.metadata, ...lead.metadata } } : lead)
  }
  return [...map.values()]
}

export function mergeUniqueById<T extends { id: string }>(existing: T[], incoming: T[]): T[] {
  const map = new Map<string, T>()
  for (const item of existing) {
    map.set(item.id, item)
  }
  for (const item of incoming) {
    map.set(item.id, item)
  }
  return [...map.values()]
}

export function countSources(leads: LeadRecord[]): Partial<Record<LeadRecord['source'], number>> {
  return leads.reduce<Partial<Record<LeadRecord['source'], number>>>((acc, lead) => {
    acc[lead.source] = (acc[lead.source] ?? 0) + 1
    return acc
  }, {})
}

export function requireEnv(): AISdrEnv {
  const required = {
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    groqApiKey: process.env.GROQ_API_KEY,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    apolloApiKey: process.env.APOLLO_API_KEY,
    hunterApiKey: process.env.HUNTER_API_KEY,
    calendlyBookingLink: process.env.CALENDLY_BOOKING_LINK,
  }

  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key)

  if (missing.length > 0) {
    throw new Error(`Missing required AI SDR environment variables: ${missing.join(', ')}`)
  }

  return {
    anthropicApiKey: required.anthropicApiKey ?? '',
    groqApiKey: required.groqApiKey ?? '',
    supabaseUrl: required.supabaseUrl ?? '',
    supabaseServiceRoleKey: required.supabaseServiceRoleKey ?? '',
    apolloApiKey: required.apolloApiKey ?? '',
    hunterApiKey: required.hunterApiKey ?? '',
    calendlyBookingLink: required.calendlyBookingLink ?? '',
    linkedinApiToken: process.env.LINKEDIN_API_TOKEN,
    linkedinScraperEndpoint: process.env.LINKEDIN_SCRAPER_ENDPOINT,
    googleSearchApiKey: process.env.GOOGLE_SEARCH_API_KEY,
    googleSearchEngineId: process.env.GOOGLE_SEARCH_ENGINE_ID,
    serpApiKey: process.env.SERPAPI_API_KEY,
    zoomAccountId: process.env.ZOOM_ACCOUNT_ID,
    zoomClientId: process.env.ZOOM_CLIENT_ID,
    zoomClientSecret: process.env.ZOOM_CLIENT_SECRET,
    whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    gmailClientId: process.env.GMAIL_CLIENT_ID,
    gmailClientSecret: process.env.GMAIL_CLIENT_SECRET,
    gmailRefreshToken: process.env.GMAIL_REFRESH_TOKEN,
    gmailSender: process.env.GMAIL_SENDER,
    crmWebhookUrl: process.env.CRM_WEBHOOK_URL,
    slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
  }
}

export function defaultLeadFilters(): LeadSearchFilters {
  return {
    companySizeMin: 10,
    companySizeMax: 50,
    annualRevenueMin: 500_000,
    annualRevenueMax: 5_000_000,
    country: 'India',
  }
}

export function defaultAnalyticsWindow(): AnalyticsWindow {
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - 1)
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  }
}

export function computeRates(found: number, replies: number, meetings: number): Pick<WorkflowMetrics, 'reply_rate' | 'meeting_rate' | 'conversion_rate'> {
  const replyRate = found > 0 ? replies / found : 0
  const meetingRate = replies > 0 ? meetings / replies : 0
  const conversionRate = found > 0 ? meetings / found : 0
  return {
    reply_rate: Number(replyRate.toFixed(4)),
    meeting_rate: Number(meetingRate.toFixed(4)),
    conversion_rate: Number(conversionRate.toFixed(4)),
  }
}

export function toScore(value: number): LeadRecord['icp_score'] {
  const bounded = Math.max(1, Math.min(10, Math.round(value)))
  return bounded as LeadRecord['icp_score']
}

export function bestVariant(variantPerformance: Record<'A' | 'B' | 'C', number>): 'A' | 'B' | 'C' {
  return (Object.entries(variantPerformance).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'A') as 'A' | 'B' | 'C'
}
