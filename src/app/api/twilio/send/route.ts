// This endpoint has been removed for security reasons.
// SMS sending is now handled internally via @/lib/twilio/send-sms.
// This file returns 404 for any requests to prevent the endpoint from being abused.

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "This endpoint has been removed" },
    { status: 404 }
  );
}
