import { StateGraph, START, END } from '@langchain/langgraph'
import { EmailAutomatorAnnotation, EmailAutomatorState } from './types'
import { generatorAgent } from './agents/generator-agent'
import { personalizerAgent } from './agents/personalizer-agent'
import { schedulerAgent } from './agents/scheduler-agent'
import { trackerAgent } from './agents/tracker-agent'

const graph = new StateGraph(EmailAutomatorAnnotation)
  .addNode('generator', generatorAgent)
  .addNode('personalizer', personalizerAgent)
  .addNode('scheduler', schedulerAgent)
  .addNode('tracker', trackerAgent)
  .addEdge(START, 'generator')
  .addEdge('generator', 'personalizer')
  .addEdge('personalizer', 'scheduler')
  .addEdge('scheduler', 'tracker')
  .addEdge('tracker', END)

const compiledGraph = graph.compile()

export async function runEmailAutomator(input: {
  journeyName: string
  customerEmail: string
  customerName: string
  businessName: string
  journeyType: 'onboarding' | 'nurture' | 'winback' | 'upsell' | 'educational'
  journeyContext: string
}): Promise<{ state: EmailAutomatorState; duration_ms: number }> {
  const start = Date.now()
  const result = await compiledGraph.invoke(
    {
      journeyName: input.journeyName,
      customerEmail: input.customerEmail,
      customerName: input.customerName,
      businessName: input.businessName,
      journeyType: input.journeyType,
      journeyContext: input.journeyContext,
      // Generator outputs
      emailSequence: [],
      sequenceLength: 0,
      // Personalizer outputs
      personalizedEmails: [],
      personalizationApplied: false,
      // Scheduler outputs
      scheduled: false,
      scheduleTimestamps: [],
      scheduleStatus: '',
      // Tracker outputs
      trackingEnabled: false,
      trackingLinks: {},
      analyticsSetup: '',
      sendStartDate: '',
      // Summary
      summary: '',
      error: null,
    },
    { configurable: { thread_id: `email_automator_${Date.now()}` } }
  )
  return { state: result as EmailAutomatorState, duration_ms: Date.now() - start }
}

export { graph as emailAutomatorGraph }
