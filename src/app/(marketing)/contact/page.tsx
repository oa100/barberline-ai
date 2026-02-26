import { Mail, MessageCircle, Instagram } from "lucide-react";

export default function ContactPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative py-28">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[400px] bg-gold/3 rounded-full blur-[120px] pointer-events-none" />

        <div className="container relative mx-auto px-6">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-medium uppercase tracking-[0.1em] text-gold animate-fade-in">
              Contact
            </span>
            <h1 className="mt-4 font-sans font-bold text-4xl tracking-tight sm:text-5xl md:text-6xl text-cream animate-fade-in-up stagger-1">
              Let&apos;s talk
            </h1>
            <p className="mt-6 text-lg text-warm-gray animate-fade-in-up stagger-2">
              Questions, feedback, or just want to learn more? We&apos;d love to
              hear from you.
            </p>
            <div className="gold-line mx-auto mt-8 w-24" />
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="relative bg-secondary py-28">
        <div className="container relative mx-auto px-6">
          <div className="mx-auto max-w-2xl">
            <div className="grid gap-12 sm:grid-cols-2">
              {/* Email */}
              <div className="animate-fade-in-up stagger-2">
                <div className="flex h-12 w-12 items-center justify-center border border-gold/30 bg-gold/10">
                  <Mail className="h-5 w-5 text-gold" />
                </div>
                <h2 className="mt-6 font-sans font-bold text-2xl text-cream">Email</h2>
                <a
                  href="mailto:hello@barberlineai.com"
                  className="mt-3 block text-gold hover:text-gold-light transition-colors"
                >
                  hello@barberlineai.com
                </a>
                <p className="mt-2 text-sm text-warm-gray">
                  We respond within 24 hours.
                </p>
              </div>

              {/* Social */}
              <div className="animate-fade-in-up stagger-3">
                <div className="flex h-12 w-12 items-center justify-center border border-gold/30 bg-gold/10">
                  <Instagram className="h-5 w-5 text-gold" />
                </div>
                <h2 className="mt-6 font-sans font-bold text-2xl text-cream">
                  Instagram
                </h2>
                <a
                  href="https://instagram.com/barberlineai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 block text-gold hover:text-gold-light transition-colors"
                >
                  @barberlineai
                </a>
                <p className="mt-2 text-sm text-warm-gray">
                  Follow us for updates and shop spotlights.
                </p>
              </div>
            </div>

            <div className="gold-line mt-16 w-full" />

            {/* Existing Customers */}
            <div className="mt-16 animate-fade-in-up stagger-4">
              <div className="flex h-12 w-12 items-center justify-center border border-gold/30 bg-gold/10">
                <MessageCircle className="h-5 w-5 text-gold" />
              </div>
              <h2 className="mt-6 font-sans font-bold text-2xl text-cream">
                Existing customers
              </h2>
              <p className="mt-3 text-warm-gray leading-relaxed">
                If you&apos;re already using BarberLine AI, you can reach our
                support team directly from your dashboard. Log in and hit the
                support button — we&apos;re usually faster there.
              </p>
            </div>

          </div>
        </div>
      </section>
    </>
  );
}
