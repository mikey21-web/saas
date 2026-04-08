# InvoiceBot Setup Guide

InvoiceBot is a fully automated invoice creation and payment tracking agent. It parses natural language invoice requests and executes the complete workflow via n8n.

## Architecture

```
User Message
    ↓
Parse Invoice Details (LLM)
    ↓
Call n8n Webhook
    ↓
n8n Workflow Executes:
  - Creates Razorpay payment link
  - Generates GST-compliant PDF invoice
  - Sends invoice + link via WhatsApp
  - Logs to Google Sheets
    ↓
Return Payment Link + Invoice Details to User
```

## Setup Steps

### 1. Set n8n Webhook URL

Add to your `.env` file:

```env
INVOICEBOT_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/invoicebot/create
```

Or pass it during agent deployment:

```javascript
// During deploy, include in credentials:
{
  credentials: {
    n8n_webhook_url: 'https://your-n8n-instance.com/webhook/invoicebot/create'
  }
}
```

### 2. Deploy InvoiceBot Agent

When deploying, the system will automatically capture:

- Business name (for invoice header)
- GST number (if registered)
- Tone/communication style
- Active hours

Example deployment payload:

```javascript
POST /api/onboard/deploy
{
  "agentType": "invoicebot",
  "config": {
    "businessName": "Acme Corp",
    "industry": "Software Services",
    "products": "Web Design, Development",
    "targetCustomers": "SMBs, Startups",
    "tone": "professional",
    "language": "English",
    "agentPersonality": "Helpful, detail-oriented",
    "activeHours": "9:00-21:00",
    "keyInstructions": "Always confirm GST rate. Default payment terms: Net 30 days."
  },
  "credentials": {
    "n8n_webhook_url": "https://n8n.example.com/webhook/invoicebot/create"
  },
  "userId": "clerk_user_id",
  "plan": "agent"
}
```

## User Interaction Example

**User:** "Invoice Mehta ₹45,000 for web design, GST 18%, due 15 May"

**InvoiceBot Response:**

1. Parses message → extracts: client=Mehta, amount=45000, description=web design, gst=18%, dueDate=2026-05-15
2. Calls n8n webhook with structured data
3. n8n creates:
   - Razorpay payment link: `https://rzp.io/i/ABC123`
   - PDF invoice with GST breakdown
   - WhatsApp message with invoice + link
   - Google Sheets log entry
4. Returns to user:

   ```
   ✅ Invoice created successfully!

   Invoice #INV-2026-001
   Amount: ₹45,000
   Client: Mehta
   Payment Link: https://rzp.io/i/ABC123
   Due Date: 15 May 2026
   ```

## n8n Webhook Payload Format

When InvoiceBot calls the webhook, it sends:

```json
{
  "clientName": "Mehta",
  "clientPhone": "+919876543210",
  "clientEmail": "mehta@example.com",
  "amount": 45000,
  "description": "Web Design Services",
  "gstRate": 18,
  "businessName": "Acme Corp",
  "businessGSTIN": "27AABCU9603R1Z5",
  "dueDate": "2026-05-15"
}
```

## n8n Webhook Response Format

After executing, n8n should return:

```json
{
  "invoiceNumber": "INV-2026-001",
  "paymentLink": "https://rzp.io/i/ABC123",
  "pdfUrl": "https://storage.example.com/invoices/INV-2026-001.pdf",
  "success": true
}
```

## Payment Tracking (Razorpay Webhook)

Set up a separate webhook in Razorpay → n8n to handle payment confirmations:

```
Razorpay Payment Received
    ↓
POST to n8n webhook: /webhook/razorpay/payment-confirmed
    ↓
n8n marks invoice as PAID in Google Sheets
    ↓
Send WhatsApp confirmation to client
    ↓
Notify business owner
```

## Testing

Test the integration without deploying:

```bash
curl -X POST https://your-n8n-instance.com/webhook/invoicebot/create \
  -H "Content-Type: application/json" \
  -d '{
    "clientName": "Test Client",
    "amount": 50000,
    "description": "Test Invoice",
    "gstRate": 18,
    "businessName": "Test Business",
    "dueDate": "2026-05-01"
  }'
```

Expected response:

```json
{
  "invoiceNumber": "...",
  "paymentLink": "...",
  "pdfUrl": "..."
}
```

## Troubleshooting

### "n8n webhook URL not configured"

- Add `INVOICEBOT_N8N_WEBHOOK_URL` to `.env` or
- Pass `n8n_webhook_url` in credentials during deployment

### "Failed to parse invoice request"

Make sure the user message includes:

- Client name
- Amount (in rupees)
- Description of work/products

Example valid messages:

- "Invoice Mehta ₹45,000 for web design, GST 18%"
- "Create invoice for John at ABC Company for ₹100,000 (consulting services)"
- "Invoice Priya ₹25,000, description: logo design, 12% GST"

### Webhook times out

- Check n8n instance is running
- Verify URL is correct
- Check network connectivity

## Future Enhancements

- [ ] Multiple invoice templates (simple, detailed, GST-only)
- [ ] Bulk invoice creation from CSV
- [ ] Auto-recurring invoices for subscriptions
- [ ] Invoice status dashboard
- [ ] Integration with accounting software (Tally, Zoho)

---

**Environment Variables Required:**

```env
INVOICEBOT_N8N_WEBHOOK_URL=https://...
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

**Database Tables:**

- `agents` — stores agent configuration
- `conversations` — conversation history
- `messages` — individual messages
- `agent_executions` — execution logs with input/output
