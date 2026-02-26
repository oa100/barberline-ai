import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
      {/* Subtle radial glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gold/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo / Brand */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <h1 className="font-sans font-bold text-3xl tracking-tight text-cream">
              Barber<span className="text-gold">Line</span>{" "}
              <span className="text-warm-gray">AI</span>
            </h1>
          </Link>
          <div className="mx-auto mt-3 h-px w-16 bg-gold/30" />
        </div>

        {/* Clerk component slot */}
        {children}

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-warm-gray">
          <Link href="/privacy" className="hover:text-cream transition-colors">
            Privacy
          </Link>
          {" · "}
          <Link href="/terms" className="hover:text-cream transition-colors">
            Terms
          </Link>
        </p>
      </div>
    </div>
  );
}
