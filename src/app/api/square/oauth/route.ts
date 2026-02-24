import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const SCOPES = [
  "APPOINTMENTS_READ",
  "APPOINTMENTS_WRITE",
  "ITEMS_READ",
  "MERCHANT_PROFILE_READ",
];

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = process.env.SQUARE_APP_ID!;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/square/callback`;

  const baseUrl =
    process.env.SQUARE_ENVIRONMENT === "production"
      ? "https://connect.squareup.com"
      : "https://connect.squareupsandbox.com";

  const params = new URLSearchParams({
    client_id: clientId,
    scope: SCOPES.join(" "),
    session: "false",
    state: userId,
  });

  const oauthUrl = `${baseUrl}/oauth2/authorize?${params.toString()}&redirect_uri=${encodeURIComponent(redirectUri)}`;

  return NextResponse.redirect(oauthUrl);
}
