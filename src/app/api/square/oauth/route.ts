import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

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

  const rl = rateLimit(`square-oauth:${userId}`, { limit: 5, windowMs: 60_000 });
  if (!rl.success) return rateLimitResponse();

  const clientId = process.env.SQUARE_APP_ID!;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/square/callback`;

  const baseUrl =
    process.env.SQUARE_ENVIRONMENT === "production"
      ? "https://connect.squareup.com"
      : "https://connect.squareupsandbox.com";

  // Generate a cryptographic nonce for CSRF protection
  const csrfState = crypto.randomUUID();

  // Store it in a secure HttpOnly cookie for validation in the callback
  const cookieStore = await cookies();
  cookieStore.set("square_oauth_state", csrfState, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  const params = new URLSearchParams({
    client_id: clientId,
    scope: SCOPES.join(" "),
    session: "false",
    state: csrfState,
  });

  const oauthUrl = `${baseUrl}/oauth2/authorize?${params.toString()}&redirect_uri=${encodeURIComponent(redirectUri)}`;

  return NextResponse.redirect(oauthUrl);
}
