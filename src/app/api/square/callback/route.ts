import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { SquareClient, SquareEnvironment } from "square";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { encrypt } from "@/lib/crypto";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/integrations?error=missing_code`
    );
  }

  // CSRF validation: compare state param with cookie
  const state = req.nextUrl.searchParams.get("state");
  const cookieStore = await cookies();
  const storedState = cookieStore.get("square_oauth_state")?.value;

  if (!state || !storedState || state !== storedState) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/integrations?error=csrf_mismatch`
    );
  }

  // Clean up the CSRF cookie
  cookieStore.delete("square_oauth_state");

  try {
    // Create a Square client without an access token for the OAuth exchange
    const client = new SquareClient({
      environment:
        process.env.SQUARE_ENVIRONMENT === "production"
          ? SquareEnvironment.Production
          : SquareEnvironment.Sandbox,
    });

    // Exchange authorization code for an access token
    const tokenResponse = await client.oAuth.obtainToken({
      clientId: process.env.SQUARE_APP_ID!,
      clientSecret: process.env.SQUARE_APP_SECRET!,
      code,
      grantType: "authorization_code",
    });

    const accessToken = tokenResponse.accessToken;
    if (!accessToken) {
      throw new Error("No access token returned from Square");
    }

    // Create an authenticated client to fetch the first location
    const authenticatedClient = new SquareClient({
      token: accessToken,
      environment:
        process.env.SQUARE_ENVIRONMENT === "production"
          ? SquareEnvironment.Production
          : SquareEnvironment.Sandbox,
    });

    const locationsResponse = await authenticatedClient.locations.list();
    const firstLocation = locationsResponse.locations?.[0];
    const locationId = firstLocation?.id ?? null;

    // Update the shop record in Supabase
    const supabase = await createClient();
    const { error: updateError } = await supabase
      .from("shops")
      .update({
        provider_type: "square",
        provider_token: encrypt(accessToken),
        provider_location_id: locationId,
      })
      .eq("clerk_user_id", userId);

    if (updateError) {
      console.error("Failed to update shop record:", updateError);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/integrations?error=db_update_failed`
      );
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/integrations?success=true`
    );
  } catch (err) {
    console.error("Square OAuth callback failed:", err);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/integrations?error=oauth_failed`
    );
  }
}
