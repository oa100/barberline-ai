import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Starter",
    price: "$49",
    period: "/mo",
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
    name: "Pro",
    price: "$99",
    period: "/mo",
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

export default function PricingPage() {
  return (
    <section className="relative py-28">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gold/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container relative mx-auto px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-medium uppercase tracking-[0.25em] text-gold animate-fade-in">
            Pricing
          </span>
          <h1 className="mt-4 font-serif text-4xl tracking-tight sm:text-5xl md:text-6xl text-cream animate-fade-in-up stagger-1">
            Simple, transparent pricing
          </h1>
          <p className="mt-6 text-lg text-warm-gray animate-fade-in-up stagger-2">
            Choose the plan that fits your barbershop. No hidden fees.
          </p>
          <div className="gold-line mx-auto mt-8 w-24" />
        </div>

        <div className="mx-auto mt-20 grid max-w-4xl gap-8 md:grid-cols-2">
          {plans.map((plan, i) => (
            <div
              key={plan.name}
              className={`card-glow animate-fade-in-up stagger-${i + 3} relative border bg-[#111111] p-10 ${
                plan.popular
                  ? "border-gold/40"
                  : "border-gold/10"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-gold text-[#0A0A0A] px-5 py-1.5 text-xs font-bold uppercase tracking-[0.2em]">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-2">
                <h2 className="font-serif text-2xl text-cream">{plan.name}</h2>
                <p className="mt-1 text-sm text-warm-gray">
                  {plan.description}
                </p>
              </div>

              <div className="my-8 flex items-baseline gap-1">
                <span className="font-serif text-5xl text-gold">
                  {plan.price}
                </span>
                <span className="text-warm-gray text-lg">{plan.period}</span>
              </div>

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
                    ? "bg-gold text-[#0A0A0A] hover:bg-gold-light"
                    : "bg-transparent border border-gold/30 text-cream hover:bg-gold/10"
                }`}
              >
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
