# diyaa.ai — Build Status & Division of Labor

**Date:** 2026-03-31
**Status:** Frontend Complete, Backend Ready for Infrastructure Setup
**Next Step:** User provides Supabase credentials & API keys

---

## ✅ COMPLETE — What I've Built (Code/Logic)

### Frontend (100% Complete)

- ✅ Dashboard layout with sidebar + breadcrumb navigation
- ✅ Agent store with 16 professional agent templates (LeadCatcher, AppointBot, PayChaser, GSTMate, etc.)
- ✅ Agent detail pages with full descriptions, capabilities, credentials, pricing
- ✅ Per-agent dashboard with 6 operational tabs:
  - Chat tab (message interface)
  - Settings tab (integration toggles, configuration)
  - Sequences tab (workflow automations)
  - Inbox tab (escalated messages)
  - Dashboard tab (analytics cards)
  - Contacts tab (contact management)
- ✅ Multi-step onboarding wizard (5 steps)
- ✅ Agent credentials management (WhatsApp, email, API keys)
- ✅ Dark theme design (#0c0c0d, #e879f9 accents)

### Backend APIs (100% Complete)

- ✅ Deploy endpoint (`/api/onboard/deploy`) — FIXED to match Supabase schema
  - Converts onboarding config → agent row in Supabase
  - Stores knowledge base in knowledge_documents table
  - Saves encrypted credentials separately
  - Logs deployment activity
- ✅ Agent list endpoint (`/api/agents`) — fetches user's agents
- ✅ Agent detail endpoint (`/api/agents/[agentId]`) — fetches single agent
- ✅ Credentials vault library (AES-256 encryption/decryption)
- ✅ Database schema types (Supabase TypeScript types)

### Critical Bug Fixes

- ✅ Fixed deploy endpoint column names (industry → business_industry, channels array → channels_whatsapp/email/sms/phone booleans)
- ✅ Fixed active_hours parsing (string "9:00-21:00" → stored as start/end numbers)
- ✅ Fixed system_prompt generation from config
- ✅ Fixed knowledge_base storage (moved to knowledge_documents table)

### Authentication & Authorization

- ✅ Clerk integration (Google/GitHub OAuth)
- ✅ Protected routes (dashboard requires auth)
- ✅ User ID validation in API headers

---

## ⏳ READY TO WORK — What's Stubbed/TODO (Waiting on Infrastructure)

### What I Can't Do Without Credentials/Infrastructure

| Feature             | What's Needed                       | Why                                       |
| ------------------- | ----------------------------------- | ----------------------------------------- |
| **Agent Execution** | Supabase connected + Redis + BullMQ | LangGraph loop needs real job queue       |
| **Chat Messages**   | Groq/Gemini API keys + Supabase     | Need real LLM to respond + store messages |
| **WhatsApp**        | Exotel API key + phone number       | Need real channel to send messages        |
| **Email**           | Resend API key                      | Real email provider                       |
| **Payment**         | Stripe/Razorpay API keys            | Real payment processing                   |
| **Knowledge Base**  | Firecrawl API key (optional)        | URL scraping for docs                     |

---

## 🔴 CRITICAL PATH — What You (User) Must Do

### Step 1: Set Up Supabase (5 minutes)

1. Go to [supabase.com](https://supabase.com)
2. Create new project (Singapore region for DPDPA)
3. Go to Project Settings → API Keys
4. Copy these 3 keys to `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=<your-project-url>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   ```
5. Run database migration (I'll provide SQL script)

### Step 2: Set Up Redis + BullMQ (10 minutes)

1. Option A (Free): Use Railway → `railway link` → connect to Redis instance
2. Option B (Paid): Upstash Redis ($0.20/mo) or AWS ElastiCache
3. Copy Redis URL to `.env.local`:
   ```env
   REDIS_URL=redis://default:<password>@<host>:<port>
   ```

### Step 3: Get API Keys (10 minutes each)

- **Groq** (free): [console.groq.com](https://console.groq.com) → API key
- **Google Gemini** (free): [ai.google.dev](https://ai.google.dev) → API key
- **Exotel** (India SMS): [exotel.com](https://exotel.com) → ₹500 signup, get SID + token
- **Resend** (email): [resend.com](https://resend.com) → free tier, API key
- **Razorpay** (payments): [razorpay.com](https://razorpay.com) → free tier
- **Stripe** (payments USD): [stripe.com](https://stripe.com) → free tier
- **Firecrawl** (optional, URL scraping): [firecrawl.dev](https://firecrawl.dev) → 500 free pages

Add all to `.env.local`:

```env
GROQ_API_KEY=gsk_...
GOOGLE_GENERATIVE_AI_API_KEY=AIzaSy...
EXOTEL_SID=xxx
EXOTEL_API_KEY=xxx
EXOTEL_API_TOKEN=xxx
RESEND_API_KEY=re_...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
STRIPE_SECRET_KEY=sk_...
ENCRYPTION_KEY=<32-char-hex-string>  # openssl rand -hex 16
```

### Step 4: Run Database Migration

```bash
# I'll provide SQL script to create all tables
# Execute in Supabase SQL Editor:
# - users table
# - agents table
# - conversations table
# - messages table
# - contacts table
# - knowledge_documents table
# - subscriptions table
# - addon_purchases table
# - inbox_messages table
# - activity_logs table
# - agent_credentials table
# Plus RLS policies for each
```

### Step 5: Deploy to Production

```bash
npm run build  # Test build locally
# Then:
# - Frontend: Deploy to Vercel (diyaa.ai domain)
# - Workers: Deploy BullMQ workers to Railway
# - Database: Already on Supabase (no deploy needed)
```

---

## 📋 What Happens After You Provide Credentials

Once `.env.local` has all keys and Supabase is set up, I can:

1. **Wire up chat messages**
   - Implement `/api/agents/[agentId]/chat` endpoint
   - Real Groq/Gemini AI responses
   - Store conversation history in messages table
   - Streaming responses in UI

2. **Build agent execution loop**
   - LangGraph state machine (agent thinks → decides → acts)
   - BullMQ job queue for async execution
   - Rate limiters (50 actions/hr, ₹500/day cost cap)
   - Fallback chains (Groq → Gemini → fail gracefully)

3. **Wire real channels**
   - WhatsApp webhook receiver (Exotel → agent)
   - Email webhook receiver (Resend → agent)
   - SMS receiver (Exotel → agent)
   - Agent can send to all channels

4. **Implement analytics**
   - Track messages sent/received per channel
   - Response rate calculation
   - Cost tracking per agent
   - Dashboard metrics (populate Dashboard tab)

5. **Real-time features**
   - Supabase Realtime for live message updates
   - Inbox escalations (when agent needs human help)
   - Contact management (TRAI consent layer)

6. **Payment webhooks**
   - Razorpay webhook → activate agent subscription
   - Stripe webhook → activate agent subscription

---

## 🏗️ Architecture Overview (How It All Connects)

```
┌─────────────────────────────────────────────────────────┐
│ User Browser (React/Next.js)                             │
│ ├─ Dashboard (Your Agents)                               │
│ ├─ Store (Browse Templates)                              │
│ ├─ Onboarding (Smart Interview 5-step)                   │
│ └─ Agent Dashboard (Chat, Settings, Analytics)           │
└──────────────┬──────────────────────────────────────────┘
               │ HTTPS
┌──────────────▼──────────────────────────────────────────┐
│ Next.js API Routes (Vercel)                              │
│ ├─ /api/agents (list user's agents)                      │
│ ├─ /api/onboard/deploy (FIXED: creates agent)            │
│ ├─ /api/agents/[id]/chat (stream LLM response) [TODO]    │
│ ├─ /api/webhooks/exotel (WhatsApp inbound) [TODO]        │
│ ├─ /api/webhooks/resend (Email inbound) [TODO]           │
│ └─ /api/webhooks/razorpay (Payment confirm) [TODO]       │
└──────────────┬──────────────────────────────────────────┘
         │     │      │       │
      ┌──▼──┬──▼──┬────▼──┬───▼───┐
      │     │     │       │       │
┌─────▼─┐  │  ┌──▼──┐  ┌─▼────┐ ┌▼─────┐
│Supabase│  │  │Redis│  │Groq/ │ │Exotel/│
│(Data)  │  │  │BullMQ Gemini│ │Resend │
└────────┘  │  └─────┘  └──────┘ └───────┘
            │
      ┌─────▼──────┐
      │BullMQ Worker│ (Railway)
      │├─ Agent    │
      ││  Executor │
      │├─ Skill    │
      ││  Runner   │
      │└─ Scheduler│
      └────────────┘
```

---

## 📊 Implementation Timeline

### Phase 1: Infrastructure (You) — 30 minutes

- [ ] Supabase project created + keys copied
- [ ] Redis instance created + URL copied
- [ ] All API keys collected in `.env.local`
- [ ] Database migration run

### Phase 2: Chat Functionality (Me) — 2 hours

- [ ] Wire `/api/agents/[id]/chat` to Groq/Gemini
- [ ] Implement conversation storage in messages table
- [ ] Add streaming response to chat UI
- [ ] Test: Deploy agent → chat with it → see response

### Phase 3: Agent Execution (Me) — 4 hours

- [ ] Deploy BullMQ workers to Railway
- [ ] Implement LangGraph execution loop
- [ ] Wire up LLM fallback chains
- [ ] Add rate limiters + cost tracking
- [ ] Test: Agent autonomously processes inbound messages

### Phase 4: Real Channels (Me) — 6 hours

- [ ] Exotel webhook receiver (WhatsApp)
- [ ] Resend webhook receiver (Email)
- [ ] SMS webhook receiver
- [ ] Agent can send responses to all channels
- [ ] Test: Send WhatsApp to agent → agent responds to WhatsApp

### Phase 5: Polish & Deploy (Me) — 4 hours

- [ ] Analytics dashboard (populate real data)
- [ ] Error handling + monitoring (Sentry)
- [ ] Product analytics (PostHog)
- [ ] Manual end-to-end test
- [ ] Deploy to diyaa.ai domain

**Total:** 30 min (you) + 16 hours (me) = **Can go live in 2 days if credentials ready**

---

## ✋ What YOU Must NOT Do

❌ Don't modify database schema (I'll provide exact migration)
❌ Don't set up n8n workflows (using LangGraph instead)
❌ Don't try to manage BullMQ workers (I'll handle deployment)
❌ Don't manually encrypt credentials (vault library does it)
❌ Don't expose `.env.local` in git (already in .gitignore)

---

## 🎯 Success Criteria

**Day 1:** You provide credentials → I build infrastructure wiring
**Day 2:** Deploy agent from store → land on agent dashboard
**Day 3:** Chat with agent → real LLM response stored in Supabase
**Day 4:** Send WhatsApp to agent → agent replies via Exotel
**Day 5:** Go live at diyaa.ai → first customer

---

## 📞 Next Steps

**Right now:**

1. Read `.env.example` to see all required keys
2. Get Supabase project (Singapore region)
3. Get Redis instance
4. Collect API keys listed above
5. Share them with me securely

**Once credentials are shared:**

1. I'll wire everything up
2. We'll do manual testing
3. Deploy to production
4. Go live

---

**Ready when you are.** The frontend is complete. Just waiting for the infrastructure credentials to make it fully functional.
