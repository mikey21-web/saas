import { Annotation } from '@langchain/langgraph'

export const EmailAutomatorAnnotation = Annotation.Root({
  // Input
  journeyName: Annotation<string>,
  customerEmail: Annotation<string>,
  customerName: Annotation<string>,
  businessName: Annotation<string>,
  journeyType: Annotation<'onboarding' | 'nurture' | 'winback' | 'upsell' | 'educational'>,
  journeyContext: Annotation<string>,

  // Generator outputs
  emailSequence: Annotation<
    Array<{
      subject: string
      body: string
      sendTime: string
      type: string
    }>
  >,
  sequenceLength: Annotation<number>,

  // Personalizer outputs
  personalizedEmails: Annotation<
    Array<{
      index: number
      subject: string
      body: string
      personalVariants: Record<string, string>
    }>
  >,
  personalizationApplied: Annotation<boolean>,

  // Scheduler outputs
  scheduled: Annotation<boolean>,
  scheduleTimestamps: Annotation<string[]>,
  scheduleStatus: Annotation<string>,

  // Tracker outputs
  trackingEnabled: Annotation<boolean>,
  trackingLinks: Annotation<Record<string, string>>,
  analyticsSetup: Annotation<string>,
  sendStartDate: Annotation<string>,

  // Summary
  summary: Annotation<string>,
  error: Annotation<string | null>,
})

export type EmailAutomatorState = typeof EmailAutomatorAnnotation.State
