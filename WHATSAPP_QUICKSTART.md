# WhatsApp Customer Support Bot — Quick Start (15 min)

## Your Goal

✅ Customers click WhatsApp button on your website
✅ Messages go to your AI agent 24/7
✅ Agent auto-responds (no human needed)
✅ All conversations tracked in dashboard

---

## The 4 Things You Need

### 1️⃣ WhatsApp Business Account (You Have This)

- ✅ Personal WhatsApp number (or buy one from Exotel for ₹30-100/mo)
- ✅ Phone number is your customer contact point

### 2️⃣ Meta API Credentials (Get in 2 min)

Link: https://developers.facebook.com/apps/

- **Token 1**: Phone Number ID (15-digit number)
- **Token 2**: API Token (starts with `EAAB...`)

### 3️⃣ Deployed diyaa.ai Agent (Already Have)

- ✅ Agent created + deployed in dashboard
- ✅ System prompt configured
- ✅ Knowledge base uploaded (optional)

### 4️⃣ Your Website Domain

- Any website: WordPress, HTML, Shopify, etc.
- Needs to be publicly accessible (not localhost)

---

## Step-by-Step Setup (15 minutes)

### Phase 1: Get Meta Tokens (5 min)

**Link 1: Meta Developers Dashboard**
https://developers.facebook.com/apps/

1. Click "Create App" → Select "Business"
2. Add "WhatsApp" product
3. Complete phone verification
4. Copy **Phone Number ID** from API Setup
5. Create System User → Copy **API Token**

**✅ You now have 2 tokens**

---

### Phase 2: Connect to diyaa.ai (3 min)

**In your agent dashboard:**

1. Open your agent → Click **Settings**
2. Find "WhatsApp" section
3. Click **Connect**
4. Paste:
   - Phone Number ID (15-digit)
   - API Token (starts with `EAAB`)
5. Click "Save & Connect"

**✅ WhatsApp is now connected to your agent**

---

### Phase 3: Configure Webhook (4 min)

**Back in Meta Dashboard → WhatsApp → Configuration:**

1. **Webhook URL**:

   ```
   https://yourdomain.com/api/webhooks/whatsapp
   ```

   (Replace `yourdomain.com` with your actual domain)

2. **Verify Token**:

   ```
   diyaa_verify_token
   ```

3. **Subscribe to events**:
   - ✅ messages
   - ✅ message_template_status_update
   - ✅ message_template_quality_update

4. Click "Verify and Save"

**✅ Webhook is active**

---

### Phase 4: Add Widget to Website (3 min)

**In your agent dashboard:**

1. Click **Embed Widget** button (top right)
2. Enter your WhatsApp number: `919876543210`
3. Click **Copy** (copy the embed code)
4. Paste code before `</body>` tag on your website

**For WordPress:**

- Go to Appearance → Theme File Editor
- Find `footer.php`
- Paste code before `</body>`
- Save

**For HTML/Shopify/Wix:**

- Find theme editor / custom HTML section
- Paste code before `</body>`
- Save/Publish

**✅ Widget is now live on your website**

---

## Test It! 🎉

1. Go to your website
2. Look bottom-right corner → see purple WhatsApp button?
3. Click it → Chat bubble appears
4. Click "Open WhatsApp"
5. Your phone opens WhatsApp
6. Type a test message
7. Check agent dashboard → See conversation in **Chat** tab

**Your agent should respond automatically within 5 seconds!**

---

## Real-World Example

### Before Setup ❌

- Customer: "Do you have XL size?"
- Customer waits... no response
- Customer leaves and buys from competitor

### After Setup ✅

- Customer clicks WhatsApp icon on your website
- Messages: "Do you have XL size?"
- AI agent responds in 3 seconds: "Yes! We have XL in black, blue, and red. Which color interests you?"
- Customer: "Blue one"
- Agent: "Great! I'll send you the details. Here's our WhatsApp catalog..."
- Sale completed 🎉

---

## What Happens Behind the Scenes

```
Customer types message
        ↓
Message sent via WhatsApp to your number
        ↓
Meta sends webhook to diyaa.ai servers
        ↓
diyaa.ai fetches your agent config + system prompt
        ↓
Groq AI generates response in 2 seconds
        ↓
Response sent back to customer via WhatsApp
        ↓
Conversation logged in dashboard
```

---

## Usage Limits & Costs

### WhatsApp Messages

- **Intern Plan** (₹999/mo): 0 WhatsApp included
- **Agent Plan** (₹2499/mo): 200 WhatsApp/month included
- After limit: ₹0.50 per message

### AI Responses

- Free: Groq + Gemini (auto-rotate)
- Unlimited: No cap, just pay for extra messages

### Website Widget

- Free: $0 (included)
- Works on unlimited websites
- No additional charges

---

## Troubleshooting

### Button not showing on website?

- Check: Is script pasted before `</body>`?
- Check: Is domain publicly accessible? (not localhost)
- Clear browser cache (Ctrl+F5)

### Agent not responding?

- Check: Is WhatsApp connected in Settings?
- Check: Is webhook configured in Meta Dashboard?
- Check: Dashboard tab → See message arrived?
- Check: Sentry logs for LLM errors

### Message marked "Pending"?

- Phone number not approved by Meta (takes 24-48 hours for new numbers)
- Use sandbox phone number for testing first

### Rate limiting?

- Meta limits new numbers to 1000/day
- After 24 hours of good delivery, limit increases to 10,000+

---

## Pro Tips

### 1. Set Agent Active Hours

- Agent should pause outside working hours
- In Settings tab → Active Hours (e.g., 9am-9pm)
- Customers' messages queue and respond next morning

### 2. Upload Knowledge Base

- Go to Settings → Knowledge tab
- Upload product catalog, FAQs, return policy
- Agent uses this to answer questions accurately

### 3. Monitor Performance

- Check Dashboard tab daily
- Track: Messages sent, response time, customer satisfaction
- Improve system prompt based on what works

### 4. Set Escalation Rules

- For complex questions → flag for human review
- In Settings → Escalation rules
- Human takes over automatically

### 5. Test with Your Own Number First

- Send 5-10 test messages
- Verify responses are accurate
- Then share with customers

---

## What's Next?

### Week 1

- ✅ Widget live on website
- ✅ Test with friends/family
- ✅ Adjust system prompt based on feedback

### Week 2

- Add product catalog to knowledge base
- Set up escalation rules for edge cases
- Monitor first real customer conversations

### Week 3

- Optimize system prompt (what works?)
- Integrate with your order system (optional)
- Train team on reviewing escalations

---

## Support

**Quick Questions?**

- Check FAQ above
- Email: support@diyaa.ai
- Read: WHATSAPP_SETUP.md (detailed version)

**Something Broken?**

- Check Sentry error logs
- Verify Meta webhook is configured
- Test with `curl` to webhook endpoint

**Feature Request?**

- Want SMS? → Coming in Phase 2
- Want Email? → Coming in Phase 2
- Want voice calls? → Coming in Phase 3

---

## Summary

You now have a **24/7 AI customer support bot** that:

- ✅ Answers customer questions automatically
- ✅ Handles ∞ concurrent conversations
- ✅ Never gets tired or rude
- ✅ Tracks all interactions
- ✅ Costs ₹2499/month for 200 messages/day

**This is your unfair advantage over competitors.**

Go live! 🚀
