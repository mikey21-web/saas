# diyaa.ai — Product Vision & Build Plan

**Last Updated:** 2026-03-31
**Status:** Ready to Build Phase 1
**Confidence:** 9/10 (85% execution, 60% customer acquisition)

---

## Product Vision

**diyaa.ai** = AI Automation Platform for Real Operational Problems

We solve **₹50L-1.3Cr annual leakage** problems for Indian SMBs using multi-agent orchestration, not marketing automation templates.

### Core Differentiators

1. **Multi-Agent Orchestration** (not single agents)
   - 5-8 agents per workflow, coordinating work
   - Example: Task Assignment = Assigner → Tracker → Notifier → Reporter
   - actionagents.io can't easily copy this

2. **Business Interview Smart Deploy**
   - Real-time streaming Groq/Gemini interview
   - 4 questions → custom agent configuration
   - Not static templates

3. **High Unit Economics**
   - ₹4,999/mo per workflow (vs actionagents ₹50/mo)
   - Targets businesses with real problems, not "nice to have" automations

4. **India-First Design**
   - WhatsApp > Email
   - UPI payment links
   - Local phone numbers (Exotel)
   - Hindi/Hinglish support (auto-detected)

---

## Competitive Landscape

### actionagents.io

- ✅ 12 marketing templates (Cold Outreach, LinkedIn Publisher, etc.)
- ✅ 449 skills marketplace (ClawHub)
- ✅ Single-agent design (simple, low friction)
- ❌ Only ₹50/mo per agent
- ❌ No multi-agent orchestration
- ❌ No business customization (static templates)
- ❌ Only solves marketing problems

### diyaa.ai (Our Position)

- ✅ Multi-agent operational workflows
- ✅ Business interview customization
- ✅ Solves ₹50L+ problems
- ✅ ₹4,999/mo high-value pricing
- ✅ India-native (WhatsApp, Exotel, UPI)
- ❌ More complex to build
- ❌ Higher barrier to entry

**We don't compete with actionagents.** We own operations. They own marketing.

---

## Simplified Tech Stack (Phase 1)

```
Frontend:
├── Next.js 14 App Router
├── Tailwind CSS
└── shadcn/ui

Auth:
└── Clerk (Google/GitHub OAuth + orgs)

Database:
├── Supabase (Postgres + pgvector)
├── Service role for admin ops
└── RLS on all tables

AI/LLM:
├── Groq (llama-3.1-8b-instant) — fast, free
├── Gemini 2.0 Flash (fallback/free tier)
└── Streaming SSE for real-time interview

Communications:
├── Exotel (₹30-1000/mo per number) — India phone + SMS
├── Resend (emails) — per-user subdomain
└── WhatsApp Official API (Meta Messages API)

Agent Execution:
├── LangGraph (state machine for agent loops)
├── BullMQ + Redis (job queue + scheduling)
└── Railway (worker deployment)

Observability:
├── Sentry (error tracking)
└── PostHog (product analytics)

Payment:
├── Stripe (USD billing)
├── Razorpay (INR/UPI billing)
└── Per-agent subscription model

NOT BUILDING (Phase 1):
❌ Evolution API (WhatsApp self-hosted) — use Meta official instead
❌ Vapi.ai (voice agents) — out of scope
❌ Twilio (international) — use Exotel for India
❌ Complex integrations (n8n, Zapier) — not MVP
❌ Pixel Office — dropped (no SMB value)
❌ 510 skills — start with 15-20 skills for 3 workflows
```

---

## Phase 1 Scope (6 Weeks)

### Week 1-2: Smart Deploy Interview Engine

- Real-time streaming interview (Groq/Gemini)
- Business onboarding wizard (4 questions)
- Extract config from conversational context
- Agent identity card (phone, email, WhatsApp, status)

### Week 3-4: Task Assignment Workflow

- **5-Agent Orchestration:**
  1. Parser Agent — parses Monday meeting notes
  2. Router Agent — assigns tasks to team members
  3. Notifier Agent — sends WhatsApp/email notifications
  4. Tracker Agent — monitors completion status
  5. Reporter Agent — generates evening summary report

- **Data Model:**
  ```
  tasks table:
  ├── id, user_id, agent_id
  ├── title, description, assigned_to
  ├── status (pending/in_progress/completed)
  ├── due_date, created_at
  └── completion_report
  ```

### Week 5-6: Wire Real Channels

- Exotel SMS outbound (task assignments)
- Resend email (task summaries)
- WhatsApp Official API (real-time notifications)
- Webhook handlers for inbound messages

### Testing & Launch Prep

- Run 3 manual end-to-end tests
- Create landing page
- Setup Razorpay + Stripe
- Ready for Day 1 customers

---

## The 3 Launch Workflows (Phase 1)

### 1. Task Assignment (Operations)

**Problem:** Monday meetings → WhatsApp task assignment → evening report
**TAM:** 1M SMBs in India
**Pricing:** ₹2,499/mo
**Agents:** 5 (Parser, Router, Notifier, Tracker, Reporter)
**Timeline:** Build Weeks 3-4
**Revenue Potential:** ₹2,499 × 1M = ₹2,499Cr TAM

### 2. Clinic Patient No-Shows (Healthcare)

**Problem:** ₹50-125L annual revenue lost to no-shows
**TAM:** 100K clinics in India
**Pricing:** ₹4,999/mo
**Agents:** 6 (Scheduler, Reminder, Classifier, Follow-up, Escalator, Analytics)
**Timeline:** Phase 2 (Week 7-8)
**Revenue Potential:** ₹4,999 × 100K = ₹500Cr TAM

### 3. Billing Automation (Consulting/Finance)

**Problem:** ₹78L-1.3Cr annual billing leakage per firm
**TAM:** 50K consulting firms
**Pricing:** ₹4,999/mo
**Agents:** 5 (Extractor, Validator, Sender, Tracker, Escalator)
**Timeline:** Phase 2 (Week 7-8)
**Revenue Potential:** ₹4,999 × 50K = ₹250Cr TAM

---

## Pricing Model

**Per-Workflow Subscription (not per-agent):**

```
Starter Plan: ₹1,999/mo
├── 1 workflow instance
├── Groq/Gemini free tier AI
└── 100 tasks/month cap

Business Plan: ₹4,999/mo
├── 2 workflow instances
├── 1000 tasks/month
└── Custom AI model upgrade available

Enterprise: ₹12,000/mo
├── Unlimited workflows
├── Unlimited tasks
└── Dedicated support + SLA
```

**Add-on Packs:**

- 500 extra tasks: ₹499
- Custom AI model: ₹999/mo

---

## Timeline & Milestones

| Timeline           | Milestone            | Target                  |
| ------------------ | -------------------- | ----------------------- |
| **Weeks 1-2**      | Smart Deploy ready   | Interview flow live     |
| **Weeks 3-4**      | Task Assignment MVP  | End-to-end working      |
| **Weeks 5-6**      | Real channels wired  | SMS/Email/WhatsApp live |
| **Week 7 (Day 1)** | Launch diyaa.ai      | Day 1 customers         |
| **Weeks 8-10**     | Add Clinic + Billing | 3 workflows live        |
| **Month 2**        | GTM blitz            | 30-50 customers         |
| **Month 3**        | Hit 100 customers    | Ready for Series A prep |

---

## Key Features (MVP)

### For Users

- ✅ Real-time interview (Groq streaming)
- ✅ Workflow store (3 templates)
- ✅ Agent identity card (phone, email, WhatsApp)
- ✅ Conversation history per agent
- ✅ Inbox for escalations
- ✅ Usage meter (tasks remaining)
- ✅ 7-day free trial (card required)

### For Agents (Internal)

- ✅ LangGraph orchestration (max 10 iterations)
- ✅ Rate limiters (50 actions/hour, ₹500/day)
- ✅ Fallback chains (Groq → Gemini → fail)
- ✅ RLS on all data (user isolation)
- ✅ Encrypted API key storage (user BYOK)

---

## Success Metrics (Phase 1)

| Metric                   | Target          | Definition                      |
| ------------------------ | --------------- | ------------------------------- |
| **Execution**            | 85%             | Ship all 3 workflows in 6 weeks |
| **Customer Acquisition** | 30-50 customers | By end of Month 2               |
| **Hit 100 Customers**    | Month 3         | First major milestone           |
| **Trial-to-Paid**        | 15-20%          | 7-day trial conversion          |
| **Churn**                | <5%/mo          | High-value workflows stick      |
| **NPS**                  | >50             | Real problem solved             |
| **MRR**                  | ₹150-250K       | 30-50 customers × ₹4,999        |

---

## What We're NOT Building (Phase 1)

❌ **Pixel Office** — Cool but zero SMB value
❌ **Voice Agents** — Vapi.ai too complex
❌ **Evolution API** — Use Meta official WhatsApp
❌ **510 Skills** — Start with 15-20 for 3 workflows
❌ **Community Marketplace** — Phase 2+
❌ **Multi-language** — English + auto-detect Hinglish only
❌ **Canvas Builder** — Pre-built workflows only
❌ **Agent Squads** — Single workflow per instance
❌ **ROI Dashboard** — Basic usage meter only

---

## Competitive Advantages (Why We Win)

1. **Multi-Agent Orchestration** — actionagents can't copy (architectural difference)
2. **Real Problem Focus** — ₹50L+ leakage = high willingness to pay
3. **India-Native** — WhatsApp, UPI, local numbers, Hinglish
4. **Business Interview** — Custom config vs static templates
5. **High Unit Economics** — ₹4,999 vs ₹50 means better CAC:LTV

---

## Execution Risks & Mitigation

| Risk                       | Severity | Mitigation                          |
| -------------------------- | -------- | ----------------------------------- |
| **Multi-agent complexity** | HIGH     | Use LangGraph (proven framework)    |
| **Real channel setup**     | HIGH     | Start with Exotel + Resend only     |
| **India compliance**       | MEDIUM   | TRAI consent layer built in         |
| **Customer acquisition**   | MEDIUM   | Pre-sell to 5-10 SMBs before launch |
| **AI cost blow-up**        | LOW      | Groq/Gemini free tier + rate limits |
| **Supabase scaling**       | LOW      | RLS + proper indexing from Day 1    |

---

## Product Philosophy (Guiding Principles)

1. **Solve Real Problems** — Not "nice to have" features. ₹50L+ annual leakage minimum.
2. **Build for India First** — WhatsApp > email. UPI > Stripe. Local numbers matter.
3. **Keep It Simple** — No Pixel Office gimmicks. No 510 skills. No over-engineering.
4. **Multi-Agent from Day 1** — Not a limitation, it's the core value prop.
5. **Customer Interview == Product** — Business interview flow drives agent customization.
6. **Defensible Moat** — Multi-agent orchestration is hard to copy.

---

## Next Steps

1. **Start Week 1:** Smart Deploy Interview Engine (Groq streaming)
2. **Weeks 3-4:** Task Assignment Workflow (5 agents)
3. **Weeks 5-6:** Wire Exotel + Resend + WhatsApp
4. **Week 7:** Launch at diyaa.ai with Day 1 customers
5. **Month 2:** Acquire 30-50 customers
6. **Month 3:** Hit 100 customers → Series A prep

---

## Resources & Files

- **Plan File:** `/plans/idempotent-watching-axolotl.md` (30-phase master plan, archived)
- **Tech Stack:** Simplified version above (Phase 1 focus)
- **Project Location:** `C:\Users\TUMMA\OneDrive\Desktop\ai agents saas\diyaa-ai\`
- **Memory:** `/memory/project_diyaa_ai.md` (updated regularly)

---

## Rating & Confidence

**Idea Rating:** 9/10

- Real problems worth solving
- Multi-agent tech is defensible
- India-first positioning
- Achievable in 6 weeks

**Execution Confidence:** 85%

- LangGraph + BullMQ proven
- Tech stack simplified
- Clear scope boundaries
- Team has domain knowledge

**Customer Acquisition Confidence:** 60%

- Product-market fit unproven
- But problem validation is real
- Pre-sales strategy needed
- GTM playbook TBD

**Why We Build This:** Because the founder identified real ₹50L+ problems in Indian businesses and multi-agent orchestration is the right technology to solve them. Not another marketing automation tool. A real business automation platform.

---

**Ready to build.** Day 1 starts now.
