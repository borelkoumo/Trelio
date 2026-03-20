-- ===================================================================
-- MIGRATION: Convert merchants.id from TEXT to UUID, add code column
--
-- Run this against an EXISTING Supabase database (not a fresh install).
-- On a fresh install, use schema.sql instead.
--
-- What this does:
--   1. Adds a 'code' column to merchants (populated from the old text id)
--   2. Generates a new UUID for each merchant row
--   3. Migrates all FK columns in points / rewards / validation_requests
--   4. Rebuilds the merchants table with id as UUID primary key
-- ===================================================================

BEGIN;

-- Step 1: Add 'code' column to merchants; populate from existing text id
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS code text;
UPDATE public.merchants SET code = id WHERE code IS NULL;
ALTER TABLE public.merchants ALTER COLUMN code SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS merchants_code_key ON public.merchants(code);

-- Step 2: Add a temporary UUID column to merchants
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS _new_id uuid DEFAULT uuid_generate_v4();

-- Give the seed merchant a stable, known UUID
UPDATE public.merchants
  SET _new_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
WHERE code = 'NOBILE_PART_DIEU';

-- Step 3: Add temporary UUID FK columns to dependent tables
ALTER TABLE public.points              ADD COLUMN IF NOT EXISTS _new_merchant_id uuid;
ALTER TABLE public.rewards             ADD COLUMN IF NOT EXISTS _new_merchant_id uuid;
ALTER TABLE public.validation_requests ADD COLUMN IF NOT EXISTS _new_merchant_id uuid;

-- Step 4: Populate the temporary FK columns
UPDATE public.points p
  SET _new_merchant_id = m._new_id
  FROM public.merchants m
  WHERE p.merchant_id = m.id;

UPDATE public.rewards r
  SET _new_merchant_id = m._new_id
  FROM public.merchants m
  WHERE r.merchant_id = m.id;

UPDATE public.validation_requests vr
  SET _new_merchant_id = m._new_id
  FROM public.merchants m
  WHERE vr.merchant_id = m.id;

-- Step 5: Drop the old FK constraints
ALTER TABLE public.points              DROP CONSTRAINT IF EXISTS points_merchant_id_fkey;
ALTER TABLE public.rewards             DROP CONSTRAINT IF EXISTS rewards_merchant_id_fkey;
ALTER TABLE public.validation_requests DROP CONSTRAINT IF EXISTS validation_requests_merchant_id_fkey;

-- Step 6: Drop old text merchant_id columns and rename the new UUID ones
ALTER TABLE public.points              DROP COLUMN merchant_id;
ALTER TABLE public.rewards             DROP COLUMN merchant_id;
ALTER TABLE public.validation_requests DROP COLUMN merchant_id;

ALTER TABLE public.points              RENAME COLUMN _new_merchant_id TO merchant_id;
ALTER TABLE public.rewards             RENAME COLUMN _new_merchant_id TO merchant_id;
ALTER TABLE public.validation_requests RENAME COLUMN _new_merchant_id TO merchant_id;

-- Step 7: Rebuild the merchants table with UUID as PK
-- (Postgres doesn't allow changing a PK column type in-place, so we
--  copy into a new table, swap, then add the FK constraints back.)

CREATE TABLE public._merchants_new (
  id                 uuid         not null,
  code               text         unique not null,
  user_id            uuid         references auth.users(id),
  name               text         not null,
  secret_key         text         not null,
  reward_threshold   integer      not null default 10,
  reward_description text         not null default 'Free coffee',
  validation_mode    text         not null default 'automatic',
  created_at         timestamptz  not null
);

INSERT INTO public._merchants_new
  SELECT _new_id, code, user_id, name, secret_key,
         reward_threshold, reward_description, validation_mode, created_at
  FROM public.merchants;

ALTER TABLE public._merchants_new ADD PRIMARY KEY (id);

-- Add FK constraints back, pointing to the new table
ALTER TABLE public.points
  ADD CONSTRAINT points_merchant_id_fkey
  FOREIGN KEY (merchant_id) REFERENCES public._merchants_new(id);

ALTER TABLE public.rewards
  ADD CONSTRAINT rewards_merchant_id_fkey
  FOREIGN KEY (merchant_id) REFERENCES public._merchants_new(id);

ALTER TABLE public.validation_requests
  ADD CONSTRAINT validation_requests_merchant_id_fkey
  FOREIGN KEY (merchant_id) REFERENCES public._merchants_new(id);

-- Enable RLS on the new table
ALTER TABLE public._merchants_new ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants are publicly readable"  ON public._merchants_new FOR SELECT USING (true);
CREATE POLICY "Merchants are insertable by owner" ON public._merchants_new FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Merchants are updatable by owner"  ON public._merchants_new FOR UPDATE USING (auth.uid() = user_id);

-- Drop the old merchants table and rename the new one
DROP TABLE public.merchants;
ALTER TABLE public._merchants_new RENAME TO merchants;

COMMIT;

-- ===================================================================
-- After running this migration:
--   • Update NEXT_PUBLIC_DEMO_MERCHANT_ID in your .env to the UUID
--     of your demo merchant (query: SELECT id, code FROM merchants;)
--   • The seed merchant 'NOBILE_PART_DIEU' has UUID:
--     a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11
-- ===================================================================
