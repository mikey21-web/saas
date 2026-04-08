import { Annotation } from '@langchain/langgraph'

export const AppointBotAnnotation = Annotation.Root({
  // Input
  clinicName: Annotation<string>,
  patientPhone: Annotation<string>,
  patientName: Annotation<string>,
  appointmentDate: Annotation<string>, // ISO format
  appointmentTime: Annotation<string>, // HH:MM format
  appointmentType: Annotation<'consultation' | 'follow_up' | 'treatment' | 'checkup'>,
  doctorName: Annotation<string>,
  userMessage: Annotation<string>,

  // Scheduler outputs
  appointmentId: Annotation<string>,
  bookingConfirmed: Annotation<boolean>,
  bookingMessage: Annotation<string>,
  availableSlots: Annotation<string[]>,

  // Reminder outputs
  reminderSent: Annotation<boolean>,
  reminderMessage: Annotation<string>,
  reminderChannel: Annotation<'whatsapp' | 'sms' | 'email'>,
  reminderTimestamp: Annotation<string>,

  // NoShow Filler outputs
  noShowDetected: Annotation<boolean>,
  fillAttempted: Annotation<boolean>,
  alternativeSlots: Annotation<string[]>,
  fillSuccess: Annotation<boolean>,

  // Analyzer outputs
  appointmentStatus: Annotation<'scheduled' | 'reminded' | 'completed' | 'no_show' | 'filled'>,
  noShowRisk: Annotation<number>, // 1-10
  patientCategory: Annotation<'regular' | 'occasional' | 'new' | 'chronic_no_show'>,
  analytics: Annotation<Record<string, unknown>>,

  // Summary
  summary: Annotation<string>,
  error: Annotation<string | null>,
})

export type AppointBotState = typeof AppointBotAnnotation.State
