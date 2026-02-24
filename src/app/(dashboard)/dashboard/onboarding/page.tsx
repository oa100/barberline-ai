import { redirect } from "next/navigation";
import { getAuthenticatedShop } from "@/lib/dashboard/auth";
import { OnboardingSteps } from "@/components/dashboard/onboarding-steps";

export default async function OnboardingPage() {
  const shop = await getAuthenticatedShop();

  if (!shop) {
    redirect("/signup");
  }

  // If already fully set up, redirect to dashboard
  if (shop.square_token && shop.vapi_agent_id) {
    redirect("/dashboard");
  }

  const hasSquare = Boolean(shop.square_token);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Set Up Your AI Receptionist</h1>
        <p className="mt-1 text-muted-foreground">
          Complete these steps to get your AI receptionist up and running.
        </p>
      </div>

      <OnboardingSteps shopId={shop.id} hasSquare={hasSquare} />
    </div>
  );
}
