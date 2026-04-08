import { supabaseAdmin } from '@/lib/supabase/client'

export interface NotificationPayload {
  userId: string
  agentId: string
  recipient: string
  channel: 'whatsapp' | 'email' | 'sms'
  message: string
  title?: string
  type: 'task_assignment' | 'reminder' | 'completion' | 'escalation' | 'report'
}

export interface NotificationResult {
  success: boolean
  notificationId?: string
  deliveryStatus: 'queued' | 'sent' | 'failed'
  message: string
  timestamp: string
}

/**
 * Mock WhatsApp Notification
 * Simulates sending WhatsApp messages without real API
 */
export async function sendWhatsAppNotification(
  payload: NotificationPayload
): Promise<NotificationResult> {
  const notificationId = `wa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const timestamp = new Date().toISOString()

  try {
    // Log notification to database
    ;(await (supabaseAdmin as any).from('notifications').insert({
      user_id: payload.userId,
      agent_id: payload.agentId,
      recipient: payload.recipient,
      channel: 'whatsapp',
      notification_type: payload.type,
      subject: payload.title || payload.message.substring(0, 50),
      message: payload.message,
      status: 'sent',
      delivery_timestamp: timestamp,
      metadata: {
        notificationId,
        mock: true,
        simulated: true,
      },
    })) as any

    console.log(
      `[WhatsApp Mock] Sent to ${payload.recipient}: ${payload.message.substring(0, 50)}...`
    )

    return {
      success: true,
      notificationId,
      deliveryStatus: 'sent',
      message: `WhatsApp notification queued for ${payload.recipient}`,
      timestamp,
    }
  } catch (error) {
    console.error('WhatsApp notification error:', error)
    return {
      success: false,
      deliveryStatus: 'failed',
      message: `Failed to send WhatsApp: ${String(error)}`,
      timestamp,
    }
  }
}

/**
 * Mock Email Notification
 * Simulates sending emails without real API
 */
export async function sendEmailNotification(
  payload: NotificationPayload
): Promise<NotificationResult> {
  const notificationId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const timestamp = new Date().toISOString()

  try {
    // Log notification to database
    ;(await (supabaseAdmin as any).from('notifications').insert({
      user_id: payload.userId,
      agent_id: payload.agentId,
      recipient: payload.recipient,
      channel: 'email',
      notification_type: payload.type,
      subject: payload.title || 'Task Assignment Notification',
      message: payload.message,
      status: 'sent',
      delivery_timestamp: timestamp,
      metadata: {
        notificationId,
        mock: true,
        simulated: true,
      },
    })) as any

    console.log(`[Email Mock] Sent to ${payload.recipient}: ${payload.title}`)

    return {
      success: true,
      notificationId,
      deliveryStatus: 'sent',
      message: `Email notification queued for ${payload.recipient}`,
      timestamp,
    }
  } catch (error) {
    console.error('Email notification error:', error)
    return {
      success: false,
      deliveryStatus: 'failed',
      message: `Failed to send email: ${String(error)}`,
      timestamp,
    }
  }
}

/**
 * Mock SMS Notification
 * Simulates sending SMS messages without real API
 */
export async function sendSMSNotification(
  payload: NotificationPayload
): Promise<NotificationResult> {
  const notificationId = `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const timestamp = new Date().toISOString()

  try {
    // Log notification to database
    ;(await (supabaseAdmin as any).from('notifications').insert({
      user_id: payload.userId,
      agent_id: payload.agentId,
      recipient: payload.recipient,
      channel: 'sms',
      notification_type: payload.type,
      subject: 'SMS',
      message: payload.message,
      status: 'sent',
      delivery_timestamp: timestamp,
      metadata: {
        notificationId,
        mock: true,
        simulated: true,
      },
    })) as any

    console.log(`[SMS Mock] Sent to ${payload.recipient}: ${payload.message.substring(0, 30)}...`)

    return {
      success: true,
      notificationId,
      deliveryStatus: 'sent',
      message: `SMS notification queued for ${payload.recipient}`,
      timestamp,
    }
  } catch (error) {
    console.error('SMS notification error:', error)
    return {
      success: false,
      deliveryStatus: 'failed',
      message: `Failed to send SMS: ${String(error)}`,
      timestamp,
    }
  }
}

/**
 * Router function to send notification via appropriate channel
 */
export async function sendNotification(payload: NotificationPayload): Promise<NotificationResult> {
  switch (payload.channel) {
    case 'whatsapp':
      return sendWhatsAppNotification(payload)
    case 'email':
      return sendEmailNotification(payload)
    case 'sms':
      return sendSMSNotification(payload)
    default:
      return {
        success: false,
        deliveryStatus: 'failed',
        message: `Unknown channel: ${payload.channel}`,
        timestamp: new Date().toISOString(),
      }
  }
}

/**
 * Batch send notifications
 */
export async function sendBatchNotifications(
  payloads: NotificationPayload[]
): Promise<NotificationResult[]> {
  return Promise.all(payloads.map((payload) => sendNotification(payload)))
}

/**
 * Log notification activity for audit trail
 */
export async function logNotificationActivity(
  userId: string,
  agentId: string,
  action: 'notification_sent' | 'notification_failed',
  details: Record<string, unknown>
): Promise<void> {
  try {
    ;(await (supabaseAdmin as any).from('activity_logs').insert({
      user_id: userId,
      agent_id: agentId,
      action,
      details,
    })) as any
  } catch (error) {
    console.error('Failed to log notification activity:', error)
  }
}
