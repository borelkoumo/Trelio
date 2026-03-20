-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Merchants Table
create table public.merchants (
  id uuid default uuid_generate_v4() primary key,
  code text unique not null,              -- human-readable identifier, e.g. 'KOFEESHOP_PART_DIEU'
  user_id uuid references auth.users(id), -- Supabase auth user who owns this merchant (null for seeded merchants)
  name text not null,
  secret_key text not null default encode(gen_random_bytes(32), 'hex'),
  reward_threshold integer not null default 10,
  reward_description text not null default 'Free coffee',
  validation_mode text not null default 'automatic', -- 'automatic' or 'manual'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Points Table
create table public.points (
  id uuid default uuid_generate_v4() primary key,
  user_id text not null,                                    -- UUID string (anonymous or authenticated)
  merchant_id uuid references public.merchants(id) not null,
  device_type text,                                         -- e.g. 'iPhone (Safari)', 'Windows (Chrome)'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Rewards Table
create table public.rewards (
  id uuid default uuid_generate_v4() primary key,
  user_id text not null,                                    -- UUID string (anonymous or authenticated)
  merchant_id uuid references public.merchants(id) not null,
  redeemed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Validation Requests Table
create table public.validation_requests (
  id uuid default uuid_generate_v4() primary key,
  merchant_id uuid references public.merchants(id) not null,
  user_id text not null,
  user_email text,       -- email if user was authenticated at scan time
  device_type text,      -- e.g. 'iPhone (Safari)', 'Windows (Chrome)'
  status text not null default 'pending', -- 'pending', 'approved', 'rejected'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ===================================================================
-- RLS Policies
-- ===================================================================
alter table public.merchants enable row level security;
alter table public.points enable row level security;
alter table public.rewards enable row level security;
alter table public.validation_requests enable row level security;

-- Merchants: publicly readable (QR scan needs to look up any merchant without auth);
-- only the owner can insert / update their own merchant
create policy "Merchants are publicly readable" on public.merchants for select using (true);
create policy "Merchants are insertable by owner" on public.merchants for insert with check (auth.uid() = user_id);
create policy "Merchants are updatable by owner" on public.merchants for update using (auth.uid() = user_id);

-- Points: anyone can read/insert; authenticated users can update (anon → user migration on account link)
create policy "Points are viewable by user" on public.points for select using (true);
create policy "Points are insertable by anyone" on public.points for insert with check (true);
create policy "Points are updatable by owner" on public.points for update
  using (true)
  with check (user_id = auth.uid()::text);

-- Rewards: same pattern as points
create policy "Rewards are viewable by user" on public.rewards for select using (true);
create policy "Rewards are insertable by anyone" on public.rewards for insert with check (true);
create policy "Rewards are updatable by owner" on public.rewards for update
  using (true)
  with check (user_id = auth.uid()::text);

-- Validation Requests: fully open (application code handles access control)
create policy "Validation requests are viewable" on public.validation_requests for select using (true);
create policy "Validation requests are insertable" on public.validation_requests for insert with check (true);
create policy "Validation requests are updatable" on public.validation_requests for update using (true);

-- Enable realtime for validation_requests
alter publication supabase_realtime add table public.validation_requests;

-- ===================================================================
-- DEFAULT / SEED MERCHANT
-- Note: the UUID below is a fixed seed value so NEXT_PUBLIC_DEMO_MERCHANT_ID
-- can be hardcoded to it in .env. Change it to match your own if needed.
-- ===================================================================
INSERT INTO public.merchants (id, code, name, secret_key, reward_threshold, reward_description, validation_mode)
VALUES (
  'cf04235c-d8af-44a6-886f-9a5f77b3c5f8',
  'KOOFEESHOP_PART_DIEU',
  'KoofeeShop Part-Dieu',
  '83eff0e622759739dc010914e31393',
  10,
  'Free coffee',
  'automatic'
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  secret_key = EXCLUDED.secret_key,
  validation_mode = EXCLUDED.validation_mode;
