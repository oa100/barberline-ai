import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

describe("POST /api/twilio/send (removed)", () => {
  it("returns 404 for any request", async () => {
    const req = new NextRequest("http://localhost/api/twilio/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        to: "+15551234567",
        shopId: "shop_1",
        startAt: "2026-03-01T14:00:00Z",
        customerName: "Test",
      }),
    });

    const res = await POST();
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body.error).toContain("removed");
  });
});
