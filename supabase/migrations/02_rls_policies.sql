-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addon_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbox_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Users RLS: Users can only see their own profile
CREATE POLICY "users_own_profile" ON public.users
  FOR ALL USING (auth.uid()::text = id::text OR auth.uid()::text = clerk_id);

-- Agents RLS: Users can only see their own agents
CREATE POLICY "agents_own_data" ON public.agents
  FOR ALL USING (auth.uid() = user_id);

-- Conversations RLS: Users can only see their own conversations
CREATE POLICY "conversations_own_data" ON public.conversations
  FOR ALL USING (auth.uid() = user_id);

-- Messages RLS: Users can only see messages from their conversations
CREATE POLICY "messages_own_data" ON public.messages
  FOR ALL USING (
    agent_id IN (
      SELECT id FROM public.agents WHERE user_id = auth.uid()
    )
  );

-- Contacts RLS: Users can only see their own contacts
CREATE POLICY "contacts_own_data" ON public.contacts
  FOR ALL USING (auth.uid() = user_id);

-- Knowledge Documents RLS
CREATE POLICY "knowledge_docs_own_data" ON public.knowledge_documents
  FOR ALL USING (auth.uid() = user_id);

-- Knowledge Embeddings RLS
CREATE POLICY "knowledge_embeddings_own_data" ON public.knowledge_embeddings
  FOR ALL USING (
    agent_id IN (
      SELECT id FROM public.agents WHERE user_id = auth.uid()
    )
  );

-- Skill Usage RLS
CREATE POLICY "skill_usage_own_data" ON public.skill_usage
  FOR ALL USING (auth.uid() = user_id);

-- Subscriptions RLS
CREATE POLICY "subscriptions_own_data" ON public.subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- Addon Purchases RLS
CREATE POLICY "addons_own_data" ON public.addon_purchases
  FOR ALL USING (auth.uid() = user_id);

-- Inbox Messages RLS
CREATE POLICY "inbox_own_data" ON public.inbox_messages
  FOR ALL USING (auth.uid() = user_id);

-- Feedback RLS
CREATE POLICY "feedback_own_data" ON public.feedback
  FOR ALL USING (auth.uid() = user_id);

-- API Keys RLS
CREATE POLICY "api_keys_own_data" ON public.api_keys
  FOR ALL USING (auth.uid() = user_id);

-- Activity Logs RLS
CREATE POLICY "activity_logs_own_data" ON public.activity_logs
  FOR ALL USING (auth.uid() = user_id);
