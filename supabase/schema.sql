-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Merchants Table
create table public.merchants (
  id text primary key default uuid_generate_v4()::text, -- Changed to text to support custom IDs like NOBILE_PART_DIEU
  user_id uuid references auth.users(id), -- Supabase auth user who owns the merchant (nullable for default merchant)
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
  user_id text not null, -- UUID (anonymous or authenticated)
  merchant_id text references public.merchants(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Rewards Table
create table public.rewards (
  id uuid default uuid_generate_v4() primary key,
  user_id text not null, -- UUID (anonymous or authenticated)
  merchant_id text references public.merchants(id) not null,
  redeemed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Validation Requests Table
create table public.validation_requests (
  id uuid default uuid_generate_v4() primary key,
  merchant_id text references public.merchants(id) not null,
  user_id text not null,
  status text not null default 'pending', -- 'pending', 'approved', 'rejected'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table public.merchants enable row level security;
alter table public.points enable row level security;
alter table public.rewards enable row level security;
alter table public.validation_requests enable row level security;

-- Merchants: Owners can read/update their own merchants
create policy "Merchants are viewable by owner" on public.merchants for select using (auth.uid() = user_id OR user_id IS NULL);
create policy "Merchants are insertable by owner" on public.merchants for insert with check (auth.uid() = user_id);
create policy "Merchants are updatable by owner" on public.merchants for update using (auth.uid() = user_id);

-- Points: Users can view their own points
create policy "Points are viewable by user" on public.points for select using (true); -- We will handle filtering in the API
create policy "Points are insertable by service role" on public.points for insert with check (true);

-- Rewards: Users can view their own rewards
create policy "Rewards are viewable by user" on public.rewards for select using (true);
create policy "Rewards are insertable by service role" on public.rewards for insert with check (true);

-- Validation Requests: Users and merchants can view/update
create policy "Validation requests are viewable by user" on public.validation_requests for select using (true);
create policy "Validation requests are insertable by user" on public.validation_requests for insert with check (true);
create policy "Validation requests are updatable by merchant" on public.validation_requests for update using (true);

-- Enable realtime for validation_requests
alter publication supabase_realtime add table public.validation_requests;

-- ==========================================
-- DEFAULT MERCHANT SCRIPT
-- ==========================================
-- Insert the default merchant for testing
INSERT INTO public.merchants (id, name, secret_key, reward_threshold, reward_description, validation_mode)
VALUES (
  'NOBILE_PART_DIEU',
  'Nobile Part-Dieu',
  '83eff0e622759739dc010914e31393',
  10,
  'Free coffee',
  'automatic'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  secret_key = EXCLUDED.secret_key,
  validation_mode = EXCLUDED.validation_mode;
