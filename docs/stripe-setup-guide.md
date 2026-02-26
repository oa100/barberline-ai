# Stripe Integration Setup Guide

Steps to connect Stripe billing to your BarberLine AI instance.

---

## 1. Get Your API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Copy your **Secret key** (starts with `sk_test_` or `sk_live_`)
3. Copy your **Publishable key** (starts with `pk_test_` or `pk_live_`)
4. Add to `.env.local`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

> Use test keys first. Switch to live keys when ready to charge real money.

---

## 2. Create Products & Prices

1. Go to [Stripe Products](https://dashboard.stripe.com/products)
2. Create **Product 1: BarberLine AI Starter**
   - Price: $49.00 / month (recurring)
   - Click into the price → copy the **Price ID** (starts with `price_`)
3. Create **Product 2: BarberLine AI Pro**
   - Price: $99.00 / month (recurring)
   - Copy the **Price ID**
4. Add to `.env.local`:
   ```
   STRIPE_STARTER_PRICE_ID=price_...
   STRIPE_PRO_PRICE_ID=price_...
   ```

---

## 3. Set Up Webhook Endpoint

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. Enter your endpoint URL:
   - Local dev: Use [Stripe CLI](https://stripe.com/docs/stripe-cli) → `stripe listen --forward-to localhost:3000/api/stripe/webhook`
   - Production: `https://yourdomain.com/api/stripe/webhook`
4. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the **Signing secret** (starts with `whsec_`)
6. Add to `.env.local`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

---

## 4. Configure Customer Portal

1. Go to [Stripe Customer Portal Settings](https://dashboard.stripe.com/settings/billing/portal)
2. Enable these features:
   - **Subscriptions → Allow switching plans** — enable, add both Starter and Pro prices
   - **Subscriptions → Allow cancellations** — enable (cancel at end of period)
   - **Invoice history** — enable
3. Save changes

---

## 5. Run Database Migration

Add the subscription columns to your Supabase `shops` table:

```sql
-- Run in Supabase SQL Editor or via CLI
ALTER TABLE shops ADD COLUMN IF NOT EXISTS stripe_customer_id text UNIQUE;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS stripe_subscription_id text UNIQUE;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'trialing';
ALTER TABLE shops ADD COLUMN IF NOT EXISTS subscription_tier text;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS current_period_end timestamptz;

CREATE INDEX IF NOT EXISTS idx_shops_stripe_customer_id ON shops(stripe_customer_id);
```

Or if using Supabase CLI: `npx supabase db push`

---

## 6. Generate Encryption Key

Required for encrypting provider tokens at rest:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add to `.env.local`:
```
ENCRYPTION_KEY=<the-64-char-hex-string>
```

---

## 7. Verify Your `.env.local`

After all steps, your `.env.local` should have these Stripe-related vars:

```
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_STARTER_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
ENCRYPTION_KEY=<64-hex-chars>
```

---

## 8. Test the Flow

1. Start dev server: `npm run dev`
2. Start Stripe CLI listener: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
3. Sign in → go to `/dashboard/billing`
4. Click "Subscribe to Starter" → complete Stripe Checkout with test card `4242 4242 4242 4242`
5. Verify:
   - Redirected back to billing page with "Active" badge
   - Stripe Dashboard shows the subscription
   - Supabase `shops` row has `stripe_customer_id`, `stripe_subscription_id`, `subscription_status = 'active'`
6. Click "Manage Subscription" → verify Customer Portal opens
7. Cancel in portal → verify webhook sets `subscription_status = 'canceled'`

---

## Going Live Checklist

- [ ] Switch from test keys to live keys in `.env.local`
- [ ] Update webhook endpoint URL to production domain
- [ ] Verify webhook signing secret matches the production endpoint
- [ ] Test one real transaction with a real card
- [ ] Confirm Customer Portal works in production
