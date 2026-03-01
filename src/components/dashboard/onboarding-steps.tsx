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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const US_TIMEZONES = [
  { label: "Eastern (ET)", value: "America/New_York" },
  { label: "Central (CT)", value: "America/Chicago" },
  { label: "Mountain (MT)", value: "America/Denver" },
  { label: "Pacific (PT)", value: "America/Los_Angeles" },
  { label: "Alaska (AKT)", value: "America/Anchorage" },
  { label: "Hawaii (HT)", value: "Pacific/Honolulu" },
];

interface OnboardingStepsProps {
  shopId: string;
  shopName: string;
  hasSquare: boolean;
  initialStep?: number;
}

const DEFAULT_GREETING =
  "Hello! Thanks for calling. I'm the AI assistant for this barbershop. I can help you check available appointment times, book an appointment, or take a message for the barber. How can I help you today?";

function computeInitialStep(hasSquare: boolean, initialStep?: number): number {
  if (initialStep && initialStep >= 1 && initialStep <= 4) return initialStep;
  if (hasSquare) return 3;
  return 1;
}

export function OnboardingSteps({
  shopId,
  shopName: initialShopName,
  hasSquare,
  initialStep,
}: OnboardingStepsProps) {
  const [currentStep, setCurrentStep] = useState(() =>
    computeInitialStep(hasSquare, initialStep)
  );
  const [shopName, setShopName] = useState(initialShopName || "");
  const [timezone, setTimezone] = useState("America/Chicago");
  const [greeting, setGreeting] = useState(DEFAULT_GREETING);
  const [activating, setActivating] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [savingShopDetails, setSavingShopDetails] = useState(false);

  async function handleSaveShopDetails() {
    if (!shopName.trim()) {
      toast.error("Please enter your shop name.");
      return;
    }
    setSavingShopDetails(true);
    try {
      const res = await fetch("/api/dashboard/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: shopName.trim(), timezone }),
      });
      if (!res.ok) {
        toast.error("Failed to save shop details. Please try again.");
        return;
      }
      setCurrentStep(2);
    } finally {
      setSavingShopDetails(false);
    }
  }

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
      } else {
        const data = await response.json().catch(() => ({}));
        toast.error(data.error || "Activation failed. Please try again.");
      }
    } catch {
      toast.error("Network error. Please check your connection and try again.");
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
      {/* Step 1: Shop Details */}
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
              <CardTitle>Shop Details</CardTitle>
              <CardDescription>
                Tell us about your barbershop so your AI receptionist knows what
                to say.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        {currentStep === 1 && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shopName">Shop Name</Label>
              <Input
                id="shopName"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="e.g. King's Cuts Barbershop"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <select
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {US_TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
            <Button
              onClick={handleSaveShopDetails}
              disabled={savingShopDetails}
            >
              {savingShopDetails ? "Saving..." : "Next"}
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Step 2: Connect Square */}
      <Card
        className={
          currentStep < 2 ? "opacity-40" : currentStep > 2 ? "opacity-60" : ""
        }
      >
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
              <CardTitle>Connect Square</CardTitle>
              <CardDescription>
                Link your Square account to sync your calendar and accept
                bookings.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        {currentStep === 2 && (
          <CardContent className="flex gap-3">
            <Button asChild>
              <a href="/api/square/oauth?returnTo=/dashboard/onboarding">
                Connect Square Account
              </a>
            </Button>
            <Button variant="outline" onClick={() => setCurrentStep(3)}>
              Skip for now
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Step 3: Customize AI Greeting */}
      <Card
        className={
          currentStep < 3 ? "opacity-40" : currentStep > 3 ? "opacity-60" : ""
        }
      >
        <CardHeader>
          <div className="flex items-center gap-3">
            {currentStep > 3 ? (
              <CheckCircle className="size-6 text-green-500" />
            ) : (
              <span className="flex size-6 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                3
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
        {currentStep === 3 && (
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
            <Button onClick={() => setCurrentStep(4)}>Next</Button>
          </CardContent>
        )}
      </Card>

      {/* Step 4: Go Live */}
      <Card className={currentStep < 4 ? "opacity-40" : ""}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="flex size-6 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              4
            </span>
            <div>
              <CardTitle>Go Live</CardTitle>
              <CardDescription>
                Activate your AI receptionist and start taking calls.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        {currentStep === 4 && (
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
