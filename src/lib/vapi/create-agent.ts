interface CreateVapiAgentParams {
  shopId: string;
  shopName: string;
  greeting: string;
}

export async function createVapiAgent(params: CreateVapiAgentParams) {
  const { shopId, shopName, greeting } = params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const payload = {
    name: `BarberLine - ${shopName}`,
    model: {
      provider: "openai",
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: greeting,
        },
      ],
    },
    voice: {
      provider: "11labs",
      voiceId: "21m00Tcm4TlvDq8ikWAM",
    },
    serverUrl: `${appUrl}/api/vapi/webhook`,
    metadata: {
      shopId,
    },
    functions: [
      {
        name: "check_availability",
        description: "Check available appointment slots for a given date",
        parameters: {
          type: "object",
          properties: {
            date: {
              type: "string",
              description: "The date to check availability for (YYYY-MM-DD)",
            },
          },
          required: ["date"],
        },
        serverUrl: `${appUrl}/api/vapi/availability`,
      },
      {
        name: "create_booking",
        description: "Create a new booking appointment",
        parameters: {
          type: "object",
          properties: {
            date: {
              type: "string",
              description: "The date for the booking (YYYY-MM-DD)",
            },
            time: {
              type: "string",
              description: "The time for the booking (HH:MM)",
            },
            customerName: {
              type: "string",
              description: "The name of the customer",
            },
            customerPhone: {
              type: "string",
              description: "The phone number of the customer",
            },
          },
          required: ["date", "time", "customerName", "customerPhone"],
        },
        serverUrl: `${appUrl}/api/vapi/book`,
      },
      {
        name: "get_shop_info",
        description: "Get information about the barbershop",
        parameters: {
          type: "object",
          properties: {},
        },
        serverUrl: `${appUrl}/api/vapi/info`,
      },
      {
        name: "take_message",
        description: "Take a message from the caller for the shop owner",
        parameters: {
          type: "object",
          properties: {
            callerName: {
              type: "string",
              description: "The name of the caller",
            },
            message: {
              type: "string",
              description: "The message content",
            },
          },
          required: ["callerName", "message"],
        },
        serverUrl: `${appUrl}/api/vapi/message`,
      },
    ],
  };

  const response = await fetch("https://api.vapi.ai/assistant", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.VAPI_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create Vapi agent: ${error}`);
  }

  return response.json();
}
