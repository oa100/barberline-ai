import Link from "next/link";
import { Phone, Calendar, MessageSquare, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
            Never miss a booking again
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            BarberLine AI answers your phone calls, books appointments, and
            sends confirmations — so you can focus on cutting hair.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/signup">Start Free Trial</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#how-it-works">See How It Works</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="border-y bg-muted/40 py-20">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            You&apos;re mid-cut. The phone rings...
          </h2>
          <p className="mt-6 text-lg text-muted-foreground">
            Independent barbers and small shops miss{" "}
            <span className="font-semibold text-foreground">
              40-60% of incoming calls
            </span>{" "}
            because they&apos;re busy with clients. Every missed call is a lost
            customer and lost revenue.
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight md:text-4xl">
            How It Works
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <feature.icon className="mb-2 size-10 text-primary" />
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-20 text-primary-foreground">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Ready to stop losing customers?
          </h2>
          <p className="mt-4 text-lg text-primary-foreground/80">
            Join hundreds of barbers who never miss a call. Start your free
            trial today.
          </p>
          <div className="mt-8">
            <Button
              size="lg"
              variant="secondary"
              asChild
            >
              <Link href="/signup">Start Free Trial</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
