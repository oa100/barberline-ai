"use client";

import { useState } from "react";

export type BillingInterval = "monthly" | "annual";

export function PricingToggle({
  onChange,
  defaultInterval = "monthly",
}: {
  onChange: (interval: BillingInterval) => void;
  defaultInterval?: BillingInterval;
}) {
  const [interval, setInterval] = useState<BillingInterval>(defaultInterval);

  function toggle(next: BillingInterval) {
    setInterval(next);
    onChange(next);
  }

  return (
    <div className="inline-flex items-center rounded-none border border-gold/20 bg-gold/5 p-1">
      <button
        onClick={() => toggle("monthly")}
        className={`px-5 py-2 text-xs font-medium uppercase tracking-[0.15em] transition-colors ${
          interval === "monthly"
            ? "bg-gold text-primary-foreground"
            : "text-warm-gray hover:text-cream"
        }`}
      >
        Monthly
      </button>
      <button
        onClick={() => toggle("annual")}
        className={`px-5 py-2 text-xs font-medium uppercase tracking-[0.15em] transition-colors ${
          interval === "annual"
            ? "bg-gold text-primary-foreground"
            : "text-warm-gray hover:text-cream"
        }`}
      >
        Annual
        <span className="ml-2 text-[10px] font-bold">Save 20%</span>
      </button>
    </div>
  );
}

export const plans = [
  {
    tier: "starter",
    name: "Starter",
    monthlyPrice: 49,
    annualPrice: 39,
    annualTotal: 468,
    description: "Perfect for solo barbers getting started with AI.",
    popular: false,
    features: [
      "200 AI calls/mo",
      "Square booking",
      "SMS confirmations",
      "Call log",
      "Basic analytics",
    ],
  },
  {
    tier: "pro",
    name: "Pro",
    monthlyPrice: 99,
    annualPrice: 79,
    annualTotal: 948,
    description: "For growing shops that need the full experience.",
    popular: true,
    features: [
      "All Starter features",
      "Unlimited calls",
      "Full analytics",
      "Custom voice/greeting",
      "Multi-barber routing",
      "Priority support",
    ],
  },
];
