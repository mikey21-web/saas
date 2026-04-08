# diyaa.ai — Quick Start (30 minutes to working app)

## What's Ready

✅ Frontend complete (all pages, all designs)
✅ Backend APIs complete (deploy, agents, chat stubs)
✅ Database schema defined

## What's Missing

❌ Your API keys
❌ Supabase project
❌ Redis instance

---

## 5 Things You Need to Do (Right Now)

### 1️⃣ Create Supabase Project (5 min)

```
1. Go to https://supabase.com → Sign up
2. Create new project → Region: Singapore (for DPDPA)
3. Wait for it to be created (2-3 min)
4. Go to Settings → API Keys (copy these 3):
   - Project URL → NEXT_PUBLIC_SUPABASE_URL
   - Anon Key → NEXT_PUBLIC_SUPABASE_ANON_KEY
   - Service Role Key → SUPABASE_SERVICE_ROLE_KEY
5. Add to your .env.local file
```

### 2️⃣ Create Redis Instance (5 min)

Choose one:

**Option A: Free (Railway + Redis)**

```
1. Go to https://railway.app → Sign up
2. New project → Add from template → Redis
3. Copy connection URL → REDIS_URL in .env.local
```

**Option B: Paid but easier (Upstash)**

```
1. Go to https://upstash.com → Sign up
2. Create Redis database
3. Copy Redis URL → REDIS_URL in .env.local
```

### 3️⃣ Get Free API Keys (10 min)

Copy-paste each key into `.env.local`:

**Groq (AI Model — FREE)**

```
1. Go to https://console.groq.com
2. Sign up with Google
3. API Keys → Create Key
4. Copy → GROQ_API_KEY
```

**Google Gemini (AI Fallback — FREE)**

```
1. Go to https://ai.google.dev
2. Get API Key
3. Copy → GOOGLE_GENERATIVE_AI_API_KEY
```

**Resend (Email — FREE tier)**

```
1. Go to https://resend.com
2. Sign up → Create API Key
3. Copy → RESEND_API_KEY
```

**Razorpay (Payments — FREE to test)**

```
1. Go to https://razorpay.com
2. Sign up → Dashboard
3. Settings → API Keys
4. Copy:
   - Key ID → RAZORPAY_KEY_ID
   - Key Secret → RAZORPAY_KEY_SECRET
```

**Stripe (Payments USD — FREE to test)**

```
1. Go to https://stripe.com
2. Sign up → Developers
3. API Keys → Copy Secret Key
4. Copy → STRIPE_SECRET_KEY
```

**Exotel (WhatsApp SMS — PAID ₹500 signup)**

```
Optional for MVP. Skip if budget tight.
1. Go to https://exotel.com
2. Sign up → Get trial account
3. Settings → API credentials
4. Copy:
   - SID → EXOTEL_SID
   - API Key → EXOTEL_API_KEY
   - API Token → EXOTEL_API_TOKEN
```

### 4️⃣ Create Encryption Key (1 min)

```bash
# In your terminal:
openssl rand -hex 16

# Copy the output → ENCRYPTION_KEY in .env.local
# Example: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

### 5️⃣ Copy Example to .env.local (2 min)

```bash
# In project root:
cp .env.example .env.local

# Then edit .env.local and fill in your keys
# (keep empty the ones you didn't get)
```

---

## Your .env.local Should Look Like This

```env
# Supabase (from Step 1)
NEXT_PUBLIC_SUPABASE_URL=https://abc123.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Clerk (already set up in project)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# AI Models (from Step 3)
GROQ_API_KEY=gsk_...
GOOGLE_GENERATIVE_AI_API_KEY=AIzaSy...

# Payments (from Step 3)
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
STRIPE_SECRET_KEY=sk_test_...

# Email (from Step 3)
RESEND_API_KEY=re_...

# Redis (from Step 2)
REDIS_URL=redis://default:password@host:port

# Encryption (from Step 4)
ENCRYPTION_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6

# App (already set)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Test It Works

```bash
# In project root:
npm run dev

# Open http://localhost:3000
# You should see:
# - Landing page → Dashboard
# - Sign in with Google/GitHub (Clerk)
# - Agent Store (16 templates)
# - Click "Create Agent" → Onboarding wizard
```

---

## Common Issues

**Q: I get "Supabase URL not configured"**

- A: Check `NEXT_PUBLIC_SUPABASE_URL` in `.env.local` is filled in
- Restart: `npm run dev`

**Q: Deployment fails with "Column does not exist"**

- A: Supabase tables don't exist yet
- Run SQL migration (I'll provide in next message)

**Q: Payment button doesn't work**

- A: That's OK for MVP. Skip Razorpay/Stripe for now.

**Q: Redis error when deploying agent**

- A: BullMQ workers not connected yet. I'll wire them after you provide credentials.

---

## What You Have Now

✅ Full agent store (16 templates)
✅ Onboarding wizard (5 steps)
✅ Agent dashboard UI (6 tabs)
✅ Deploy API (ready to save agents)

## What Happens Next

1. You complete 5 steps above (get credentials)
2. Share `.env.local` with me (via Slack/Discord, not GitHub)
3. I run database migration (create all tables)
4. I wire up chat, payments, and real channels
5. **Day 2:** You can deploy agents and chat with them
6. **Day 3:** Real WhatsApp messages flowing through
7. **Day 4:** Go live at diyaa.ai

---

## Timeline

- **30 minutes:** You do steps 1-5 above
- **30 minutes:** I set up database
- **2 hours:** I wire chat + agent execution
- **2 hours:** I wire real channels (WhatsApp, email)
- **Total:** Can have working MVP in **5 hours** once you have credentials

---

**Ready? Do the 5 steps above and let me know when `.env.local` is filled in.**

(Keep `.env.local` out of git — it's in `.gitignore` already)
