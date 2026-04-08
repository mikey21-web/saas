export type LeadSource = 'linkedin' | 'apollo' | 'google'
export type LeadStatus = 'new' | 'contacted' | 'interested' | 'meeting' | 'lost'
export type OutreachChannel = 'linkedin' | 'whatsapp' | 'email'
export type CopyVariant = 'A' | 'B' | 'C'
export type ReplyClassification = 'INTERESTED' | 'OBJECTION' | 'SPAM' | 'NOT_QUALIFIED'
export type ReplySentiment = 'positive' | 'neutral' | 'negative'
export type WorkflowEntryPoint = 'lead_finder' | 'qualifier' | 'scheduler' | 'analytics'
export type WorkflowStep =
  | 'lead_finder'
  | 'outreach_creator'
  | 'qualifier'
  | 'scheduler'
  | 'engagement'
  | 'analytics'
  | 'completed'

export interface Lead {
  id: string
  company_name: string
  decision_maker: string
  linkedin_url: string
  email: string
  phone: string
  niche: string
  company_size: number
  annual_revenue: number
  icp_score: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
  source: LeadSource
  scraped_at: Date
  status: LeadStatus
}

export interface LeadRecord extends Lead {
  website: string
  company_location: string
  job_title: string
  domain: string
  enrichment_status: 'pending' | 'completed' | 'failed'
  trigger_summary?: string
  metadata: Record<string, unknown>
}

export interface OutreachSequence {
  id: string
  lead_id: string
  copy_variant: CopyVariant
  channel: OutreachChannel
  sent_at: Date
  reply_received: boolean
  reply_text?: string
  reply_sentiment?: ReplySentiment
  reply_intent?: string
}

export interface OutreachSequenceRecord extends OutreachSequence {
  subject?: string
  message_body: string
  icebreaker: string
  cta_link: string
  trigger_summary?: string
  status: 'draft' | 'sent' | 'replied' | 'closed'
  metadata: Record<string, unknown>
}

export interface BookedMeeting {
  id: string
  lead_id: string
  calendly_event_id: string
  zoom_link: string
  scheduled_at: Date
  status: 'confirmed' | 'reminder_sent' | 'no_show' | 'completed'
}

export interface BookedMeetingRecord extends BookedMeeting {
  whatsapp_confirmation_sent: boolean
  reminders_sent_at: string[]
  metadata: Record<string, unknown>
}

export interface LeadFinderOutput {
  leads: LeadRecord[]
  icp_scores: number[]
}

export interface OutreachCreatorOutput {
  sequences: OutreachSequenceRecord[]
}

export interface QualifierOutput {
  classification: ReplyClassification
  next_action: string
}

export interface SchedulerOutput {
  meeting?: BookedMeetingRecord
  reminders: string[]
}

export interface EngagementOutput {
  sentiment: ReplySentiment
  escalate: boolean
}

export interface AnalyticsOutput {
  metrics: WorkflowMetrics
  insights: string[]
}

export interface WorkflowMetrics {
  leads_found: number
  replies_received: number
  meetings_booked: number
  reply_rate: number
  meeting_rate: number
  conversion_rate: number
  cost_per_meeting: number
  channel_performance: Record<OutreachChannel, number>
  best_times: Array<{ hour: number; replies: number }>
  variant_performance: Record<CopyVariant, number>
}

export interface WorkflowReplyPayload {
  channel: OutreachChannel
  sequence_id: string
  lead_id: string
  reply_text: string
  sender_name?: string
  sender_email?: string
  sender_phone?: string
  received_at: string
}

export interface CalendlyInvitee {
  name: string
  email: string
  phone?: string
  timezone?: string
  questions_and_answers?: Array<{ question: string; answer: string }>
}

export interface CalendlyEventPayload {
  event: 'invitee.created' | 'invitee.canceled' | 'reminder_24h' | 'reminder_1h' | 'no_show_followup'
  event_id: string
  scheduled_at: string
  lead_id: string
  invitee: CalendlyInvitee
}

export interface AnalyticsWindow {
  start: string
  end: string
}

export interface WorkflowTriggerPayload {
  reply?: WorkflowReplyPayload
  calendly_event?: CalendlyEventPayload
  analytics_window?: AnalyticsWindow
}

export interface WorkflowState {
  agent_id: string
  user_id: string
  entry_point: WorkflowEntryPoint
  lead_finder_output?: LeadFinderOutput
  outreach_creator_output?: OutreachCreatorOutput
  qualifier_output?: QualifierOutput
  scheduler_output?: SchedulerOutput
  engagement_output?: EngagementOutput
  analytics_output?: AnalyticsOutput
  leads: LeadRecord[]
  outreach_sequences: OutreachSequenceRecord[]
  booked_meetings: BookedMeetingRecord[]
  current_step: WorkflowStep
  next_step?: WorkflowStep
  errors: string[]
  completed_at?: Date
  source_counts: Partial<Record<LeadSource, number>>
  trigger_payload?: WorkflowTriggerPayload
  retry_count: number
}

export interface LeadSearchFilters {
  companySizeMin: number
  companySizeMax: number
  annualRevenueMin: number
  annualRevenueMax: number
  country: string
  niche?: string
}

export interface RawLeadCandidate {
  company_name: string
  decision_maker: string
  linkedin_url?: string
  email?: string
  phone?: string
  niche?: string
  company_size?: number
  annual_revenue?: number
  source: LeadSource
  website?: string
  company_location?: string
  job_title?: string
  domain?: string
  metadata?: Record<string, unknown>
}

export interface LeadScoreResult {
  score: LeadRecord['icp_score']
  reasoning: string
}

export interface TriggerContext {
  funding?: string
  new_hire?: string
  recent_post?: string
  website_headline?: string
  summary: string
}

export interface GeneratedVariant {
  variant: CopyVariant
  linkedin: { subject?: string; body: string }
  whatsapp: { body: string }
  email: { subject: string; body: string }
}

export interface QualificationAnalysis {
  classification: ReplyClassification
  sentiment: ReplySentiment
  intent: string
  meeting_preference?: string
  objection_key?: string
  auto_reply?: string
}

export interface EngagementAnalysis {
  sentiment: ReplySentiment
  intent: string
  escalate: boolean
  reply: string
}

export interface AnalyticsReportRecord {
  id: string
  user_id: string
  agent_id?: string
  generated_at: Date
  window_start: Date
  window_end: Date
  metrics: WorkflowMetrics
  insights: string[]
  best_variant: CopyVariant
}

export interface AiSdrWebhookEvent {
  id: string
  source: 'reply' | 'calendly'
  external_event_id: string
  user_id: string
  agent_id?: string
  status: 'received' | 'processing' | 'processed' | 'failed'
  payload: Record<string, unknown>
  processed_at?: string
  error_message?: string
}

export interface SupabaseTableRow {
  [key: string]: unknown
}

export interface RetryOptions {
  attempts: number
  backoffMs: number
  label: string
}

export interface AISdrEnv {
  anthropicApiKey: string
  groqApiKey: string
  supabaseUrl: string
  supabaseServiceRoleKey: string
  apolloApiKey: string
  hunterApiKey: string
  calendlyBookingLink: string
  linkedinApiToken?: string
  linkedinScraperEndpoint?: string
  googleSearchApiKey?: string
  googleSearchEngineId?: string
  serpApiKey?: string
  zoomAccountId?: string
  zoomClientId?: string
  zoomClientSecret?: string
  whatsappPhoneNumberId?: string
  whatsappAccessToken?: string
  gmailClientId?: string
  gmailClientSecret?: string
  gmailRefreshToken?: string
  gmailSender?: string
  crmWebhookUrl?: string
  slackWebhookUrl?: string
}

export interface RunAISdrInput {
  agent_id: string
  user_id: string
  entry_point: WorkflowEntryPoint
  trigger_payload?: WorkflowTriggerPayload
}

export interface RunAISdrOutput {
  state: WorkflowState
  duration_ms: number
}
