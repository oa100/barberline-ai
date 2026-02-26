"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PricingToggle, plans, type BillingInterval } from "@/components/pricing-toggle";

export function PricingCards() {
  const [interval, setInterval] = useState<BillingInterval>("monthly");

  return (
    <>
      <div className="mt-10 flex justify-center animate-fade-in-up stagger-2">
        <PricingToggle onChange={setInterval} />
      </div>

      <div className="mx-auto mt-16 grid max-w-4xl gap-8 md:grid-cols-2">
        {plans.map((plan, i) => {
          const price = interval === "annual" ? plan.annualPrice : plan.monthlyPrice;
          return (
            <div
              key={plan.name}
              className={`card-glow animate-fade-in-up stagger-${i + 3} relative border bg-card p-10 ${
                plan.popular ? "border-gold/40" : "border-gold/10"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-gold text-primary-foreground px-5 py-1.5 text-xs font-bold uppercase tracking-[0.2em]">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-2">
                <h2 className="font-serif text-2xl text-cream">{plan.name}</h2>
                <p className="mt-1 text-sm text-warm-gray">{plan.description}</p>
              </div>

              <div className="my-8 flex items-baseline gap-1">
                <span className="font-serif text-5xl text-gold">${price}</span>
                <span className="text-warm-gray text-lg">/mo</span>
              </div>
              {interval === "annual" && (
                <p className="text-xs text-warm-gray -mt-6 mb-8">
                  Billed as ${plan.annualTotal}/yr
                </p>
              )}

              <div className="gold-line w-full mb-8" />

              <ul className="space-y-4 mb-10">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center border border-gold/30 bg-gold/10">
                      <Check className="h-3 w-3 text-gold" />
                    </div>
                    <span className="text-sm text-cream/80">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                className={`w-full rounded-none py-6 text-sm uppercase tracking-[0.15em] font-semibold ${
                  plan.popular
                    ? "bg-gold text-primary-foreground hover:bg-gold-light"
                    : "bg-transparent border border-gold/30 text-cream hover:bg-gold/10"
                }`}
              >
                <Link href="/signup">Get Started</Link>
              </Button>
              <p className="mt-4 text-center text-xs text-warm-gray">
                14-day free trial. No credit card required to start.
              </p>
            </div>
          );
        })}
      </div>
    </>
  );
}
