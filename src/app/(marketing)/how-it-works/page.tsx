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
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            How it works
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Get your AI receptionist up and running in three simple steps.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-2xl space-y-12">
          {steps.map((step) => (
            <div key={step.number} className="flex gap-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                {step.number}
              </div>
              <div>
                <h2 className="text-xl font-semibold">{step.title}</h2>
                <p className="mt-2 text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Button asChild size="lg">
            <Link href="/signup">Get Started Now</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
