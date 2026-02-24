import { NextRequest } from "next/server";

export function validateVapiRequest(req: NextRequest): boolean {
  const secret = req.headers.get("x-vapi-secret");
  return secret === process.env.VAPI_SERVER_SECRET;
}

export function unauthorizedResponse() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
