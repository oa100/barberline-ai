import twilio from "twilio";

interface SendSmsParams {
  to: string;
  body: string;
}

export async function sendSms({ to, body }: SendSmsParams) {
  const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
  );

  await twilioClient.messages.create({
    to,
    from: process.env.TWILIO_PHONE_NUMBER!,
    body,
  });
}
