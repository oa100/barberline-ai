import { NextRequest } from "next/server";
import crypto from "crypto";

export function validateVapiRequest(req: NextRequest): boolean {
  const secret = req.headers.get("x-vapi-secret");
  const expectedSecret = process.env.VAPI_SERVER_SECRET;

  // Reject if either secret is missing or empty
  if (!secret || !expectedSecret) {
    return false;
  }

  // Handle different lengths safely (timingSafeEqual requires equal-length buffers)
  const secretBuffer = Buffer.from(secret, "utf-8");
  const expectedBuffer = Buffer.from(expectedSecret, "utf-8");

  if (secretBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(secretBuffer, expectedBuffer);
}

export function unauthorizedResponse() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
