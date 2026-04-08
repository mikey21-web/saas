import {
  AGENT_TEMPLATES,
  getTemplate,
  getCredentialRequirements,
  requiresCredential,
} from '@/lib/agents/template-definitions'

describe('template-definitions', () => {
  it('every template has an agentType field', () => {
    for (const t of AGENT_TEMPLATES) {
      expect(t.agentType).toBeTruthy()
    }
  })

  it('every template has required fields', () => {
    for (const t of AGENT_TEMPLATES) {
      expect(t.id).toBeTruthy()
      expect(t.name).toBeTruthy()
      expect(t.icon).toBeTruthy()
      expect(t.category).toBeTruthy()
      expect(t.description).toBeTruthy()
      expect(Array.isArray(t.features)).toBe(true)
      expect(Array.isArray(t.credentials)).toBe(true)
    }
  })

  it('no duplicate template IDs', () => {
    const ids = AGENT_TEMPLATES.map((t) => t.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  it('getTemplate returns correct template', () => {
    const t = getTemplate('lead-catcher')
    expect(t?.name).toBe('LeadCatcher')
    expect(t?.agentType).toBe('leadcatcher')
  })

  it('getTemplate returns undefined for unknown id', () => {
    expect(getTemplate('nonexistent')).toBeUndefined()
  })

  it('getCredentialRequirements returns array', () => {
    const reqs = getCredentialRequirements('lead-catcher')
    expect(Array.isArray(reqs)).toBe(true)
  })

  it('requiresCredential works correctly', () => {
    expect(requiresCredential('lead-catcher', 'whatsapp_number')).toBe(true)
    expect(requiresCredential('gst-mate', 'whatsapp_number')).toBe(false)
  })

  it('customer-support requires whatsapp and website', () => {
    expect(requiresCredential('customer-support', 'whatsapp_number')).toBe(true)
    expect(requiresCredential('customer-support', 'website_url')).toBe(true)
  })

  it('new agents are present', () => {
    const ids = AGENT_TEMPLATES.map((t) => t.id)
    expect(ids).toContain('lead-intent')
    expect(ids).toContain('sales-closer')
    expect(ids).toContain('conversation-intel')
    expect(ids).toContain('churn-prevention')
    expect(ids).toContain('revenue-forecaster')
    expect(ids).toContain('lifetime-value')
    expect(ids).toContain('email-automator')
    expect(ids).toContain('decision-copilot')
    expect(ids).toContain('process-automator')
    expect(ids).toContain('business-insights')
    expect(ids).toContain('market-intel')
    expect(ids).toContain('document-processor')
    expect(ids).toContain('content-engine')
  })
})
