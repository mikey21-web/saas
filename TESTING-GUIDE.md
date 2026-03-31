# diyaa.ai Payment Flow Testing Guide

## Overview

This guide covers comprehensive testing of the payment webhook infrastructure for agent deployment using:
- **Test-Driven Development Dashboard** — `/test-driven-development`
- **WebApp Testing Documentation** — `/webapp-testing`
- **Thunder Client** — API testing tool
- **Code Rabbit** — Code quality and testing

---

## Quick Start (3 Minutes)

### Step 1: Visit Test Dashboard
```
http://localhost:3000/test-driven-development
```

### Step 2: Run All Tests
Click "Run All Tests" button to execute full test suite:
- ✓ Razorpay Webhook Verification
- ✓ Stripe Webhook Verification
- ✓ Agent Creation with skipPayment
- ✓ Payment Activation Flow
- ✓ Activity Logging

### Step 3: Check Results
- Green checkmarks = passing tests
- Red Xs = failed tests
- See details for each test

---

## Testing Architecture

### 1. Test-Driven Development Page (`/test-driven-development`)

**What it tests:**
- Razorpay webhook signature verification
- Stripe webhook signature verification
- Agent creation flow
- Agent activation after payment
- Activity logging

**How it works:**
1. Runs automated tests that simulate payment flows
2. Verifies agent status changes from 'pending' → 'active'
3. Confirms activity logs are created
4. Shows pass/fail status with timing

**Mock Payment Simulator:**
- "Test Razorpay Flow" button — simulates Razorpay payment
- "Test Stripe Flow" button — simulates Stripe payment
- No real charges, instant feedback

### 2. WebApp Testing Page (`/webapp-testing`)

**What it provides:**
- Detailed API endpoint documentation
- cURL examples
- Node.js test code
- Thunder Client import collection
- Expected response formats
- Troubleshooting guide

**Key sections:**
1. Agent Creation endpoint
2. Razorpay Webhook endpoint
3. Stripe Webhook endpoint
4. Thunder Client setup instructions

---

## Using Thunder Client for API Testing

### Installation

**VS Code:**
1. Open Extensions (Ctrl+Shift+X)
2. Search "Thunder Client"
3. Install official extension

**Standalone:**
- Download from https://www.thunderclient.com/

### Importing Test Collection

1. Go to `/webapp-testing`
2. Click "Export Thunder Client Collection"
3. Open Thunder Client
4. Import the downloaded JSON file
5. All test requests are ready to use

### Running Tests in Order

**Step 1: Create Agent (skipPayment)**
- Request: `POST /api/onboard/deploy`
- Body: Agent config with `skipPayment: true`
- Response: Returns `agentId`, status will be 'pending'
- **SAVE THIS AGENT ID** — you'll need it for next steps

**Step 2: Trigger Razorpay Webhook**
- Request: `POST /api/webhooks/razorpay`
- Header: `x-razorpay-signature: test-signature`
- Body: Payment authorized event with agentId in notes
- Response: `{ "received": true }`
- **Check:** Agent status should now be 'active'

**Step 3: Trigger Stripe Webhook**
- Request: `POST /api/webhooks/stripe`
- Header: `stripe-signature: test-signature`
- Body: Checkout session completed event
- Response: `{ "received": true }`
- **Check:** Agent status should be 'active', deployed_at set

**Step 4: Use Mock Payment Simulator**
- Request: `POST /api/webapp-testing/mock-payment`
- Body: agentId, userId, provider (razorpay|stripe)
- Response: Returns newStatus 'active', paymentId
- **Check:** No Supabase queries needed, direct simulation

### Key Placeholders to Update

When using Thunder Client requests, update these placeholders:

| Placeholder | Example | Where to Get |
|---|---|---|
| `[AGENT_ID_FROM_STEP_1]` | `550e8400-e29b-41d4-a716-446655440000` | From Step 1 response |
| `[USER_ID]` | `test-user-123` | Same userId used in Step 1 |
| `[SESSION_ID]` | `cs_test_123` | Generate unique ID per test |

---

## Manual cURL Testing

### Create Agent
```bash
curl -X POST http://localhost:3000/api/onboard/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "agentType": "LeadCatcher",
    "agentIcon": "🎯",
    "config": {
      "businessName": "Test Business",
      "industry": "Sales",
      "products": "Test",
      "targetCustomers": "Test",
      "tone": "friendly",
      "language": "English",
      "agentPersonality": "Helpful",
      "activeHours": "9:00-21:00",
      "keyInstructions": "Help users",
      "agentName": "Test Agent"
    },
    "userId": "test-user-curl",
    "plan": "agent",
    "skipPayment": true
  }'
```

**Response:**
```json
{
  "success": true,
  "agentId": "550e8400-e29b-41d4-a716-446655440000",
  "agentName": "Test Agent"
}
```

### Trigger Razorpay Webhook
```bash
curl -X POST http://localhost:3000/api/webhooks/razorpay \
  -H "Content-Type: application/json" \
  -H "x-razorpay-signature: test-signature" \
  -d '{
    "event": "payment.authorized",
    "payload": {
      "payment": {
        "entity": {
          "id": "pay_test_123",
          "status": "captured",
          "notes": {
            "userId": "test-user-curl",
            "agentId": "550e8400-e29b-41d4-a716-446655440000",
            "plan": "agent"
          }
        }
      }
    }
  }'
```

---

## Using Code Rabbit for Code Quality

### What Code Rabbit Does
- Static analysis of payment-related code
- Detects security issues (signature verification)
- Checks error handling
- Validates webhook implementation

### Key Files to Review

**Webhook Handlers:**
- `app/api/webhooks/razorpay/route.ts` — payment verification
- `app/api/webhooks/stripe/route.ts` — signature check
- `app/api/checkout/stripe/route.ts` — session creation

**Database:**
- `supabase/migrations/01_init_schema.sql` — activity_logs RLS
- `app/api/onboard/deploy/route.ts` — agent creation

### Code Rabbit Checks

Run in VS Code or terminal:
```bash
# Install Code Rabbit extension
npm install -g code-rabbit

# Run analysis
code-rabbit analyze app/api/webhooks app/api/checkout
```

**Expected Results:**
- ✓ Signature verification correct
- ✓ Error handling present
- ✓ Database operations use RLS
- ✓ Status transitions valid

---

## Database Verification

After running webhook tests, verify database changes:

### Check Agent Status
```sql
SELECT id, status, deployed_at
FROM agents
WHERE user_id = 'test-user-123'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected:** status='active', deployed_at populated

### Check Activity Logs
```sql
SELECT id, action, details, created_at
FROM activity_logs
WHERE user_id = 'test-user-123'
AND action = 'payment_received'
ORDER BY created_at DESC;
```

**Expected:** One entry per successful payment with paymentId and plan details

### Check RLS Policies
```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename IN ('agents', 'activity_logs');
```

**Expected:** RLS policies enforcing user isolation

---

## Payment Flow State Machine

### Valid Transitions

```
┌──────────┐     skipPayment=true      ┌──────────────┐
│ CREATE   │────────────────────────────▶│ pending      │
└──────────┘                             └──────────────┘
                                                │
                                        webhook received
                                                ▼
                                         ┌──────────────┐
                                         │ active       │
                                         │ deployed_at  │
                                         │ activity log │
                                         └──────────────┘
```

### Agent Lifecycle

1. **Creation** → status='pending', no deployed_at (skipPayment=true)
2. **Payment Processing** → Webhook received with agentId in notes
3. **Activation** → status='active', deployed_at set, activity logged
4. **Usage** → Agent can send/receive messages, use skills

---

## End-to-End Testing Workflow

### Full Flow (10 minutes)

1. **Open Test Dashboard**
   ```
   http://localhost:3000/test-driven-development
   ```

2. **Create Agent Test**
   - Click "Run" on "Agent Creation with skipPayment Flag"
   - Verify: Agent created with pending status

3. **Payment Activation Test**
   - Click "Run" on "Agent Activation After Payment"
   - Verify: Agent status changed to active

4. **Activity Logging Test**
   - Click "Run" on "Payment Activity Logging"
   - Verify: Activity logged in activity_logs table

5. **Mock Payment Simulator**
   - Click "Test Razorpay Flow" button
   - Check console for mock payment response
   - Verify: Agent status is active

6. **Verify Database**
   - Open Supabase dashboard
   - Query agents table to confirm status
   - Query activity_logs to confirm payment recorded

---

## Real Payment Integration Testing

### When Ready for Real Payments

1. **Get API Keys**
   - Razorpay: https://dashboard.razorpay.com/
   - Stripe: https://dashboard.stripe.com/

2. **Update Environment**
   ```env
   RAZORPAY_KEY_ID=rzp_test_xxxxx
   RAZORPAY_KEY_SECRET=xxxxx
   STRIPE_SECRET_KEY=sk_test_xxxxx
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

3. **Enable Test Mode**
   - Use Razorpay test keys
   - Use Stripe test mode
   - No real charges

4. **Run Integration Tests**
   - Same test flow, but with real Razorpay/Stripe test accounts
   - Verify webhooks are actually received from payment processors

---

## Troubleshooting

### Webhook Not Triggering Agent Update

**Check:**
- Is client_reference_id format correct? `agent_[agentId]_[userId]`
- Does agentId exist in agents table?
- Does userId match agent's user_id?
- Are RLS policies allowing service role updates?

**Fix:**
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'agents';

-- Verify agent exists
SELECT id, user_id, status FROM agents WHERE id = '[agentId]';
```

### Activity Logs Not Recording

**Check:**
- Does activity_logs table exist?
- Are RLS policies configured?
- Is user_id valid?

**Fix:**
```sql
-- Check table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'activity_logs';

-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_class c
WHERE c.relname = 'activity_logs';
```

### Signature Verification Failing

**Check:**
- Is webhook secret configured?
- Is signature header present?
- Is body not modified before verification?

**Fix:**
```typescript
// Signature must be verified on raw body text
const body = await request.text()
const signature = request.headers.get('x-razorpay-signature')
// THEN parse body after verification
```

---

## Summary

| Component | Test Method | Location | Expected Result |
|---|---|---|---|
| Agent Creation | Dashboard/Thunder Client | `/api/onboard/deploy` | Returns agentId, status='pending' |
| Razorpay Webhook | Dashboard/Thunder Client | `/api/webhooks/razorpay` | Agent activated, activity logged |
| Stripe Webhook | Dashboard/Thunder Client | `/api/webhooks/stripe` | Agent activated, activity logged |
| Mock Simulator | Dashboard buttons | `/api/webapp-testing/mock-payment` | Instant feedback, no DB changes needed |
| Database | SQL queries | Supabase dashboard | Status='active', deployed_at set |

**All tests pass = Payment infrastructure is production-ready** ✓

---

## Next Steps

After confirming all tests pass:
1. ✓ Update landing page with Task Assignment workflow
2. ✓ Build mock notification system
3. ✓ Add Workflows tab to dashboard
4. ✓ End-to-end testing: sign up → deploy → execute workflow

For questions or issues, check the `/webapp-testing` page for detailed troubleshooting.
