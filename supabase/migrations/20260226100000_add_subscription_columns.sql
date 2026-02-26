-- Add Stripe billing columns to shops table
ALTER TABLE shops ADD COLUMN IF NOT EXISTS stripe_customer_id text UNIQUE;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS stripe_subscription_id text UNIQUE;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'trialing';
ALTER TABLE shops ADD COLUMN IF NOT EXISTS subscription_tier text;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS current_period_end timestamptz;

-- Index for webhook lookups
CREATE INDEX IF NOT EXISTS idx_shops_stripe_customer_id ON shops(stripe_customer_id);
