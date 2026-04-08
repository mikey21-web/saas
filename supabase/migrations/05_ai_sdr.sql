-- Migration 05: AI SDR workflow tables, indexes, and idempotency

CREATE TABLE IF NOT EXISTS public.qualified_leads (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  decision_maker TEXT NOT NULL,
  linkedin_url TEXT DEFAULT '',
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  niche TEXT DEFAULT '',
  company_size INTEGER DEFAULT 0,
  annual_revenue NUMERIC(14, 2) DEFAULT 0,
  icp_score INTEGER NOT NULL CHECK (icp_score BETWEEN 1 AND 10),
  source TEXT NOT NULL CHECK (source IN ('linkedin', 'apollo', 'google')),
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'interested', 'meeting', 'lost')),
  website TEXT DEFAULT '',
  company_location TEXT DEFAULT '',
  job_title TEXT DEFAULT '',
  domain TEXT DEFAULT '',
  enrichment_status TEXT NOT NULL DEFAULT 'pending' CHECK (enrichment_status IN ('pending', 'completed', 'failed')),
  trigger_summary TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS qualified_leads_user_company_decision_maker_source_uidx
  ON public.qualified_leads(user_id, lower(company_name), lower(decision_maker), source);

CREATE INDEX IF NOT EXISTS qualified_leads_user_status_scraped_at_idx
  ON public.qualified_leads(user_id, status, scraped_at DESC);

CREATE INDEX IF NOT EXISTS qualified_leads_agent_scraped_at_idx
  ON public.qualified_leads(agent_id, scraped_at DESC);

CREATE TABLE IF NOT EXISTS public.outreach_sequences (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  lead_id TEXT NOT NULL REFERENCES public.qualified_leads(id) ON DELETE CASCADE,
  copy_variant TEXT NOT NULL CHECK (copy_variant IN ('A', 'B', 'C')),
  channel TEXT NOT NULL CHECK (channel IN ('linkedin', 'whatsapp', 'email')),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reply_received BOOLEAN NOT NULL DEFAULT FALSE,
  reply_text TEXT,
  reply_sentiment TEXT CHECK (reply_sentiment IN ('positive', 'neutral', 'negative')),
  reply_intent TEXT,
  subject TEXT,
  message_body TEXT NOT NULL,
  icebreaker TEXT NOT NULL DEFAULT '',
  cta_link TEXT NOT NULL,
  trigger_summary TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'replied', 'closed')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS outreach_sequences_user_lead_channel_variant_uidx
  ON public.outreach_sequences(user_id, lead_id, channel, copy_variant);

CREATE INDEX IF NOT EXISTS outreach_sequences_user_lead_sent_at_idx
  ON public.outreach_sequences(user_id, lead_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS outreach_sequences_user_reply_received_idx
  ON public.outreach_sequences(user_id, reply_received, sent_at DESC);

CREATE TABLE IF NOT EXISTS public.booked_meetings (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  lead_id TEXT NOT NULL REFERENCES public.qualified_leads(id) ON DELETE CASCADE,
  calendly_event_id TEXT NOT NULL,
  zoom_link TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('confirmed', 'reminder_sent', 'no_show', 'completed')),
  whatsapp_confirmation_sent BOOLEAN NOT NULL DEFAULT FALSE,
  reminders_sent_at JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(calendly_event_id)
);

CREATE INDEX IF NOT EXISTS booked_meetings_user_scheduled_at_idx
  ON public.booked_meetings(user_id, scheduled_at DESC);

CREATE INDEX IF NOT EXISTS booked_meetings_user_status_idx
  ON public.booked_meetings(user_id, status, scheduled_at DESC);

CREATE TABLE IF NOT EXISTS public.engagement_logs (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  lead_id TEXT NOT NULL REFERENCES public.qualified_leads(id) ON DELETE CASCADE,
  sequence_id TEXT NOT NULL REFERENCES public.outreach_sequences(id) ON DELETE CASCADE,
  sentiment TEXT NOT NULL CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  intent TEXT NOT NULL,
  escalate BOOLEAN NOT NULL DEFAULT FALSE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS engagement_logs_user_created_at_idx
  ON public.engagement_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS engagement_logs_user_escalate_idx
  ON public.engagement_logs(user_id, escalate, created_at DESC);

CREATE TABLE IF NOT EXISTS public.analytics_reports (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  insights JSONB NOT NULL DEFAULT '[]'::jsonb,
  best_variant TEXT NOT NULL CHECK (best_variant IN ('A', 'B', 'C')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS analytics_reports_user_generated_at_idx
  ON public.analytics_reports(user_id, generated_at DESC);

CREATE TABLE IF NOT EXISTS public.objection_handlers (
  key TEXT PRIMARY KEY,
  response TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_sdr_webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source TEXT NOT NULL CHECK (source IN ('reply', 'calendly')),
  external_event_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processing', 'processed', 'failed')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(source, external_event_id)
);

CREATE INDEX IF NOT EXISTS ai_sdr_webhook_events_user_created_at_idx
  ON public.ai_sdr_webhook_events(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS ai_sdr_webhook_events_status_idx
  ON public.ai_sdr_webhook_events(status, created_at DESC);

ALTER TABLE public.qualified_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booked_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_sdr_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.objection_handlers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_manage_own_qualified_leads" ON public.qualified_leads;
CREATE POLICY "users_manage_own_qualified_leads"
  ON public.qualified_leads FOR ALL
  USING (
    user_id IN (
      SELECT id FROM public.users
      WHERE clerk_id = current_setting('request.jwt.claims', true)::jsonb ->> 'sub'
    )
  );

DROP POLICY IF EXISTS "users_manage_own_outreach_sequences" ON public.outreach_sequences;
CREATE POLICY "users_manage_own_outreach_sequences"
  ON public.outreach_sequences FOR ALL
  USING (
    user_id IN (
      SELECT id FROM public.users
      WHERE clerk_id = current_setting('request.jwt.claims', true)::jsonb ->> 'sub'
    )
  );

DROP POLICY IF EXISTS "users_manage_own_booked_meetings" ON public.booked_meetings;
CREATE POLICY "users_manage_own_booked_meetings"
  ON public.booked_meetings FOR ALL
  USING (
    user_id IN (
      SELECT id FROM public.users
      WHERE clerk_id = current_setting('request.jwt.claims', true)::jsonb ->> 'sub'
    )
  );

DROP POLICY IF EXISTS "users_manage_own_engagement_logs" ON public.engagement_logs;
CREATE POLICY "users_manage_own_engagement_logs"
  ON public.engagement_logs FOR ALL
  USING (
    user_id IN (
      SELECT id FROM public.users
      WHERE clerk_id = current_setting('request.jwt.claims', true)::jsonb ->> 'sub'
    )
  );

DROP POLICY IF EXISTS "users_manage_own_analytics_reports" ON public.analytics_reports;
CREATE POLICY "users_manage_own_analytics_reports"
  ON public.analytics_reports FOR ALL
  USING (
    user_id IN (
      SELECT id FROM public.users
      WHERE clerk_id = current_setting('request.jwt.claims', true)::jsonb ->> 'sub'
    )
  );

DROP POLICY IF EXISTS "users_manage_own_ai_sdr_webhook_events" ON public.ai_sdr_webhook_events;
CREATE POLICY "users_manage_own_ai_sdr_webhook_events"
  ON public.ai_sdr_webhook_events FOR ALL
  USING (
    user_id IN (
      SELECT id FROM public.users
      WHERE clerk_id = current_setting('request.jwt.claims', true)::jsonb ->> 'sub'
    )
  );

DROP POLICY IF EXISTS "authenticated_users_read_objection_handlers" ON public.objection_handlers;
CREATE POLICY "authenticated_users_read_objection_handlers"
  ON public.objection_handlers FOR SELECT
  USING (auth.role() = 'authenticated');

INSERT INTO public.objection_handlers (key, response)
VALUES
  ('too_busy', 'Totally fair. Most teams we help were overloaded before automating follow-up. If it helps, I can send a 2-minute summary now and you can decide later.'),
  ('not_interested', 'Understood. Before I close this out, would it be useful if I shared one short idea tailored to your current pipeline so you can revisit it when timing is better?'),
  ('already_have_vendor', 'Makes sense. Teams usually switch only when reply quality drops or meetings stay flat. Happy to share a side-by-side benchmark if you want a quick comparison.'),
  ('budget', 'That is a valid concern. We usually start by comparing current CAC or rep time against meetings booked so the ROI is clear before any larger rollout.')
ON CONFLICT (key) DO NOTHING;
