import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { shopId } = await req.json();

  const supabase = await createClient();
  const { data: shop } = await supabase
    .from("shops")
    .select("*")
    .eq("id", shopId)
    .eq("clerk_user_id", userId)
    .single();

  if (!shop) {
    return NextResponse.json({ error: "Shop not found" }, { status: 404 });
  }

  const greeting =
    shop.greeting ||
    "Hello! Thanks for calling. I'm the AI assistant for this barbershop. I can help you check available appointment times, book an appointment, or answer questions. How can I help you today?";

  // Return the API key and assistant config for the web SDK
  // In production, you'd generate a scoped JWT instead
  return NextResponse.json({
    apiKey: process.env.VAPI_API_KEY,
    assistant: {
      name: `${shop.name} AI Receptionist`,
      firstMessage: greeting,
      model: {
        provider: "openai",
        model: "gpt-4o",
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content: `You are a friendly AI receptionist for "${shop.name}", a barbershop. Your job is to:
1. Answer questions about the shop (hours, services, pricing)
2. Help callers book appointments
3. Handle rescheduling and cancellations
4. Take messages if needed

Shop details:
- Name: ${shop.name}
- Timezone: ${shop.timezone}
- Hours: Monday-Saturday 9 AM to 7 PM (typical barbershop hours)
- Services: Classic Fade ($35), Beard Trim ($20), Hot Towel Shave ($30), Line Up ($15), Full Cut + Beard ($50), Kids Cut ($25)

Be warm, professional, and conversational. Keep responses concise since this is a phone call. If someone wants to book, ask for their name, preferred service, and preferred date/time.`,
          },
        ],
      },
      voice: {
        provider: "11labs",
        voiceId: "21m00Tcm4TlvDq8ikWAM",
      },
      endCallMessage: "Thanks for calling! Have a great day.",
      metadata: {
        shopId: shop.id,
      },
    },
  });
}
