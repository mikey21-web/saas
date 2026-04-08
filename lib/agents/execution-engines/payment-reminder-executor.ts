import { runPaymentReminder } from '@/lib/agents/20-agents/payment-reminder/payment-reminder'
import { supabaseAdmin } from '@/lib/supabase/client'

export interface PaymentReminderContext {
  agentId: string
  userId?: string
  channel?: string
  fromPhone?: string
  fromEmail?: string
  metadata?: Record<string, unknown>
}

/**
 * Executor for Payment Reminder Agent
 * Tracks overdue invoices and sends smart reminders
 *
 * Trigger: Overdue invoice, manual payment check, scheduled reminder
 */
export async function executePaymentReminder(
  userMessage: string,
  ctx: PaymentReminderContext
): Promise<{ success: boolean; message: string; data?: Record<string, unknown> }> {
  try {
    // Parse invoice details from metadata or message
    const invoiceId = (ctx.metadata?.invoice_id as string) || 'inv_unknown'
    const invoiceAmount = (ctx.metadata?.invoice_amount as number) || 0
    const customerPhone = ctx.fromPhone || (ctx.metadata?.customer_phone as string) || ''
    const customerEmail = ctx.fromEmail || (ctx.metadata?.customer_email as string) || ''
    const daysOverdue = (ctx.metadata?.days_overdue as number) || 0
    const paymentMethod =
      (ctx.metadata?.payment_method as 'upi' | 'bank_transfer' | 'cash') || 'bank_transfer'

    const result = await runPaymentReminder({
      invoiceId,
      invoiceAmount,
      customerPhone,
      customerEmail,
      businessName: (ctx.metadata?.business_name as string) || 'Business',
      daysOverdue,
      paymentMethod,
      invoiceContext: userMessage,
    })

    const s = result.state
    const responseMessage = buildResponse(s)
    await storeExecution(s, ctx, userMessage)

    return {
      success: true,
      message: responseMessage,
      data: {
        invoice_id: s.invoiceId,
        status: s.status,
        urgency: s.urgencyLevel,
        risk_score: s.riskScore,
        reminder_message: s.reminderMessage,
        channel: s.channel,
        reminder_sent: s.reminderSent,
        payment_status: s.paymentStatus,
        amount_received: s.amountReceived,
        should_escalate: s.shouldEscalate,
        escalation_reason: s.escalationReason,
        next_followup: s.nextFollowUpDate,
        duration_ms: result.duration_ms,
      },
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[PaymentReminder] Execution error:', msg)
    return {
      success: false,
      message: 'Payment reminder processing failed.',
      data: { error: msg },
    }
  }
}

function buildResponse(s: any): string {
  let msg = `💰 Payment Reminder Report\n`
  msg += `Invoice: ${s.invoiceId} | ₹${s.invoiceAmount}\n`
  msg += `Status: ${s.status} | Urgency: ${s.urgencyLevel} | Risk: ${s.riskScore}/10\n`

  if (s.reminderSent) {
    msg += `✅ Reminder sent via ${s.channel}\n`
  }

  msg += `\nPayment: ${s.paymentStatus}`
  if (s.amountReceived > 0) {
    msg += ` (₹${s.amountReceived} received)`
  }

  if (s.shouldEscalate) {
    msg += `\n\n⚠️ ESCALATE: ${s.escalationReason}`
  } else {
    msg += `\n\nFollow-up: ${new Date(s.nextFollowUpDate).toLocaleDateString('en-IN')}`
  }

  return msg
}

async function storeExecution(
  state: any,
  ctx: PaymentReminderContext,
  userMessage: string
): Promise<void> {
  try {
    await supabaseAdmin.from('agent_executions').insert({
      agent_id: ctx.agentId,
      agent_type: 'paymentreminder',
      input: {
        message: userMessage,
        invoice_id: state.invoiceId,
        amount: state.invoiceAmount,
      },
      output: {
        status: state.status,
        reminder_message: state.reminderMessage,
        should_escalate: state.shouldEscalate,
      },
    })
  } catch (err) {
    console.error('[PaymentReminder] Store error:', err)
  }
}
