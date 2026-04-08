import { RunnableConfig } from '@langchain/core/runnables'
import { ChatGroq } from '@langchain/groq'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { ChatAnthropic } from '@langchain/anthropic'
import { EcommerceState } from '../types'

const GROQ_MODEL = 'mixtral-8x7b-32768'
const GEMINI_MODEL = 'gemini-2.0-flash'
const CLAUDE_MODEL = 'claude-opus-4-6'

/**
 * 3-tier LLM fallback: Groq → Gemini → Claude
 * Classifies Shopify webhook event and extracts fields
 */
async function classifierAgent(state: EcommerceState, config?: RunnableConfig): Promise<Partial<EcommerceState>> {
  const systemPrompt = `You are an E-commerce Operations AI Agent for a Shopify store.

Analyze the Shopify webhook event and classify it into ONE category:
- ORDER_NEW: New order placed
- ORDER_UPDATED: Order updated (status change, address edit)
- ORDER_FULFILLED: Order shipped with tracking
- ORDER_CANCELLED: Order cancelled
- REFUND_REQUESTED: Refund initiated
- RETURN_REQUESTED: Customer return/exchange request
- INVENTORY_LOW: Stock below threshold (10 units)
- UNKNOWN: Cannot classify

Extract ALL available fields from the webhook payload. Use null for missing fields.

Respond ONLY in valid JSON (no markdown, no code blocks):`

  const userPrompt = `Event Topic: ${state.webhookTopic}
Event Payload: ${JSON.stringify(state.webhookPayload).substring(0, 3000)}

Respond in this exact JSON format (no markdown):
{
  "category": "ORDER_NEW",
  "confidence": 0.97,
  "customer_name": "...",
  "customer_email": "...",
  "customer_phone": "+91XXXXXXXXXX",
  "order_id": "#1234",
  "order_total": "₹2,500",
  "product_name": "...",
  "sku": "...",
  "tracking_number": null,
  "carrier": null,
  "refund_amount": null,
  "return_reason": null,
  "inventory_product": null,
  "inventory_quantity": null,
  "needs_human_review": false,
  "escalation_reason": null,
  "action_summary": "New order placed for Product X worth ₹2,500"
}`

  let response: string
  let usedModel = ''

  // Try Groq first (fastest, free)
  try {
    const groq = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: GROQ_MODEL,
      temperature: 0.1,
      maxTokens: 800,
    })
    const result = await groq.invoke([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ])
    response = result.content as string
    usedModel = 'Groq'
  } catch (groqError) {
    console.warn('[Ecommerce] Groq failed, trying Gemini:', groqError)

    // Fallback to Gemini
    try {
      const gemini = new ChatGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_API_KEY,
        model: GEMINI_MODEL,
        temperature: 0.1,
        maxOutputTokens: 800,
      })
      const result = await gemini.invoke([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ])
      response = result.content as string
      usedModel = 'Gemini'
    } catch (geminiError) {
      console.warn('[Ecommerce] Gemini failed, trying Claude:', geminiError)

      // Final fallback to Claude
      const claude = new ChatAnthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: CLAUDE_MODEL,
        temperature: 0.1,
        maxTokens: 800,
      })
      const result = await claude.invoke([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ])
      response = result.content as string
      usedModel = 'Claude'
    }
  }

  // Parse response
  try {
    const cleanResponse = response.replace(/```json|```/g, '').trim()
    const match = cleanResponse.match(/\{[\s\S]*\}/)
    const parsed = JSON.parse(match ? match[0] : cleanResponse)

    return {
      category: parsed.category || 'UNKNOWN',
      confidence: parsed.confidence || 0,
      customerName: parsed.customer_name || null,
      customerEmail: parsed.customer_email || null,
      customerPhone: parsed.customer_phone || null,
      orderId: parsed.order_id || null,
      orderTotal: parsed.order_total || null,
      productName: parsed.product_name || null,
      sku: parsed.sku || null,
      trackingNumber: parsed.tracking_number || null,
      carrier: parsed.carrier || null,
      refundAmount: parsed.refund_amount || null,
      returnReason: parsed.return_reason || null,
      inventoryProduct: parsed.inventory_product || null,
      inventoryQuantity: parsed.inventory_quantity || null,
      needsHumanReview: parsed.needs_human_review || false,
      escalationReason: parsed.escalation_reason || null,
      actionSummary: parsed.action_summary || 'Event processed',
    }
  } catch (parseError) {
    console.error('[Ecommerce] Parse error:', parseError, 'response:', response)
    return {
      category: 'UNKNOWN',
      confidence: 0,
      needsHumanReview: true,
      escalationReason: `AI parse error: ${parseError instanceof Error ? parseError.message : 'Unknown'}`,
      actionSummary: 'Parse error — needs manual review',
    }
  }
}

export { classifierAgent }
