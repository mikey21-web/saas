import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

export const claudeClient = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * List internal links from a webpage (maps to n8n list_links tool node)
 */
export async function listLinks(url: string): Promise<string[]> {
  try {
    const response = await fetch(url)
    const html = await response.text()

    const linkRegex = /href=["']([^"']+)["']/g
    const baseUrl = new URL(url).origin
    const links = new Set<string>()

    let match
    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1]
      if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:') || href === '/') continue

      try {
        const absolute = href.startsWith('http') ? href : `${baseUrl}${href.startsWith('/') ? '' : '/'}${href}`
        const parsed = new URL(absolute)
        if (parsed.origin === baseUrl) {
          links.add(absolute)
        }
      } catch {}
    }

    return Array.from(links).slice(0, 100)
  } catch (error) {
    console.error('[listLinks] Error:', error)
    return []
  }
}

/**
 * Get visible text content from a webpage (maps to n8n get_page tool node)
 */
export async function getPageText(url: string): Promise<string> {
  try {
    const response = await fetch(url)
    const html = await response.text()

    // Strip HTML tags and decode entities
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s{2,}/g, ' ')
      .trim()

    return text.substring(0, 5000) // Cap at 5k chars
  } catch (error) {
    console.error('[getPageText] Error:', error)
    return ''
  }
}

/**
 * Send WhatsApp message via Meta Cloud API
 */
export async function sendWhatsAppMessage(phoneNumber: string, message: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phoneNumber,
          type: 'text',
          text: { body: message },
        }),
      }
    )
    return response.ok
  } catch (error) {
    console.error('[sendWhatsApp] Error:', error)
    return false
  }
}

/**
 * Send WhatsApp template message to reopen conversation (maps to n8n template node)
 */
export async function sendWhatsAppTemplate(phoneNumber: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phoneNumber,
          type: 'template',
          template: {
            name: 'hello_world',
            language: { code: 'en_US' },
          },
        }),
      }
    )
    return response.ok
  } catch (error) {
    console.error('[sendWhatsAppTemplate] Error:', error)
    return false
  }
}

/**
 * Load conversation history from Supabase (maps to n8n Postgres Memory node)
 */
export async function loadConversationHistory(userId: string): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
  try {
    const { data } = await supabaseAdmin
      .from('message_history')
      .select('role, content')
      .eq('session_id', userId)
      .order('created_at', { ascending: true })
      .limit(20)

    return (data || []) as Array<{ role: 'user' | 'assistant'; content: string }>
  } catch {
    return []
  }
}

/**
 * Save message to conversation history
 */
export async function saveMessage(userId: string, role: 'user' | 'assistant', content: string): Promise<void> {
  try {
    await supabaseAdmin.from('message_history').insert({
      session_id: userId,
      role,
      content,
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[saveMessage] Error:', error)
  }
}
