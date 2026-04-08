# WhatsApp Integration Setup Guide

This guide will help you connect your diyaa.ai agent to WhatsApp Business API so customers can message your agent directly via WhatsApp.

## Prerequisites

- Meta Business Account (create at https://business.facebook.com/)
- WhatsApp Business Account
- Phone number to use for WhatsApp (can be personal or business)
- API token from Meta

## Step 1: Create Meta App

1. Go to https://developers.facebook.com/apps/
2. Click "Create App" → Choose "Business" type
3. Fill in app details:
   - App Name: `diyaa-ai-whatsapp`
   - App Purpose: Select "Business"
4. Click "Create App"

## Step 2: Set Up WhatsApp Product

1. In your app dashboard, click "Add Product"
2. Find "WhatsApp" and click "Add"
3. Select "WhatsApp Business API"
4. Complete the phone number verification

## Step 3: Get Your Credentials

### Phone Number ID

1. Go to App Settings → WhatsApp → API Setup
2. Copy your **Phone Number ID** (15-digit number)

### API Token

1. Go to Settings → Users and Roles → System Users
2. Click "Add" to create a new System User
3. Generate an access token with `whatsapp_business_messaging` scope
4. Copy the **API Token** (starts with `EAAB...`)

⚠️ **Keep this token safe!** It grants access to send messages on your behalf.

## Step 4: Configure in diyaa.ai

1. In your agent's **Settings tab**, click "Connect" on WhatsApp
2. Paste:
   - **Phone Number ID**: From Step 3
   - **API Token**: From Step 3
3. Click "Save & Connect"

diyaa.ai will verify the credentials and enable WhatsApp messaging.

## Step 5: Set Up Webhook

1. Go to your app dashboard → WhatsApp → Configuration
2. Under **Webhook URL**, enter:

   ```
   https://yourdomain.com/api/webhooks/whatsapp
   ```

   (Replace `yourdomain.com` with your actual domain)

3. Under **Verify Token**, enter:

   ```
   diyaa_verify_token
   ```

   (Or use your custom token from `.env.local` - `WHATSAPP_WEBHOOK_VERIFY_TOKEN`)

4. Under **Subscribe to Webhook Events**, select:
   - ✅ `messages`
   - ✅ `message_template_status_update`
   - ✅ `message_template_quality_update`

5. Click "Verify and Save"

## Step 6: Test

1. From your phone, message the WhatsApp number registered in Step 2
2. Your agent should automatically respond
3. Check the **Chat tab** in the agent dashboard to see the conversation

## Troubleshooting

### Webhook Not Connecting

- Ensure your app is deployed publicly (localhost won't work)
- Check that the Verify Token matches exactly
- Go to Logs in Meta App Dashboard to see webhook errors

### Agent Not Responding

1. Check the **Dashboard tab** in the agent to see if messages are arriving
2. Check agent **System Prompt** — does it make sense for WhatsApp?
3. Verify the agent has `channels_whatsapp: true` in the database
4. Check Sentry error logs for LLM failures

### Rate Limiting

- Meta allows 1000 messages per day for new numbers
- After 24 hours of good delivery, this limit increases
- Response time: typically <5 seconds

## Webhook Events Received

When a customer messages your WhatsApp number, diyaa.ai receives:

```json
{
  "entry": [
    {
      "changes": [
        {
          "value": {
            "messages": [
              {
                "from": "1234567890", // Customer's WhatsApp number
                "id": "wamid.xxx", // Message ID
                "timestamp": "1640000000",
                "type": "text",
                "text": { "body": "Hello!" }
              }
            ],
            "phone_number_id": "123456789" // Your WhatsApp number ID
          }
        }
      ]
    }
  ]
}
```

diyaa.ai automatically:

1. Creates a conversation thread
2. Stores the incoming message
3. Generates an AI response using your agent's system prompt
4. Sends the response back via WhatsApp
5. Logs all interactions for analytics

## Advanced: Custom Business Profiles

For enterprise customers, Meta offers:

- **Quality Rating**: Maintain high delivery rates (green/yellow/red)
- **Display Name**: Shows your business name in chats
- **Business Verification**: Blue check mark for trust

Contact Meta support if you need access to these features.

## Security Notes

- **Never share your API token** — it can send messages on your behalf
- diyaa.ai stores your token encrypted in the database
- Tokens are never logged or exposed in error messages
- Customers can only message your WhatsApp number; you cannot initiate without approval

## Next Steps

- Add knowledge base documents so your agent has context
- Set active hours (e.g., 9am-9pm) to pause responses outside working hours
- Monitor response quality in the Dashboard tab
- Set up escalation rules for complex queries

---

**Support**: Email support@diyaa.ai or check docs at https://diyaa.ai/docs
