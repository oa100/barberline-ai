import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { createVapiAgent } from "@/lib/vapi/create-agent";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { shopId, greeting } = await req.json();
  if (!shopId) {
    return NextResponse.json({ error: "Missing shopId" }, { status: 400 });
  }

  const supabase = await createClient();

  // Verify the shop belongs to this user
  const { data: shop } = await supabase
    .from("shops")
    .select("id, name")
    .eq("id", shopId)
    .eq("clerk_user_id", userId)
    .single();

  if (!shop) {
    return NextResponse.json({ error: "Shop not found" }, { status: 404 });
  }

  // Save greeting first
  const { error: greetingError } = await supabase
    .from("shops")
    .update({ greeting: greeting || null })
    .eq("id", shopId);

  if (greetingError) {
    return NextResponse.json(
      { error: "Failed to save greeting" },
      { status: 500 }
    );
  }

  // Create the Vapi agent
  try {
    const agent = await createVapiAgent({
      shopId,
      shopName: shop.name,
      greeting:
        greeting ||
        "Hello! Thanks for calling. I'm the AI assistant for this barbershop. I can help you check available appointment times, book an appointment, or take a message for the barber. How can I help you today?",
    });

    // Store the real agent ID
    const { error: updateError } = await supabase
      .from("shops")
      .update({ vapi_agent_id: agent.id })
      .eq("id", shopId);

    if (updateError) {
      return NextResponse.json(
        { error: "Agent created but failed to save agent ID" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, agentId: agent.id });
  } catch (err) {
    console.error("Failed to create Vapi agent:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to create AI agent. Please try again.",
      },
      { status: 500 }
    );
  }
}
