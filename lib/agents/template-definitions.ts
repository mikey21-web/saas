/**
 * Agent Template Definitions
 *
 * Defines which credentials and configuration each agent template requires.
 * This ensures consistent credential collection across all agents in the store.
 */

export interface TemplateCredentialRequirement {
  field: 'whatsapp_number' | 'website_url' | 'openai_api_key' | 'groq_api_key' | 'use_diyaa_ai_powered'
  required: boolean
  description: string
}

export interface AgentTemplate {
  id: string
  name: string
  icon: string
  category: string
  description: string
  pain: string
  features: string[]
  targetBusiness: string
  badge?: string
  workflow?: boolean
  credentials: TemplateCredentialRequirement[]
}

// Credential requirement patterns
const PATTERN_WHATSAPP = {
  field: 'whatsapp_number' as const,
  required: true,
  description: 'WhatsApp Business Number for sending messages',
}

const PATTERN_WEBSITE = {
  field: 'website_url' as const,
  required: true,
  description: 'Your website URL for knowledge base context',
}

const PATTERN_WEBSITE_OPTIONAL = {
  field: 'website_url' as const,
  required: false,
  description: 'Your website URL (optional for knowledge base)',
}

const PATTERN_AI_MODEL = {
  field: 'use_diyaa_ai_powered' as const,
  required: true,
  description: 'AI Model selection (diyaa.ai powered or bring your own key)',
}

/**
 * Agent templates with their credential requirements
 * This is the source of truth for what each agent needs to function
 */
export const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: 'task-master',
    name: 'TaskMaster',
    icon: '📋',
    category: 'Operations',
    description: '5-agent workflow: Parse meetings → Assign tasks → Send notifications → Track progress → Report daily',
    pain: 'Monday meetings taking forever, tasks never get done',
    features: ['Parse meeting notes', 'AI task extraction', 'Smart assignment', 'Multi-channel notifications', 'Daily reports', 'Progress tracking'],
    targetBusiness: 'Any team with recurring meetings',
    badge: 'Multi-Agent 🚀',
    workflow: true,
    credentials: [PATTERN_WHATSAPP, PATTERN_AI_MODEL],
  },
  {
    id: 'lead-catcher',
    name: 'LeadCatcher',
    icon: '🎯',
    category: 'Sales',
    description: 'WhatsApp lead capture + instant follow-up',
    pain: 'Never miss a lead again',
    features: ['Lead capture', 'Auto-follow-up', 'WhatsApp messages'],
    targetBusiness: 'Any business',
    credentials: [PATTERN_WHATSAPP, PATTERN_AI_MODEL],
  },
  {
    id: 'appoint-bot',
    name: 'AppointBot',
    icon: '📅',
    category: 'Scheduling',
    description: 'Appointment booking + reminder via WhatsApp',
    pain: 'No-shows killing your business',
    features: ['Booking calendar', 'Reminders', 'Confirmations'],
    targetBusiness: 'Clinic, Salon, Gym, Consultant',
    credentials: [PATTERN_WHATSAPP, PATTERN_WEBSITE_OPTIONAL, PATTERN_AI_MODEL],
  },
  {
    id: 'pay-chaser',
    name: 'PayChaser',
    icon: '💰',
    category: 'Collections',
    description: 'Payment due reminders + UPI link sender',
    pain: 'Chasing money manually',
    features: ['Due reminders', 'UPI links', 'Payment tracking'],
    targetBusiness: 'Any business with invoices',
    credentials: [PATTERN_WHATSAPP, PATTERN_AI_MODEL],
  },
  {
    id: 'gst-mate',
    name: 'GSTMate',
    icon: '📊',
    category: 'Accounting',
    description: 'GST invoice generation + GSTR reconciliation',
    pain: 'Complex GST compliance',
    features: ['Invoice generation', 'GSTR sync', 'Tax compliance'],
    targetBusiness: 'Every registered Indian business',
    credentials: [PATTERN_AI_MODEL],
  },
  {
    id: 'customer-support',
    name: 'CustomerSupport',
    icon: '💬',
    category: 'Support',
    description: '24/7 WhatsApp/email/phone support',
    pain: 'Missing customer messages',
    features: ['Multi-channel', '24/7 support', 'Chat history'],
    targetBusiness: 'Retail, E-com, SaaS, D2C',
    credentials: [PATTERN_WHATSAPP, PATTERN_WEBSITE, PATTERN_AI_MODEL],
  },
  {
    id: 'review-guard',
    name: 'ReviewGuard',
    icon: '⭐',
    category: 'Reputation',
    description: 'Review monitoring + auto-response',
    pain: 'Bad reviews going unaddressed',
    features: ['Review monitor', 'Auto-reply', 'Multi-platform'],
    targetBusiness: 'Restaurant, Hotel, Salon, Retail',
    credentials: [PATTERN_WEBSITE, PATTERN_AI_MODEL],
  },
  {
    id: 'invoice-bot',
    name: 'InvoiceBot',
    icon: '📄',
    category: 'Accounting',
    description: 'Auto invoice + GST + UPI reconciliation',
    pain: 'Manual invoicing is time-consuming',
    features: ['Auto-invoice', 'GST handling', 'UPI integration'],
    targetBusiness: 'CA firms, Freelancers, MSMEs',
    credentials: [PATTERN_AI_MODEL],
  },
  {
    id: 'whats-blast',
    name: 'WhatsBlast',
    icon: '📢',
    category: 'Marketing',
    description: 'WhatsApp campaign broadcast + segmentation',
    pain: 'No way to reach customers at scale',
    features: ['Broadcasts', 'Segmentation', 'Analytics'],
    targetBusiness: 'Any consumer business',
    credentials: [PATTERN_WHATSAPP],
  },
  {
    id: 'doc-harvest',
    name: 'DocHarvest',
    icon: '📋',
    category: 'Operations',
    description: 'Client document collection automation',
    pain: 'Chasing clients for documents',
    features: ['Doc collection', 'Reminders', 'Organization'],
    targetBusiness: 'CA firm, Legal, Immigration',
    credentials: [PATTERN_WHATSAPP, PATTERN_AI_MODEL],
  },
  {
    id: 'nurture-bot',
    name: 'NurtureBot',
    icon: '🌱',
    category: 'Sales',
    description: 'Lead nurture drip sequence (multi-channel)',
    pain: 'Leads going cold without follow-up',
    features: ['Drip campaigns', 'Personalization', 'Multi-channel'],
    targetBusiness: 'Sales teams, D2C brands',
    credentials: [PATTERN_WHATSAPP, PATTERN_AI_MODEL],
  },
  {
    id: 'stock-sentinel',
    name: 'StockSentinel',
    icon: '📦',
    category: 'Operations',
    description: 'Inventory reorder alert + supplier order',
    pain: 'Stockouts losing revenue',
    features: ['Stock alerts', 'Auto-reorder', 'Supplier sync'],
    targetBusiness: 'Pharmacy, Retail, FMCG',
    credentials: [PATTERN_WHATSAPP, PATTERN_AI_MODEL],
  },
  {
    id: 'patient-pulse',
    name: 'PatientPulse',
    icon: '🏥',
    category: 'Healthcare',
    description: 'Patient follow-up + prescription refill reminder',
    pain: 'Patients forgetting follow-ups',
    features: ['Patient follow-up', 'Prescription reminder', 'Compliance'],
    targetBusiness: 'Clinic, Hospital, Diagnostic center',
    credentials: [PATTERN_WHATSAPP, PATTERN_AI_MODEL],
  },
  {
    id: 'resume-filter',
    name: 'ResumeFilter',
    icon: '👤',
    category: 'HR',
    description: 'AI resume screening + shortlisting agent',
    pain: 'Manual resume screening is tedious',
    features: ['Resume screening', 'Shortlisting', 'Ranking'],
    targetBusiness: 'HR/Recruitment agency, IT firm',
    credentials: [PATTERN_AI_MODEL],
  },
  {
    id: 'social-sched',
    name: 'SocialSched',
    icon: '📱',
    category: 'Marketing',
    description: 'Social media calendar + publisher (all platforms)',
    pain: 'Posting manually to every platform',
    features: ['Calendar', 'Multi-platform', 'Scheduling'],
    targetBusiness: 'Agency, D2C brand, Creator',
    credentials: [PATTERN_AI_MODEL],
  },
  {
    id: 'fee-collect',
    name: 'FeeCollect',
    icon: '🎓',
    category: 'Education',
    description: 'Fee reminder + installment tracking agent',
    pain: 'Fee collection delays',
    features: ['Fee reminder', 'Installment tracking', 'Reporting'],
    targetBusiness: 'School, Coaching institute, Tuition',
    credentials: [PATTERN_WHATSAPP, PATTERN_AI_MODEL],
  },
]

/**
 * Get template by ID
 */
export function getTemplate(templateId: string): AgentTemplate | undefined {
  return AGENT_TEMPLATES.find(t => t.id === templateId)
}

/**
 * Get credential requirements for a template
 */
export function getCredentialRequirements(templateId: string): TemplateCredentialRequirement[] {
  const template = getTemplate(templateId)
  return template?.credentials || []
}

/**
 * Check if a template requires a specific credential
 */
export function requiresCredential(
  templateId: string,
  field: TemplateCredentialRequirement['field']
): boolean {
  const reqs = getCredentialRequirements(templateId)
  const req = reqs.find(r => r.field === field)
  return req?.required || false
}

/**
 * Get all required credential fields for a template
 */
export function getRequiredCredentials(
  templateId: string
): TemplateCredentialRequirement['field'][] {
  const reqs = getCredentialRequirements(templateId)
  return reqs.filter(r => r.required).map(r => r.field)
}
