import { redirect } from "next/navigation";
import { getAuthenticatedShop } from "@/lib/dashboard/auth";
import { SettingsForm } from "@/components/dashboard/settings-form";

export default async function SettingsPage() {
  const shop = await getAuthenticatedShop();

  if (!shop) {
    redirect("/signup");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your shop profile and preferences.
        </p>
      </div>

      <SettingsForm
        initialData={{
          name: shop.name,
          timezone: shop.timezone ?? "America/New_York",
          greeting: shop.ai_greeting ?? null,
        }}
      />
    </div>
  );
}
