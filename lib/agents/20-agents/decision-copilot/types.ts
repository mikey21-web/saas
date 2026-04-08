import { Annotation } from '@langchain/langgraph'

export const DecisionCopilotAnnotation = Annotation.Root({
  // Input
  businessName: Annotation<string>,
  businessMetrics: Annotation<Record<string, unknown>>,
  recentEvents: Annotation<string>,
  userRole: Annotation<string>,
  decisionContext: Annotation<string>,

  // Analyzer outputs
  topChallenges: Annotation<string[]>,
  opportunities: Annotation<string[]>,
  risks: Annotation<string[]>,
  dataInsights: Annotation<Record<string, unknown>>,

  // Prioritizer outputs
  topThreeActions: Annotation<
    Array<{
      priority: number
      action: string
      impact: string
      deadline: string
      owner: string
    }>
  >,
  prioritizationMethod: Annotation<string>,
  urgencyScore: Annotation<number>,

  // Communicator outputs
  dailyBrief: Annotation<string>,
  actionItems: Annotation<string[]>,
  executiveSummary: Annotation<string>,
  deliveryChannel: Annotation<'email' | 'whatsapp' | 'slack' | 'dashboard'>,

  // Summary
  summary: Annotation<string>,
  error: Annotation<string | null>,
})

export type DecisionCopilotState = typeof DecisionCopilotAnnotation.State
