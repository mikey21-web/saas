import { Annotation } from '@langchain/langgraph'

export const SalesIntelligenceAnnotation = Annotation.Root({
  // Input
  userMessage: Annotation<string>,
  messageContext: Annotation<string>,
  contactName: Annotation<string>,
  contactPhone: Annotation<string>,

  // Conversation Intel
  intentScore: Annotation<number>,
  urgency: Annotation<string>,
  stage: Annotation<string>,
  emotion: Annotation<string>,
  churnRisk: Annotation<boolean>,
  upsellOpportunity: Annotation<boolean>,
  suggestedReply: Annotation<string>,
  hinglishDetected: Annotation<boolean>,

  // Revenue Forecaster
  forecast90Day: Annotation<number>,
  confidenceLevel: Annotation<string>,
  confidenceRange: Annotation<{ low: number; high: number }>,
  cashflowGaps: Annotation<Array<{ month: string; gap: number }>>,
  topRisks: Annotation<string[]>,
  recommendedActions: Annotation<string[]>,

  // Competitor Intel
  competitorThreats: Annotation<
    Array<{
      competitor: string
      threat_level: number
      changes: string[]
    }>
  >,

  // Integration summary
  summary: Annotation<string>,
  alertTriggered: Annotation<boolean>,
  nextAction: Annotation<string>,

  // Metadata
  alertsSent: Annotation<boolean>,
  error: Annotation<string | null>,
})

export type SalesIntelligenceState = typeof SalesIntelligenceAnnotation.State
