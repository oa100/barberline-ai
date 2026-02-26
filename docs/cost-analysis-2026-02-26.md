# BarberLine AI -- Cost Analysis & Unit Economics

**Date:** 2026-02-26
**Status:** Draft
**Author:** Operations & Finance

---

## Table of Contents

1. [Per-Shop Cost Breakdown (COGS)](#1-per-shop-cost-breakdown-cogs)
2. [Phone Number Strategy](#2-phone-number-strategy)
3. [Infrastructure Costs (Fixed)](#3-infrastructure-costs-fixed)
4. [Upfront / One-Time Costs](#4-upfront--one-time-costs)
5. [Operational Cost Scaling Model](#5-operational-cost-scaling-model)
6. [Revenue Model](#6-revenue-model)
7. [Unit Economics & Margins](#7-unit-economics--margins)
8. [Break-Even Analysis](#8-break-even-analysis)
9. [Cost Optimization Opportunities](#9-cost-optimization-opportunities)
10. [Risk Factors](#10-risk-factors)

---

## 1. Per-Shop Cost Breakdown (COGS)

This is the variable cost BarberLine AI incurs for each paying barbershop, per month. These costs scale linearly with the number of shops.

### Vapi Voice AI (Dominant Cost -- ~70-80% of COGS)

Vapi's advertised base rate is $0.05/minute for orchestration, but the real per-minute cost is significantly higher when all required services are included:

| Component | Cost | Notes |
|-----------|------|-------|
| Vapi orchestration | $0.05/min | Platform fee |
| Speech-to-Text (Deepgram) | $0.01-0.02/min | Transcribes caller speech |
| LLM (GPT-4o-mini) | $0.01-0.03/min | Generates AI responses |
| Text-to-Speech (11Labs) | $0.02-0.04/min | Voice synthesis |
| Telephony (Twilio via Vapi) | $0.01-0.02/min | Phone network charges |
| **Total per minute** | **$0.10-0.16/min** | Conservative estimate using GPT-4o-mini + 11Labs |

**Per-shop Vapi cost depends on call volume and duration:**

| Scenario | Calls/mo | Avg Duration | Minutes/mo | Cost/mo |
|----------|----------|-------------|------------|---------|
| Light usage (solo barber, new shop) | 30 | 2.5 min | 75 | $7.50-12.00 |
| Typical Starter plan shop | 80 | 3 min | 240 | $24.00-38.40 |
| Heavy Starter plan shop | 200 | 3 min | 600 | $60.00-96.00 |
| Typical Pro plan shop | 150 | 3 min | 450 | $45.00-72.00 |
| Heavy Pro plan shop (unlimited) | 400 | 3.5 min | 1,400 | $140.00-224.00 |

**Key risk: The Pro plan offers unlimited calls at $99/mo.** A heavy-usage Pro shop could cost $140-224/mo in Vapi fees alone, making that shop unprofitable. This needs a usage cap or fair-use policy (see Section 9).

### Twilio SMS

Each booking generates SMS confirmations to both the customer and the barber.

| Item | Cost | Notes |
|------|------|-------|
| Outbound SMS | $0.0083/msg | US domestic |
| Inbound SMS | $0.0083/msg | Customer replies |
| Carrier surcharge | ~$0.003/msg | AT&T, T-Mobile, Verizon |

**Per-shop SMS cost:**

| Scenario | Bookings/mo | SMS/mo (2 per booking) | Cost/mo |
|----------|-------------|----------------------|---------|
| Light | 20 | 40 | $0.45 |
| Typical | 60 | 120 | $1.35 |
| Heavy | 150 | 300 | $3.38 |

SMS costs are negligible -- under $4/mo even for heavy users.

### Phone Number (Per Shop)

Each shop needs a dedicated phone number. Numbers are provisioned through Vapi (backed by Twilio infrastructure).

| Item | Cost | Notes |
|------|------|-------|
| Local phone number | $1.15-2.00/mo | Through Vapi/Twilio |
| Toll-free number (if offered) | $2.15/mo | Higher trust with callers |

**Estimated cost: $1.50/mo per shop** (see Section 2 for full phone number strategy).

### Per-Shop COGS Summary

| Component | Light Usage | Typical Usage | Heavy Usage |
|-----------|------------|---------------|-------------|
| Vapi voice AI | $7.50-12.00 | $24.00-38.40 | $60.00-96.00 |
| Twilio SMS | $0.45 | $1.35 | $3.38 |
| Phone number | $1.50 | $1.50 | $1.50 |
| Database (allocated) | $0.10 | $0.15 | $0.30 |
| **Total COGS/shop** | **$9.55-14.05** | **$27.00-41.40** | **$65.18-101.18** |

**Blended estimate for "average" shop: $15-25/mo COGS** (mix of light and typical usage across Starter and Pro plans).

---

## 2. Phone Number Strategy

### Does each shop need its own number?

**Yes.** Each barbershop needs a dedicated phone number for several reasons:

1. **Call routing.** The AI agent is configured per-shop with that shop's services, barbers, hours, and Square account. A shared number would require caller identification before routing, adding complexity and latency.
2. **Number forwarding.** Shops forward their existing business line to their BarberLine AI number. This only works with a dedicated number per shop.
3. **Caller ID.** When the AI sends SMS confirmations, the shop's dedicated number appears as the sender. Customers associate that number with the shop.
4. **Vapi architecture.** Each Vapi assistant (AI agent) is bound to a phone number. This is a platform design constraint.

### Phone Number Cost at Scale

| Shops | Numbers | Monthly Cost |
|-------|---------|-------------|
| 10 (beta) | 10 | $15 |
| 50 | 50 | $75 |
| 100 | 100 | $150 |
| 330 (Month 12) | 330 | $495 |
| 1,000 | 1,000 | $1,500 |

**At scale, phone numbers are ~$1.50/shop/mo -- a small cost relative to Vapi voice minutes.** Bulk number provisioning may qualify for volume discounts from Twilio (negotiate at 500+ numbers).

### Number Provisioning Flow (Current)

1. Shop signs up and connects Square (OAuth)
2. During onboarding activation (`/api/dashboard/onboarding/activate`), Vapi provisions a phone number
3. Number is bound to the shop's Vapi assistant
4. Shop forwards their existing line to the new number (or uses it directly)

---

## 3. Infrastructure Costs (Fixed)

These costs are incurred regardless of how many shops are active. They scale in steps, not linearly.

### Vercel (Hosting & Compute)

| Tier | Cost | When to Use |
|------|------|-------------|
| Hobby (free) | $0/mo | Development only |
| Pro | $20/mo per seat | Production (current need) |
| Pro with usage | $20/mo + overages | At scale |

Vercel Pro includes $20/mo in usage credits (covers data transfer, edge requests, serverless function execution). For a Next.js app handling webhook callbacks from Vapi, this is sufficient up to ~100-200 shops. Beyond that, expect $50-150/mo in overages depending on call volume and webhook processing time.

**Estimated Vercel cost:**

| Phase | Shops | Cost/mo |
|-------|-------|---------|
| Beta (Month 1-2) | 10-20 | $20 |
| Early Growth (Month 3-4) | 50-100 | $20-50 |
| DFW Coverage (Month 5-6) | 100-200 | $50-100 |
| Texas Expansion (Month 7-12) | 200-330 | $100-200 |

### Supabase (Database)

| Tier | Cost | Includes |
|------|------|---------|
| Free | $0/mo | 500 MB storage, 1 GB bandwidth, 50K MAU auth |
| Pro | $25/mo | 8 GB storage, 100 GB bandwidth, 100K MAU auth |
| Pro + overages | $25/mo + usage | $0.125/GB storage, $0.09/GB bandwidth |

**Database storage estimate:**
- Each call log (with transcript): ~2-5 KB
- 100 shops x 80 calls/mo = 8,000 records/mo = ~24 MB/mo
- 330 shops x 100 calls/mo = 33,000 records/mo = ~100 MB/mo
- Year 1 cumulative: ~600 MB-1 GB of call logs

**The free tier (500 MB) covers Month 1-3. Pro ($25/mo) covers through Month 12 comfortably.** Storage overages are unlikely in Year 1 unless transcripts are unusually large.

**Estimated Supabase cost:**

| Phase | Cost/mo |
|-------|---------|
| Month 1-3 | $0 (free tier) |
| Month 4-12 | $25-50 |
| Year 2 (1,000+ shops) | $50-150 |

### Clerk (Authentication)

| Tier | Cost | Includes |
|------|------|---------|
| Free | $0/mo | 10,000 MAU, social logins, prebuilt UI |
| Pro | $25/mo | Enhanced features, RBAC |

**BarberLine AI's MAU = number of shop owners using the dashboard.** Even at 1,000 shops, MAU is well under 10,000. **Clerk stays free through Year 1 and likely Year 2.**

**Estimated Clerk cost: $0/mo** for the foreseeable future.

### Domain & DNS

| Item | Cost | Frequency |
|------|------|-----------|
| Domain (barberlineai.com) | $12-15 | Annual |
| SSL certificate | $0 | Included with Vercel |
| DNS hosting | $0 | Included with Vercel |

**Estimated cost: ~$1/mo amortized.**

### Fixed Infrastructure Summary

| Component | Month 1-3 | Month 4-6 | Month 7-12 |
|-----------|-----------|-----------|------------|
| Vercel | $20 | $20-100 | $100-200 |
| Supabase | $0 | $25-50 | $25-50 |
| Clerk | $0 | $0 | $0 |
| Domain/DNS | $1 | $1 | $1 |
| **Total Fixed** | **$21** | **$46-151** | **$126-251** |

---

## 4. Upfront / One-Time Costs

Costs already incurred or required before first revenue.

### Development (Sunk Cost)

| Item | Estimated Value | Notes |
|------|----------------|-------|
| Product development (founder time) | $0 cash (sweat equity) | Next.js app, Vapi integration, Square OAuth, dashboard |
| AI/design tools used during dev | ~$100-300 | Claude, Cursor, etc. |

### Pre-Launch Setup

| Item | Cost | Notes |
|------|------|-------|
| Domain registration | $12-15 | One-time (annual renewal) |
| Vapi account setup | $0 | Free to create, pay-as-you-go |
| Twilio account setup | $0 | Free to create, pay-as-you-go |
| Square Developer account | $0 | Free |
| Supabase project | $0 | Free tier |
| Vercel deployment | $0-20 | Free for hobby, $20/mo for Pro |
| Apple Developer Program (future mobile app) | $99/yr | Only if/when mobile app launches |

### Marketing Launch Materials

| Item | Cost | Notes |
|------|------|-------|
| Business cards + QR codes (500 qty) | $50-100 | For in-person outreach |
| Demo video production | $0-300 | DIY or hire local videographer |
| Logo and brand assets | $0 (done) | Already built into the app |
| Beta shop window stickers (50 qty) | $75-150 | Physical social proof |

### Total Upfront Cost

| Category | Low Estimate | High Estimate |
|----------|-------------|---------------|
| Infrastructure setup | $12 | $35 |
| Marketing materials | $50 | $550 |
| **Total upfront** | **$62** | **$585** |

**This is remarkably low.** The entire product can launch with under $600 in upfront costs. The real cost is founder time.

---

## 5. Operational Cost Scaling Model

### Monthly Total Cost Projection (Infrastructure + COGS + Marketing)

| Month | Active Shops | COGS (variable) | Infrastructure (fixed) | Marketing & Sales | Total Monthly Cost | MRR | Net Margin |
|-------|-------------|-----------------|----------------------|-------------------|-------------------|-----|------------|
| 1 | 10 (free beta) | $150 | $21 | $870 | $1,041 | $0 | -$1,041 |
| 2 | 18 (free beta) | $270 | $21 | $830 | $1,121 | $0 | -$1,121 |
| 3 | 35 | $700 | $46 | $2,660 | $3,406 | $2,100 | -$1,306 |
| 4 | 55 | $1,100 | $71 | $2,950 | $4,121 | $3,520 | -$601 |
| 5 | 80 | $1,600 | $96 | $4,200 | $5,896 | $5,120 | -$776 |
| 6 | 108 | $2,160 | $126 | $4,620 | $6,906 | $6,912 | +$6 |
| 7 | 140 | $2,800 | $151 | $5,000 | $7,951 | $8,960 | +$1,009 |
| 8 | 178 | $3,560 | $176 | $5,200 | $8,936 | $11,392 | +$2,456 |
| 9 | 219 | $4,380 | $201 | $5,400 | $9,981 | $14,016 | +$4,035 |
| 10 | 253 | $5,060 | $201 | $5,500 | $10,761 | $16,192 | +$5,431 |
| 11 | 290 | $5,800 | $226 | $5,600 | $11,626 | $18,560 | +$6,934 |
| 12 | 330 | $6,600 | $251 | $5,800 | $12,651 | $21,120 | +$8,469 |

**Assumptions:**
- COGS per shop: $20/mo blended average (mix of light and heavy usage)
- Infrastructure scales in steps per Section 3
- Marketing spend from the marketing strategy doc budget (Section 8)
- MRR from marketing strategy doc projections (Section 6)
- Month 5+ includes $3,500/mo for first sales rep hire

### Cumulative Cash Flow

| Milestone | Cumulative Cost | Cumulative Revenue | Net Position |
|-----------|----------------|-------------------|--------------|
| End of Month 2 | -$2,162 | $0 | -$2,162 |
| End of Month 4 | -$9,689 | $5,620 | -$4,069 |
| End of Month 6 | -$22,491 | $17,652 | -$4,839 |
| End of Month 8 | -$39,378 | $38,004 | -$1,374 |
| **End of Month 9** | **-$49,359** | **$52,020** | **+$2,661** |
| End of Month 12 | -$82,997 | $107,892 | +$24,895 |

**Cash-flow positive by Month 8-9.** Cumulative profit of ~$25K by end of Year 1.

---

## 6. Revenue Model

### Revenue Per Shop

| Plan | Monthly | Annual (20% off) | Monthly Effective |
|------|---------|-------------------|-------------------|
| Starter | $49/mo | $468/yr ($39 x 12) | $39/mo |
| Pro | $99/mo | $948/yr ($79 x 12) | $79/mo |
| Lite (future, booth renters) | $29/mo | TBD | TBD |

> See `docs/plans/2026-02-26-annual-pricing-plan.md` for full annual pricing implementation plan.

**Blended ARPU assumption: $69/mo** (based on ~60% Starter at $49, ~40% Pro at $99).

### Revenue Scenarios by Shop Count

| Shops | Blended ARPU | MRR | ARR |
|-------|-------------|-----|-----|
| 10 | $69 | $690 | $8,280 |
| 50 | $69 | $3,450 | $41,400 |
| 100 | $69 | $6,900 | $82,800 |
| 250 | $69 | $17,250 | $207,000 |
| 330 | $69 | $22,770 | $273,240 |
| 500 | $69 | $34,500 | $414,000 |
| 1,000 | $69 | $69,000 | $828,000 |
| 1,210 | $69 | $83,490 | $1,001,880 |

**$1M ARR requires ~1,210 shops at current pricing.**

### Revenue Risk: Plan Mix Sensitivity

If more shops choose Starter over Pro, ARPU drops:

| Scenario | Starter % | Pro % | Blended ARPU | Shops for $1M ARR |
|----------|-----------|-------|-------------|-------------------|
| Optimistic | 40% | 60% | $79 | 1,055 |
| Base case | 60% | 40% | $69 | 1,208 |
| Pessimistic | 80% | 20% | $59 | 1,413 |

---

## 7. Unit Economics & Margins

### Per-Shop Margin Analysis

| Metric | Starter ($49/mo) | Pro ($99/mo) |
|--------|-----------------|-------------|
| Revenue | $49.00 | $99.00 |
| Vapi (voice AI) | $12.00-24.00 | $24.00-72.00 |
| Twilio (SMS) | $1.00 | $1.50 |
| Phone number | $1.50 | $1.50 |
| Database (allocated) | $0.10 | $0.15 |
| **Total COGS** | **$14.60-26.60** | **$27.15-75.15** |
| **Gross Profit** | **$22.40-34.40** | **$23.85-71.85** |
| **Gross Margin** | **46-70%** | **24-73%** |

**Critical finding: Pro plan margin depends entirely on usage.**

- A Pro shop making 100 calls/mo at 3 min avg: COGS ~$30, margin ~70%
- A Pro shop making 400 calls/mo at 3.5 min avg: COGS ~$170, margin **-72%** (losing money)

**The $99 price point gives significantly more headroom than the original $79, but the "unlimited" Pro plan still needs guardrails for extreme outliers.** See Section 9.

### Blended Gross Margin (Portfolio View)

At portfolio level with typical usage distribution:

| Metric | Value |
|--------|-------|
| Blended ARPU | $69/mo |
| Blended COGS | $15-25/mo |
| **Blended Gross Margin** | **64-78%** |
| Target gross margin | 70%+ |

This is healthy for a SaaS business. The $99 Pro price gives strong margin headroom. The 80% gross margin cited in the marketing strategy is achievable if heavy Pro users are managed.

### Customer Lifetime Value (LTV)

| Metric | Conservative | Base | Optimistic |
|--------|-------------|------|-----------|
| ARPU | $59/mo | $69/mo | $75/mo |
| Gross margin | 65% | 72% | 78% |
| Avg lifetime | 14 mo | 20 mo | 26 mo |
| **LTV** | **$537** | **$994** | **$1,521** |

### Customer Acquisition Cost (CAC) & Payback

| Channel | CAC | Payback (months) | LTV/CAC |
|---------|-----|-------------------|---------|
| In-person outreach | $100 | 2.0 | 9.9x |
| Referral program | $50 | 1.0 | 19.9x |
| Organic social | $40 | 0.8 | 24.9x |
| Paid social (Meta) | $125 | 2.5 | 8.0x |
| Paid search (Google) | $100 | 2.0 | 9.9x |
| **Blended** | **$90** | **1.8** | **11.0x** |

**LTV/CAC of 11x and payback under 2 months is excellent.** Anything above 3x LTV/CAC is considered healthy for SaaS.

---

## 8. Break-Even Analysis

### Monthly Operating Break-Even

How many shops needed to cover all monthly costs (COGS + infrastructure + marketing/sales)?

| Monthly Expense Level | Shops to Break Even | Notes |
|----------------------|-------------------|-------|
| Lean (no sales rep, minimal ads) | ~20-25 shops | Founder-only, organic growth |
| Moderate (1 sales rep, $2K ads) | ~75-90 shops | Phase 2 growth mode |
| Aggressive (2 reps, $5K ads) | ~140-160 shops | Full DFW push |

**Formula:** Break-even shops = Fixed costs / (ARPU - COGS per shop) = Fixed costs / ($69 - $20) = Fixed costs / $49

### Cumulative Break-Even (Recoup All Spend)

Based on the projection in Section 5:
- **Monthly cash-flow positive: Month 8-9**
- **Cumulative break-even (all prior losses recouped): Month 9**
- **Cumulative profit at Month 12: ~$25,000**

### Sensitivity: What If Growth Is Slower?

| Scenario | Month 12 Shops | Month 12 MRR | Cumulative P/L at Month 12 |
|----------|---------------|-------------|---------------------------|
| Aggressive (base case) | 330 | $21,120 | +$24,895 |
| Moderate (60% of target) | 200 | $12,800 | -$2,500 |
| Conservative (40% of target) | 130 | $8,320 | -$18,000 |
| Worst case (25% of target) | 80 | $5,120 | -$28,000 |

**Even at 40% of target, cumulative losses are only ~$18K by Month 12** -- manageable for a bootstrapped startup. At 60% of target, you're roughly break-even. The risk profile is modest because per-shop COGS are low and infrastructure costs are minimal.

---

## 9. Cost Optimization Opportunities

### 1. Cap the "Unlimited" Pro Plan

**Problem:** The Pro plan at $99/mo with unlimited calls creates margin risk. A shop averaging 400+ calls/month costs $140-224 in Vapi fees alone.

**Options:**
- **Fair use policy:** "Unlimited" means up to 1,000 calls/month. Shops exceeding this get flagged for Enterprise pricing. Disclose in terms of service.
- **Soft cap with overage:** Pro includes 500 calls. Beyond that, $0.15/call. Transparent and fair.
- **Tiered Pro:** Pro 500 ($99/mo), Pro Unlimited ($129/mo). Captures higher willingness to pay from busy shops.

**Recommendation:** Start with a fair-use policy of 500 calls/month on Pro. Nearly all barbershops will fall under this. Revisit when you have usage data from beta.

### 2. Negotiate Vapi Volume Pricing

At 500+ shops (Month 12-15), you'll be doing 50,000+ voice minutes/month. This gives leverage to negotiate:
- Reduced per-minute rates (target $0.08-0.12 all-in vs. $0.10-0.16)
- Bulk phone number discounts
- Dedicated support/SLA

**Potential savings: 15-25% reduction in Vapi costs at scale.**

### 3. Optimize Call Duration

Every minute of call time costs $0.10-0.16. Shorter calls = lower COGS.

- Optimize AI prompts to be efficient (confirm booking in under 2 minutes)
- Set max call duration (5-7 minutes) to prevent edge cases
- Analyze transcripts to identify where the AI rambles or loops

**Target: Average call duration of 2.5 minutes (vs. current 3 min assumption). Saves ~17% on Vapi costs.**

### 4. Transcript Storage Management

Call transcripts accumulate. At scale:
- Archive transcripts older than 90 days to cold storage (Vercel Blob or S3 at $0.023/GB)
- Offer transcript retention as a Pro feature (30 days Starter, 1 year Pro)
- Compress stored transcripts (gzip reduces text by ~70%)

### 5. Evaluate Vapi Alternatives at Scale

If Vapi costs become prohibitive, alternatives exist:
- **Retell AI** -- Similar per-minute model, may offer better volume pricing
- **Bland AI** -- Competitor with aggressive pricing for high volume
- **Build in-house** -- At 5,000+ shops, it may make sense to build a custom voice pipeline (Twilio + Deepgram + OpenAI + 11Labs directly). Eliminates Vapi's $0.05/min orchestration fee. Significant engineering investment but saves ~30-35% on voice costs.

**Not recommended before 1,000 shops.** Vapi's convenience and speed-to-market outweigh cost savings at current scale.

---

## 10. Risk Factors

### Cost Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| Vapi raises per-minute pricing | High | Medium | Provider abstraction layer already built. Evaluate Retell/Bland as backups. |
| Heavy Pro plan users erode margins | High | Medium | Implement fair-use cap (500 calls/mo). Monitor per-shop COGS in dashboard. |
| Twilio raises SMS/number pricing | Low | Low | SMS is <5% of COGS. Minimal impact. |
| Supabase storage overages | Low | Low | Transcript archival policy, compression. |
| Vercel serverless function costs spike | Medium | Low | Optimize webhook processing. Consider self-hosted alternative (Railway, Fly.io) if costs exceed $300/mo. |
| OpenAI raises GPT-4o-mini pricing | Medium | Low | Can swap to Claude Haiku or other low-cost LLM. Model is abstracted through Vapi config. |

### Revenue Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| Higher-than-expected churn (>8%) | High | Medium | Invest in onboarding, ROI visibility in dashboard, and "here's what you'd lose" cancellation flow. |
| Shops don't convert from trial | High | Medium | In-person onboarding support, automated trial-end ROI summary emails. |
| Lower ARPU (more Starter, fewer Pro) | Medium | Medium | Improve Pro value prop (custom voice, multi-barber routing are strong differentiators). |
| Seasonal revenue dips | Low | High | Barbershops have mild seasonality (slower Jan-Feb). Build cash reserves during peak months. |

---

## Summary: The Numbers at a Glance

| Metric | Value |
|--------|-------|
| **Upfront cost to launch** | $62-585 |
| **Monthly infrastructure (fixed)** | $21-251 (scales with phase) |
| **COGS per shop (variable)** | $15-25/mo blended |
| **Phone number per shop** | $1.50/mo |
| **ARPU** | $69/mo |
| **Gross margin (blended)** | 64-78% |
| **LTV** | $994 |
| **CAC (blended)** | $90 |
| **LTV/CAC** | 11.0x |
| **Payback period** | 1.8 months |
| **Monthly break-even (lean)** | ~20-25 shops |
| **Cash-flow positive** | Month 8-9 |
| **Year 1 cumulative profit** | ~$30,000 |
| **Shops for $1M ARR** | ~1,210 |

**Bottom line:** BarberLine AI has strong unit economics with low upfront costs and a clear path to profitability. The dominant cost driver is Vapi voice minutes (~70-80% of COGS), which scales linearly and can be optimized through call duration tuning and volume negotiations. The "unlimited" Pro plan should have a fair-use cap for extreme outliers, but the $99 price point provides strong margin headroom for typical usage. At 330 shops (Month 12 target), the business generates ~$23K MRR against ~$12.7K in total costs -- a healthy operating margin of ~45%.

---

### Sources: Vendor Pricing (as of February 2026)

- [Vapi Pricing](https://vapi.ai/pricing) -- $0.05/min base + provider costs
- [Vapi Pricing Breakdown (Dograh)](https://blog.dograh.com/vapi-pricing-breakdown-2025-plans-hidden-costs-what-to-expect/) -- True cost analysis
- [Twilio SMS Pricing](https://www.twilio.com/en-us/sms/pricing/us) -- $0.0083/msg US
- [Twilio Phone Number Pricing](https://help.twilio.com/articles/223182908-How-much-does-a-phone-number-cost-) -- $1.15/mo local
- [Vercel Pricing](https://vercel.com/pricing) -- $20/mo Pro
- [Supabase Pricing](https://supabase.com/pricing) -- $25/mo Pro
- [Clerk Pricing](https://clerk.com/pricing) -- Free up to 10K MAU

---

*This analysis should be reviewed monthly against actual usage data once beta shops are live. Vapi per-minute costs and average call duration are the two most sensitive assumptions -- validate early.*
