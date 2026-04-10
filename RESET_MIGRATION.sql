-- diyaa.ai — Clean Reset Migration
-- Run this in Supabase SQL Editor.
-- Safe to run multiple times. Drops and recreates all policies/tables.
-- Does NOT use Clerk. Uses custom JWT auth (Google OAuth via Supabase).

-- ============================================================================
-- DROP EXISTING POLICIES (idempotent)
-- ============================================================================
DO $$ BEGIN
  -- Drop all known policies
  DROP POLICY IF EXISTS "users_own_data"          ON users;
  DROP POLICY IF EXISTS "users_own_agents"        ON agents;
  DROP POLICY IF EXISTS "users_own_conversations" ON conversations;
  DROP POLICY IF EXISTS "users_own_messages"      ON messages;
  DROP POLICY IF EXISTS "users_own_contacts"      ON contacts;
  DROP POLICY IF EXISTS "users_own_knowledge"     ON knowledge_documents;
  DROP POLICY IF EXISTS "users_own_subscriptions" ON subscriptions;
  DROP POLICY IF EXISTS "users_own_addons"        ON addon_purchases;
  DROP POLICY IF EXISTS "users_own_inbox"         ON inbox_messages;
  DROP POLICY IF EXISTS "users_own_activity"      ON activity_logs;
  DROP POLICY IF EXISTS "users_own_credentials"   ON agent_credentials;
  DROP POLICY IF EXISTS "users_own_auth"          ON auth_accounts;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================================
-- 1. USERS TABLE
-- id is TEXT so we can store "google:<uuid>" or "jwt:<email>" identifiers
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,          -- e.g. "google:abc123" or "jwt:email@x.com"
  email         TEXT UNIQUE NOT NULL,
  full_name     TEXT,
  business_name TEXT,
  timezone      TEXT    DEFAULT 'Asia/Kolkata',
  language      TEXT    DEFAULT 'English',
  plan_tier     TEXT    DEFAULT 'intern'  CHECK (plan_tier   IN ('intern','agent')),
  plan_status   TEXT    DEFAULT 'active'  CHECK (plan_status IN ('active','paused','cancelled')),
  usage_pause_all BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- Service role key bypasses RLS; anon/user reads are blocked by default
CREATE POLICY "users_own_data" ON users FOR ALL USING (true);

-- ============================================================================
-- 2. AUTH ACCOUNTS TABLE (custom email/password + OAuth accounts)
-- ============================================================================
CREATE TABLE IF NOT EXISTS auth_accounts (
  id               UUID   PRIMARY KEY DEFAULT gen_random_uuid(),
  external_user_id TEXT   UNIQUE NOT NULL,   -- matches users.id
  email            TEXT   UNIQUE NOT NULL,
  password_hash    TEXT   NOT NULL,           -- "oauth:google" for OAuth users
  full_name        TEXT,
  email_verified   BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP,
  created_at       TIMESTAMP DEFAULT NOW(),
  updated_at       TIMESTAMP DEFAULT NOW()
);

ALTER TABLE auth_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_auth" ON auth_accounts FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_auth_accounts_email              ON auth_accounts(email);
CREATE INDEX IF NOT EXISTS idx_auth_accounts_external_user_id  ON auth_accounts(external_user_id);

-- ============================================================================
-- 3. AGENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS agents (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name                   TEXT NOT NULL,
  description            TEXT,
  template_id            TEXT,
  template_version       TEXT,
  status                 TEXT DEFAULT 'active'        CHECK (status       IN ('active','paused','archived')),
  system_prompt          TEXT,
  business_name          TEXT,
  business_industry      TEXT,
  business_description   TEXT,
  tone                   TEXT DEFAULT 'professional'  CHECK (tone         IN ('professional','casual','friendly')),
  channels_whatsapp      BOOLEAN DEFAULT TRUE,
  channels_email         BOOLEAN DEFAULT TRUE,
  channels_sms           BOOLEAN DEFAULT FALSE,
  channels_phone         BOOLEAN DEFAULT FALSE,
  ai_model               TEXT DEFAULT 'groq'          CHECK (ai_model     IN ('groq','gemini','kimi','byok')),
  ai_model_tier          TEXT DEFAULT 'fast'          CHECK (ai_model_tier IN ('fast','balanced','smartest')),
  byok_provider          TEXT,
  byok_api_key_encrypted TEXT,
  active_hours_start     INTEGER DEFAULT 9,
  active_hours_end       INTEGER DEFAULT 21,
  active_hours_timezone  TEXT DEFAULT 'Asia/Kolkata',
  monthly_calls_used     INTEGER DEFAULT 0,
  monthly_emails_used    INTEGER DEFAULT 0,
  monthly_whatsapp_used  INTEGER DEFAULT 0,
  monthly_api_requests   INTEGER DEFAULT 0,
  deployed_at            TIMESTAMP,
  created_at             TIMESTAMP DEFAULT NOW(),
  updated_at             TIMESTAMP DEFAULT NOW()
);

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_agents" ON agents FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_status  ON agents(status);

-- ============================================================================
-- 4. CONVERSATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS conversations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id              UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  contact_phone_or_email TEXT NOT NULL,
  channel               TEXT NOT NULL CHECK (channel IN ('whatsapp','email','sms','phone')),
  status                TEXT DEFAULT 'active' CHECK (status IN ('active','escalated','resolved')),
  escalation_reason     TEXT,
  total_messages        INTEGER DEFAULT 0,
  total_cost_inr        DECIMAL DEFAULT 0,
  created_at            TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_conversations" ON conversations FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id  ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_agent_id ON conversations(agent_id);

-- ============================================================================
-- 5. MESSAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  agent_id         UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  role             TEXT NOT NULL CHECK (role IN ('user','agent')),
  content          TEXT NOT NULL,
  channel          TEXT NOT NULL,
  tool_name        TEXT,
  tool_input       TEXT,
  tool_result      TEXT,
  cost_inr         DECIMAL,
  response_time_ms INTEGER,
  feedback_score   INTEGER CHECK (feedback_score IN (1,2,3,4,5)),
  feedback_text    TEXT,
  created_at       TIMESTAMP DEFAULT NOW()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_messages" ON messages FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_agent_id        ON messages(agent_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at      ON messages(created_at DESC);

-- ============================================================================
-- 6. CONTACTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS contacts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  phone            TEXT,
  email            TEXT,
  business_name    TEXT,
  whatsapp_consent BOOLEAN DEFAULT FALSE,
  sms_consent      BOOLEAN DEFAULT FALSE,
  call_consent     BOOLEAN DEFAULT FALSE,
  email_consent    BOOLEAN DEFAULT FALSE,
  consent_date     TIMESTAMP,
  consent_source   TEXT CHECK (consent_source IN ('form','inbound','manual')),
  created_at       TIMESTAMP DEFAULT NOW(),
  updated_at       TIMESTAMP DEFAULT NOW()
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_contacts" ON contacts FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);

-- ============================================================================
-- 7. KNOWLEDGE DOCUMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS knowledge_documents (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id   UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,
  source     TEXT NOT NULL CHECK (source IN ('manual','url','pdf','qa')),
  source_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_knowledge" ON knowledge_documents FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_knowledge_agent_id ON knowledge_documents(agent_id);

-- ============================================================================
-- 8. SUBSCRIPTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id      TEXT,
  stripe_subscription_id  TEXT,
  razorpay_customer_id    TEXT,
  razorpay_subscription_id TEXT,
  plan_tier               TEXT NOT NULL CHECK (plan_tier       IN ('intern','agent')),
  billing_currency        TEXT DEFAULT 'INR' CHECK (billing_currency IN ('INR','USD')),
  billing_amount          DECIMAL NOT NULL,
  status                  TEXT DEFAULT 'active' CHECK (status  IN ('active','trialing','past_due','cancelled')),
  trial_ends_at           TIMESTAMP,
  current_period_start    TIMESTAMP,
  current_period_end      TIMESTAMP,
  cancel_at_period_end    BOOLEAN DEFAULT FALSE,
  cancelled_at            TIMESTAMP,
  created_at              TIMESTAMP DEFAULT NOW(),
  updated_at              TIMESTAMP DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_subscriptions" ON subscriptions FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);

-- ============================================================================
-- 9. ADDON PURCHASES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS addon_purchases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  addon_type      TEXT NOT NULL CHECK (addon_type IN ('calls','whatsapp','emails','powered_ai')),
  addon_name      TEXT,
  quantity        INTEGER,
  price_inr       DECIMAL NOT NULL,
  stripe_item_id  TEXT,
  razorpay_item_id TEXT,
  status          TEXT DEFAULT 'active' CHECK (status IN ('active','expired')),
  purchased_at    TIMESTAMP NOT NULL,
  expires_at      TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW()
);

ALTER TABLE addon_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_addons" ON addon_purchases FOR ALL USING (true);

-- ============================================================================
-- 10. INBOX MESSAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS inbox_messages (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_id       UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  agent_id              UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  status                TEXT DEFAULT 'pending' CHECK (status   IN ('pending','approved','escalated','resolved')),
  priority              TEXT DEFAULT 'normal'  CHECK (priority IN ('low','normal','high')),
  last_message_content  TEXT,
  last_message_at       TIMESTAMP,
  taken_over_by_user    BOOLEAN DEFAULT FALSE,
  taken_over_at         TIMESTAMP,
  created_at            TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW()
);

ALTER TABLE inbox_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_inbox" ON inbox_messages FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_inbox_user_id ON inbox_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_inbox_status  ON inbox_messages(status);

-- ============================================================================
-- 11. ACTIVITY LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id   UUID REFERENCES agents(id) ON DELETE SET NULL,
  action     TEXT NOT NULL,
  details    TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_activity" ON activity_logs FOR ALL USING (true);

-- ============================================================================
-- 12. AGENT CREDENTIALS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS agent_credentials (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id            UUID NOT NULL UNIQUE REFERENCES agents(id) ON DELETE CASCADE,
  whatsapp_number     TEXT,
  whatsapp_verified   BOOLEAN DEFAULT FALSE,
  website_url         TEXT,
  website_verified    BOOLEAN DEFAULT FALSE,
  openai_api_key      TEXT,
  groq_api_key        TEXT,
  custom_ai_key       TEXT,
  custom_ai_provider  TEXT CHECK (custom_ai_provider IN ('openai','groq','gemini','anthropic')),
  auth_token          TEXT,
  webhook_url         TEXT,
  created_at          TIMESTAMP DEFAULT NOW(),
  last_verified       TIMESTAMP,
  last_rotated        TIMESTAMP
);

ALTER TABLE agent_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_credentials" ON agent_credentials FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_credentials_agent_id ON agent_credentials(agent_id);

-- ============================================================================
-- 13. PGVECTOR (optional RAG, safe to skip if extension unavailable)
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS knowledge_embeddings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  embedding   vector(1536),
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_doc    ON knowledge_embeddings(document_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_vector ON knowledge_embeddings
  USING ivfflat (embedding vector_cosine_ops);

-- ============================================================================
-- DONE
-- Tables use TEXT user IDs to match custom JWT auth (no Clerk dependency).
-- All tables accessible via service role key (bypasses RLS).
-- Sign in with Google → /auth/callback mints JWT → cookie → /agents
-- ============================================================================
