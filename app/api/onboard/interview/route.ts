import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

const AGENT_CONTEXTS: Record<string, string> = {
  LeadCatcher: 'lead capture and follow-up automation via WhatsApp',
  AppointBot: 'appointment booking and reminder system',
  PayChaser: 'payment collection and UPI reminder automation',
  GSTMate: 'GST invoice generation and compliance',
  CustomerSupport: '24/7 customer support across WhatsApp, email, and phone',
  ReviewGuard: 'review monitoring and auto-response',
  InvoiceBot: 'invoice creation with GST and UPI reconciliation',
  WhatsBlast: 'WhatsApp broadcast campaigns and segmentation',
  DocHarvest: 'client document collection automation',
  NurtureBot: 'lead nurturing drip sequences',
  StockSentinel: 'inventory monitoring and auto-reorder',
  PatientPulse: 'patient follow-up and prescription reminders',
  ResumeFilter: 'AI resume screening and candidate shortlisting',
  SocialSched: 'social media calendar and publishing automation',
  FeeCollect: 'fee collection and installment tracking',
}

function buildSystemPrompt(agentType: string): string {
  const agentContext = AGENT_CONTEXTS[agentType] || 'AI automation'

  return `You are an AI business setup assistant for diyaa.ai. Your job is to conduct a short interview to configure a "${agentType}" agent (${agentContext}) for a business.

## Your Interview Goal
Ask 5-6 focused questions to understand the business so you can configure the agent perfectly. Be conversational, warm, and concise — like a helpful consultant on WhatsApp.

## Question Flow for ${agentType}
1. Business name + what they sell/do
2. Who are their main customers
3. Biggest pain point this agent should solve
4. Preferred communication style (formal/friendly/Hinglish)
5. Working hours / when the agent should be active
6. Any specific instructions or things to avoid (optional)

## Rules
- Ask ONE question at a time
- Keep each message under 3 sentences
- Use simple, clear English (Indian business owners)
- Add light emojis where natural
- After 5-6 exchanges when you have enough info, output the config block EXACTLY as shown below

## When Interview is Complete
Output this EXACT format (JSON block at the end of your message):
"Great! I have everything I need to set up your [AgentName]. Here's your custom configuration:

\`\`\`AGENT_CONFIG
{
  "businessName": "...",
  "industry": "...",
  "products": "...",
  "targetCustomers": "...",
  "tone": "friendly|professional|casual",
  "language": "English|Hindi|Hinglish",
  "agentPersonality": "...",
  "activeHours": "...",
  "keyInstructions": "...",
  "agentName": "${agentType} for [Business Name]"
}
\`\`\`"

DO NOT output the config block until you have asked at least 4 questions and received answers.`
}

export async function POST(req: NextRequest) {
  const { agentType, messages } = await req.json() as {
    agentType: string
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
  }

  const apiKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY || ''
  const useGemini = !process.env.GROQ_API_KEY && !!process.env.GEMINI_API_KEY

  const systemPrompt = buildSystemPrompt(agentType)

  // Build messages for AI
  const aiMessages = [
    { role: 'system', content: systemPrompt },
    // Opening message if this is the first exchange
    ...(messages.length === 0
      ? [{
          role: 'assistant' as const,
          content: `Hi! I'm going to ask you a few quick questions to set up your **${agentType}** agent perfectly for your business. It'll only take 2 minutes! 😊\n\nFirst — what's your business name and what do you sell or offer?`
        }]
      : messages
    )
  ]

  // If messages is empty, stream the opening message
  if (messages.length === 0) {
    const openingMsg = `Hi! I'm going to ask you a few quick questions to set up your **${agentType}** agent perfectly for your business. It'll only take 2 minutes! 😊\n\nFirst — what's your business name and what do you sell or offer?`

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        // Simulate streaming word by word
        const words = openingMsg.split(' ')
        let i = 0
        const interval = setInterval(() => {
          if (i < words.length) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: words[i] + ' ' })}\n\n`))
            i++
          } else {
            controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
            controller.close()
            clearInterval(interval)
          }
        }, 30)
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    })
  }

  // Call AI with streaming
  try {
    let endpoint: string
    let authHeader: string
    let body: Record<string, unknown>

    if (!useGemini) {
      endpoint = 'https://api.groq.com/openai/v1/chat/completions'
      authHeader = `Bearer ${apiKey}`
      body = {
        model: 'llama-3.3-70b-versatile',
        messages: aiMessages,
        stream: true,
        temperature: 0.7,
        max_tokens: 512,
      }
    } else {
      endpoint = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
      authHeader = `Bearer ${apiKey}`
      body = {
        model: 'gemini-2.0-flash',
        messages: aiMessages,
        stream: true,
        temperature: 0.7,
        max_tokens: 512,
      }
    }

    const aiRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    })

    if (!aiRes.ok || !aiRes.body) {
      throw new Error(`AI API error: ${aiRes.status}`)
    }

    // Pass through the SSE stream, transforming to our format
    const reader = aiRes.body.getReader()
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = ''
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue
              const data = line.slice(6)
              if (data === '[DONE]') {
                controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                continue
              }
              try {
                const parsed = JSON.parse(data) as {
                  choices?: Array<{ delta?: { content?: string } }>
                }
                const token = parsed.choices?.[0]?.delta?.content
                if (token) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`))
                }
              } catch {
                // skip malformed chunks
              }
            }
          }
        } catch (e) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: String(e) })}\n\n`))
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    })

  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
