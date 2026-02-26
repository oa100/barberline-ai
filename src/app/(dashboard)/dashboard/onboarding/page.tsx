import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { OnboardingSteps } from "@/components/dashboard/onboarding-steps";

export default async function OnboardingPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const supabase = await createClient();

  // Check if the user already has a shop
  let { data: shop } = await supabase
    .from("shops")
    .select("*")
    .eq("clerk_user_id", userId)
    .single();

  // If no shop exists, create one for the new user
  if (!shop) {
    const { data: newShop } = await supabase
      .from("shops")
      .insert({
        clerk_user_id: userId,
        name: "My Barbershop",
        timezone: "America/New_York",
      })
      .select()
      .single();

    shop = newShop;
  }

  if (!shop) {
    // If still no shop after insert, something went wrong
    return (
      <div className="mx-auto max-w-2xl space-y-8 p-8">
        <h1 className="text-3xl font-bold">Something went wrong</h1>
        <p className="text-muted-foreground">
          We couldn&apos;t create your shop profile. Please try again or contact support.
        </p>
      </div>
    );
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
