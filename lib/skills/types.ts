import { z } from 'zod'

export interface AgentContext {
  agentId: string
  userId: string
  businessName: string
  channel: 'whatsapp' | 'email' | 'sms' | 'phone'
  conversationId: string
}

export interface SkillResult {
  success: boolean
  output: string
  data?: Record<string, unknown>
  error?: string
}

export interface Skill {
  id: string
  name: string
  description: string
  category: SkillCategory
  type: 'api' | 'prompt' | 'browser' | 'code'
  icon: string
  inputSchema: z.ZodSchema
  execute: (input: unknown, context: AgentContext) => Promise<SkillResult>
}

export type SkillCategory =
  | 'communication'
  | 'indian-business'
  | 'research'
  | 'sales'
  | 'finance'
  | 'marketing'
  | 'operations'
  | 'ai'
  | 'data'
