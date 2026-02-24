"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ShopSettings {
  square_access_token: string | null;
  phone_number: string | null;
}

export default function IntegrationsPage() {
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/dashboard/settings");
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  const squareConnected = !!settings?.square_access_token;
  const phoneActive = !!settings?.phone_number;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Integrations</h1>
        <p className="mt-1 text-muted-foreground">
          Connect external services to your shop.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Square</CardTitle>
              <Badge variant={squareConnected ? "default" : "secondary"}>
                {squareConnected ? "Connected" : "Not Connected"}
              </Badge>
            </div>
            <CardDescription>
              Accept payments and sync your booking calendar with Square.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {squareConnected ? (
              <p className="text-sm text-muted-foreground">
                Your Square account is connected and active.
              </p>
            ) : (
              <Button asChild>
                <a href="/api/square/oauth">Connect Square</a>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>AI Phone Line</CardTitle>
              <Badge variant={phoneActive ? "default" : "secondary"}>
                {phoneActive ? "Active" : "Not Set Up"}
              </Badge>
            </div>
            <CardDescription>
              Your dedicated AI-powered phone number for customer calls.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {phoneActive ? (
              <p className="text-sm font-medium">{settings?.phone_number}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No phone number assigned yet. Contact support to set up your AI
                phone line.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
