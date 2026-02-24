"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface SettingsFormProps {
  initialData: {
    name: string;
    timezone: string;
    greeting: string | null;
  };
}

export function SettingsForm({ initialData }: SettingsFormProps) {
  const [name, setName] = useState(initialData.name);
  const [timezone, setTimezone] = useState(initialData.timezone);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await fetch("/api/dashboard/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, timezone }),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Shop Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="timezone">Timezone</Label>
        <Input
          id="timezone"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
        />
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}
