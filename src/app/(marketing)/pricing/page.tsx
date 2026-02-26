import { PricingCards } from "./pricing-cards";

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

        <PricingCards />
      </div>
    </section>
  );
}
