import Link from "next/link";
import { Phone, Calendar, MessageSquare, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardMockup } from "@/components/marketing/dashboard-mockup";
import { Testimonials } from "@/components/marketing/testimonials";

const features = [
  {
    icon: Phone,
    title: "24/7 Call Answering",
    description:
      "Our AI receptionist answers every call, day or night, so you never miss a potential booking.",
  },
  {
    icon: Calendar,
    title: "Instant Booking",
    description:
      "Callers can book, reschedule, or cancel appointments in real time without waiting.",
  },
  {
    icon: MessageSquare,
    title: "SMS Confirmations",
    description:
      "Automatic text confirmations and reminders keep no-shows to a minimum.",
  },
  {
    icon: BarChart3,
    title: "Call Analytics",
    description:
      "Track call volume, booking rates, and peak hours with a clear analytics dashboard.",
  },
];

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden py-28 md:py-40">
        {/* Subtle radial glow behind hero */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gold/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="container relative mx-auto px-6 text-center">
          {/* Eyebrow */}
          <div className="animate-fade-in stagger-1 mb-8 inline-flex items-center gap-3 rounded-full border border-gold/20 bg-gold/5 px-5 py-2">
            <span className="text-xs font-medium uppercase tracking-[0.1em] text-gold">
              AI-Powered Receptionist for Barbershops
            </span>
          </div>

          <h1 className="animate-fade-in-up stagger-2 mx-auto max-w-4xl font-sans font-bold text-5xl leading-tight tracking-tight md:text-7xl lg:text-8xl">
            Never miss a{" "}
            <span className="text-primary">booking</span>{" "}
            again
          </h1>

          <p className="animate-fade-in-up stagger-3 mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-warm-gray md:text-xl">
            BarberLine AI answers your phone calls, books appointments, and
            sends confirmations — so you can focus on cutting hair.
          </p>

          <div className="animate-fade-in-up stagger-4 mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              asChild
              className="bg-gold text-primary-foreground font-semibold hover:bg-gold-light rounded-full px-10 py-6 text-sm uppercase tracking-wide"
            >
              <Link href="/signup">Start Free Trial</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="rounded-full border-gold/30 text-cream hover:bg-gold/10 hover:border-gold/50 px-10 py-6 text-sm uppercase tracking-wide"
            >
              <Link href="/how-it-works">See How It Works</Link>
            </Button>
          </div>

          {/* Dashboard preview */}
          <DashboardMockup />
        </div>
      </section>

      {/* Problem */}
      <section className="relative border-y border-gold/10 bg-secondary py-24">
        <div className="container mx-auto max-w-3xl px-6 text-center">
          <h2 className="animate-fade-in-up font-sans font-bold text-3xl leading-snug tracking-tight md:text-5xl text-cream">
            You&apos;re mid-cut. The phone rings...
          </h2>
          <p className="mt-8 text-lg leading-relaxed text-warm-gray">
            Independent barbers and small shops miss{" "}
            <span className="font-semibold text-gold">
              40-60% of incoming calls
            </span>{" "}
            because they&apos;re busy with clients. Every missed call is a lost
            customer and lost revenue.
          </p>

          {/* Stats row */}
          <div className="mt-14 grid grid-cols-3 gap-8">
            <div className="animate-fade-in-up stagger-1">
              <div className="font-sans font-bold text-4xl text-gold md:text-5xl">60%</div>
              <div className="mt-2 text-xs uppercase tracking-[0.2em] text-warm-gray">
                Calls Missed
              </div>
            </div>
            <div className="animate-fade-in-up stagger-2">
              <div className="font-sans font-bold text-4xl text-gold md:text-5xl">$1,200</div>
              <div className="mt-2 text-xs uppercase tracking-[0.2em] text-warm-gray">
                Lost Monthly
              </div>
            </div>
            <div className="animate-fade-in-up stagger-3">
              <div className="font-sans font-bold text-4xl text-gold md:text-5xl">24/7</div>
              <div className="mt-2 text-xs uppercase tracking-[0.2em] text-warm-gray">
                AI Coverage
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="how-it-works" className="relative py-28">
        {/* Background accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold/3 rounded-full blur-[100px] pointer-events-none" />

        <div className="container relative mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-medium uppercase tracking-[0.1em] text-gold">
              Features
            </span>
            <h2 className="mt-4 font-sans font-bold text-3xl tracking-tight md:text-5xl text-cream">
              Everything your shop needs
            </h2>
            <div className="mx-auto mt-6 w-16 border-b-2 border-primary" />
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className={`animate-fade-in-up stagger-${i + 1} group relative border border-border hover:border-primary/30 transition-colors bg-card p-8`}
              >
                {/* Icon */}
                <div className="mb-6 flex h-12 w-12 items-center justify-center bg-primary/10 rounded-full">
                  <feature.icon className="h-6 w-6 text-gold" />
                </div>

                <h3 className="text-lg font-semibold text-cream tracking-wide">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-warm-gray">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <Testimonials />

      {/* CTA */}
      <section className="relative overflow-hidden py-28">
        <div className="container relative mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-sans font-bold text-3xl tracking-tight md:text-5xl text-cream">
            Ready to stop losing customers?
          </h2>
          <p className="mt-6 text-lg text-warm-gray leading-relaxed">
            Join hundreds of barbers who never miss a call. Start your free
            trial today.
          </p>
          <div className="mt-10">
            <Button
              size="lg"
              asChild
              className="bg-gold text-primary-foreground font-semibold hover:bg-gold-light rounded-full px-12 py-6 text-sm uppercase tracking-wide"
            >
              <Link href="/signup">Start Free Trial</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
