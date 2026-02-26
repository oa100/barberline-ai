import { redirect } from "next/navigation";
import { getAuthenticatedShop } from "@/lib/dashboard/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function BillingPage() {
  const shop = await getAuthenticatedShop();

  if (!shop) {
    redirect("/dashboard/onboarding");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your subscription and billing details.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Current Plan <Badge>Free Trial</Badge>
          </CardTitle>
          <CardDescription>
            Upgrade your plan to unlock more AI calls, advanced analytics, and
            premium features.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button variant="outline">Starter — $49/mo</Button>
            <Button>Pro — $99/mo</Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Stripe checkout integration coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
