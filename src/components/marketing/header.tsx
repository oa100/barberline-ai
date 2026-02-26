"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gold/10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto flex h-20 items-center justify-between px-6">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-3 group">
            {/* Barber pole icon */}
            <div className="relative h-8 w-3 overflow-hidden rounded-full">
              <div className="barber-stripe absolute inset-0" />
            </div>
            <span className="font-serif text-2xl tracking-wide text-foreground">
              BarberLine <span className="text-gold">AI</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="/how-it-works"
              className="text-sm font-medium tracking-wide text-warm-gray uppercase transition-colors hover:text-gold"
            >
              How It Works
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-medium tracking-wide text-warm-gray uppercase transition-colors hover:text-gold"
            >
              Pricing
            </Link>
          </nav>
        </div>

        {/* Desktop buttons */}
        <div className="hidden items-center gap-3 md:flex">
          <Button
            variant="ghost"
            asChild
            className="text-warm-gray hover:text-cream hover:bg-transparent"
          >
            <Link href="/sign-in">Log In</Link>
          </Button>
          <ThemeToggle />
          <Button
            asChild
            className="bg-gold text-primary-foreground font-semibold hover:bg-gold-light rounded-none px-6 tracking-wide uppercase text-xs"
          >
            <Link href="/signup">Get Started</Link>
          </Button>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="flex h-10 w-10 items-center justify-center rounded-md md:hidden text-foreground hover:bg-white/10"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Mobile menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="right" className="w-72 bg-background border-gold/10">
            <SheetHeader className="border-b border-gold/10 pb-4">
              <SheetTitle className="font-serif text-xl text-cream">
                BarberLine <span className="text-gold">AI</span>
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-4 pt-6">
              <Link
                href="/how-it-works"
                onClick={() => setOpen(false)}
                className="text-sm font-medium tracking-wide text-warm-gray uppercase transition-colors hover:text-gold"
              >
                How It Works
              </Link>
              <Link
                href="/pricing"
                onClick={() => setOpen(false)}
                className="text-sm font-medium tracking-wide text-warm-gray uppercase transition-colors hover:text-gold"
              >
                Pricing
              </Link>
              <div className="mt-4 flex flex-col gap-3 border-t border-gold/10 pt-6">
                <Button
                  variant="ghost"
                  asChild
                  className="w-full justify-center text-warm-gray hover:text-cream hover:bg-transparent"
                >
                  <Link href="/sign-in" onClick={() => setOpen(false)}>
                    Log In
                  </Link>
                </Button>
                <Button
                  asChild
                  className="w-full bg-gold text-primary-foreground font-semibold hover:bg-gold-light rounded-none px-6 tracking-wide uppercase text-xs"
                >
                  <Link href="/signup" onClick={() => setOpen(false)}>
                    Get Started
                  </Link>
                </Button>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
