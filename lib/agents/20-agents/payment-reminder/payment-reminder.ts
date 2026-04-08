import { StateGraph, START, END } from '@langchain/langgraph'
import { PaymentReminderAnnotation, PaymentReminderState } from './types'
import { classifierAgent } from './agents/classifier-agent'
import { reminderAgent } from './agents/reminder-agent'
import { trackerAgent } from './agents/tracker-agent'
import { escalatorAgent } from './agents/escalator-agent'

const graph = new StateGraph(PaymentReminderAnnotation)
  .addNode('classifier', classifierAgent)
  .addNode('reminder', reminderAgent)
  .addNode('tracker', trackerAgent)
  .addNode('escalator', escalatorAgent)
  .addEdge(START, 'classifier')
  .addEdge('classifier', 'reminder')
  .addEdge('reminder', 'tracker')
  .addEdge('tracker', 'escalator')
  .addEdge('escalator', END)

const compiledGraph = graph.compile()

export async function runPaymentReminder(input: {
  invoiceId: string
  invoiceAmount: number
  customerPhone: string
  customerEmail: string
  businessName: string
  daysOverdue: number
  paymentMethod?: 'upi' | 'bank_transfer' | 'cash'
  invoiceContext?: string
}): Promise<{ state: PaymentReminderState; duration_ms: number }> {
  const start = Date.now()
  const result = await compiledGraph.invoke(
    {
      invoiceId: input.invoiceId,
      invoiceAmount: input.invoiceAmount,
      customerPhone: input.customerPhone,
      customerEmail: input.customerEmail,
      businessName: input.businessName,
      daysOverdue: input.daysOverdue,
      paymentMethod: input.paymentMethod || 'bank_transfer',
      invoiceContext: input.invoiceContext || '',
      // Classifier outputs
      status: 'due_soon',
      urgencyLevel: 'medium',
      riskScore: 0,
      // Reminder outputs
      reminderMessage: '',
      channel: 'whatsapp',
      reminderSent: false,
      reminderTimestamp: '',
      // Tracker outputs
      paymentStatus: 'pending',
      amountReceived: 0,
      lastPaymentDate: '',
      nextFollowUpDate: '',
      // Escalator outputs
      shouldEscalate: false,
      escalationReason: '',
      escalationNotes: '',
      assignedTo: '',
      // Summary
      summary: '',
      error: null,
    },
    { configurable: { thread_id: `payment_reminder_${Date.now()}` } }
  )
  return { state: result as PaymentReminderState, duration_ms: Date.now() - start }
}

export { graph as paymentReminderGraph }
