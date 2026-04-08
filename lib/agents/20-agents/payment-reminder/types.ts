import { Annotation } from '@langchain/langgraph'

export const PaymentReminderAnnotation = Annotation.Root({
  // Input
  invoiceId: Annotation<string>,
  invoiceAmount: Annotation<number>,
  customerPhone: Annotation<string>,
  customerEmail: Annotation<string>,
  businessName: Annotation<string>,
  daysOverdue: Annotation<number>,
  paymentMethod: Annotation<'upi' | 'bank_transfer' | 'cash'>,
  invoiceContext: Annotation<string>,

  // Classifier outputs
  status: Annotation<'on_track' | 'due_soon' | 'overdue' | 'severely_overdue'>,
  urgencyLevel: Annotation<'low' | 'medium' | 'high' | 'critical'>,
  riskScore: Annotation<number>, // 1-10 default risk of non-payment

  // Reminder outputs
  reminderMessage: Annotation<string>,
  channel: Annotation<'whatsapp' | 'email' | 'both'>,
  reminderSent: Annotation<boolean>,
  reminderTimestamp: Annotation<string>,

  // Tracker outputs
  paymentStatus: Annotation<'pending' | 'partially_paid' | 'paid'>,
  amountReceived: Annotation<number>,
  lastPaymentDate: Annotation<string>,
  nextFollowUpDate: Annotation<string>,

  // Escalator outputs
  shouldEscalate: Annotation<boolean>,
  escalationReason: Annotation<string>,
  escalationNotes: Annotation<string>,
  assignedTo: Annotation<string>,

  // Summary
  summary: Annotation<string>,
  error: Annotation<string | null>,
})

export type PaymentReminderState = typeof PaymentReminderAnnotation.State
