# Annual Pricing Plan

**Status:** Ready to implement
**Decision date:** 2026-02-26

---

## Pricing Structure

| Plan | Monthly | Annual | Effective Monthly | Discount |
|------|---------|--------|-------------------|----------|
| Starter | $49/mo | $468/yr ($39 x 12) | $39/mo | 20% |
| Pro | $99/mo | $948/yr ($79 x 12) | $79/mo | 20% |

### Why These Numbers

- **20% discount** (not 17%) — "Save 20%" is rounder, more compelling than "Save 17%"
- **$39/mo and $79/mo** are clean numbers that look good on a pricing page
- Original cost analysis had $490/$990 (2 months free = 17%) — we went slightly more aggressive
- Margin impact is minimal: COGS is $15-25/mo, so $39/mo Starter still yields 35-62% gross margin

---

## Business Case

### Cash Flow
- Annual Starter = $468 upfront vs $49/mo drip
- Annual Pro = $948 upfront vs $99/mo drip
- If 30% of Month-12 target (330 shops) go annual: ~$15-20K in upfront collected revenue
- Funds marketing, sales rep hire, and Vapi bills before monthly revenue catches up

### Churn Reduction
- Annual customers can't churn for 12 months
- Even unhappy annual customer ($468) > churned monthly customer who leaves month 3 ($147)
- Reducing churn from 8% to 5% monthly takes avg lifetime from 12.5 to 20 months
- LTV jumps from ~$600 to ~$994 — the 20% discount pays for itself many times over

### Worst-Case Comparison
- Monthly customer who churns at month 3: paid $147 total
- Annual customer who's unhappy but stays: paid $468 total
- Annual customer is worth 3x more even in the worst case

---

## Implementation Scope

### Stripe Setup
1. Create two additional Prices in Stripe Dashboard:
   - "BarberLine AI Starter — Annual" → $468/yr recurring (yearly interval)
   - "BarberLine AI Pro — Annual" → $948/yr recurring (yearly interval)
2. Add env vars:
   ```
   STRIPE_STARTER_ANNUAL_PRICE_ID=price_...
   STRIPE_PRO_ANNUAL_PRICE_ID=price_...
   ```

### Code Changes

**1. Update checkout route (`src/app/api/stripe/checkout/route.ts`):**
- Accept `interval` param ("monthly" | "annual") in addition to `tier`
- Map to correct Stripe Price ID based on tier + interval combo
- Remove `trial_period_days: 14` for annual plans (or keep — your call)

**2. Update billing page (`src/app/(dashboard)/dashboard/billing/page.tsx`):**
- Add monthly/annual toggle above plan cards
- Show both prices: "$49/mo" or "$39/mo billed annually"
- Pass selected interval to CheckoutButton

**3. Update checkout button (`src/app/(dashboard)/dashboard/billing/checkout-button.tsx`):**
- Accept `interval` prop, pass to API

**4. Update pricing page (`src/app/(marketing)/pricing/page.tsx`):**
- Add monthly/annual toggle at top (styled pill switch)
- Update prices dynamically based on selection
- Show "Save 20%" badge next to annual toggle
- Keep "14-day free trial" messaging on both

**5. Update webhook handler (`src/app/api/stripe/webhook/route.ts`):**
- No changes needed — already handles subscription events generically
- Stripe sends `customer.subscription.updated` regardless of billing interval

**6. Update env example (`.env.local.example`):**
- Add `STRIPE_STARTER_ANNUAL_PRICE_ID` and `STRIPE_PRO_ANNUAL_PRICE_ID`

### Files to Touch
- `src/app/api/stripe/checkout/route.ts` — add interval logic
- `src/app/api/stripe/checkout/route.test.ts` — add annual test cases
- `src/app/(dashboard)/dashboard/billing/page.tsx` — toggle UI
- `src/app/(dashboard)/dashboard/billing/checkout-button.tsx` — interval prop
- `src/app/(marketing)/pricing/page.tsx` — toggle UI + dynamic prices
- `src/app/(marketing)/pricing/pricing.test.tsx` — update tests
- `.env.local.example` — 2 new vars

### UI Pattern for Toggle

```
[ Monthly ]  [ Annual — Save 20% ]
```

On the pricing page, when "Annual" is selected:
- Starter shows: **$39**/mo (billed as $468/yr)
- Pro shows: **$79**/mo (billed as $948/yr)

On the billing page, same toggle above plan cards.

---

## Updated Revenue Model (with Annual Mix)

Assuming 30% of customers choose annual:

| Metric | Monthly Only | With 30% Annual |
|--------|-------------|-----------------|
| Starter ARPU | $49/mo | $46/mo blended |
| Pro ARPU | $99/mo | $93/mo blended |
| Blended ARPU | $69/mo | $65/mo blended |
| Upfront cash (100 shops) | $0 | ~$6,000 |
| Effective churn | 8% | ~5-6% (annual locks) |
| LTV | $600-994 | $800-1,200 |

The slightly lower ARPU is more than offset by reduced churn and upfront cash.

---

## Open Questions

- **Trial on annual plans?** Could offer 14-day trial on annual too, or skip trial since they're committing. Recommendation: keep the trial — it removes friction and the annual commitment is already a strong signal.
- **Refund policy for annual?** Stripe supports prorated refunds. Recommendation: offer prorated refund within first 30 days, no refund after. Document in terms of service.
- **When to implement?** Can launch with monthly-only and add annual within the first month. Annual pricing is a growth optimization, not a launch blocker.
