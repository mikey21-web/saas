-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Users table (managed by Clerk via JWT)
-- We store additional user metadata
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  business_name TEXT,
  timezone TEXT DEFAULT 'Asia/Kolkata',
  language TEXT DEFAULT 'English',
  plan_tier TEXT DEFAULT 'intern', -- 'intern' | 'agent'
  plan_status TEXT DEFAULT 'active', -- 'active' | 'paused' | 'cancelled'
  usage_pause_all BOOLEAN DEFAULT FALSE, -- red kill switch
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agents table
CREATE TABLE IF NOT EXISTS public.agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  template_id TEXT, -- reference to agent store template
  agent_type TEXT, -- the agent type (leadcatcher, invoicebot, etc.)
  template_version TEXT, -- pinned version
  status TEXT DEFAULT 'active', -- 'active' | 'paused' | 'archived'

  -- Configuration
  system_prompt TEXT,
  business_name TEXT,
  business_industry TEXT,
  business_description TEXT,
  tone TEXT DEFAULT 'professional', -- 'professional' | 'casual' | 'friendly'

  -- Channels enabled
  channels_whatsapp BOOLEAN DEFAULT TRUE,
  channels_email BOOLEAN DEFAULT TRUE,
  channels_sms BOOLEAN DEFAULT FALSE,
  channels_phone BOOLEAN DEFAULT FALSE,

  -- AI Model
  ai_model TEXT DEFAULT 'groq', -- 'groq' | 'gemini' | 'kimi' | 'byok'
  ai_model_tier TEXT DEFAULT 'balanced', -- 'fast' | 'balanced' | 'smartest'
  byok_provider TEXT, -- 'openai' | 'anthropic' | 'google'
  byok_api_key_encrypted TEXT, -- AES-256 encrypted

  -- Active hours
  active_hours_start INTEGER DEFAULT 9, -- 9am
  active_hours_end INTEGER DEFAULT 21, -- 9pm
  active_hours_timezone TEXT DEFAULT 'Asia/Kolkata',

  -- Usage tracking
  monthly_calls_used INTEGER DEFAULT 0,
  monthly_emails_used INTEGER DEFAULT 0,
  monthly_whatsapp_used INTEGER DEFAULT 0,
  monthly_api_requests INTEGER DEFAULT 0,

  -- Metadata
  metadata JSONB, -- additional agent configuration
  deployed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  contact_phone_or_email TEXT NOT NULL, -- phone or email of contact
  channel TEXT NOT NULL, -- 'whatsapp' | 'email' | 'sms' | 'phone'

  status TEXT DEFAULT 'active', -- 'active' | 'escalated' | 'resolved'
  escalation_reason TEXT,

  total_messages INTEGER DEFAULT 0,
  total_cost_inr NUMERIC(10, 2) DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(agent_id, contact_phone_or_email, channel)
);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,

  role TEXT NOT NULL, -- 'user' | 'agent'
  content TEXT NOT NULL,
  channel TEXT NOT NULL,

  -- Tool use tracking
  tool_name TEXT,
  tool_input TEXT, -- JSON
  tool_result TEXT, -- JSON

  -- Metadata
  cost_inr NUMERIC(8, 2),
  response_time_ms INTEGER,
  feedback_score INTEGER, -- 1-5
  feedback_text TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contacts table (for TRAI compliance)
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  business_name TEXT,

  -- Consent flags (TRAI DND compliance)
  whatsapp_consent BOOLEAN DEFAULT FALSE,
  sms_consent BOOLEAN DEFAULT FALSE,
  call_consent BOOLEAN DEFAULT FALSE,
  email_consent BOOLEAN DEFAULT FALSE,

  consent_date TIMESTAMP WITH TIME ZONE,
  consent_source TEXT, -- 'form' | 'inbound' | 'manual'

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Knowledge base documents (for RAG)
CREATE TABLE IF NOT EXISTS public.knowledge_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  content TEXT NOT NULL, -- full document text
  source TEXT, -- 'manual' | 'url' | 'pdf' | 'qa'
  source_url TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Knowledge embeddings (pgvector for RAG)
CREATE TABLE IF NOT EXISTS public.knowledge_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES public.knowledge_documents(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,

  chunk_text TEXT NOT NULL,
  embedding vector(1536), -- OpenAI embedding dimension

  chunk_index INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Skills usage tracking
CREATE TABLE IF NOT EXISTS public.skill_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  skill_name TEXT NOT NULL,
  execution_count INTEGER DEFAULT 1,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,

  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions (for Stripe + Razorpay)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  razorpay_customer_id TEXT,
  razorpay_subscription_id TEXT,

  plan_tier TEXT NOT NULL, -- 'intern' | 'agent'
  billing_currency TEXT DEFAULT 'INR', -- 'INR' | 'USD'
  billing_amount NUMERIC(10, 2),

  status TEXT DEFAULT 'active', -- 'active' | 'trialing' | 'past_due' | 'cancelled'
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,

  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Addon purchases
CREATE TABLE IF NOT EXISTS public.addon_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  addon_type TEXT NOT NULL, -- 'calls' | 'whatsapp' | 'emails' | 'powered_ai'
  addon_name TEXT,
  quantity INTEGER,
  price_inr NUMERIC(10, 2),

  stripe_item_id TEXT,
  razorpay_item_id TEXT,

  status TEXT DEFAULT 'active', -- 'active' | 'expired'
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inbox messages (escalated conversations)
CREATE TABLE IF NOT EXISTS public.inbox_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,

  status TEXT DEFAULT 'pending', -- 'pending' | 'approved' | 'escalated' | 'resolved'
  priority TEXT DEFAULT 'normal', -- 'low' | 'normal' | 'high'

  last_message_content TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,

  taken_over_by_user BOOLEAN DEFAULT FALSE,
  taken_over_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback/ratings on agent responses
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,

  rating INTEGER, -- 1-5
  comment TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API keys for users
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  key_hash TEXT UNIQUE NOT NULL, -- SHA-256 hash
  name TEXT,

  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Activity logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,

  action TEXT NOT NULL, -- 'agent_created' | 'message_sent' | 'skill_used' etc
  details TEXT, -- JSON

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TASK ASSIGNMENT WORKFLOW TABLES (Week 3-4 MVP)

-- Tasks table (created by Parser agent from meeting notes)
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  workflow_id UUID REFERENCES public.agents(id) ON DELETE SET NULL, -- task assignment workflow agent

  title TEXT NOT NULL,
  description TEXT,
  assigned_to TEXT NOT NULL, -- team member name/email
  assigned_by TEXT, -- who created the task (usually from meeting notes)

  status TEXT DEFAULT 'pending', -- 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled'
  priority TEXT DEFAULT 'normal', -- 'low' | 'normal' | 'high' | 'urgent'

  due_date DATE,
  due_time TIME,

  -- Tracking
  notified_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Completion report from team member
  completion_notes TEXT,
  completion_attachments TEXT, -- JSON array of attachment URLs

  -- Auto-generated by Reporter agent
  summary_report TEXT,
  report_generated_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow executions (for tracking multi-agent runs)
CREATE TABLE IF NOT EXISTS public.workflow_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE, -- the workflow agent

  workflow_type TEXT NOT NULL, -- 'task_assignment' | 'patient_noshows' | 'billing_automation'
  trigger_type TEXT, -- 'manual' | 'scheduled' | 'webhook'

  input_data TEXT, -- JSON (e.g., meeting notes for task assignment)

  -- Agent execution states
  parser_state TEXT DEFAULT 'pending', -- 'pending' | 'running' | 'completed' | 'failed'
  parser_output TEXT, -- JSON

  router_state TEXT DEFAULT 'pending',
  router_output TEXT, -- JSON

  notifier_state TEXT DEFAULT 'pending',
  notifier_output TEXT, -- JSON (list of notifications sent)

  tracker_state TEXT DEFAULT 'pending',
  tracker_output TEXT, -- JSON (tracking status)

  reporter_state TEXT DEFAULT 'pending',
  reporter_output TEXT, -- JSON (final report)

  status TEXT DEFAULT 'running', -- 'running' | 'completed' | 'failed'
  error_message TEXT,

  total_duration_ms INTEGER,
  cost_inr NUMERIC(10, 2),

  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Notifications sent by Notifier agent
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  workflow_execution_id UUID REFERENCES public.workflow_executions(id) ON DELETE SET NULL,

  recipient TEXT NOT NULL, -- email or phone
  channel TEXT NOT NULL, -- 'whatsapp' | 'email' | 'sms'
  notification_type TEXT, -- 'task_assigned' | 'task_reminder' | 'daily_report'

  subject TEXT,
  message_body TEXT,

  status TEXT DEFAULT 'sent', -- 'pending' | 'sent' | 'failed' | 'bounced'
  delivery_timestamp TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_clerk_id ON public.users(clerk_id);
CREATE INDEX idx_agents_user_id ON public.agents(user_id);
CREATE INDEX idx_agents_status ON public.agents(status);
CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX idx_conversations_agent_id ON public.conversations(agent_id);
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
CREATE INDEX idx_contacts_user_id ON public.contacts(user_id);
CREATE INDEX idx_knowledge_agent_id ON public.knowledge_documents(agent_id);
CREATE INDEX idx_knowledge_embeddings_agent_id ON public.knowledge_embeddings(agent_id);
CREATE INDEX idx_skill_usage_agent_id ON public.skill_usage(agent_id);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_razorpay_id ON public.subscriptions(razorpay_subscription_id);
CREATE INDEX idx_inbox_user_id ON public.inbox_messages(user_id);
CREATE INDEX idx_inbox_status ON public.inbox_messages(status);
CREATE INDEX idx_activity_user_id ON public.activity_logs(user_id);

-- Indexes for Task Assignment Workflow (Week 3-4)
CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_tasks_workflow_id ON public.tasks(workflow_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX idx_tasks_created_at ON public.tasks(created_at);

CREATE INDEX idx_workflow_executions_user_id ON public.workflow_executions(user_id);
CREATE INDEX idx_workflow_executions_agent_id ON public.workflow_executions(agent_id);
CREATE INDEX idx_workflow_executions_type ON public.workflow_executions(workflow_type);
CREATE INDEX idx_workflow_executions_status ON public.workflow_executions(status);
CREATE INDEX idx_workflow_executions_created_at ON public.workflow_executions(created_at);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_task_id ON public.notifications(task_id);
CREATE INDEX idx_notifications_status ON public.notifications(status);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);

-- Vector index for knowledge embeddings (HNSW)
CREATE INDEX ON public.knowledge_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Agent conversations (for Pixel Office chat history)
CREATE TABLE IF NOT EXISTS public.agent_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  messages JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent actions (for tracking agent actions like send_whatsapp, send_email, etc.)
CREATE TABLE IF NOT EXISTS public.agent_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_params JSONB,
  result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for new tables
CREATE INDEX idx_agent_conversations_agent_id ON public.agent_conversations(agent_id);
CREATE INDEX idx_agent_conversations_user_id ON public.agent_conversations(user_id);
CREATE INDEX idx_agent_actions_agent_id ON public.agent_actions(agent_id);
CREATE INDEX idx_agent_actions_user_id ON public.agent_actions(user_id);
CREATE INDEX idx_agent_actions_type ON public.agent_actions(action_type);
