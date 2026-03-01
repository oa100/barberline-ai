"use client";

import { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function VoiceSettingsPage() {
  const [greeting, setGreeting] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/dashboard/settings");
        if (res.ok) {
          const data = await res.json();
          setGreeting(data.greeting ?? "");
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ greeting }),
      });
      if (res.ok) {
        toast.success("Voice settings saved.");
      } else {
        toast.error("Failed to save voice settings.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Voice Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Customize your AI phone assistant greeting.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="greeting">AI Greeting</Label>
          <Textarea
            id="greeting"
            value={greeting}
            onChange={(e) => setGreeting(e.target.value)}
            rows={4}
            placeholder="Hello! Thanks for calling. How can I help you today?"
          />
          <p className="text-sm text-muted-foreground">
            This is the first thing your AI assistant will say when answering a
            call.
          </p>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
