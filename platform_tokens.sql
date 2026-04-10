-- SQL for platform_tokens table
create table if not exists platform_tokens (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references users(id) on delete cascade,
    platform text not null,
    access_token text not null, -- ENCRYPTED at rest (use Supabase Vault or similar)
    refresh_token text,
    expires_at timestamptz,
    page_id text, -- Facebook page ID
    account_id text, -- Instagram business account ID, LinkedIn URN, TikTok open_id
    username text,
    scopes text,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    constraint unique_user_platform unique (user_id, platform)
);

-- RLS: Only allow users to read/write their own tokens
alter table platform_tokens enable row level security;

create policy "Users can manage their own tokens" on platform_tokens
    for all using (auth.uid() = user_id);

-- Index for fast lookup
create index if not exists idx_platform_tokens_user_id on platform_tokens(user_id);