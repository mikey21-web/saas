import crypto from "crypto";

const OAUTH_STATE_SECRET = process.env.OAUTH_STATE_SECRET!;

// Generate a signed state param containing userId + random nonce
export function generateOAuthState(userId: string): string {
  const nonce = crypto.randomBytes(16).toString("hex");
  const payload = JSON.stringify({ userId, nonce, ts: Date.now() });
  const hmac = crypto.createHmac("sha256", OAUTH_STATE_SECRET);
  hmac.update(payload);
  const sig = hmac.digest("base64url");
  return Buffer.from(payload).toString("base64url") + "." + sig;
}

// Verify and decode the state param on callback
export function verifyOAuthState(state: string): { userId: string } | null {
  if (!state || typeof state !== "string" || !state.includes(".")) return null;
  const [payloadB64, sig] = state.split(".");
  let payloadRaw: string;
  try {
    payloadRaw = Buffer.from(payloadB64, "base64url").toString();
  } catch {
    return null;
  }
  const hmac = crypto.createHmac("sha256", OAUTH_STATE_SECRET);
  hmac.update(payloadRaw);
  const expectedSig = hmac.digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null;
  try {
    const { userId } = JSON.parse(payloadRaw);
    if (!userId) return null;
    return { userId };
  } catch {
    return null;
  }
}
