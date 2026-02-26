# Marketing Site Visual Recommendations

## Current State

The marketing site is text-forward with Lucide icons and CSS-based effects (grain overlay, gold shimmer text, barber stripe patterns, card hover glows). There are no product screenshots, illustrations, or photos.

## Implemented

### Dashboard Mockup (Hero Section)
- **Component**: `src/components/marketing/dashboard-mockup.tsx`
- Static stylized dashboard preview with fake data showing stat cards (Calls Today: 12, Booked Today: 8, Upcoming: 5), a weekly bar chart, and a recent calls list
- Wrapped in a browser chrome frame with traffic lights and URL bar
- Placed below the hero CTA buttons on the landing page
- Matches the gold/cream brand aesthetic

### Testimonials Section
- **Component**: `src/components/marketing/testimonials.tsx`
- Three fictional DFW-area barber testimonials with star ratings, quotes, and avatar initials
- Placed between Features and CTA sections on the landing page
- Gold-themed card layout with hover glow effects

## Future Recommendations (Priority Order)

### High Impact

1. **How It Works Step Visuals**
   - The 3-step process page (`/how-it-works`) is text-only with numbered steps
   - Add small UI mockups or illustrations at each step: Square connection screen, AI customization panel, live dashboard
   - Could reuse/adapt the dashboard mockup component

2. **Real Product Screenshots**
   - Once the dashboard UI is polished, replace the static mockup with actual screenshots
   - Show the call analytics chart, call log, and settings pages
   - Optimize with Next.js `<Image>` for performance

3. **Social Proof Enhancement**
   - Replace fictional testimonials with real ones when available
   - Add barber shop photos alongside quotes
   - Consider a logo bar of partner shops

### Medium Impact

4. **Feature Section Illustrations**
   - The 4-feature grid (phone, booking, SMS, analytics) uses small Lucide icons
   - Add small animated illustrations or dashboard UI snippets per feature
   - Consider micro-interactions on hover

5. **About Page Imagery**
   - Team photo or headshot for the "Built for barbershops" narrative
   - Dallas skyline or barbershop imagery to reinforce local identity

### Skip for Now

- **Stock barbershop photos** — feels generic, hurts more than helps
- **Video backgrounds** — slow load, distracts from message
- **Pricing page visuals** — the toggle + plan cards are clean as-is
- **Complex animations** — the existing fade-in-up and shimmer effects are sufficient

## Technical Notes

- All marketing visuals use Tailwind CSS with the project's theme tokens (`text-cream`, `bg-gold`, `text-warm-gray`, etc.)
- Components are theme-aware and work in both light and dark mode via CSS variables
- No external image assets are required for the current implementations — everything is CSS/JSX
- When adding real images, use `next/image` with appropriate sizing and `priority` on hero images
