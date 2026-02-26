"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CheckoutButton({
  tier,
  interval,
  label,
  variant = "default",
}: {
  tier: string;
  interval: "monthly" | "annual";
  label: string;
  variant?: "default" | "outline";
}) {
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, interval }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant={variant} onClick={handleCheckout} disabled={loading}>
      {loading ? "Redirecting…" : label}
    </Button>
  );
}
