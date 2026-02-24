"use client";

import { useState } from "react";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface OnboardingStepsProps {
  shopId: string;
  hasSquare: boolean;
}

const DEFAULT_GREETING =
  "Hello! Thanks for calling. I'm the AI assistant for this barbershop. I can help you check available appointment times, book an appointment, or take a message for the barber. How can I help you today?";

export function OnboardingSteps({ shopId, hasSquare }: OnboardingStepsProps) {
  const [currentStep, setCurrentStep] = useState(hasSquare ? 2 : 1);
  const [greeting, setGreeting] = useState(DEFAULT_GREETING);
  const [activating, setActivating] = useState(false);
  const [completed, setCompleted] = useState(false);

  async function handleActivate() {
    setActivating(true);
    try {
      const response = await fetch("/api/dashboard/onboarding/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, greeting }),
      });

      if (response.ok) {
        setCompleted(true);
      }
    } finally {
      setActivating(false);
    }
  }

  if (completed) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle className="size-16 text-green-500" />
          <h2 className="mt-4 text-2xl font-bold">You are all set!</h2>
          <p className="mt-2 text-muted-foreground">
            Your AI receptionist is now live and ready to take calls.
          </p>
          <Button asChild className="mt-6">
            <a href="/dashboard">Go to Dashboard</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Step 1: Connect Square */}
      <Card className={currentStep > 1 ? "opacity-60" : ""}>
        <CardHeader>
          <div className="flex items-center gap-3">
            {currentStep > 1 ? (
              <CheckCircle className="size-6 text-green-500" />
            ) : (
              <span className="flex size-6 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                1
              </span>
            )}
            <div>
              <CardTitle>Connect Square</CardTitle>
              <CardDescription>
                Link your Square account to sync your calendar and accept
                bookings.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        {currentStep === 1 && (
          <CardContent>
            <Button asChild>
              <a href="/api/square/oauth">Connect Square Account</a>
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Step 2: Customize AI Greeting */}
      <Card className={currentStep < 2 ? "opacity-40" : currentStep > 2 ? "opacity-60" : ""}>
        <CardHeader>
          <div className="flex items-center gap-3">
            {currentStep > 2 ? (
              <CheckCircle className="size-6 text-green-500" />
            ) : (
              <span className="flex size-6 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                2
              </span>
            )}
            <div>
              <CardTitle>Customize AI Greeting</CardTitle>
              <CardDescription>
                Set the greeting your AI receptionist will use when answering
                calls.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        {currentStep === 2 && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="greeting">AI Greeting Message</Label>
              <Textarea
                id="greeting"
                value={greeting}
                onChange={(e) => setGreeting(e.target.value)}
                rows={4}
              />
            </div>
            <Button onClick={() => setCurrentStep(3)}>Next</Button>
          </CardContent>
        )}
      </Card>

      {/* Step 3: Go Live */}
      <Card className={currentStep < 3 ? "opacity-40" : ""}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="flex size-6 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              3
            </span>
            <div>
              <CardTitle>Go Live</CardTitle>
              <CardDescription>
                Activate your AI receptionist and start taking calls.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        {currentStep === 3 && (
          <CardContent>
            <Button onClick={handleActivate} disabled={activating}>
              {activating ? "Activating..." : "Activate AI Receptionist"}
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
