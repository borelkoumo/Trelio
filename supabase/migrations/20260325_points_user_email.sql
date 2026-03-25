-- Add user_email column to points table
-- Allows email lookup directly from points rows, eliminating admin.listUsers() calls
ALTER TABLE public.points ADD COLUMN IF NOT EXISTS user_email text;
