/**
 * Evolution API — self-hosted WhatsApp gateway on Railway
 * No Meta approval needed. Each agent = one QR-connected session.
 * instance = agentId
 */

const BASE = process.env.EVOLUTION_API_URL ?? ''
const API_KEY = process.env.EVOLUTION_API_KEY ?? ''

const headers = { apikey: API_KEY, 'Content-Type': 'application/json' }

// ─── Instance Management ──────────────────────────────────────────────────────

export async function createInstance(
  agentId: string
): Promise<{ success: boolean; qrCode?: string; error?: string }> {
  try {
    const res = await fetch(`${BASE}/instance/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        instanceName: agentId,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
      }),
    })
    const data = (await res.json()) as { qrcode?: { base64?: string }; error?: string }
    if (!res.ok) return { success: false, error: data.error ?? 'Failed to create instance' }
    return { success: true, qrCode: data.qrcode?.base64 }
  } catch (e: unknown) {
    return { success: false, error: (e as Error).message }
  }
}

export async function getQRCode(
  agentId: string
): Promise<{ success: boolean; qrCode?: string; error?: string }> {
  try {
    const res = await fetch(`${BASE}/instance/connect/${agentId}`, { headers })
    const data = (await res.json()) as { base64?: string; error?: string }
    if (!res.ok) return { success: false, error: data.error ?? 'Failed to get QR' }
    return { success: true, qrCode: data.base64 }
  } catch (e: unknown) {
    return { success: false, error: (e as Error).message }
  }
}

export async function getInstanceStatus(
  agentId: string
): Promise<'connected' | 'disconnected' | 'pending'> {
  try {
    const res = await fetch(`${BASE}/instance/fetchInstances?instanceName=${agentId}`, { headers })
    const data = (await res.json()) as Array<{ instance?: { state?: string } }>
    const state = data[0]?.instance?.state
    if (state === 'open') return 'connected'
    if (state === 'close') return 'disconnected'
    return 'pending'
  } catch {
    return 'disconnected'
  }
}

// ─── Messaging ────────────────────────────────────────────────────────────────

export async function sendText(
  agentId: string,
  to: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const res = await fetch(`${BASE}/message/sendText/${agentId}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ number: to, text: message }),
    })
    const data = (await res.json()) as { key?: { id?: string }; error?: string }
    if (!res.ok) return { success: false, error: data.error ?? 'Failed to send message' }
    return { success: true, messageId: data.key?.id }
  } catch (e: unknown) {
    return { success: false, error: (e as Error).message }
  }
}

export async function sendMedia(
  agentId: string,
  to: string,
  mediaUrl: string,
  caption?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${BASE}/message/sendMedia/${agentId}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ number: to, mediatype: 'image', media: mediaUrl, caption }),
    })
    if (!res.ok) return { success: false, error: `Evolution media error: ${res.status}` }
    return { success: true }
  } catch (e: unknown) {
    return { success: false, error: (e as Error).message }
  }
}
