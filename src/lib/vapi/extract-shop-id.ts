/**
 * Extracts and validates shopId from a Vapi webhook message body.
 * Prefers the trusted metadata shopId over untrusted function call parameters.
 * Returns null if there's a mismatch (possible tampering).
 */
export function extractShopId(body: {
  message?: {
    functionCall?: { parameters?: { shopId?: string } };
    assistant?: { metadata?: { shopId?: string } };
  };
}): { shopId: string | null; mismatch: boolean } {
  const metadataShopId = body.message?.assistant?.metadata?.shopId;
  const paramShopId = body.message?.functionCall?.parameters?.shopId;

  // If both are provided, they must match
  if (metadataShopId && paramShopId && metadataShopId !== paramShopId) {
    return { shopId: null, mismatch: true };
  }

  // Prefer metadata (trusted) over parameters (untrusted)
  const shopId = metadataShopId || paramShopId || null;
  return { shopId, mismatch: false };
}
