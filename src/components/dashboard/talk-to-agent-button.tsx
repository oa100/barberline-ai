"use client";

import { useState, useRef, useCallback } from "react";
import { Mic, MicOff, PhoneCall, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TalkToAgentButtonProps {
  shopId: string;
  shopName: string;
  greeting: string | null;
  timezone: string;
}

export function TalkToAgentButton({
  shopId,
  shopName,
  greeting,
  timezone,
}: TalkToAgentButtonProps) {
  const [status, setStatus] = useState<
    "idle" | "connecting" | "active" | "ending"
  >("idle");
  const [transcript, setTranscript] = useState<
    { role: string; text: string }[]
  >([]);
  const [isMuted, setIsMuted] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vapiRef = useRef<any>(null);

  const defaultGreeting =
    "Hello! Thanks for calling. I'm the AI assistant for this barbershop. I can help you check available appointment times, book an appointment, or answer questions. How can I help you today?";

  const startCall = useCallback(async () => {
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    if (!publicKey) {
      alert("NEXT_PUBLIC_VAPI_PUBLIC_KEY is not set. Add it to .env.local.");
      return;
    }

    setStatus("connecting");
    setTranscript([]);

    try {
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
        console.error("Vapi error:", error);
        setStatus("idle");
        vapiRef.current = null;
      });

      await vapi.start({
        name: `${shopName} AI Receptionist`,
        firstMessage: greeting || defaultGreeting,
        model: {
          provider: "openai",
          model: "gpt-4o",
          temperature: 0.7,
          messages: [
            {
              role: "system",
              content: `You are a friendly AI receptionist for "${shopName}", a barbershop. Your job is to:
1. Answer questions about the shop (hours, services, pricing)
2. Help callers book appointments
3. Handle rescheduling and cancellations
4. Take messages if needed

Shop details:
- Name: ${shopName}
- Timezone: ${timezone}
- Hours: Monday-Saturday 9 AM to 7 PM
- Services: Classic Fade ($35), Beard Trim ($20), Hot Towel Shave ($30), Line Up ($15), Full Cut + Beard ($50), Kids Cut ($25)

Be warm, professional, and conversational. Keep responses concise since this is a voice call.`,
            },
          ],
        },
        voice: {
          provider: "11labs",
          voiceId: "21m00Tcm4TlvDq8ikWAM",
        },
        metadata: {
          shopId,
        },
      });
    } catch (err) {
      console.error("Failed to start call:", err);
      setStatus("idle");
    }
  }, [shopId, shopName, greeting, timezone, defaultGreeting]);

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
