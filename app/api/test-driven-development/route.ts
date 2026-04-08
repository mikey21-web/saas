import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'

export async function POST(req: NextRequest) {
  try {
    const { testId } = await req.json()

    const startTime = Date.now()

    switch (testId) {
      case 'razorpay-webhook': {
        // Test Razorpay webhook signature verification
        const body = JSON.stringify({
          event: 'payment.authorized',
          payload: {
            payment: {
              entity: {
                id: 'pay_test_razorpay',
                status: 'captured',
                notes: {
                  userId: 'test-user-razorpay',
                  agentId: 'test-agent-razorpay',
                  plan: 'agent',
                },
              },
            },
          },
        })

        const response = await fetch('http://localhost:3000/api/webhooks/razorpay', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-razorpay-signature': 'test-signature',
          },
          body,
        })

        const result = await response.json()
        const duration = Date.now() - startTime

        return NextResponse.json({
          passed: response.ok,
          duration,
          message: response.ok ? 'Razorpay webhook processed successfully' : result.error,
        })
      }

      case 'stripe-webhook': {
        // Test Stripe webhook signature verification
        const body = JSON.stringify({
          type: 'checkout.session.completed',
          data: {
            object: {
              id: 'cs_test_stripe',
              payment_status: 'paid',
              amount_total: 499900,
              currency: 'inr',
              client_reference_id: 'agent_test-agent-stripe_test-user-stripe',
              payment_intent: 'pi_test_stripe',
              metadata: {
                plan: 'agent',
                agent_id: 'test-agent-stripe',
                user_id: 'test-user-stripe',
              },
            },
          },
        })

        const response = await fetch('http://localhost:3000/api/webhooks/stripe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'stripe-signature': 'test-signature',
          },
          body,
        })

        const result = await response.json()
        const duration = Date.now() - startTime

        return NextResponse.json({
          passed: response.ok,
          duration,
          message: response.ok ? 'Stripe webhook processed successfully' : result.error,
        })
      }

      case 'agent-creation': {
        // Test agent creation with skipPayment
        const response = await fetch('http://localhost:3000/api/onboard/deploy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentType: 'TestAgent',
            agentIcon: '🧪',
            config: {
              businessName: 'Test Business',
              industry: 'Testing',
              products: 'Test Product',
              targetCustomers: 'Test Customers',
              tone: 'friendly',
              language: 'English',
              agentPersonality: 'Helpful',
              activeHours: '9:00-21:00',
              keyInstructions: 'Be helpful',
              agentName: 'Test Agent',
            },
            userId: 'test-user-creation',
            plan: 'agent',
            skipPayment: true,
          }),
        })

        const result = await response.json()
        const duration = Date.now() - startTime

        return NextResponse.json({
          passed: result.success && result.agentId,
          duration,
          message: result.success ? `Agent created: ${result.agentId}` : result.error,
        })
      }

      case 'payment-activation': {
        // Test agent activation after payment
        // 1. Create agent with skipPayment
        const createResponse = await fetch('http://localhost:3000/api/onboard/deploy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentType: 'TestAgent',
            agentIcon: '🧪',
            config: {
              businessName: 'Test Business',
              industry: 'Testing',
              products: 'Test Product',
              targetCustomers: 'Test Customers',
              tone: 'friendly',
              language: 'English',
              agentPersonality: 'Helpful',
              activeHours: '9:00-21:00',
              keyInstructions: 'Be helpful',
              agentName: 'Payment Test Agent',
            },
            userId: 'test-user-activation',
            plan: 'agent',
            skipPayment: true,
          }),
        })

        const createResult = await createResponse.json()

        if (!createResult.success) {
          return NextResponse.json({
            passed: false,
            duration: Date.now() - startTime,
            message: 'Agent creation failed',
          })
        }

        // 2. Trigger webhook to activate
        const webhookBody = JSON.stringify({
          event: 'payment.authorized',
          payload: {
            payment: {
              entity: {
                id: 'pay_activation_test',
                status: 'captured',
                notes: {
                  userId: 'test-user-activation',
                  agentId: createResult.agentId,
                  plan: 'agent',
                },
              },
            },
          },
        })

        const webhookResponse = await fetch('http://localhost:3000/api/webhooks/razorpay', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-razorpay-signature': 'test-signature',
          },
          body: webhookBody,
        })

        // 3. Verify agent status changed to active
        const { data: agent } = (await supabaseAdmin
          .from('agents')
          .select('status, deployed_at')
          .eq('id', createResult.agentId)
          .single()) as { data: { status: string } | null }

        const duration = Date.now() - startTime
        const passed = webhookResponse.ok && agent?.status === 'active'

        return NextResponse.json({
          passed,
          duration,
          message: passed
            ? `Agent activated: ${agent?.status}`
            : `Activation failed. Status: ${agent?.status}`,
        })
      }

      case 'activity-logging': {
        // Test activity logging on payment
        const userId = 'test-user-logging'
        const { data: existingLogs } = await supabaseAdmin
          .from('activity_logs')
          .select('id')
          .eq('user_id', userId)

        const existingCount = existingLogs?.length || 0

        // Create and trigger payment
        const createResponse = await fetch('http://localhost:3000/api/onboard/deploy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentType: 'TestAgent',
            agentIcon: '🧪',
            config: {
              businessName: 'Test Business',
              industry: 'Testing',
              products: 'Test Product',
              targetCustomers: 'Test Customers',
              tone: 'friendly',
              language: 'English',
              agentPersonality: 'Helpful',
              activeHours: '9:00-21:00',
              keyInstructions: 'Be helpful',
              agentName: 'Logging Test Agent',
            },
            userId,
            plan: 'agent',
            skipPayment: true,
          }),
        })

        const createResult = await createResponse.json()

        // Trigger webhook
        await fetch('http://localhost:3000/api/webhooks/razorpay', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-razorpay-signature': 'test-signature',
          },
          body: JSON.stringify({
            event: 'payment.authorized',
            payload: {
              payment: {
                entity: {
                  id: 'pay_logging_test',
                  status: 'captured',
                  notes: {
                    userId,
                    agentId: createResult.agentId,
                    plan: 'agent',
                  },
                },
              },
            },
          }),
        })

        // Check logs
        const { data: newLogs } = await supabaseAdmin
          .from('activity_logs')
          .select('*')
          .eq('user_id', userId)
          .eq('action', 'payment_received')

        const duration = Date.now() - startTime
        const passed = (newLogs?.length || 0) > existingCount

        return NextResponse.json({
          passed,
          duration,
          message: passed
            ? `Activity logged: ${newLogs?.length} entries`
            : 'No activity logs found',
        })
      }

      default:
        return NextResponse.json({ error: 'Unknown test' }, { status: 400 })
    }
  } catch (error) {
    console.error('Test error:', error)
    return NextResponse.json({ passed: false, message: String(error) }, { status: 500 })
  }
}
