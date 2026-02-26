"use client";

import { useState } from "react";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SimulateCallButtonProps {
  shopId: string;
}

export function SimulateCallButton({ shopId }: SimulateCallButtonProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleSimulate() {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/dashboard/simulate-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId }),
      });

      const data = await res.json();
      if (data.ok) {
        setResult(data.summary);
        // Refresh the page after a short delay so stats update
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setResult(`Error: ${data.error}`);
      }
    } catch {
      setResult("Failed to simulate call");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      <Button onClick={handleSimulate} disabled={loading} variant="outline" size="sm" className="w-full sm:w-auto">
        <Phone className="mr-2 h-4 w-4" />
        {loading ? "Calling..." : "Simulate Call"}
      </Button>
      {result && (
        <span className="text-sm text-muted-foreground animate-in fade-in">{result}</span>
      )}
    </div>
  );
}
