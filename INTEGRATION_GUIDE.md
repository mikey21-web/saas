# Supabase Integration Guide

This document maps where Supabase needs to be wired into existing Phase 1-9 code.

## Overview

**Migration Path:**
- Phase 9 uses mock data (hardcoded arrays)
- Wire Supabase → code persists real data
- Phases 10-15 depend on this wiring

**Files to Update (Priority Order):**

1. `lib/agent/executor.ts` — Save agent config, conversation history, usage
2. `app/api/checkout/stripe/route.ts` — Create subscription on payment
3. `app/api/checkout/razorpay/route.ts` — Same for Razorpay
4. `app/api/webhooks/stripe/route.ts` — Update subscription status
5. `app/api/webhooks/exotel/route.ts` → Queue LangGraph job
6. `app/api/webhooks/evolution/route.ts` → Queue LangGraph job
7. `app/(dashboard)/page.ts` — Load real agents instead of mock
8. `app/(dashboard)/contacts/page.tsx` — Load real contacts instead of mock
9. `app/(dashboard)/inbox/page.tsx` — Load real messages instead of mock
10. `app/(dashboard)/billing/page.tsx` — Load real subscription + usage

---

## 1. Executor.ts Integration (CRITICAL)

**File:** `lib/agent/executor.ts`

**Current Issue:** Messages disappear after agent response (not saved to DB)

**Integration Points:**

### A. Load Agent Config

Replace mock agentConfig load:

```typescript
// BEFORE (Line ~25)
const agentConfig = mockAgentConfig

// AFTER
import { getAgent } from '@/lib/supabase/queries'

const agentConfig = await getAgent(userId, agentId)
if (!agentConfig) throw new Error('Agent not found')
```

### B. Save Conversation History

After generating response (Line ~180):

```typescript
import { addMessage } from '@/lib/supabase/queries'

const message = await addMessage({
  conversation_id: conversationId,
  agent_id: agentId,
  role: 'agent',
  content: responseText,
  channel: channel,
  tool_name: toolName,
  tool_input: JSON.stringify(toolInput),
  tool_result: JSON.stringify(toolResult),
  cost_inr: costInr,
  response_time_ms: Date.now() - startTime,
})
```

### C. Update Usage Metrics

After each message (Line ~190):

```typescript
import { updateAgentUsage } from '@/lib/supabase/queries'

await updateAgentUsage(agentId, channel) // increment counter
```

### D. Check Kill Switch

Before running agent (Line ~15):

```typescript
import { getAgent } from '@/lib/supabase/queries'

const agent = await getAgent(userId, agentId)
if (agent.status === 'paused') {
  throw new Error('Agent is paused')
}
```

---

## 2. Stripe Checkout Integration

**File:** `app/api/checkout/stripe/route.ts`

**Current Issue:** TODO comment (Line 12)

**Integration:**

```typescript
import { supabaseAdmin } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  // ... existing checkout logic ...

  // AFTER creating Stripe session (Line ~30)
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('clerk_id', userId)
    .single()

  if (!user) {
    // Create user profile if first time
    await supabaseAdmin.from('users').insert({
      clerk_id: userId,
      email: userEmail,
    })
  }

  return NextResponse.json({
    sessionId: session.id,
    message: 'Checkout session created',
  })
}
```

---

## 3. Razorpay Webhook Integration

**File:** `app/api/webhooks/stripe/route.ts`

**Current Issue:** TODO comment (Line 24)

**Integration:**

```typescript
import { supabaseAdmin } from '@/lib/supabase/client'

// AFTER signature verification (Line ~16)
const customerId = sub.metadata?.clerk_id // Store clerk_id in Stripe metadata
const tier = (sub.metadata as Record<string, string>).tier

// CASE: customer.subscription.created/updated (Line ~20)
case 'customer.subscription.created':
case 'customer.subscription.updated': {
  const sub = event.data.object as Stripe.Subscription
  const tier = (sub.metadata as Record<string, string>).tier

  // Find user by Stripe customer ID
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('stripe_customer_id', sub.customer as string)
    .single()

  if (user) {
    // Update subscription in Supabase
    await supabaseAdmin
      .from('subscriptions')
      .upsert({
        user_id: user.id,
        stripe_customer_id: sub.customer as string,
        stripe_subscription_id: sub.id,
        plan_tier: tier as 'intern' | 'agent',
        status: sub.status as 'active' | 'trialing' | 'past_due',
        billing_amount: (sub.items.data[0].price?.unit_amount || 0) / 100,
        current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      }, { onConflict: 'stripe_subscription_id' })

    // Update user tier
    await supabaseAdmin
      .from('users')
      .update({ plan_tier: tier })
      .eq('id', user.id)
  }
  break
}

// CASE: customer.subscription.deleted (Line ~31)
case 'customer.subscription.deleted': {
  const sub = event.data.object as Stripe.Subscription

  await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'cancelled' })
    .eq('stripe_subscription_id', sub.id)

  break
}

// CASE: invoice.payment_failed (Line ~41)
case 'invoice.payment_failed': {
  const invoice = event.data.object as Stripe.Invoice

  // Find user and pause agents
  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', invoice.customer as string)
    .single()

  if (subscription) {
    await supabaseAdmin
      .from('agents')
      .update({ status: 'paused' })
      .eq('user_id', subscription.user_id)
  }

  break
}
```

---

## 4. Exotel Webhook Integration

**File:** `app/api/webhooks/exotel/route.ts`

**Current Issue:** TODO comment (Line 21)

**Integration:**

```typescript
import { getOrCreateConversation } from '@/lib/supabase/queries'
import { queueAgentJob } from '@/lib/queue/producer'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const from = formData.get('From') as string
    const to = formData.get('To') as string
    const body = formData.get('Body') as string

    if (!from) return NextResponse.json({ ok: true })

    // Parse agent phone from 'to' field (should match virtual number)
    const agentPhoneNumber = to

    // Find agent by phone number (stored in contacts or agent profile)
    // For now, assume it's passed as query param or stored
    const agentId = formData.get('agent_id') as string
    const userId = formData.get('user_id') as string

    if (direction === 'inbound' && body) {
      // Inbound SMS
      const conversation = await getOrCreateConversation(
        userId,
        agentId,
        from,
        'sms'
      )

      // Queue agent job
      await queueAgentJob({
        agentId,
        userId,
        channel: 'sms',
        from,
        message: body,
        conversationId: conversation.id,
      })

      return NextResponse.json({ ok: true })
    } else if (!body) {
      // Inbound call
      const conversation = await getOrCreateConversation(
        userId,
        agentId,
        from,
        'phone'
      )

      await queueAgentJob({
        agentId,
        userId,
        channel: 'phone',
        from,
        message: 'Inbound call received',
        conversationId: conversation.id,
      })

      // Return TwiML response
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Say>Thank you for calling. Your AI agent will be with you shortly.</Say>
        </Response>`,
        { headers: { 'Content-Type': 'application/xml' } }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    console.error('Exotel webhook error:', e)
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 })
  }
}
```

---

## 5. Evolution API Webhook Integration

**File:** `app/api/webhooks/evolution/route.ts`

**Current Issue:** TODO comment (Line 31)

**Integration:**

```typescript
import { getOrCreateConversation } from '@/lib/supabase/queries'
import { queueAgentJob } from '@/lib/queue/producer'

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json() as {
      event: string
      instance: string
      data?: {
        key?: { remoteJid?: string; id?: string }
        message?: { conversation?: string }
        pushName?: string
      }
    }

    if (payload.event !== 'messages.upsert') {
      return NextResponse.json({ ok: true })
    }

    const agentId = payload.instance
    const from = payload.data?.key?.remoteJid?.replace('@s.whatsapp.net', '') ?? ''
    const messageText = payload.data?.message?.conversation ?? ''
    const contactName = payload.data?.pushName ?? 'Unknown'

    if (!from || !messageText) {
      return NextResponse.json({ ok: true })
    }

    // Find agent by ID (you store this mapping when agent is created)
    // For now, assume agentId is passed directly
    const { data: agent } = await supabaseAdmin
      .from('agents')
      .select('user_id')
      .eq('id', agentId)
      .single()

    if (!agent) {
      console.warn(`Agent not found: ${agentId}`)
      return NextResponse.json({ ok: true })
    }

    const conversation = await getOrCreateConversation(
      agent.user_id,
      agentId,
      from,
      'whatsapp'
    )

    // Queue LangGraph job
    await queueAgentJob({
      agentId,
      userId: agent.user_id,
      channel: 'whatsapp',
      from,
      message: messageText,
      conversationId: conversation.id,
    })

    console.log(`[WhatsApp] Queued job for agent ${agentId}: ${messageText}`)

    return NextResponse.json({ ok: true, agentId, from })
  } catch (e: unknown) {
    console.error('Evolution webhook error:', e)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
```

---

## 6. Dashboard Pages

### A. Your Agents Dashboard

**File:** `app/(dashboard)/page.tsx`

```typescript
import { getAgentsByUser } from '@/lib/supabase/queries'
import { auth } from '@clerk/nextjs'

export default async function DashboardHome() {
  const { userId } = auth()
  const agents = await getAgentsByUser(userId!)

  return (
    <div>
      {/* ... existing layout ... */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map(agent => (
          <div key={agent.id} className="...">
            {/* Agent card */}
          </div>
        ))}
      </div>
    </div>
  )
}
```

### B. Contacts Page

**File:** `app/(dashboard)/contacts/page.tsx`

```typescript
import { getContactsByUser } from '@/lib/supabase/queries'
import { auth } from '@clerk/nextjs'

export default async function ContactsPage() {
  const { userId } = auth()
  const contacts = await getContactsByUser(userId!)

  return (
    <div>
      {/* Replace mockContacts with contacts */}
    </div>
  )
}
```

### C. Inbox Page

**File:** `app/(dashboard)/inbox/page.tsx`

```typescript
import { supabase } from '@/lib/supabase/client'
import { auth } from '@clerk/nextjs'

export default async function InboxPage() {
  const { userId } = auth()

  const { data: messages } = await supabase
    .from('inbox_messages')
    .select(`
      *,
      conversations(contact_phone_or_email, channel),
      agents(name)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  return (
    <div>
      {/* Use messages instead of mockMessages */}
    </div>
  )
}
```

### D. Billing Page

**File:** `app/(dashboard)/billing/page.tsx`

```typescript
import { supabase } from '@/lib/supabase/client'
import { auth } from '@clerk/nextjs'

export default async function BillingPage() {
  const { userId } = auth()

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const { data: agents } = await supabase
    .from('agents')
    .select('monthly_calls_used, monthly_emails_used, monthly_whatsapp_used')
    .eq('user_id', userId)

  // Calculate total usage across all agents
  const totalCallsUsed = agents?.reduce((sum, a) => sum + a.monthly_calls_used, 0) ?? 0
  // ... etc

  return (
    <div>
      {/* Display subscription and usage */}
    </div>
  )
}
```

---

## Implementation Checklist

- [ ] Set up Supabase project (Singapore region)
- [ ] Run migrations (01_init_schema.sql + 02_rls_policies.sql)
- [ ] Add credentials to `.env.local`
- [ ] Test connection with `/api/test-db` endpoint
- [ ] Wire executor.ts (save config, history, usage)
- [ ] Wire Stripe webhook
- [ ] Wire Razorpay webhook (when implemented)
- [ ] Wire Exotel webhook
- [ ] Wire Evolution webhook
- [ ] Update dashboard pages to load real data
- [ ] Test end-to-end: Create agent → Deploy → Send message → Check inbox
- [ ] Set up scheduled jobs to reset monthly usage (BullMQ)
- [ ] Deploy to Vercel (automatically uses prod Supabase)

---

## Deployment

When deploying to production:

1. Create new Supabase project (production)
2. Run migrations on prod
3. Update Vercel environment variables
4. Test all integrations in prod
5. Monitor Supabase logs for errors

All Phase 10+ features depend on this wiring. Without Supabase, data won't persist and RAG won't work.

