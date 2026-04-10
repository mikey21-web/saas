-- Auth Accounts Table (for custom email/password authentication)
-- Run this AFTER the main DATABASE_MIGRATION.sql in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS auth_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE auth_accounts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own auth account
CREATE POLICY "users_own_auth" ON auth_accounts FOR ALL USING (
  external_user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
);

-- Indexes
CREATE INDEX idx_auth_accounts_email ON auth_accounts(email);
CREATE INDEX idx_auth_accounts_external_user_id ON auth_accounts(external_user_id);

-- All done!
-- Users can now sign in with email/password via /api/auth/login
