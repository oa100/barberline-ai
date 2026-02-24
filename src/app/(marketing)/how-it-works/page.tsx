import Link from "next/link";
import { Button } from "@/components/ui/button";

const steps = [
  {
    number: 1,
    title: "Connect your Square account",
    description:
      "Link your Square account in a few clicks. We sync your services, availability, and team members automatically so you can get set up fast.",
  },
  {
    number: 2,
    title: "Customize your AI receptionist",
    description:
      "Choose your AI voice, set a custom greeting, and configure how calls are routed. Make it sound and feel like your shop.",
  },
  {
    number: 3,
    title: "Go live and start booking",
    description:
      "Flip the switch and your AI receptionist answers calls 24/7, books appointments, and sends SMS confirmations to your clients.",
  },
];

export default function HowItWorksPage() {
  return (
    <section className="relative py-28">
      {/* Background accent */}
      <div className="absolute top-1/3 left-0 w-[400px] h-[400px] bg-gold/3 rounded-full blur-[120px] pointer-events-none" />

      <div className="container relative mx-auto px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-medium uppercase tracking-[0.25em] text-gold animate-fade-in">
            Get Started
          </span>
          <h1 className="mt-4 font-serif text-4xl tracking-tight sm:text-5xl md:text-6xl text-cream animate-fade-in-up stagger-1">
            How it works
          </h1>
          <p className="mt-6 text-lg text-warm-gray animate-fade-in-up stagger-2">
            Get your AI receptionist up and running in three simple steps.
          </p>
          <div className="gold-line mx-auto mt-8 w-24" />
        </div>

        <div className="mx-auto mt-20 max-w-2xl space-y-0">
          {steps.map((step, i) => (
            <div
              key={step.number}
              className={`animate-slide-in-left stagger-${i + 2} relative flex gap-8 pb-16 last:pb-0`}
            >
              {/* Vertical connector line */}
              {step.number < 3 && (
                <div className="absolute left-[23px] top-14 bottom-0 w-px bg-gradient-to-b from-gold/30 to-transparent" />
              )}

              {/* Number circle */}
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center border border-gold/40 bg-gold/10">
                <span className="font-serif text-xl text-gold">
                  {step.number}
                </span>
              </div>

              <div className="pt-1">
                <h2 className="font-serif text-2xl text-cream">
                  {step.title}
                </h2>
                <p className="mt-3 text-warm-gray leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 text-center">
          <Button
            asChild
            size="lg"
            className="bg-gold text-[#0A0A0A] font-semibold hover:bg-gold-light rounded-none px-12 py-6 text-sm uppercase tracking-[0.15em]"
          >
            <Link href="/signup">Get Started Now</Link>
          </Button>

          <div className="mx-auto mt-12 barber-stripe-thin h-1 w-32 opacity-40 rounded-full" />
        </div>
      </div>
    </section>
  );
}
