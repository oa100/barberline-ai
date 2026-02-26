import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Marcus T.",
    shop: "Fresh Cuts Studio",
    location: "Dallas, TX",
    quote:
      "I used to miss 10+ calls a day while I was with clients. Now every call gets answered and most of them turn into bookings. My revenue went up 30% the first month.",
    stars: 5,
    initials: "MT",
  },
  {
    name: "Darius W.",
    shop: "Elite Barber Lounge",
    location: "Fort Worth, TX",
    quote:
      "The AI sounds so natural my clients don't even realize it's not a real person picking up. Setup took 15 minutes and it just works. Best investment I've made for my shop.",
    stars: 5,
    initials: "DW",
  },
  {
    name: "James R.",
    shop: "The Gentlemen's Chair",
    location: "Arlington, TX",
    quote:
      "I was paying a receptionist $2,400 a month. BarberLine does the same job for a fraction of the cost and never calls in sick. My books stay full every week.",
    stars: 5,
    initials: "JR",
  },
];

export function Testimonials() {
  return (
    <section className="relative py-28 border-t border-gold/10">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gold/3 rounded-full blur-[120px] pointer-events-none" />

      <div className="container relative mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-xs font-medium uppercase tracking-[0.25em] text-gold">
            Testimonials
          </span>
          <h2 className="mt-4 font-serif text-3xl tracking-tight md:text-5xl text-cream">
            Trusted by barbers across DFW
          </h2>
          <div className="gold-line mx-auto mt-6 w-24" />
        </div>

        <div className="mx-auto max-w-5xl grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              className={`card-glow animate-fade-in-up stagger-${i + 1} relative border border-gold/10 bg-card p-8`}
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.stars }).map((_, j) => (
                  <Star
                    key={j}
                    className="h-3.5 w-3.5 fill-gold text-gold"
                  />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-sm leading-relaxed text-cream/80">
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              {/* Author */}
              <div className="mt-6 flex items-center gap-3 border-t border-gold/10 pt-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-gold/30 bg-gold/10 text-xs font-bold text-gold uppercase tracking-wider">
                  {t.initials}
                </div>
                <div>
                  <div className="text-sm font-semibold text-cream">{t.name}</div>
                  <div className="text-xs text-warm-gray">
                    {t.shop} &middot; {t.location}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
