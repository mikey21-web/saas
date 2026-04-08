import { StateGraph, START, END } from '@langchain/langgraph'
import { AppointBotAnnotation, AppointBotState } from './types'
import { schedulerAgent } from './agents/scheduler-agent'
import { reminderAgent } from './agents/reminder-agent'
import { noShowFillerAgent } from './agents/no-show-filler-agent'
import { analyzerAgent } from './agents/analyzer-agent'

const graph = new StateGraph(AppointBotAnnotation)
  .addNode('scheduler', schedulerAgent)
  .addNode('reminder', reminderAgent)
  .addNode('no_show_filler', noShowFillerAgent)
  .addNode('analyzer', analyzerAgent)
  .addEdge(START, 'scheduler')
  .addEdge('scheduler', 'reminder')
  .addEdge('reminder', 'no_show_filler')
  .addEdge('no_show_filler', 'analyzer')
  .addEdge('analyzer', END)

const compiledGraph = graph.compile()

export async function runAppointBot(input: {
  clinicName: string
  patientPhone: string
  patientName: string
  appointmentDate: string
  appointmentTime: string
  appointmentType: 'consultation' | 'follow_up' | 'treatment' | 'checkup'
  doctorName: string
  userMessage: string
}): Promise<{ state: AppointBotState; duration_ms: number }> {
  const start = Date.now()
  const result = await compiledGraph.invoke(
    {
      clinicName: input.clinicName,
      patientPhone: input.patientPhone,
      patientName: input.patientName,
      appointmentDate: input.appointmentDate,
      appointmentTime: input.appointmentTime,
      appointmentType: input.appointmentType,
      doctorName: input.doctorName,
      userMessage: input.userMessage,
      // Scheduler outputs
      appointmentId: '',
      bookingConfirmed: false,
      bookingMessage: '',
      availableSlots: [],
      // Reminder outputs
      reminderSent: false,
      reminderMessage: '',
      reminderChannel: 'whatsapp',
      reminderTimestamp: '',
      // NoShow filler outputs
      noShowDetected: false,
      fillAttempted: false,
      alternativeSlots: [],
      fillSuccess: false,
      // Analyzer outputs
      appointmentStatus: 'scheduled',
      noShowRisk: 0,
      patientCategory: 'new',
      analytics: {},
      // Summary
      summary: '',
      error: null,
    },
    { configurable: { thread_id: `appoint_bot_${Date.now()}` } }
  )
  return { state: result as AppointBotState, duration_ms: Date.now() - start }
}

export { graph as appointBotGraph }
