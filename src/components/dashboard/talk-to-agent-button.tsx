"use client";

import { useState, useRef, useCallback } from "react";
import { Mic, MicOff, PhoneCall, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TalkToAgentButtonProps {
  shopId: string;
}

export function TalkToAgentButton({ shopId }: TalkToAgentButtonProps) {
  const [status, setStatus] = useState<
    "idle" | "connecting" | "active" | "ending"
  >("idle");
  const [transcript, setTranscript] = useState<
    { role: string; text: string }[]
  >([]);
  const [isMuted, setIsMuted] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vapiRef = useRef<any>(null);

  const startCall = useCallback(async () => {
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    if (!publicKey) {
      alert("NEXT_PUBLIC_VAPI_PUBLIC_KEY is not set. Add it to .env.local.");
      return;
    }

    setStatus("connecting");
    setTranscript([]);

    try {
      // Fetch sanitized assistant config from server
      const configRes = await fetch("/api/dashboard/vapi-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId }),
      });

      if (!configRes.ok) {
        alert("Failed to load agent configuration. Please try again.");
        setStatus("idle");
        return;
      }

      const { assistant } = await configRes.json();

      const { default: Vapi } = await import("@vapi-ai/web");
      const vapi = new Vapi(publicKey);
      vapiRef.current = vapi;

      vapi.on("call-start", () => {
        setStatus("active");
      });

      vapi.on("call-end", () => {
        setStatus("idle");
        vapiRef.current = null;
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vapi.on("message", (message: any) => {
        if (
          message.type === "transcript" &&
          message.transcriptType === "final"
        ) {
          setTranscript((prev) => [
            ...prev,
            {
              role: message.role as string,
              text: message.transcript as string,
            },
          ]);
        }
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vapi.on("error", (error: any) => {
        const msg =
          (typeof error?.error === "string" && error.error) ||
          error?.error?.message ||
          error?.message ||
          "Connection failed. Please try again.";
        console.error("Vapi error:", { type: error?.type, stage: error?.stage, error: error?.error });
        alert(`Call failed: ${msg}`);
        setStatus("idle");
        vapiRef.current = null;
      });

      await vapi.start(assistant);
    } catch (err) {
      console.error("Failed to start call:", err);
      setStatus("idle");
    }
  }, [shopId]);

  const endCall = useCallback(() => {
    setStatus("ending");
    vapiRef.current?.stop();
  }, []);

  const toggleMute = useCallback(() => {
    if (vapiRef.current) {
      const newMuted = !isMuted;
      vapiRef.current.setMuted(newMuted);
      setIsMuted(newMuted);
    }
  }, [isMuted]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
        {status === "idle" ? (
          <Button onClick={startCall} variant="default" size="sm" className="w-full sm:w-auto">
            <PhoneCall className="mr-2 h-4 w-4" />
            Talk to Agent
          </Button>
        ) : (
          <>
            <Button
              onClick={endCall}
              variant="destructive"
              size="sm"
              className="w-full sm:w-auto"
              disabled={status === "connecting" || status === "ending"}
            >
              <PhoneOff className="mr-2 h-4 w-4" />
              {status === "connecting"
                ? "Connecting..."
                : status === "ending"
                ? "Ending..."
                : "End Call"}
            </Button>
            {status === "active" && (
              <Button onClick={toggleMute} variant="outline" size="sm">
                {isMuted ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
            )}
            {status === "active" && (
              <span className="flex items-center gap-1.5 text-sm text-green-500">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Live
              </span>
            )}
          </>
        )}
      </div>

      {transcript.length > 0 && (
        <div className="max-h-48 overflow-y-auto rounded border bg-muted/50 p-3 text-sm space-y-2">
          {transcript.map((t, i) => (
            <div key={i}>
              <span className="font-semibold text-muted-foreground">
                {t.role === "assistant" ? "AI: " : "You: "}
              </span>
              <span>{t.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
