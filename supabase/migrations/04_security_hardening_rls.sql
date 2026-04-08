-- Migration 04: Security hardening for RLS and auth runtime tables

ALTER TABLE public.auth_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_accounts_own_data" ON public.auth_accounts;
CREATE POLICY "auth_accounts_own_data" ON public.auth_accounts
  FOR ALL USING (external_user_id = current_setting('request.jwt.claims', true)::jsonb ->> 'sub');

DROP POLICY IF EXISTS "agent_conversations_own_data" ON public.agent_conversations;
CREATE POLICY "agent_conversations_own_data" ON public.agent_conversations
  FOR ALL USING (
    user_id IN (
      SELECT id FROM public.users
      WHERE clerk_id = current_setting('request.jwt.claims', true)::jsonb ->> 'sub'
    )
  );

DROP POLICY IF EXISTS "agent_actions_own_data" ON public.agent_actions;
CREATE POLICY "agent_actions_own_data" ON public.agent_actions
  FOR ALL USING (
    user_id IN (
      SELECT id FROM public.users
      WHERE clerk_id = current_setting('request.jwt.claims', true)::jsonb ->> 'sub'
    )
  );
