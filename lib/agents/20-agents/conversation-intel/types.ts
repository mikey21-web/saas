import { Annotation } from '@langchain/langgraph'

export const ConversationIntelAnnotation = Annotation.Root({
  // Input
  messageId: Annotation<string>,
  from: Annotation<string>,
  contactName: Annotation<string>,
  text: Annotation<string>,
  timestamp: Annotation<string>,

  // Context
  historyText: Annotation<string>,
  dealValue: Annotation<number | null>,
  isVip: Annotation<boolean>,
  conversationCount: Annotation<number>,
  crmStage: Annotation<string>,

  // AI Output
  intentScore: Annotation<number>,
  urgency: Annotation<'immediate' | 'this_week' | 'this_month' | 'browsing'>,
  stage: Annotation<'awareness' | 'consideration' | 'decision' | 'negotiation' | 'closed_won' | 'at_risk'>,
  emotion: Annotation<'positive' | 'neutral' | 'frustrated' | 'urgent' | 'confused'>,
  signals: Annotation<string[]>,
  upsellOpportunity: Annotation<boolean>,
  churnRisk: Annotation<boolean>,
  nextBestAction: Annotation<string>,
  suggestedReply: Annotation<string>,
  hinglishDetected: Annotation<boolean>,
  festivalContext: Annotation<string | null>,
  summary: Annotation<string>,

  // Alert
  shouldAlert: Annotation<boolean>,
  slackAlertSent: Annotation<boolean>,
  error: Annotation<string | null>,
})

export type ConversationIntelState = typeof ConversationIntelAnnotation.State
