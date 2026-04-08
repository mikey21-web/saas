/**
 * Agent Configuration Manager
 *
 * Central hub that ties together:
 * - Onboarding config (what questions to ask)
 * - Dashboard config (what metrics to show)
 * - UI identity (colors, icons, tabs)
 * - Execution engine (how the agent runs)
 *
 * For each agent type, this provides a complete configuration.
 */

import { getAgentOnboarding, type AgentOnboardingConfig } from './agent-onboarding'
import { getAgentDashboard, type AgentDashboardConfig } from './agent-dashboards'
import { getAgentUIIdentity, type AgentUIIdentity } from './agent-ui-identity'
import { AGENT_TEMPLATES } from './template-definitions'

export interface AgentConfig {
  // From template definitions
  template: (typeof AGENT_TEMPLATES)[0]

  // From onboarding
  onboarding: AgentOnboardingConfig

  // From UI identity
  ui: AgentUIIdentity

  // From dashboard
  dashboard: AgentDashboardConfig

  // Derived properties
  hasWhatsApp: boolean
  hasInvoices: boolean
  hasCalendar: boolean
  hasDocuments: boolean
  hasContacts: boolean
  hasSequences: boolean
}

/**
 * Map agent type to the correct config
 */
export function getAgentConfig(agentType: string): AgentConfig {
  // Find the template
  const template =
    AGENT_TEMPLATES.find((t) => t.agentType === agentType || t.id === agentType) ||
    AGENT_TEMPLATES[0]

  // Get all configs
  const onboarding = getAgentOnboarding(agentType)
  const ui = getAgentUIIdentity(agentType)
  const dashboard = getAgentDashboard(agentType)

  // Determine capabilities from feature flags
  const features = onboarding.features

  return {
    template,
    onboarding,
    ui,
    dashboard,
    hasWhatsApp: features.chat || features.inbox,
    hasInvoices: features.invoices,
    hasCalendar: features.calendar,
    hasDocuments: features.documents,
    hasContacts: features.contacts,
    hasSequences: features.sequences,
  }
}

/**
 * Get all available agent types with their configs
 */
export function getAllAgentConfigs(): AgentConfig[] {
  const agentTypes = [...new Set(AGENT_TEMPLATES.map((t) => t.agentType))]
  return agentTypes.map((type) => getAgentConfig(type))
}

/**
 * Get agents grouped by category
 */
export function getAgentsByCategory(): Record<string, AgentConfig[]> {
  const categories: Record<string, AgentConfig[]> = {}

  for (const template of AGENT_TEMPLATES) {
    const config = getAgentConfig(template.agentType)
    if (!categories[template.category]) {
      categories[template.category] = []
    }
    categories[template.category].push(config)
  }

  return categories
}

/**
 * Check if an agent type requires specific credentials
 */
export function getRequiredCredentials(agentType: string): string[] {
  const onboarding = getAgentOnboarding(agentType)
  return onboarding.credentials.required.map((c) => c.field)
}

/**
 * Get the onboarding steps for an agent type
 */
export function getOnboardingSteps(agentType: string): AgentOnboardingConfig['steps'] {
  return getAgentOnboarding(agentType).steps
}

/**
 * Get dashboard sections for an agent type
 */
export function getDashboardSections(agentType: string): AgentDashboardConfig {
  return getAgentDashboard(agentType)
}

/**
 * Get UI identity for an agent type
 */
export function getUIIdentity(agentType: string): AgentUIIdentity {
  return getAgentUIIdentity(agentType)
}

/**
 * Resolve agent type from various possible sources
 */
export function resolveAgentType(
  agentType?: string,
  templateId?: string,
  fallback: string = 'customersupport'
): string {
  if (agentType) return agentType

  if (templateId) {
    const template = AGENT_TEMPLATES.find((t) => t.id === templateId)
    if (template) return template.agentType
  }

  return fallback
}

// Agent type aliases for backwards compatibility
const TYPE_ALIASES: Record<string, string> = {
  'whatsapp-assistant': 'customersupport',
  support: 'customersupport',
  invoice: 'invoicebot',
  gst: 'invoicebot',
  lead: 'leadcatcher',
  appointment: 'appointbot',
  booking: 'appointbot',
  payment: 'paymentreminder',
  chase: 'paymentreminder',
  task: 'teamexecutor',
  team: 'teamexecutor',
  review: 'feedbackanalyzer',
  docs: 'docharvest',
  content: 'contentengine',
}

export function normalizeAgentType(agentType: string): string {
  const normalized = agentType.toLowerCase().replace(/[-_\s]/g, '')
  return TYPE_ALIASES[normalized] || agentType
}
