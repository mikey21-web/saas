/**
 * System Prompt Builder — constructs context-rich prompts for agents
 * Takes agent config + RAG context + conversation history → system prompt
 */

export interface AgentConfig {
  id: string
  userId: string
  name: string
  businessName: string
  industry: string
  products: string[]
  knowledgeBase: string
  tone: string
  activeHours: { start: number; end: number }
  channels: string[]
  modelTier: 'free' | 'pro' | 'enterprise'
  systemPromptOverride?: string
  language?: string
  maxResponseLength?: number
}

export interface PromptContext {
  agentConfig: AgentConfig
  ragContext?: string
  conversationHistory?: ConversationMessage[]
  currentChannel: string
  customerName?: string
  customerInfo?: string
  currentTime: string
  availableSkills: SkillSummary[]
}

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface SkillSummary {
  id: string
  name: string
  description: string
}

/**
 * Builds the complete system prompt for an agent execution run.
 */
export function buildSystemPrompt(ctx: PromptContext): string {
  const { agentConfig, ragContext, currentChannel, customerName, availableSkills } = ctx

  // If the user has a custom system prompt override, prepend it
  const customSection = agentConfig.systemPromptOverride
    ? `\n## Custom Instructions\n${agentConfig.systemPromptOverride}\n`
    : ''

  const skillList = availableSkills
    .map((s) => `- **${s.name}** (${s.id}): ${s.description}`)
    .join('\n')

  const productList = agentConfig.products.length > 0
    ? agentConfig.products.map((p) => `- ${p}`).join('\n')
    : 'No specific products configured.'

  const ragSection = ragContext
    ? `\n## Relevant Business Knowledge\n${ragContext}\n`
    : ''

  const customerSection = customerName
    ? `\nYou are currently talking to: **${customerName}**`
    : ''

  const channelGuidelines = getChannelGuidelines(currentChannel)

  const languageNote = agentConfig.language && agentConfig.language !== 'en'
    ? `\nPreferred language: ${agentConfig.language}. Respond in this language when the customer uses it.`
    : '\nRespond in the same language the customer uses. Default to English.'

  const maxLenNote = agentConfig.maxResponseLength
    ? `\nKeep responses under ${agentConfig.maxResponseLength} characters.`
    : '\nKeep responses concise and actionable.'

  return `You are **${agentConfig.name}**, an AI assistant for **${agentConfig.businessName}** in the **${agentConfig.industry}** industry.

## Your Role
You help customers and handle business operations autonomously. You are professional, helpful, and knowledgeable about the business.

## Tone & Style
- Tone: ${agentConfig.tone}
- Be natural and conversational, not robotic${languageNote}${maxLenNote}

## Business Information
**Products/Services:**
${productList}

**Knowledge Base:**
${agentConfig.knowledgeBase || 'No additional knowledge base configured.'}
${ragSection}${customSection}
## Available Tools
You can use these tools to take actions. Call them when appropriate:
${skillList}

## Channel: ${currentChannel}
${channelGuidelines}
${customerSection}

## Current Time
${ctx.currentTime} IST

## Important Rules
1. NEVER make up information. If you don't know something, say so.
2. NEVER share internal system details, API keys, or technical implementation.
3. If a customer asks something outside your scope, politely redirect or offer to connect them with a human.
4. For payment or financial actions, always confirm with the customer before proceeding.
5. Follow TRAI DND regulations — never send unsolicited messages.
6. If the conversation requires human intervention, use the escalation path.
7. Do not exceed 10 tool calls in a single conversation turn.
8. Be mindful of Indian business customs and local context.`
}

function getChannelGuidelines(channel: string): string {
  switch (channel) {
    case 'whatsapp':
      return `- Keep messages short (under 1000 chars ideal)
- Use line breaks for readability
- Emojis are acceptable but don't overuse
- You can send media (images, PDFs) when relevant
- Respect 24-hour messaging window for template messages`

    case 'email':
      return `- Use proper email formatting with greeting and sign-off
- Can be longer and more detailed than chat
- Use HTML formatting where helpful
- Include clear subject lines
- Always include unsubscribe option for marketing emails`

    case 'sms':
      return `- Maximum 160 characters per message
- Be extremely concise
- No formatting available
- Include business name for identification
- Only send during active hours (9am-9pm IST)`

    case 'phone':
      return `- Prepare concise talking points
- Be ready for voice interaction
- Keep call duration reasonable
- Confirm key details verbally`

    default:
      return `- Use appropriate formatting for the channel
- Be clear and concise`
  }
}

/**
 * Format conversation history into AI messages.
 * Limits to last N messages to stay within token budget.
 */
export function formatConversationHistory(
  history: ConversationMessage[],
  maxMessages: number = 10
): Array<{ role: 'user' | 'assistant'; content: string }> {
  const recent = history.slice(-maxMessages)
  return recent.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }))
}

/**
 * Build the tool definitions array for the AI model from skill summaries.
 */
export function buildToolDefinitions(
  skills: Array<{ id: string; name: string; description: string; inputSchema: unknown }>
): Array<{
  type: 'function'
  function: { name: string; description: string; parameters: Record<string, unknown> }
}> {
  return skills.map((skill) => ({
    type: 'function' as const,
    function: {
      name: skill.id,
      description: skill.description,
      parameters: (skill.inputSchema && typeof skill.inputSchema === 'object' && 'shape' in (skill.inputSchema as Record<string, unknown>))
        ? zodToJsonSchema(skill.inputSchema)
        : (skill.inputSchema as Record<string, unknown>) ?? { type: 'object', properties: {} },
    },
  }))
}

/**
 * Minimal Zod-to-JSON-Schema converter for tool definitions.
 * Handles the common cases used in our skill registry.
 */
function zodToJsonSchema(schema: unknown): Record<string, unknown> {
  // For actual production use, consider the zod-to-json-schema package.
  // This is a minimal fallback that wraps the schema description.
  if (schema && typeof schema === 'object' && '_def' in (schema as Record<string, unknown>)) {
    const def = (schema as Record<string, unknown>)._def as Record<string, unknown>
    if (def.typeName === 'ZodObject' && def.shape) {
      const shape = typeof def.shape === 'function' ? (def.shape as () => Record<string, unknown>)() : def.shape as Record<string, unknown>
      const properties: Record<string, unknown> = {}
      const required: string[] = []

      for (const [key, value] of Object.entries(shape)) {
        const fieldDef = (value as Record<string, unknown>)?._def as Record<string, unknown> | undefined
        if (fieldDef) {
          const isOptional = fieldDef.typeName === 'ZodOptional'
          if (!isOptional) {
            required.push(key)
          }
          properties[key] = { type: 'string', description: (fieldDef.description as string) ?? '' }
        }
      }

      return { type: 'object', properties, required }
    }
  }

  return { type: 'object', properties: {} }
}
