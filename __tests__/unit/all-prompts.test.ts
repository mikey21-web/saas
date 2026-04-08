import {
  getAgentPrompt,
  AGENT_CATALOG,
  AgentType,
  AgentPromptConfig,
} from '@/lib/agents/all-prompts'

const baseConfig: AgentPromptConfig = {
  businessName: 'Test Business',
  businessKnowledge: 'We sell test products',
}

describe('all-prompts', () => {
  describe('AGENT_CATALOG', () => {
    it('has exactly 20 agents', () => {
      expect(AGENT_CATALOG).toHaveLength(20)
    })

    it('every agent has required fields', () => {
      for (const agent of AGENT_CATALOG) {
        expect(agent.type).toBeTruthy()
        expect(agent.name).toBeTruthy()
        expect(agent.description).toBeTruthy()
        expect(agent.category).toMatch(/^(core|revenue|operations|intelligence)$/)
        expect(agent.icon).toBeTruthy()
        expect(Array.isArray(agent.useCases)).toBe(true)
      }
    })

    it('no duplicate agent types', () => {
      const types = AGENT_CATALOG.map((a) => a.type)
      const unique = new Set(types)
      expect(unique.size).toBe(types.length)
    })
  })

  describe('getAgentPrompt', () => {
    const allTypes = AGENT_CATALOG.map((a) => a.type) as AgentType[]

    it.each(allTypes)('generates a non-empty prompt for %s', (type) => {
      const prompt = getAgentPrompt(type, baseConfig)
      expect(typeof prompt).toBe('string')
      expect(prompt.length).toBeGreaterThan(100)
    })

    it('includes business name in all prompts', () => {
      for (const agent of AGENT_CATALOG) {
        const prompt = getAgentPrompt(agent.type, baseConfig)
        expect(prompt).toContain('Test Business')
      }
    })

    it('includes business knowledge in all prompts', () => {
      for (const agent of AGENT_CATALOG) {
        const prompt = getAgentPrompt(agent.type, baseConfig)
        expect(prompt).toContain('We sell test products')
      }
    })

    it('all prompts contain JSON format instruction', () => {
      for (const agent of AGENT_CATALOG) {
        const prompt = getAgentPrompt(agent.type, baseConfig)
        expect(prompt.toLowerCase()).toContain('json')
      }
    })

    it('leadcatcher prompt contains lead capture keywords', () => {
      const prompt = getAgentPrompt('leadcatcher', baseConfig)
      expect(prompt).toContain('lead')
      expect(prompt).toContain('contact')
    })

    it('salescloser prompt contains objection handling', () => {
      const prompt = getAgentPrompt('salescloser', baseConfig)
      expect(prompt.toLowerCase()).toContain('objection')
    })

    it('invoicebot prompt contains GST', () => {
      const prompt = getAgentPrompt('invoicebot', baseConfig)
      expect(prompt).toContain('GST')
    })

    it('contentengine prompt contains platform names', () => {
      const prompt = getAgentPrompt('contentengine', baseConfig)
      expect(prompt).toContain('LinkedIn')
      expect(prompt).toContain('Twitter')
    })
  })
})
