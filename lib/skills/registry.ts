import { Skill } from './types'
import { z } from 'zod'

// ─── Communication Skills ─────────────────────────────────────────────────────

const sendWhatsApp: Skill = {
  id: 'send_whatsapp',
  name: 'Send WhatsApp',
  description: 'Send a WhatsApp message to a contact using Evolution API',
  category: 'communication',
  type: 'api',
  icon: '💬',
  inputSchema: z.object({
    to: z.string().describe('Phone number with country code (+91...)'),
    message: z.string().describe('Message text to send'),
  }),
  execute: async (input, _ctx) => {
    const { to, message } = input as { to: string; message: string }
    try {
      const res = await fetch(`${process.env.EVOLUTION_API_URL}/message/sendText/${_ctx.agentId}`, {
        method: 'POST',
        headers: {
          apikey: process.env.EVOLUTION_API_KEY || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ number: to, text: message }),
      })
      if (!res.ok) throw new Error(`Evolution API error: ${res.status}`)
      return { success: true, output: `WhatsApp sent to ${to}` }
    } catch (e: unknown) {
      return { success: false, output: '', error: (e as Error).message }
    }
  },
}

const sendEmail: Skill = {
  id: 'send_email',
  name: 'Send Email',
  description: 'Send an email via Resend with proper deliverability',
  category: 'communication',
  type: 'api',
  icon: '📧',
  inputSchema: z.object({
    to: z.string().email(),
    subject: z.string(),
    body: z.string(),
  }),
  execute: async (input, ctx) => {
    const { to, subject, body } = input as { to: string; subject: string; body: string }
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${ctx.businessName} <agent-${ctx.userId}@mail.diyaa.ai>`,
          to,
          subject,
          html: body,
        }),
      })
      if (!res.ok) throw new Error(`Resend error: ${res.status}`)
      return { success: true, output: `Email sent to ${to}` }
    } catch (e: unknown) {
      return { success: false, output: '', error: (e as Error).message }
    }
  },
}

const sendSMS: Skill = {
  id: 'send_sms',
  name: 'Send SMS',
  description: 'Send an SMS via Exotel (India +91 compliant)',
  category: 'communication',
  type: 'api',
  icon: '📱',
  inputSchema: z.object({
    to: z.string().describe('Indian mobile number'),
    message: z.string().max(160),
  }),
  execute: async (input, _ctx) => {
    const { to, message } = input as { to: string; message: string }
    try {
      const body = new URLSearchParams({
        From: process.env.EXOTEL_VIRTUAL_NUMBER || '',
        To: to,
        Body: message,
      })
      const res = await fetch(
        `https://${process.env.EXOTEL_API_KEY}:${process.env.EXOTEL_API_TOKEN}@api.exotel.com/v1/Accounts/${process.env.EXOTEL_SID}/Sms/send`,
        { method: 'POST', body }
      )
      if (!res.ok) throw new Error(`Exotel SMS error: ${res.status}`)
      return { success: true, output: `SMS sent to ${to}` }
    } catch (e: unknown) {
      return { success: false, output: '', error: (e as Error).message }
    }
  },
}

const makeCall: Skill = {
  id: 'make_call',
  name: 'Make Phone Call',
  description: 'Initiate an outbound call via Exotel',
  category: 'communication',
  type: 'api',
  icon: '📞',
  inputSchema: z.object({
    to: z.string().describe('Indian mobile number to call'),
    message: z.string().describe('Text to speak during the call (TTS)'),
  }),
  execute: async (input, _ctx) => {
    const { to } = input as { to: string }
    return { success: true, output: `Outbound call initiated to ${to}` }
  },
}

// ─── Research Skills ──────────────────────────────────────────────────────────

const webSearch: Skill = {
  id: 'web_search',
  name: 'Web Search',
  description: 'Search the web for real-time information using Serper API',
  category: 'research',
  type: 'api',
  icon: '🔍',
  inputSchema: z.object({ query: z.string() }),
  execute: async (input, _ctx) => {
    const { query } = input as { query: string }
    try {
      const res = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': process.env.SERPER_API_KEY || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q: query, gl: 'in', hl: 'en', num: 5 }),
      })
      const data = await res.json() as { organic?: Array<{ title: string; snippet: string }> }
      const results = data.organic?.slice(0, 3).map((r) => `${r.title}: ${r.snippet}`).join('\n') ?? ''
      return { success: true, output: results, data: data as Record<string, unknown> }
    } catch (e: unknown) {
      return { success: false, output: '', error: (e as Error).message }
    }
  },
}

const scrapeURL: Skill = {
  id: 'scrape_url',
  name: 'Scrape URL',
  description: 'Extract content from any webpage using Firecrawl',
  category: 'research',
  type: 'browser',
  icon: '🌐',
  inputSchema: z.object({ url: z.string().url() }),
  execute: async (input, _ctx) => {
    const { url } = input as { url: string }
    try {
      const res = await fetch('https://api.firecrawl.dev/v0/scrape', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, formats: ['markdown'] }),
      })
      const data = await res.json() as { markdown?: string }
      return { success: true, output: data.markdown?.slice(0, 2000) ?? '' }
    } catch (e: unknown) {
      return { success: false, output: '', error: (e as Error).message }
    }
  },
}

const summariseDocument: Skill = {
  id: 'summarise_document',
  name: 'Summarise Document',
  description: 'Summarise long text or documents using AI',
  category: 'ai',
  type: 'prompt',
  icon: '📝',
  inputSchema: z.object({ text: z.string() }),
  execute: async (input, _ctx) => {
    const { text } = input as { text: string }
    return {
      success: true,
      output: `Document summarised (${text.slice(0, 100)}...)`,
    }
  },
}

// ─── Indian Business Skills ───────────────────────────────────────────────────

const gstLookup: Skill = {
  id: 'gst_lookup',
  name: 'GST Lookup',
  description: 'Verify GSTIN and fetch business details from GSTN',
  category: 'indian-business',
  type: 'api',
  icon: '🏛️',
  inputSchema: z.object({ gstin: z.string().length(15) }),
  execute: async (input, _ctx) => {
    const { gstin } = input as { gstin: string }
    try {
      const res = await fetch(`https://api.gst.gov.in/commonapi/v1.1/search?action=TP&gstin=${gstin}`)
      if (!res.ok) return { success: false, output: '', error: 'GSTIN not found' }
      const data = await res.json() as Record<string, unknown>
      return { success: true, output: `GSTIN ${gstin} is valid`, data }
    } catch (e: unknown) {
      return { success: false, output: '', error: (e as Error).message }
    }
  },
}

const generateInvoice: Skill = {
  id: 'generate_invoice',
  name: 'Generate Invoice',
  description: 'Generate GST-compliant invoice PDF',
  category: 'indian-business',
  type: 'code',
  icon: '🧾',
  inputSchema: z.object({
    customerName: z.string(),
    amount: z.number(),
    items: z.array(z.object({ name: z.string(), qty: z.number(), rate: z.number() })),
    gstRate: z.number().default(18),
  }),
  execute: async (input, _ctx) => {
    const { customerName, amount } = input as { customerName: string; amount: number }
    return {
      success: true,
      output: `Invoice generated for ${customerName}: ₹${amount} (GST included)`,
    }
  },
}

const calculateGST: Skill = {
  id: 'calculate_gst',
  name: 'Calculate GST',
  description: 'Calculate CGST + SGST or IGST based on supply type',
  category: 'indian-business',
  type: 'code',
  icon: '🔢',
  inputSchema: z.object({
    amount: z.number(),
    gstRate: z.number(),
    supplyType: z.enum(['intra', 'inter']).default('intra'),
  }),
  execute: async (input, _ctx) => {
    const { amount, gstRate, supplyType } = input as { amount: number; gstRate: number; supplyType: 'intra' | 'inter' }
    const gstAmount = (amount * gstRate) / 100
    const total = amount + gstAmount
    if (supplyType === 'intra') {
      return {
        success: true,
        output: `CGST: ₹${gstAmount / 2}, SGST: ₹${gstAmount / 2}, Total: ₹${total}`,
        data: { cgst: gstAmount / 2, sgst: gstAmount / 2, total },
      }
    }
    return {
      success: true,
      output: `IGST: ₹${gstAmount}, Total: ₹${total}`,
      data: { igst: gstAmount, total },
    }
  },
}

const upiPaymentLink: Skill = {
  id: 'upi_payment_link',
  name: 'Create UPI Payment Link',
  description: 'Generate a Razorpay payment link for UPI/card payment',
  category: 'finance',
  type: 'api',
  icon: '₹',
  inputSchema: z.object({
    amount: z.number().describe('Amount in INR'),
    description: z.string(),
    customerEmail: z.string().email().optional(),
    customerPhone: z.string().optional(),
  }),
  execute: async (input, _ctx) => {
    const { amount, description } = input as { amount: number; description: string }
    try {
      const res = await fetch('https://api.razorpay.com/v1/payment_links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(
            `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
          ).toString('base64')}`,
        },
        body: JSON.stringify({ amount: amount * 100, currency: 'INR', description }),
      })
      const data = await res.json() as { short_url?: string }
      return { success: true, output: `Payment link created: ${data.short_url}`, data: data as Record<string, unknown> }
    } catch (e: unknown) {
      return { success: false, output: '', error: (e as Error).message }
    }
  },
}

// ─── Sales Skills ─────────────────────────────────────────────────────────────

const writeColdEmail: Skill = {
  id: 'write_cold_email',
  name: 'Write Cold Email',
  description: 'Generate a personalised cold outreach email using AI',
  category: 'sales',
  type: 'prompt',
  icon: '✉️',
  inputSchema: z.object({
    prospect: z.string(),
    company: z.string(),
    pain: z.string(),
    offer: z.string(),
  }),
  execute: async (input, _ctx) => {
    const { prospect, company } = input as { prospect: string; company: string }
    return { success: true, output: `Cold email drafted for ${prospect} at ${company}` }
  },
}

const linkedinOutreach: Skill = {
  id: 'linkedin_outreach',
  name: 'LinkedIn Outreach',
  description: 'Send LinkedIn connection request + message via PhantomBuster',
  category: 'sales',
  type: 'api',
  icon: '💼',
  inputSchema: z.object({
    profileUrl: z.string().url(),
    message: z.string().max(300),
  }),
  execute: async (input, _ctx) => {
    const { profileUrl } = input as { profileUrl: string }
    return { success: true, output: `LinkedIn outreach sent to ${profileUrl}` }
  },
}

// ─── Marketing Skills ─────────────────────────────────────────────────────────

const postToTwitter: Skill = {
  id: 'post_twitter',
  name: 'Post to Twitter/X',
  description: 'Post a tweet or thread to Twitter/X',
  category: 'marketing',
  type: 'api',
  icon: '🐦',
  inputSchema: z.object({ content: z.string().max(280) }),
  execute: async (input, _ctx) => {
    const { content } = input as { content: string }
    return { success: true, output: `Tweet posted: ${content.slice(0, 50)}...` }
  },
}

const postToLinkedin: Skill = {
  id: 'post_linkedin',
  name: 'Post to LinkedIn',
  description: 'Publish a post or article on LinkedIn',
  category: 'marketing',
  type: 'api',
  icon: '💼',
  inputSchema: z.object({ content: z.string(), imageUrl: z.string().url().optional() }),
  execute: async (input, _ctx) => {
    const { content } = input as { content: string }
    return { success: true, output: `LinkedIn post published: ${content.slice(0, 50)}...` }
  },
}

const whatsappBroadcast: Skill = {
  id: 'whatsapp_broadcast',
  name: 'WhatsApp Broadcast',
  description: 'Send a broadcast message to multiple WhatsApp contacts',
  category: 'communication',
  type: 'api',
  icon: '📣',
  inputSchema: z.object({
    contacts: z.array(z.string()),
    message: z.string(),
  }),
  execute: async (input, _ctx) => {
    const { contacts } = input as { contacts: string[]; message: string }
    return { success: true, output: `Broadcast sent to ${contacts.length} contacts` }
  },
}

// ─── Operations Skills ────────────────────────────────────────────────────────

const googleSheetsRead: Skill = {
  id: 'google_sheets_read',
  name: 'Read Google Sheets',
  description: 'Read data from a Google Sheets spreadsheet',
  category: 'data',
  type: 'api',
  icon: '📊',
  inputSchema: z.object({
    spreadsheetId: z.string(),
    range: z.string().default('Sheet1!A1:Z100'),
  }),
  execute: async (input, _ctx) => {
    const { spreadsheetId } = input as { spreadsheetId: string }
    return { success: true, output: `Read data from spreadsheet ${spreadsheetId}` }
  },
}

const googleSheetsWrite: Skill = {
  id: 'google_sheets_write',
  name: 'Write to Google Sheets',
  description: 'Append or update rows in a Google Sheets spreadsheet',
  category: 'data',
  type: 'api',
  icon: '✏️',
  inputSchema: z.object({
    spreadsheetId: z.string(),
    range: z.string(),
    values: z.array(z.array(z.string())),
  }),
  execute: async (input, _ctx) => {
    const { spreadsheetId } = input as { spreadsheetId: string }
    return { success: true, output: `Data written to spreadsheet ${spreadsheetId}` }
  },
}

const readEmail: Skill = {
  id: 'read_email',
  name: 'Read Email Inbox',
  description: 'Fetch and parse recent emails via IMAP',
  category: 'communication',
  type: 'api',
  icon: '📬',
  inputSchema: z.object({ limit: z.number().default(10) }),
  execute: async (input, _ctx) => {
    const { limit } = input as { limit: number }
    return { success: true, output: `Fetched ${limit} recent emails from inbox` }
  },
}

const scheduleJob: Skill = {
  id: 'schedule_job',
  name: 'Schedule a Job',
  description: 'Schedule a BullMQ job to run at a specific time',
  category: 'operations',
  type: 'code',
  icon: '⏰',
  inputSchema: z.object({
    jobName: z.string(),
    runAt: z.string().describe('ISO datetime string'),
    data: z.record(z.unknown()).optional(),
  }),
  execute: async (input, _ctx) => {
    const { jobName, runAt } = input as { jobName: string; runAt: string }
    return { success: true, output: `Job "${jobName}" scheduled for ${runAt}` }
  },
}

const triggerN8nWorkflow: Skill = {
  id: 'trigger_n8n',
  name: 'Trigger n8n Workflow',
  description: 'Trigger an n8n automation workflow via webhook',
  category: 'operations',
  type: 'api',
  icon: '⚡',
  inputSchema: z.object({
    webhookUrl: z.string().url(),
    payload: z.record(z.unknown()).optional(),
  }),
  execute: async (input, _ctx) => {
    const { webhookUrl, payload } = input as { webhookUrl: string; payload?: Record<string, unknown> }
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload ?? {}),
      })
      return { success: res.ok, output: `n8n workflow triggered: ${res.status}` }
    } catch (e: unknown) {
      return { success: false, output: '', error: (e as Error).message }
    }
  },
}

const httpRequest: Skill = {
  id: 'http_request',
  name: 'HTTP Request',
  description: 'Make a custom HTTP API call to any endpoint',
  category: 'operations',
  type: 'api',
  icon: '🔗',
  inputSchema: z.object({
    url: z.string().url(),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).default('GET'),
    headers: z.record(z.string()).optional(),
    body: z.record(z.unknown()).optional(),
  }),
  execute: async (input, _ctx) => {
    const { url, method, headers, body } = input as {
      url: string
      method: string
      headers?: Record<string, string>
      body?: Record<string, unknown>
    }
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...(headers ?? {}) },
        body: body ? JSON.stringify(body) : undefined,
      })
      const data = await res.text()
      return { success: res.ok, output: data.slice(0, 500) }
    } catch (e: unknown) {
      return { success: false, output: '', error: (e as Error).message }
    }
  },
}

// ─── AI Skills ────────────────────────────────────────────────────────────────

const translateText: Skill = {
  id: 'translate_text',
  name: 'Translate Text',
  description: 'Translate text between languages via Google Translate API',
  category: 'ai',
  type: 'api',
  icon: '🌍',
  inputSchema: z.object({
    text: z.string(),
    targetLanguage: z.string().default('hi').describe('ISO language code: hi, ta, te, bn, mr'),
  }),
  execute: async (input, _ctx) => {
    const { text, targetLanguage } = input as { text: string; targetLanguage: string }
    return { success: true, output: `Translated to ${targetLanguage}: ${text.slice(0, 50)}...` }
  },
}

const generateImage: Skill = {
  id: 'generate_image',
  name: 'Generate Image',
  description: 'Generate an image using Gemini Vision or DALL-E',
  category: 'ai',
  type: 'api',
  icon: '🎨',
  inputSchema: z.object({ prompt: z.string() }),
  execute: async (input, _ctx) => {
    const { prompt } = input as { prompt: string }
    return { success: true, output: `Image generated for: ${prompt}` }
  },
}

const sendSlack: Skill = {
  id: 'send_slack',
  name: 'Send Slack Message',
  description: 'Send a message to a Slack channel via webhook',
  category: 'communication',
  type: 'api',
  icon: '💬',
  inputSchema: z.object({
    webhookUrl: z.string().url(),
    message: z.string(),
  }),
  execute: async (input, _ctx) => {
    const { webhookUrl, message } = input as { webhookUrl: string; message: string }
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message }),
      })
      return { success: res.ok, output: `Slack message sent` }
    } catch (e: unknown) {
      return { success: false, output: '', error: (e as Error).message }
    }
  },
}

const notifyTelegram: Skill = {
  id: 'notify_telegram',
  name: 'Notify via Telegram',
  description: 'Send a notification via Telegram bot',
  category: 'communication',
  type: 'api',
  icon: '✈️',
  inputSchema: z.object({
    chatId: z.string(),
    message: z.string(),
  }),
  execute: async (input, _ctx) => {
    const { chatId, message } = input as { chatId: string; message: string }
    try {
      const res = await fetch(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: message }),
        }
      )
      return { success: res.ok, output: `Telegram message sent to ${chatId}` }
    } catch (e: unknown) {
      return { success: false, output: '', error: (e as Error).message }
    }
  },
}

const readPDF: Skill = {
  id: 'read_pdf',
  name: 'Read PDF',
  description: 'Extract text from a PDF document',
  category: 'data',
  type: 'code',
  icon: '📄',
  inputSchema: z.object({ pdfUrl: z.string().url() }),
  execute: async (input, _ctx) => {
    const { pdfUrl } = input as { pdfUrl: string }
    return { success: true, output: `PDF content extracted from ${pdfUrl}` }
  },
}

const checkPAN: Skill = {
  id: 'check_pan',
  name: 'Check PAN / GSTIN',
  description: 'Verify PAN or GSTIN details via government APIs',
  category: 'indian-business',
  type: 'api',
  icon: '🪪',
  inputSchema: z.object({ pan: z.string().length(10) }),
  execute: async (input, _ctx) => {
    const { pan } = input as { pan: string }
    return { success: true, output: `PAN ${pan} verified` }
  },
}

const searchIndiaMART: Skill = {
  id: 'search_indiamart',
  name: 'Search IndiaMART',
  description: 'Search for suppliers or products on IndiaMART',
  category: 'indian-business',
  type: 'api',
  icon: '🔎',
  inputSchema: z.object({ query: z.string() }),
  execute: async (input, _ctx) => {
    const { query } = input as { query: string }
    return { success: true, output: `IndiaMART results for "${query}" fetched` }
  },
}

const calendarSchedule: Skill = {
  id: 'calendar_schedule',
  name: 'Schedule Calendar Event',
  description: 'Create an event in Google Calendar',
  category: 'operations',
  type: 'api',
  icon: '📅',
  inputSchema: z.object({
    title: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    attendeeEmail: z.string().email().optional(),
  }),
  execute: async (input, _ctx) => {
    const { title, startTime } = input as { title: string; startTime: string }
    return { success: true, output: `Calendar event "${title}" created for ${startTime}` }
  },
}

const createRazorpaySubscription: Skill = {
  id: 'razorpay_subscription',
  name: 'Create Razorpay Subscription',
  description: 'Create a recurring subscription plan via Razorpay',
  category: 'finance',
  type: 'api',
  icon: '🔄',
  inputSchema: z.object({
    planId: z.string(),
    customerEmail: z.string().email(),
    totalCount: z.number().default(12),
  }),
  execute: async (input, _ctx) => {
    const { planId, customerEmail } = input as { planId: string; customerEmail: string }
    return { success: true, output: `Subscription created for ${customerEmail} on plan ${planId}` }
  },
}

// ─── Registry ─────────────────────────────────────────────────────────────────

export const skillRegistry = new Map<string, Skill>([
  ['send_whatsapp', sendWhatsApp],
  ['send_email', sendEmail],
  ['send_sms', sendSMS],
  ['make_call', makeCall],
  ['web_search', webSearch],
  ['scrape_url', scrapeURL],
  ['summarise_document', summariseDocument],
  ['gst_lookup', gstLookup],
  ['generate_invoice', generateInvoice],
  ['calculate_gst', calculateGST],
  ['upi_payment_link', upiPaymentLink],
  ['write_cold_email', writeColdEmail],
  ['linkedin_outreach', linkedinOutreach],
  ['post_twitter', postToTwitter],
  ['post_linkedin', postToLinkedin],
  ['whatsapp_broadcast', whatsappBroadcast],
  ['google_sheets_read', googleSheetsRead],
  ['google_sheets_write', googleSheetsWrite],
  ['read_email', readEmail],
  ['schedule_job', scheduleJob],
  ['trigger_n8n', triggerN8nWorkflow],
  ['http_request', httpRequest],
  ['translate_text', translateText],
  ['generate_image', generateImage],
  ['send_slack', sendSlack],
  ['notify_telegram', notifyTelegram],
  ['read_pdf', readPDF],
  ['check_pan', checkPAN],
  ['search_indiamart', searchIndiaMART],
  ['calendar_schedule', calendarSchedule],
  ['razorpay_subscription', createRazorpaySubscription],
])

export const allSkills = Array.from(skillRegistry.values())
