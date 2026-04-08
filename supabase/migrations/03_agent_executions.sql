-- Migration 03: agent_executions + knowledge_documents

-- Step 1: Enable pgvector extension (MUST run before creating VECTOR columns)
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 2: Agent executions log (every time an agent runs)
CREATE TABLE IF NOT EXISTS agent_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  agent_type VARCHAR(50) NOT NULL,
  input JSONB DEFAULT '{}',
  output JSONB DEFAULT '{}',
  conversation_id UUID,
  cost_inr DECIMAL(10,4) DEFAULT 0,
  duration_ms INTEGER,
  model_used VARCHAR(50),
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Knowledge documents for RAG (per agent)
CREATE TABLE IF NOT EXISTS knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500),
  content TEXT NOT NULL,
  source VARCHAR(50) DEFAULT 'manual',
  file_name VARCHAR(255),
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Indexes
CREATE INDEX IF NOT EXISTS knowledge_documents_agent_id_idx
  ON knowledge_documents(agent_id);

CREATE INDEX IF NOT EXISTS agent_executions_agent_id_idx
  ON agent_executions(agent_id);

CREATE INDEX IF NOT EXISTS agent_executions_created_at_idx
  ON agent_executions(created_at DESC);

-- Step 5: Vector similarity index (requires rows to exist — run AFTER inserting data if it fails)
-- If this line errors, skip it and run it separately after uploading first knowledge doc.
CREATE INDEX IF NOT EXISTS knowledge_documents_embedding_idx
  ON knowledge_documents USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Step 6: RLS for agent_executions
ALTER TABLE agent_executions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_see_own_agent_executions" ON agent_executions;
CREATE POLICY "users_see_own_agent_executions"
  ON agent_executions FOR SELECT
  USING (
    agent_id IN (
      SELECT a.id
      FROM agents a
      JOIN users u ON u.id = a.user_id
      WHERE u.clerk_id = current_setting('request.jwt.claims', true)::jsonb ->> 'sub'
    )
  );

-- Step 7: RLS for knowledge_documents
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_manage_own_knowledge" ON knowledge_documents;
CREATE POLICY "users_manage_own_knowledge"
  ON knowledge_documents FOR ALL
  USING (
    user_id IN (
      SELECT id FROM users
      WHERE clerk_id = current_setting('request.jwt.claims', true)::jsonb ->> 'sub'
    )
  );
