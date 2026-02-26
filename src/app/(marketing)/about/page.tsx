import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative py-28">
        <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-gold/3 rounded-full blur-[120px] pointer-events-none" />

        <div className="container relative mx-auto px-6">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-medium uppercase tracking-[0.25em] text-gold animate-fade-in">
              About Us
            </span>
            <h1 className="mt-4 font-serif text-4xl tracking-tight sm:text-5xl md:text-6xl text-cream animate-fade-in-up stagger-1">
              Built for barbershops,
              <br />
              by people who get it
            </h1>
            <p className="mt-6 text-lg text-warm-gray animate-fade-in-up stagger-2">
              BarberLine AI is a Dallas-based startup on a mission to help every
              barber focus on their craft — not their phone.
            </p>
            <div className="gold-line mx-auto mt-8 w-24" />
          </div>
        </div>
      </section>

      {/* Why Barbershops */}
      <section className="relative bg-[#0E0E0E] py-28">
        <div className="container relative mx-auto px-6">
          <div className="mx-auto max-w-2xl">
            <span className="text-xs font-medium uppercase tracking-[0.25em] text-gold">
              Why Barbershops
            </span>
            <h2 className="mt-4 font-serif text-3xl tracking-tight sm:text-4xl text-cream">
              Every missed call is a missed customer
            </h2>
            <div className="gold-line mt-8 w-16" />

            <div className="mt-10 space-y-6 text-warm-gray leading-relaxed">
              <p>
                Barbers are busy. When you&apos;re mid-fade, you can&apos;t pick
                up the phone. But that call might be a new client, a reschedule,
                or a regular trying to get in this week. Every unanswered call is
                money left on the table.
              </p>
              <p>
                We built BarberLine AI because generic answering services
                don&apos;t understand barbershops. They don&apos;t know the
                difference between a taper and a lineup. They can&apos;t check
                your real availability on Square and book the right service with
                the right barber.
              </p>
              <p>
                Our AI receptionist does. It answers calls 24/7, speaks
                naturally, books appointments directly into your calendar, and
                sends your clients a confirmation text — all while you stay
                focused on the chair.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission / Where We Are */}
      <section className="relative py-28">
        <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-gold/3 rounded-full blur-[100px] pointer-events-none" />

        <div className="container relative mx-auto px-6">
          <div className="mx-auto max-w-2xl">
            <span className="text-xs font-medium uppercase tracking-[0.25em] text-gold">
              Our Mission
            </span>
            <h2 className="mt-4 font-serif text-3xl tracking-tight sm:text-4xl text-cream">
              Help barbers never miss a customer
            </h2>
            <div className="gold-line mt-8 w-16" />

            <div className="mt-10 space-y-6 text-warm-gray leading-relaxed">
              <p>
                We&apos;re not trying to replace barbers — we&apos;re giving
                them a tool that handles the one part of the job that gets in the
                way of the work. The phone.
              </p>
              <p>
                Based in Dallas-Fort Worth, we&apos;re currently serving the DFW
                barbershop community and growing from here. We believe the best
                products are built close to the people they serve, and
                that&apos;s exactly what we&apos;re doing — talking to barbers,
                sitting in shops, and building what they actually need.
              </p>
            </div>

            <div className="mt-16 text-center">
              <Button
                asChild
                size="lg"
                className="bg-gold text-[#0A0A0A] font-semibold hover:bg-gold-light rounded-none px-12 py-6 text-sm uppercase tracking-[0.15em]"
              >
                <Link href="/contact">Get in Touch</Link>
              </Button>

              <div className="mx-auto mt-12 barber-stripe-thin h-1 w-32 opacity-40 rounded-full" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
