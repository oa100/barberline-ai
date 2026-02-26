import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client with the service role key.
 * ONLY use in server-to-server contexts (Vapi webhooks) where no Clerk session exists.
 * This client bypasses RLS — always scope queries by shop_id.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL");
  }

  return createSupabaseClient(url, key);
}
