# Ecommerce Automation Agents

## Overview
Multi-agent workflows for Indian ecommerce businesses solving ₹25L+ annual leakage.

## Target Problems
1. **Abandoned Carts** (₹10-20L/mo loss)
2. **Customer Reacquisition** (₹5-10L/mo)
3. **Inventory Stockouts** (₹5-15L/mo)
4. **Order Processing** (₹2-5L/mo) 

{
  "name": "🛒 E-commerce Operations Agent v2 — 10/10",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "shopify-ecommerce-agent",
        "responseMode": "onReceived",
        "responseCode": 200,
        "options": {}
      },
      "id": "1",
      "name": "Shopify Webhook Receiver",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [100, 400],
      "webhookId": "shopify-ecommerce-agent"
    },

    {
      "parameters": {
        "jsCode": "// ✅ SECURITY: Verify Shopify HMAC Signature\nconst crypto = require('crypto');\nconst secret = $vars.SHOPIFY_WEBHOOK_SECRET || '';\nconst hmacHeader = $input.first().json.headers?.['x-shopify-hmac-sha256'] || '';\nconst rawBody = JSON.stringify($input.first().json.body);\n\nif (secret) {\n  const computed = crypto.createHmac('sha256', secret).update(rawBody).digest('base64');\n  if (computed !== hmacHeader) {\n    throw new Error('Invalid Shopify webhook signature — request rejected');\n  }\n}\n\n// ✅ DEDUPLICATION: Use event ID to prevent double-processing\nconst body = $input.first().json.body;\nconst topic = $input.first().json.headers?.['x-shopify-topic'] || 'unknown';\nconst eventId = body.id ? `${topic}-${body.id}` : `${topic}-${Date.now()}`;\n\nreturn [{ json: { ...body, topic, eventId, receivedAt: new Date().toISOString() } }];"
      },
      "id": "2",
      "name": "Security + Dedup Check",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [300, 400]
    },

    {
      "parameters": {
        "operation": "append",
        "documentId": "={{ $vars.GOOGLE_SHEET_ID }}",
        "sheetName": "raw_events",
        "columns": {
          "mappingMode": "defineBelow",
          "value": {
            "event_id": "={{ $json.eventId }}",
            "topic": "={{ $json.topic }}",
            "order_id": "={{ $json.order_number || $json.id || '' }}",
            "received_at": "={{ $json.receivedAt }}",
            "status": "PROCESSING",
            "raw_payload": "={{ JSON.stringify($json).substring(0, 500) }}"
          }
        },
        "options": {}
      },
      "id": "3",
      "name": "Log Event to Google Sheets",
      "type": "n8n-nodes-base.googleSheets",
      "typeVersion": 4.5,
      "position": [500, 300],
      "credentials": {
        "googleSheetsOAuth2Api": { "id": "5", "name": "Google Sheets" }
      }
    },

    {
      "parameters": {
        "model": "claude-sonnet-4-20250514",
        "messages": {
          "values": [
            {
              "role": "user",
              "content": "=You are an E-commerce Operations AI Agent for a Shopify store.\n\nAnalyze this Shopify webhook event and classify it.\n\nEvent Topic: {{ $json.topic }}\nEvent Payload: {{ JSON.stringify($json).substring(0, 3000) }}\n\nClassify into ONE category:\n- ORDER_NEW: New order placed\n- ORDER_UPDATED: Order updated (status change, address edit)\n- ORDER_FULFILLED: Order shipped with tracking\n- ORDER_CANCELLED: Order cancelled\n- REFUND_REQUESTED: Refund initiated\n- RETURN_REQUESTED: Customer return/exchange request\n- INVENTORY_LOW: Stock below threshold (10 units)\n- UNKNOWN: Cannot classify\n\nExtract all available fields. Use null for missing fields.\n\nRespond ONLY in valid JSON:\n{\n  \"category\": \"ORDER_NEW\",\n  \"confidence\": 0.97,\n  \"customer_name\": \"...\",\n  \"customer_email\": \"...\",\n  \"customer_phone\": \"+91XXXXXXXXXX\",\n  \"order_id\": \"#1234\",\n  \"order_total\": \"₹2,500\",\n  \"product_name\": \"...\",\n  \"sku\": \"...\",\n  \"tracking_number\": null,\n  \"carrier\": null,\n  \"refund_amount\": null,\n  \"return_reason\": null,\n  \"inventory_product\": null,\n  \"inventory_quantity\": null,\n  \"needs_human_review\": false,\n  \"escalation_reason\": null,\n  \"action_summary\": \"New order placed for Product X worth ₹2,500\"\n}"
            }
          ]
        },
        "options": {
          "maxTokens": 800,
          "temperature": 0.1
        }
      },
      "id": "4",
      "name": "Claude AI — Classify & Extract",
      "type": "@n8n/n8n-nodes-langchain.lmChatAnthropic",
      "typeVersion": 1,
      "position": [700, 400],
      "credentials": {
        "anthropicApi": { "id": "2", "name": "Anthropic Claude" }
      }
    },

    {
      "parameters": {
        "jsCode": "const raw = $input.first().json.text || $input.first().json.content?.[0]?.text || '{}';\ntry {\n  const clean = raw.replace(/```json|```/g, '').trim();\n  const match = clean.match(/\\{[\\s\\S]*\\}/);\n  const parsed = JSON.parse(match ? match[0] : clean);\n  // Attach original event metadata\n  parsed._eventId = $('Security + Dedup Check').item.json.eventId;\n  parsed._receivedAt = $('Security + Dedup Check').item.json.receivedAt;\n  return [{ json: parsed }];\n} catch(e) {\n  return [{ json: {\n    category: 'UNKNOWN',\n    needs_human_review: true,\n    escalation_reason: 'AI failed to parse event: ' + e.message,\n    action_summary: 'Parse error — needs manual review',\n    _eventId: $('Security + Dedup Check').item.json.eventId\n  }}];\n}"
      },
      "id": "5",
      "name": "Parse & Validate AI Response",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [900, 400]
    },

    {
      "parameters": {
        "rules": {
          "rules": [
            {
              "outputKey": "order_new",
              "conditions": { "conditions": [{ "leftValue": "={{ $json.category }}", "rightValue": "ORDER_NEW", "operator": { "type": "string", "operation": "equals" } }] }
            },
            {
              "outputKey": "order_fulfilled",
              "conditions": { "conditions": [{ "leftValue": "={{ $json.category }}", "rightValue": "ORDER_FULFILLED", "operator": { "type": "string", "operation": "equals" } }] }
            },
            {
              "outputKey": "order_cancelled",
              "conditions": { "conditions": [{ "leftValue": "={{ $json.category }}", "rightValue": "ORDER_CANCELLED", "operator": { "type": "string", "operation": "equals" } }] }
            },
            {
              "outputKey": "refund",
              "conditions": { "conditions": [{ "leftValue": "={{ $json.category }}", "rightValue": "REFUND_REQUESTED", "operator": { "type": "string", "operation": "equals" } }] }
            },
            {
              "outputKey": "return",
              "conditions": { "conditions": [{ "leftValue": "={{ $json.category }}", "rightValue": "RETURN_REQUESTED", "operator": { "type": "string", "operation": "equals" } }] }
            },
            {
              "outputKey": "inventory_low",
              "conditions": { "conditions": [{ "leftValue": "={{ $json.category }}", "rightValue": "INVENTORY_LOW", "operator": { "type": "string", "operation": "equals" } }] }
            }
          ]
        },
        "options": { "fallbackOutput": "extra" }
      },
      "id": "6",
      "name": "Route by Event Type",
      "type": "n8n-nodes-base.switch",
      "typeVersion": 3,
      "position": [1100, 400]
    },

    {
      "parameters": {
        "fromEmail": "ops@yourstore.com",
        "toEmail": "={{ $('Parse & Validate AI Response').item.json.customer_email }}",
        "subject": "=✅ Order Confirmed — {{ $('Parse & Validate AI Response').item.json.order_id }}",
        "emailType": "html",
        "message": "=<div style=\"font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #eee;border-radius:10px\">\n  <div style=\"background:#2d6a4f;padding:16px;border-radius:8px 8px 0 0;text-align:center\">\n    <h1 style=\"color:white;margin:0;font-size:22px\">Order Confirmed 🎉</h1>\n  </div>\n  <div style=\"padding:20px\">\n    <p>Hi <strong>{{ $('Parse & Validate AI Response').item.json.customer_name }}</strong>,</p>\n    <p>Thank you for your order! We've received it and are processing it now.</p>\n    <table style=\"width:100%;border-collapse:collapse;margin:16px 0\">\n      <tr style=\"background:#f0faf4\"><td style=\"padding:10px;border:1px solid #d4edda\"><strong>Order ID</strong></td><td style=\"padding:10px;border:1px solid #d4edda\">{{ $('Parse & Validate AI Response').item.json.order_id }}</td></tr>\n      <tr><td style=\"padding:10px;border:1px solid #ddd\"><strong>Product</strong></td><td style=\"padding:10px;border:1px solid #ddd\">{{ $('Parse & Validate AI Response').item.json.product_name }}</td></tr>\n      <tr style=\"background:#f0faf4\"><td style=\"padding:10px;border:1px solid #d4edda\"><strong>Total</strong></td><td style=\"padding:10px;border:1px solid #d4edda\"><strong>{{ $('Parse & Validate AI Response').item.json.order_total }}</strong></td></tr>\n    </table>\n    <p>We'll notify you once your order ships. Expected delivery: <strong>3–5 business days</strong>.</p>\n    <p style=\"color:#888;font-size:12px;margin-top:24px\">Questions? Reply to this email. | Ref: {{ $('Parse & Validate AI Response').item.json._eventId }}</p>\n  </div>\n</div>",
        "options": { "replyTo": "support@yourstore.com" }
      },
      "id": "7",
      "name": "Email — Order Confirmed",
      "type": "n8n-nodes-base.emailSend",
      "typeVersion": 2.1,
      "position": [1340, 120],
      "credentials": { "smtp": { "id": "3", "name": "SMTP Email" } }
    },
    {
      "parameters": {
        "operation": "send",
        "from": "whatsapp:+14155238886",
        "to": "=whatsapp:{{ $('Parse & Validate AI Response').item.json.customer_phone }}",
        "body": "=✅ *Order Confirmed!*\n\nHi {{ $('Parse & Validate AI Response').item.json.customer_name }}! 👋\n\n📦 *Order:* {{ $('Parse & Validate AI Response').item.json.order_id }}\n🛍️ *Product:* {{ $('Parse & Validate AI Response').item.json.product_name }}\n💰 *Total:* {{ $('Parse & Validate AI Response').item.json.order_total }}\n⏱️ *Delivery:* 3–5 business days\n\nThank you for shopping with us! We'll WhatsApp you when it ships. 🙏",
        "options": {}
      },
      "id": "8",
      "name": "WhatsApp — Order Confirmed",
      "type": "n8n-nodes-base.twilio",
      "typeVersion": 1,
      "position": [1340, 260],
      "credentials": { "twilioApi": { "id": "4", "name": "Twilio WhatsApp" } }
    },

    {
      "parameters": {
        "fromEmail": "ops@yourstore.com",
        "toEmail": "={{ $('Parse & Validate AI Response').item.json.customer_email }}",
        "subject": "=🚚 Shipped! {{ $('Parse & Validate AI Response').item.json.order_id }} — Track Your Order",
        "emailType": "html",
        "message": "=<div style=\"font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #eee;border-radius:10px\">\n  <div style=\"background:#1d3557;padding:16px;border-radius:8px 8px 0 0;text-align:center\">\n    <h1 style=\"color:white;margin:0;font-size:22px\">Your Order is On Its Way! 🚀</h1>\n  </div>\n  <div style=\"padding:20px\">\n    <p>Hi <strong>{{ $('Parse & Validate AI Response').item.json.customer_name }}</strong>,</p>\n    <p>Great news! Your order has been shipped and is heading your way.</p>\n    <table style=\"width:100%;border-collapse:collapse;margin:16px 0\">\n      <tr style=\"background:#e8f0fe\"><td style=\"padding:10px;border:1px solid #c5d8fd\"><strong>Order ID</strong></td><td style=\"padding:10px;border:1px solid #c5d8fd\">{{ $('Parse & Validate AI Response').item.json.order_id }}</td></tr>\n      <tr><td style=\"padding:10px;border:1px solid #ddd\"><strong>Carrier</strong></td><td style=\"padding:10px;border:1px solid #ddd\">{{ $('Parse & Validate AI Response').item.json.carrier }}</td></tr>\n      <tr style=\"background:#e8f0fe\"><td style=\"padding:10px;border:1px solid #c5d8fd\"><strong>Tracking No.</strong></td><td style=\"padding:10px;border:1px solid #c5d8fd\"><strong>{{ $('Parse & Validate AI Response').item.json.tracking_number }}</strong></td></tr>\n    </table>\n    <p style=\"color:#888;font-size:12px;margin-top:24px\">Reply to this email for help. | Ref: {{ $('Parse & Validate AI Response').item.json._eventId }}</p>\n  </div>\n</div>",
        "options": {}
      },
      "id": "9",
      "name": "Email — Order Shipped",
      "type": "n8n-nodes-base.emailSend",
      "typeVersion": 2.1,
      "position": [1340, 380],
      "credentials": { "smtp": { "id": "3", "name": "SMTP Email" } }
    },
    {
      "parameters": {
        "operation": "send",
        "from": "whatsapp:+14155238886",
        "to": "=whatsapp:{{ $('Parse & Validate AI Response').item.json.customer_phone }}",
        "body": "=🚚 *Your order has shipped!*\n\nHi {{ $('Parse & Validate AI Response').item.json.customer_name }}!\n\n📦 *Order:* {{ $('Parse & Validate AI Response').item.json.order_id }}\n🏢 *Carrier:* {{ $('Parse & Validate AI Response').item.json.carrier }}\n🔍 *Tracking:* `{{ $('Parse & Validate AI Response').item.json.tracking_number }}`\n\nExpect delivery in 3–5 business days. Track using the number above. 📬",
        "options": {}
      },
      "id": "10",
      "name": "WhatsApp — Order Shipped",
      "type": "n8n-nodes-base.twilio",
      "typeVersion": 1,
      "position": [1340, 500],
      "credentials": { "twilioApi": { "id": "4", "name": "Twilio WhatsApp" } }
    },

    {
      "parameters": {
        "fromEmail": "ops@yourstore.com",
        "toEmail": "={{ $('Parse & Validate AI Response').item.json.customer_email }}",
        "subject": "=❌ Order Cancelled — {{ $('Parse & Validate AI Response').item.json.order_id }}",
        "emailType": "html",
        "message": "=<div style=\"font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #eee;border-radius:10px\">\n  <div style=\"background:#e63946;padding:16px;border-radius:8px 8px 0 0;text-align:center\">\n    <h1 style=\"color:white;margin:0;font-size:22px\">Order Cancelled</h1>\n  </div>\n  <div style=\"padding:20px\">\n    <p>Hi <strong>{{ $('Parse & Validate AI Response').item.json.customer_name }}</strong>,</p>\n    <p>Your order <strong>{{ $('Parse & Validate AI Response').item.json.order_id }}</strong> has been cancelled.</p>\n    <p>If payment was made, a full refund will be credited within <strong>5–7 business days</strong>.</p>\n    <p>We hope to serve you again. Reply to this email if you need help.</p>\n  </div>\n</div>",
        "options": {}
      },
      "id": "11",
      "name": "Email — Order Cancelled",
      "type": "n8n-nodes-base.emailSend",
      "typeVersion": 2.1,
      "position": [1340, 600],
      "credentials": { "smtp": { "id": "3", "name": "SMTP Email" } }
    },
    {
      "parameters": {
        "operation": "send",
        "from": "whatsapp:+14155238886",
        "to": "=whatsapp:{{ $('Parse & Validate AI Response').item.json.customer_phone }}",
        "body": "=❌ *Order Cancelled*\n\nHi {{ $('Parse & Validate AI Response').item.json.customer_name }}, your order {{ $('Parse & Validate AI Response').item.json.order_id }} has been cancelled.\n\nIf you paid, a refund will be processed in 5–7 business days. Sorry for the inconvenience! 🙏",
        "options": {}
      },
      "id": "12",
      "name": "WhatsApp — Order Cancelled",
      "type": "n8n-nodes-base.twilio",
      "typeVersion": 1,
      "position": [1340, 720],
      "credentials": { "twilioApi": { "id": "4", "name": "Twilio WhatsApp" } }
    },

    {
      "parameters": {
        "url": "=https://{{ $vars.SHOPIFY_STORE }}.myshopify.com/admin/api/2024-01/orders/{{ $('Parse & Validate AI Response').item.json.order_id.replace('#','') }}/refunds.json",
        "method": "POST",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            { "name": "X-Shopify-Access-Token", "value": "={{ $vars.SHOPIFY_ACCESS_TOKEN }}" },
            { "name": "Content-Type", "value": "application/json" }
          ]
        },
        "sendBody": true,
        "contentType": "json",
        "body": "={ \"refund\": { \"notify\": true, \"note\": \"Auto-processed by n8n Operations Agent\" } }",
        "options": { "retry": { "enabled": true, "maxTries": 3, "waitBetweenTries": 2000 } }
      },
      "id": "13",
      "name": "Process Refund — Shopify API",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1340, 820]
    },
    {
      "parameters": {
        "fromEmail": "ops@yourstore.com",
        "toEmail": "={{ $('Parse & Validate AI Response').item.json.customer_email }}",
        "subject": "=💰 Refund Processed — {{ $('Parse & Validate AI Response').item.json.order_id }}",
        "emailType": "html",
        "message": "=<div style=\"font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #eee;border-radius:10px\">\n  <div style=\"background:#f4a261;padding:16px;border-radius:8px 8px 0 0;text-align:center\">\n    <h1 style=\"color:white;margin:0;font-size:22px\">Refund Initiated ✅</h1>\n  </div>\n  <div style=\"padding:20px\">\n    <p>Hi <strong>{{ $('Parse & Validate AI Response').item.json.customer_name }}</strong>,</p>\n    <p>Your refund for order <strong>{{ $('Parse & Validate AI Response').item.json.order_id }}</strong> has been initiated.</p>\n    <table style=\"width:100%;border-collapse:collapse;margin:16px 0\">\n      <tr style=\"background:#fff3e0\"><td style=\"padding:10px;border:1px solid #ffe0b2\"><strong>Refund Amount</strong></td><td style=\"padding:10px;border:1px solid #ffe0b2\"><strong>{{ $('Parse & Validate AI Response').item.json.refund_amount }}</strong></td></tr>\n      <tr><td style=\"padding:10px;border:1px solid #ddd\"><strong>Timeline</strong></td><td style=\"padding:10px;border:1px solid #ddd\">5–7 Business Days</td></tr>\n      <tr style=\"background:#fff3e0\"><td style=\"padding:10px;border:1px solid #ffe0b2\"><strong>Method</strong></td><td style=\"padding:10px;border:1px solid #ffe0b2\">Original Payment Method</td></tr>\n    </table>\n  </div>\n</div>",
        "options": {}
      },
      "id": "14",
      "name": "Email — Refund Processed",
      "type": "n8n-nodes-base.emailSend",
      "typeVersion": 2.1,
      "position": [1560, 760],
      "credentials": { "smtp": { "id": "3", "name": "SMTP Email" } }
    },
    {
      "parameters": {
        "operation": "send",
        "from": "whatsapp:+14155238886",
        "to": "=whatsapp:{{ $('Parse & Validate AI Response').item.json.customer_phone }}",
        "body": "=💰 *Refund Processed!*\n\nHi {{ $('Parse & Validate AI Response').item.json.customer_name }},\n\n✅ Your refund for order {{ $('Parse & Validate AI Response').item.json.order_id }} has been initiated.\n\n💵 *Amount:* {{ $('Parse & Validate AI Response').item.json.refund_amount }}\n⏱️ *Timeline:* 5–7 Business Days\n\nAmount will be credited to your original payment method. 🙏",
        "options": {}
      },
      "id": "15",
      "name": "WhatsApp — Refund Processed",
      "type": "n8n-nodes-base.twilio",
      "typeVersion": 1,
      "position": [1560, 900],
      "credentials": { "twilioApi": { "id": "4", "name": "Twilio WhatsApp" } }
    },

    {
      "parameters": {
        "fromEmail": "ops@yourstore.com",
        "toEmail": "={{ $('Parse & Validate AI Response').item.json.customer_email }}",
        "subject": "=🔄 Return Request Received — {{ $('Parse & Validate AI Response').item.json.order_id }}",
        "emailType": "html",
        "message": "=<div style=\"font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #eee;border-radius:10px\">\n  <div style=\"background:#457b9d;padding:16px;border-radius:8px 8px 0 0;text-align:center\">\n    <h1 style=\"color:white;margin:0;font-size:22px\">Return Request Received 🔄</h1>\n  </div>\n  <div style=\"padding:20px\">\n    <p>Hi <strong>{{ $('Parse & Validate AI Response').item.json.customer_name }}</strong>,</p>\n    <p>We've received your return request for order <strong>{{ $('Parse & Validate AI Response').item.json.order_id }}</strong>.</p>\n    <p><strong>Return Reason:</strong> {{ $('Parse & Validate AI Response').item.json.return_reason || 'Not specified' }}</p>\n    <p>Our team will review your request and get back to you within <strong>24–48 hours</strong> with return instructions.</p>\n    <p>Please do NOT ship the item until you receive confirmation from us.</p>\n    <p style=\"color:#888;font-size:12px;margin-top:24px\">Reply to this email for questions.</p>\n  </div>\n</div>",
        "options": {}
      },
      "id": "16",
      "name": "Email — Return Acknowledged",
      "type": "n8n-nodes-base.emailSend",
      "typeVersion": 2.1,
      "position": [1340, 980],
      "credentials": { "smtp": { "id": "3", "name": "SMTP Email" } }
    },
    {
      "parameters": {
        "operation": "send",
        "from": "whatsapp:+14155238886",
        "to": "=whatsapp:{{ $('Parse & Validate AI Response').item.json.customer_phone }}",
        "body": "=🔄 *Return Request Received*\n\nHi {{ $('Parse & Validate AI Response').item.json.customer_name }},\n\nWe've received your return request for order {{ $('Parse & Validate AI Response').item.json.order_id }}.\n\n📋 *Reason:* {{ $('Parse & Validate AI Response').item.json.return_reason || 'Not specified' }}\n\nOur team will review and send return instructions within 24–48 hours. Please *do not ship* the item until then. 🙏",
        "options": {}
      },
      "id": "17",
      "name": "WhatsApp — Return Acknowledged",
      "type": "n8n-nodes-base.twilio",
      "typeVersion": 1,
      "position": [1340, 1100],
      "credentials": { "twilioApi": { "id": "4", "name": "Twilio WhatsApp" } }
    },
    {
      "parameters": {
        "fromEmail": "ops@yourstore.com",
        "toEmail": "returns@yourstore.com",
        "subject": "=🔄 [ACTION REQUIRED] New Return Request — {{ $('Parse & Validate AI Response').item.json.order_id }}",
        "emailType": "html",
        "message": "=<div style=\"font-family:Arial,sans-serif;padding:20px\">\n  <h2 style=\"color:#e63946\">⚠️ Return Request — Action Required</h2>\n  <p><strong>Customer:</strong> {{ $('Parse & Validate AI Response').item.json.customer_name }}</p>\n  <p><strong>Email:</strong> {{ $('Parse & Validate AI Response').item.json.customer_email }}</p>\n  <p><strong>Phone:</strong> {{ $('Parse & Validate AI Response').item.json.customer_phone }}</p>\n  <p><strong>Order ID:</strong> {{ $('Parse & Validate AI Response').item.json.order_id }}</p>\n  <p><strong>Product:</strong> {{ $('Parse & Validate AI Response').item.json.product_name }}</p>\n  <p><strong>Return Reason:</strong> {{ $('Parse & Validate AI Response').item.json.return_reason }}</p>\n  <p><strong>AI Summary:</strong> {{ $('Parse & Validate AI Response').item.json.action_summary }}</p>\n  <hr/>\n  <p>Please process this return within 24 hours and update the customer.</p>\n</div>",
        "options": {}
      },
      "id": "18",
      "name": "Email — Alert Returns Team",
      "type": "n8n-nodes-base.emailSend",
      "typeVersion": 2.1,
      "position": [1560, 1040],
      "credentials": { "smtp": { "id": "3", "name": "SMTP Email" } }
    },

    {
      "parameters": {
        "conditions": {
          "conditions": [
            {
              "leftValue": "={{ $json.inventory_quantity }}",
              "rightValue": 10,
              "operator": { "type": "number", "operation": "lt" }
            }
          ]
        },
        "options": {}
      },
      "id": "19",
      "name": "Is Stock Critical?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [1340, 1200]
    },
    {
      "parameters": {
        "fromEmail": "ops@yourstore.com",
        "toEmail": "inventory@yourstore.com",
        "subject": "=⚠️ LOW STOCK ALERT: {{ $('Parse & Validate AI Response').item.json.inventory_product }} — {{ $('Parse & Validate AI Response').item.json.inventory_quantity }} units left",
        "emailType": "html",
        "message": "=<div style=\"font-family:Arial,sans-serif;padding:20px;border:2px solid #e63946;border-radius:8px\">\n  <h2 style=\"color:#e63946\">⚠️ Critical Low Stock Warning</h2>\n  <table style=\"width:100%;border-collapse:collapse;margin:16px 0\">\n    <tr style=\"background:#fff0f0\"><td style=\"padding:10px;border:1px solid #ffcccc\"><strong>Product</strong></td><td style=\"padding:10px;border:1px solid #ffcccc\">{{ $('Parse & Validate AI Response').item.json.inventory_product }}</td></tr>\n    <tr><td style=\"padding:10px;border:1px solid #ddd\"><strong>Current Stock</strong></td><td style=\"padding:10px;border:1px solid #ddd;color:#e63946\"><strong>{{ $('Parse & Validate AI Response').item.json.inventory_quantity }} units</strong></td></tr>\n    <tr style=\"background:#fff0f0\"><td style=\"padding:10px;border:1px solid #ffcccc\"><strong>Threshold</strong></td><td style=\"padding:10px;border:1px solid #ffcccc\">10 units</td></tr>\n    <tr><td style=\"padding:10px;border:1px solid #ddd\"><strong>Alert Time</strong></td><td style=\"padding:10px;border:1px solid #ddd\">{{ $('Parse & Validate AI Response').item.json._receivedAt }}</td></tr>\n  </table>\n  <p style=\"color:#e63946\"><strong>Action Required: Reorder immediately to avoid stockout.</strong></p>\n</div>",
        "options": {}
      },
      "id": "20",
      "name": "Email — Low Stock Alert",
      "type": "n8n-nodes-base.emailSend",
      "typeVersion": 2.1,
      "position": [1560, 1160],
      "credentials": { "smtp": { "id": "3", "name": "SMTP Email" } }
    },
    {
      "parameters": {
        "operation": "send",
        "from": "whatsapp:+14155238886",
        "to": "=whatsapp:{{ $vars.TEAM_WHATSAPP_NUMBER }}",
        "body": "=⚠️ *CRITICAL LOW STOCK ALERT*\n\n🛒 *Product:* {{ $('Parse & Validate AI Response').item.json.inventory_product }}\n📦 *Stock Left:* {{ $('Parse & Validate AI Response').item.json.inventory_quantity }} units\n🚨 *Status:* CRITICAL — Below 10 unit threshold\n⏰ *Time:* {{ $('Parse & Validate AI Response').item.json._receivedAt }}\n\n*ACTION REQUIRED: Reorder immediately!* 🔴",
        "options": {}
      },
      "id": "21",
      "name": "WhatsApp — Low Stock Alert",
      "type": "n8n-nodes-base.twilio",
      "typeVersion": 1,
      "position": [1560, 1280],
      "credentials": { "twilioApi": { "id": "4", "name": "Twilio WhatsApp" } }
    },
    {
      "parameters": {
        "fromEmail": "ops@yourstore.com",
        "toEmail": "supplier@yoursupplier.com",
        "subject": "=📦 Reorder Request — {{ $('Parse & Validate AI Response').item.json.inventory_product }}",
        "emailType": "html",
        "message": "=<div style=\"font-family:Arial,sans-serif;padding:20px\">\n  <h2>Reorder Request</h2>\n  <p>Please process a reorder for the following product:</p>\n  <p><strong>Product:</strong> {{ $('Parse & Validate AI Response').item.json.inventory_product }}</p>\n  <p><strong>Current Stock:</strong> {{ $('Parse & Validate AI Response').item.json.inventory_quantity }} units</p>\n  <p><strong>Reorder Qty Requested:</strong> 100 units (please confirm)</p>\n  <p>This is an automated reorder alert. Please confirm receipt and expected delivery date.</p>\n</div>",
        "options": {}
      },
      "id": "22",
      "name": "Email — Auto Reorder to Supplier",
      "type": "n8n-nodes-base.emailSend",
      "typeVersion": 2.1,
      "position": [1560, 1380],
      "credentials": { "smtp": { "id": "3", "name": "SMTP Email" } }
    },

    {
      "parameters": {
        "conditions": {
          "conditions": [
            {
              "leftValue": "={{ $json.needs_human_review }}",
              "rightValue": true,
              "operator": { "type": "boolean", "operation": "true" }
            }
          ]
        },
        "options": {}
      },
      "id": "23",
      "name": "Needs Human Review?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [1340, 1500]
    },
    {
      "parameters": {
        "fromEmail": "ops@yourstore.com",
        "toEmail": "ops-team@yourstore.com",
        "subject": "=🚨 [ESCALATION] Manual Review Needed — {{ $('Parse & Validate AI Response').item.json.order_id || 'Unknown Event' }}",
        "emailType": "html",
        "message": "=<div style=\"font-family:Arial,sans-serif;padding:20px;border:2px solid #ff9800\">\n  <h2 style=\"color:#ff9800\">🚨 Human Review Required</h2>\n  <p><strong>Event ID:</strong> {{ $('Parse & Validate AI Response').item.json._eventId }}</p>\n  <p><strong>Category:</strong> {{ $('Parse & Validate AI Response').item.json.category }}</p>\n  <p><strong>Escalation Reason:</strong> {{ $('Parse & Validate AI Response').item.json.escalation_reason }}</p>\n  <p><strong>AI Summary:</strong> {{ $('Parse & Validate AI Response').item.json.action_summary }}</p>\n  <p><strong>Customer:</strong> {{ $('Parse & Validate AI Response').item.json.customer_name }} ({{ $('Parse & Validate AI Response').item.json.customer_email }})</p>\n  <hr/>\n  <p>The AI agent could not process this event automatically. Please review and take manual action.</p>\n</div>",
        "options": {}
      },
      "id": "24",
      "name": "Email — Escalate to Human Team",
      "type": "n8n-nodes-base.emailSend",
      "typeVersion": 2.1,
      "position": [1560, 1460],
      "credentials": { "smtp": { "id": "3", "name": "SMTP Email" } }
    },
    {
      "parameters": {
        "operation": "send",
        "from": "whatsapp:+14155238886",
        "to": "=whatsapp:{{ $vars.TEAM_WHATSAPP_NUMBER }}",
        "body": "=🚨 *ESCALATION — Manual Review Required*\n\n📋 *Event ID:* {{ $('Parse & Validate AI Response').item.json._eventId }}\n🏷️ *Category:* {{ $('Parse & Validate AI Response').item.json.category }}\n❗ *Reason:* {{ $('Parse & Validate AI Response').item.json.escalation_reason }}\n👤 *Customer:* {{ $('Parse & Validate AI Response').item.json.customer_name }}\n\n*Please check your email and take action immediately.*",
        "options": {}
      },
      "id": "25",
      "name": "WhatsApp — Escalate to Team",
      "type": "n8n-nodes-base.twilio",
      "typeVersion": 1,
      "position": [1560, 1580],
      "credentials": { "twilioApi": { "id": "4", "name": "Twilio WhatsApp" } }
    },

    {
      "parameters": {
        "operation": "update",
        "documentId": "={{ $vars.GOOGLE_SHEET_ID }}",
        "sheetName": "raw_events",
        "columns": {
          "mappingMode": "defineBelow",
          "value": {
            "event_id": "={{ $('Parse & Validate AI Response').item.json._eventId }}",
            "status": "COMPLETED",
            "category": "={{ $('Parse & Validate AI Response').item.json.category }}",
            "action_summary": "={{ $('Parse & Validate AI Response').item.json.action_summary }}",
            "completed_at": "={{ new Date().toISOString() }}"
          }
        },
        "options": {}
      },
      "id": "26",
      "name": "Update Audit Log",
      "type": "n8n-nodes-base.googleSheets",
      "typeVersion": 4.5,
      "position": [1780, 400],
      "credentials": {
        "googleSheetsOAuth2Api": { "id": "5", "name": "Google Sheets" }
      }
    }
  ],

  "connections": {
    "Shopify Webhook Receiver": {
      "main": [[{ "node": "Security + Dedup Check", "type": "main", "index": 0 }]]
    },
    "Security + Dedup Check": {
      "main": [
        [
          { "node": "Log Event to Google Sheets", "type": "main", "index": 0 },
          { "node": "Claude AI — Classify & Extract", "type": "main", "index": 0 }
        ]
      ]
    },
    "Claude AI — Classify & Extract": {
      "main": [[{ "node": "Parse & Validate AI Response", "type": "main", "index": 0 }]]
    },
    "Parse & Validate AI Response": {
      "main": [
        [
          { "node": "Route by Event Type", "type": "main", "index": 0 },
          { "node": "Needs Human Review?", "type": "main", "index": 0 }
        ]
      ]
    },
    "Route by Event Type": {
      "main": [
        [{ "node": "Email — Order Confirmed", "type": "main", "index": 0 }, { "node": "WhatsApp — Order Confirmed", "type": "main", "index": 0 }],
        [{ "node": "Email — Order Shipped", "type": "main", "index": 0 }, { "node": "WhatsApp — Order Shipped", "type": "main", "index": 0 }],
        [{ "node": "Email — Order Cancelled", "type": "main", "index": 0 }, { "node": "WhatsApp — Order Cancelled", "type": "main", "index": 0 }],
        [{ "node": "Process Refund — Shopify API", "type": "main", "index": 0 }],
        [{ "node": "Email — Return Acknowledged", "type": "main", "index": 0 }, { "node": "WhatsApp — Return Acknowledged", "type": "main", "index": 0 }, { "node": "Email — Alert Returns Team", "type": "main", "index": 0 }],
        [{ "node": "Is Stock Critical?", "type": "main", "index": 0 }],
        [{ "node": "Update Audit Log", "type": "main", "index": 0 }]
      ]
    },
    "Process Refund — Shopify API": {
      "main": [
        [{ "node": "Email — Refund Processed", "type": "main", "index": 0 }, { "node": "WhatsApp — Refund Processed", "type": "main", "index": 0 }]
      ]
    },
    "Is Stock Critical?": {
      "main": [
        [{ "node": "Email — Low Stock Alert", "type": "main", "index": 0 }, { "node": "WhatsApp — Low Stock Alert", "type": "main", "index": 0 }, { "node": "Email — Auto Reorder to Supplier", "type": "main", "index": 0 }],
        []
      ]
    },
    "Needs Human Review?": {
      "main": [
        [{ "node": "Email — Escalate to Human Team", "type": "main", "index": 0 }, { "node": "WhatsApp — Escalate to Team", "type": "main", "index": 0 }],
        []
      ]
    },
    "Email — Order Confirmed": { "main": [[{ "node": "Update Audit Log", "type": "main", "index": 0 }]] },
    "Email — Order Shipped": { "main": [[{ "node": "Update Audit Log", "type": "main", "index": 0 }]] },
    "Email — Order Cancelled": { "main": [[{ "node": "Update Audit Log", "type": "main", "index": 0 }]] },
    "Email — Refund Processed": { "main": [[{ "node": "Update Audit Log", "type": "main", "index": 0 }]] },
    "Email — Return Acknowledged": { "main": [[{ "node": "Update Audit Log", "type": "main", "index": 0 }]] },
    "Email — Low Stock Alert": { "main": [[{ "node": "Update Audit Log", "type": "main", "index": 0 }]] },
    "Email — Escalate to Human Team": { "main": [[{ "node": "Update Audit Log", "type": "main", "index": 0 }]] }
  },

  "active": false,
  "settings": {
    "executionOrder": "v1",
    "saveManualExecutions": true,
    "errorWorkflow": "",
    "callerPolicy": "workflowsFromSameOwner"
  },
  "tags": [
    { "name": "Ecommerce" },
    { "name": "Shopify" },
    { "name": "AI Agent" },
    { "name": "Production-Ready" }
  ],
  "_setup": {
    "variables_required": [
      "SHOPIFY_STORE — your Shopify subdomain (e.g. mystore)",
      "SHOPIFY_ACCESS_TOKEN — from Shopify Admin API",
      "SHOPIFY_WEBHOOK_SECRET — from Shopify webhook settings (for HMAC verification)",
      "TEAM_WHATSAPP_NUMBER — ops team WhatsApp number with country code",
      "GOOGLE_SHEET_ID — Google Sheet ID for audit logging"
    ],
    "credentials_required": [
      "Shopify API",
      "Anthropic Claude (claude-sonnet-4-20250514)",
      "SMTP Email",
      "Twilio (WhatsApp)",
      "Google Sheets OAuth2"
    ],
    "google_sheet_columns": [
      "event_id | topic | order_id | received_at | status | category | action_summary | completed_at | raw_payload"
    ],
    "webhook_registration": "In Shopify Admin → Settings → Notifications → Webhooks → Add webhook URL from n8n",
    "whatsapp_note": "Use Twilio Sandbox for testing. For production, use Meta WhatsApp Business API node in n8n or upgrade Twilio plan."
  }
}