-- Channel Credentials Table
CREATE TABLE IF NOT EXISTS channel_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  channel_type TEXT NOT NULL CHECK (channel_type IN ('gmail', 'whatsapp', 'telegram')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  is_connected BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, channel_type, agent_id)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_channel_credentials_user_id ON channel_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_channel_credentials_agent_id ON channel_credentials(agent_id);
CREATE INDEX IF NOT EXISTS idx_channel_credentials_channel_type ON channel_credentials(channel_type);

-- RLS Policy (user can only see their own credentials)
ALTER TABLE channel_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own channel credentials"
  ON channel_credentials FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own channel credentials"
  ON channel_credentials FOR ALL
  USING (auth.uid() = user_id);
