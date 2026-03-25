-- RPC function for efficient unique user counting
-- Replaces in-memory JS Set deduplication with a single Postgres aggregate
CREATE OR REPLACE FUNCTION count_distinct_users(p_merchant_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(DISTINCT user_id)
  FROM public.points
  WHERE merchant_id = p_merchant_id;
$$;
