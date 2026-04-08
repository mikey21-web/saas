# Supabase Setup Guide for diyaa.ai

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign in / Create account
3. Click **"New Project"**
4. Configure:
   - **Organization:** Your organization
   - **Project name:** `diyaa-ai-prod` (or similar)
   - **Database password:** Save this securely
   - **Region:** **Singapore** (Asia/sg — DPDPA compliant for India)
   - **Pricing:** Free or Pro (start with Free)
5. Click **"Create new project"** and wait for setup (5-10 minutes)

## Step 2: Get Credentials

Once project is created:

1. Go to **Settings → API** (left sidebar)
2. Copy these values to your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]
```

## Step 3: Run Migrations

1. Go to **SQL Editor** in Supabase dashboard (left sidebar)
2. Click **"New Query"**
3. Copy the entire contents of `supabase/migrations/01_init_schema.sql`
4. Paste into the SQL Editor
5. Click **"Run"** (Ctrl+Enter)
6. Wait for completion ✅

Repeat for `supabase/migrations/02_rls_policies.sql`:

1. Click **"New Query"** again
2. Copy `02_rls_policies.sql` contents
3. Paste and **"Run"**

## Step 4: Enable Realtime (Optional)

1. Go to **Database → Replication** (left sidebar)
2. Enable Realtime for tables:
   - `conversations`
   - `messages`
   - `inbox_messages`

This allows real-time message updates in dashboards.

## Step 5: Create an RLS-Safe Role (Optional but Recommended)

For development, Supabase automatically uses your service role for admin operations. For production:

1. Go to **SQL Editor**
2. Create a new query:

```sql
-- Create a role for API access (already included with supabase-js)
-- The anon key uses this role and RLS policies are enforced
```

## Step 6: Verify Schema

1. Go to **Table Editor** (left sidebar)
2. You should see these tables:
   - `users`
   - `agents`
   - `conversations`
   - `messages`
   - `contacts`
   - `knowledge_documents`
   - `knowledge_embeddings`
   - `skill_usage`
   - `subscriptions`
   - `addon_purchases`
   - `inbox_messages`
   - `feedback`
   - `api_keys`
   - `activity_logs`

All with RLS enabled ✅

## Step 7: Test Connection

Run this in your project:

```bash
npm run dev
```

Navigate to any page. Check browser console for errors. Supabase should connect silently.

To verify programmatically, create a test route:

```typescript
// app/api/test-db/route.ts
import { supabase } from '@/lib/supabase/client'
import { NextResponse } from 'next/server'

export async function GET() {
  const { data, error } = await supabase.from('users').select('count')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data })
}
```

Visit `http://localhost:3000/api/test-db` — should return `{ success: true }` ✅

## Step 8: Production Considerations

### Row Level Security (RLS)

All tables have RLS enabled. Users can ONLY access their own data via `auth.uid()`.

✅ **Service role key** (in backend/workers) bypasses RLS
✅ **Anon key** (in client) enforces RLS policies
❌ **Never expose service role key to frontend**

### Encryption

API keys are stored encrypted with AES-256 in `byok_api_key_encrypted` column. To enable:

1. Install: `npm install crypto`
2. In executor.ts before saving API key:

```typescript
import crypto from 'crypto'

const encryptionKey = process.env.ENCRYPTION_KEY! // 32-byte hex string
const cipher = crypto.createCipher('aes-256-cbc', encryptionKey)
const encrypted = cipher.update(apiKey, 'utf8', 'hex') + cipher.final('hex')
// Save encrypted to DB
```

### Backups

Supabase automatically backs up free tier daily. For production:

1. Go to **Settings → Backups**
2. Enable daily backups (Pro plan)
3. Set retention: 30 days

### Monitoring

1. Go to **Database → Logs** to see all queries
2. Go to **Settings → Usage** to track API usage
3. Set up alerts for storage/bandwidth limits

## Troubleshooting

### "Auth session missing"

- Make sure Clerk is configured and user is signed in
- Check `middleware.ts` is protecting `/api/*` routes

### "RLS policy violation"

- User ID mismatch between Clerk and Supabase
- Check that `user_id` column matches `auth.uid()`

### "No rows found" on single()

- Query returned 0 rows but expected 1
- Use `.single()` only when you know 1 row exists
- Otherwise use `.select()` and check for empty array

### Migrations failed

- Copy migration line-by-line if full query fails
- Check SQL syntax in error message
- Some Postgres extensions (vector) may need enabling first

## Next Steps

1. ✅ Wire up executor.ts to save agent configs and conversation history
2. ✅ Implement RAG vector search with pgvector
3. ✅ Build knowledge base UI (upload PDF, scrape URL)
4. ✅ Set up subscription webhooks (Stripe/Razorpay → Supabase)
5. ✅ Deploy to Vercel (automatically uses Supabase in production)

See `PHASES.md` (Phases 10-15) for detailed implementation.
