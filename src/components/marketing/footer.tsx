import Link from "next/link";

export function Footer() {
  return (
    <footer className="relative border-t border-gold/10 bg-[#080808]">
      {/* Gold line accent at top */}
      <div className="gold-line w-full" />

      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-2 gap-12 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative h-6 w-2 overflow-hidden rounded-full">
                <div className="barber-stripe absolute inset-0" />
              </div>
              <span className="font-serif text-xl tracking-wide text-cream">
                BarberLine <span className="text-gold">AI</span>
              </span>
            </div>
            <p className="text-sm text-warm-gray leading-relaxed max-w-xs">
              The AI receptionist built for barbers. Never miss a call, never lose a booking.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              Product
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/how-it-works"
                  className="text-sm text-warm-gray transition-colors hover:text-cream"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="text-sm text-warm-gray transition-colors hover:text-cream"
                >
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              Company
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/about"
                  className="text-sm text-warm-gray transition-colors hover:text-cream"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-warm-gray transition-colors hover:text-cream"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              Legal
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-warm-gray transition-colors hover:text-cream"
                >
                  Privacy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-warm-gray transition-colors hover:text-cream"
                >
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-gold/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-warm-gray tracking-wide">
            &copy; {new Date().getFullYear()} BarberLine AI. All rights reserved.
          </p>
          <div className="barber-stripe-thin h-1 w-24 rounded-full" />
        </div>
      </div>
    </footer>
  );
}
