-- Performance indexes for merchant queries

-- Points: primary query pattern (merchant stats, pagination, filtering by date)
CREATE INDEX IF NOT EXISTS idx_points_merchant_created
  ON public.points (merchant_id, created_at DESC);

-- Points: user lookup (registered vs anonymous detection, user history)
CREATE INDEX IF NOT EXISTS idx_points_user_id
  ON public.points (user_id);

-- Rewards: merchant count query
CREATE INDEX IF NOT EXISTS idx_rewards_merchant_id
  ON public.rewards (merchant_id);

-- Validation requests: realtime subscription filter + status lookups
CREATE INDEX IF NOT EXISTS idx_validation_requests_merchant_status
  ON public.validation_requests (merchant_id, status);

-- Merchants: per-user lookup (done on every authenticated request in layout)
CREATE INDEX IF NOT EXISTS idx_merchants_user_id
  ON public.merchants (user_id);
