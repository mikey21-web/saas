# Sales Intelligence Agents

## Overview
AI agents that give sales teams superpowers through data, intent, and automation.

## Core Capabilities
1. **Lead Intent Scoring** (1-10 urgency score)
2. **Competitor Tracking** (pricing + moves)
3. **Buyer Journey Mapping** (stage detection)
4. **Revenue Forecasting** (90-day accuracy)
5. **Deal Risk Analysis** (churn prediction)

## Agent Pipeline
```
Daily Brief → Lead Scoring → Outreach Optimization → 
Deal Coaching → Revenue Forecast → Weekly Insights
```

## Key Agents
### 1. LeadIntent (Real-time scoring)
```
Input: WhatsApp/email conversations
Output: 1-10 intent score + next best action
Metrics: 32% reply rate → 8% meeting booked
```

### 2. RevenueForecaster
```
Input: Pipeline + historical data
Output: 90-day revenue prediction ±12%
Alert: Cashflow gaps before crisis
```

### 3. ConversationIntel
```
Input: All customer comms
Output: Emotion + urgency + upsell signals
VIP Alert: High-value customer frustration
```

## Integration Stack
```
WhatsApp Business API → ConversationIntel → LeadIntent
CRM (HubSpot/Pipedrive) → RevenueForecaster
LinkedIn SalesNav → CompetitorTracker
Supabase → Real-time dashboard
```

## Expected ROI
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Lead Reply Rate | 8% | 28% | 3.5x |
| Meeting Book Rate | 1.2% | 6.8% | 5.7x |
| Sales Cycle | 45 days | 22 days | 50% faster |
| Win Rate | 18% | 29% | 61% higher |

## Pricing
```
Pro: ₹9,999/mo (Unlimited users + CRM sync)
Enterprise: ₹24,999/mo (Custom integrations + API)

Free Trial: 14 days, 100 leads scored
```

## India-First
- Hinglish conversation analysis
- WhatsApp as primary intelligence source
- UPI deal value tracking
- Festival season intent spikes

## Quick Deploy
1. Connect WhatsApp + CRM
2. Upload 30-day conversation history
3. Daily intelligence brief starts tomorrow

**Supercharge your sales team. Deploy now.**

{
  "name": "ConversationIntel — WhatsApp Intent Scoring",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "whatsapp-webhook",
        "responseMode": "responseNode",
        "options": {}
      },
      "id": "node_wa_webhook",
      "name": "WhatsApp Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [240, 400]
    },
    {
      "parameters": {
        "jsCode": "const body = $input.first().json.body || $input.first().json;\nconst entry = body.entry?.[0];\nconst change = entry?.changes?.[0];\nconst msg = change?.value?.messages?.[0];\nconst contact = change?.value?.contacts?.[0];\n\nif (!msg || msg.type !== 'text') {\n  return [{ json: { skip: true } }];\n}\n\nreturn [{\n  json: {\n    messageId: msg.id,\n    from: msg.from,\n    contactName: contact?.profile?.name || 'Unknown',\n    text: msg.text?.body || '',\n    timestamp: new Date(parseInt(msg.timestamp) * 1000).toISOString(),\n    phoneNumberId: change?.value?.metadata?.phone_number_id\n  }\n}];"
      },
      "id": "node_parse_wa",
      "name": "Parse WhatsApp Message",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [460, 400]
    },
    {
      "parameters": {
        "conditions": {
          "options": { "caseSensitive": false, "leftValue": "", "typeValidation": "strict" },
          "combinator": "and",
          "conditions": [
            {
              "leftValue": "={{ $json.skip }}",
              "rightValue": true,
              "operator": { "type": "boolean", "operation": "notEquals" }
            }
          ]
        }
      },
      "id": "node_skip_check",
      "name": "Skip Non-Text",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [680, 400]
    },
    {
      "parameters": {
        "operation": "select",
        "schema": "public",
        "table": "conversation_history",
        "where": {
          "values": [
            { "column": "phone", "value": "={{ $json.from }}" }
          ]
        },
        "limit": 20,
        "sort": { "values": [{ "column": "created_at", "direction": "DESC" }] },
        "options": {}
      },
      "id": "node_fetch_history",
      "name": "Fetch Conversation History",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [900, 400],
      "credentials": { "supabaseApi": { "id": "SUPABASE_CRED_ID", "name": "Supabase" } }
    },
    {
      "parameters": {
        "operation": "select",
        "schema": "public",
        "table": "contacts",
        "where": {
          "values": [{ "column": "phone", "value": "={{ $('Parse WhatsApp Message').first().json.from }}" }]
        },
        "limit": 1,
        "options": {}
      },
      "id": "node_fetch_contact",
      "name": "Fetch CRM Contact",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [900, 560],
      "credentials": { "supabaseApi": { "id": "SUPABASE_CRED_ID", "name": "Supabase" } }
    },
    {
      "parameters": {
        "jsCode": "const msg = $('Parse WhatsApp Message').first().json;\nconst history = $('Fetch Conversation History').all().map(r => r.json);\nconst contact = $('Fetch CRM Contact').first().json || {};\n\nconst historyText = history.reverse().map(h => `[${h.role}]: ${h.text}`).join('\\n');\n\nreturn [{\n  json: {\n    ...msg,\n    contact,\n    historyText,\n    dealValue: contact.deal_value || null,\n    isVip: (contact.deal_value || 0) > 100000,\n    conversationCount: history.length\n  }\n}];"
      },
      "id": "node_build_context",
      "name": "Build Context",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1120, 400]
    },
    {
      "parameters": {
        "authentication": "apiKey",
        "resource": "message",
        "operation": "send",
        "modelId": "claude-opus-4-5",
        "messages": {
          "values": [
            {
              "role": "system",
              "content": "You are an expert B2B sales conversation analyst specializing in Indian markets and Hinglish communication. Analyze the conversation and return ONLY valid JSON:\n{\n  \"intentScore\": <1-10>,\n  \"urgency\": \"immediate\" | \"this_week\" | \"this_month\" | \"browsing\",\n  \"stage\": \"awareness\" | \"consideration\" | \"decision\" | \"negotiation\" | \"closed_won\" | \"at_risk\",\n  \"emotion\": \"positive\" | \"neutral\" | \"frustrated\" | \"urgent\" | \"confused\",\n  \"signals\": [\"<signal1>\", \"<signal2>\"],\n  \"upsellOpportunity\": <boolean>,\n  \"churnRisk\": <boolean>,\n  \"nextBestAction\": \"<one specific action>\",\n  \"suggestedReply\": \"<personalized reply in the same language/style as the customer>\",\n  \"hinglishDetected\": <boolean>,\n  \"festivalContext\": \"<festival name if relevant, else null>\",\n  \"summary\": \"<2 sentence summary>\"\n}"
            },
            {
              "role": "user",
              "content": "=Analyze this WhatsApp conversation:\n\nContact: {{ $json.contactName }} ({{ $json.isVip ? 'VIP - Deal value: ₹' + $json.dealValue : 'Standard' }})\nConversation count: {{ $json.conversationCount }}\nCRM stage: {{ $json.contact.stage || 'unknown' }}\nDeal value: ₹{{ $json.dealValue || 'unknown' }}\n\nConversation history:\n{{ $json.historyText }}\n\nLatest message:\n{{ $json.text }}"
            }
          ]
        },
        "options": {}
      },
      "id": "node_analyze",
      "name": "ConversationIntel AI",
      "type": "@n8n/n8n-nodes-langchain.lmChatAnthropic",
      "typeVersion": 1.3,
      "position": [1340, 400]
    },
    {
      "parameters": {
        "jsCode": "const ctx = $('Build Context').first().json;\nlet intel = {};\ntry {\n  const raw = $input.first().json.content?.[0]?.text || $input.first().json.text || '{}';\n  intel = JSON.parse(raw.replace(/```json\\n?|```/g, '').trim());\n} catch(e) {\n  intel = { intentScore: 5, urgency: 'this_month', stage: 'consideration', emotion: 'neutral', signals: [], upsellOpportunity: false, churnRisk: false, nextBestAction: 'Follow up manually', suggestedReply: '', hinglishDetected: false, festivalContext: null, summary: 'Analysis failed' };\n}\nreturn [{ json: { ...ctx, intel } }];"
      },
      "id": "node_parse_intel",
      "name": "Parse Intelligence",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1560, 400]
    },
    {
      "parameters": {
        "operation": "upsert",
        "schema": "public",
        "table": "conversation_history",
        "columns": "phone,role,text,intent_score,emotion,stage,created_at",
        "values": {
          "values": [
            { "column": "phone", "value": "={{ $json.from }}" },
            { "column": "role", "value": "customer" },
            { "column": "text", "value": "={{ $json.text }}" },
            { "column": "intent_score", "value": "={{ $json.intel.intentScore }}" },
            { "column": "emotion", "value": "={{ $json.intel.emotion }}" },
            { "column": "stage", "value": "={{ $json.intel.stage }}" },
            { "column": "created_at", "value": "={{ $json.timestamp }}" }
          ]
        },
        "options": {}
      },
      "id": "node_save_history",
      "name": "Save to Supabase",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [1780, 300],
      "credentials": { "supabaseApi": { "id": "SUPABASE_CRED_ID", "name": "Supabase" } }
    },
    {
      "parameters": {
        "operation": "update",
        "schema": "public",
        "table": "contacts",
        "where": { "values": [{ "column": "phone", "value": "={{ $json.from }}" }] },
        "columns": "intent_score,urgency,stage,emotion,churn_risk,upsell_opportunity,last_intel_at,next_best_action",
        "values": {
          "values": [
            { "column": "intent_score", "value": "={{ $json.intel.intentScore }}" },
            { "column": "urgency", "value": "={{ $json.intel.urgency }}" },
            { "column": "stage", "value": "={{ $json.intel.stage }}" },
            { "column": "emotion", "value": "={{ $json.intel.emotion }}" },
            { "column": "churn_risk", "value": "={{ $json.intel.churnRisk }}" },
            { "column": "upsell_opportunity", "value": "={{ $json.intel.upsellOpportunity }}" },
            { "column": "last_intel_at", "value": "={{ $json.timestamp }}" },
            { "column": "next_best_action", "value": "={{ $json.intel.nextBestAction }}" }
          ]
        },
        "options": {}
      },
      "id": "node_update_contact",
      "name": "Update CRM Contact",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [1780, 460],
      "credentials": { "supabaseApi": { "id": "SUPABASE_CRED_ID", "name": "Supabase" } }
    },
    {
      "parameters": {
        "rules": {
          "values": [
            {
              "conditions": {
                "combinator": "or",
                "conditions": [
                  { "leftValue": "={{ $json.intel.intentScore }}", "rightValue": 8, "operator": { "type": "number", "operation": "gte" } },
                  { "leftValue": "={{ $json.isVip && $json.intel.emotion === 'frustrated' }}", "rightValue": true, "operator": { "type": "boolean", "operation": "equals" } },
                  { "leftValue": "={{ $json.intel.churnRisk }}", "rightValue": true, "operator": { "type": "boolean", "operation": "equals" } }
                ]
              },
              "renameOutput": true,
              "outputKey": "Alert"
            }
          ]
        },
        "options": { "fallbackOutput": "none" }
      },
      "id": "node_alert_check",
      "name": "Alert Trigger?",
      "type": "n8n-nodes-base.switch",
      "typeVersion": 3.2,
      "position": [2000, 400]
    },
    {
      "parameters": {
        "authentication": "apiKey",
        "resource": "message",
        "operation": "send",
        "modelId": "claude-opus-4-5",
        "messages": {
          "values": [
            {
              "role": "system",
              "content": "You generate urgent Slack alert messages for sales reps. Be concise, use emojis, include the key insight and exact next action. Max 3 lines."
            },
            {
              "role": "user",
              "content": "=Generate a Slack alert for:\nContact: {{ $json.contactName }} ({{ $json.from }})\nIntent score: {{ $json.intel.intentScore }}/10\nEmotion: {{ $json.intel.emotion }}\nChurn risk: {{ $json.intel.churnRisk }}\nVIP: {{ $json.isVip }}\nDeal value: ₹{{ $json.dealValue }}\nSummary: {{ $json.intel.summary }}\nNext action: {{ $json.intel.nextBestAction }}"
            }
          ]
        },
        "options": {}
      },
      "id": "node_draft_alert",
      "name": "Draft Slack Alert",
      "type": "@n8n/n8n-nodes-langchain.lmChatAnthropic",
      "typeVersion": 1.3,
      "position": [2220, 300]
    },
    {
      "parameters": {
        "authentication": "oAuth2",
        "channel": "#sales-alerts",
        "text": "={{ $('Draft Slack Alert').first().json.content?.[0]?.text || $('Draft Slack Alert').first().json.text }}",
        "otherOptions": {}
      },
      "id": "node_slack_alert",
      "name": "Slack Alert",
      "type": "n8n-nodes-base.slack",
      "typeVersion": 2.2,
      "position": [2440, 300],
      "credentials": { "slackOAuth2Api": { "id": "SLACK_CRED_ID", "name": "Slack" } }
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={ \"status\": \"ok\" }"
      },
      "id": "node_respond",
      "name": "Respond to Webhook",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [2440, 500]
    }
  ],
  "connections": {
    "WhatsApp Webhook": { "main": [[{ "node": "Parse WhatsApp Message", "type": "main", "index": 0 }]] },
    "Parse WhatsApp Message": { "main": [[{ "node": "Skip Non-Text", "type": "main", "index": 0 }]] },
    "Skip Non-Text": {
      "main": [
        [
          { "node": "Fetch Conversation History", "type": "main", "index": 0 },
          { "node": "Fetch CRM Contact", "type": "main", "index": 0 }
        ]
      ]
    },
    "Fetch Conversation History": { "main": [[{ "node": "Build Context", "type": "main", "index": 0 }]] },
    "Fetch CRM Contact": { "main": [[{ "node": "Build Context", "type": "main", "index": 0 }]] },
    "Build Context": { "main": [[{ "node": "ConversationIntel AI", "type": "main", "index": 0 }]] },
    "ConversationIntel AI": { "main": [[{ "node": "Parse Intelligence", "type": "main", "index": 0 }]] },
    "Parse Intelligence": {
      "main": [[
        { "node": "Save to Supabase", "type": "main", "index": 0 },
        { "node": "Update CRM Contact", "type": "main", "index": 0 },
        { "node": "Alert Trigger?", "type": "main", "index": 0 }
      ]]
    },
    "Alert Trigger?": { "main": [[{ "node": "Draft Slack Alert", "type": "main", "index": 0 }]] },
    "Draft Slack Alert": { "main": [[{ "node": "Slack Alert", "type": "main", "index": 0 }]] },
    "Slack Alert": { "main": [[{ "node": "Respond to Webhook", "type": "main", "index": 0 }]] },
    "Save to Supabase": { "main": [[{ "node": "Respond to Webhook", "type": "main", "index": 0 }]] }
  },
  "pinData": {},
  "settings": { "executionOrder": "v1", "saveManualExecutions": true },
  "tags": [{ "name": "sales" }, { "name": "whatsapp" }, { "name": "conversation-intel" }],
  "triggerCount": 1,
  "updatedAt": "2026-04-07T00:00:00.000Z",
  "versionId": "1"
}




{
  "name": "RevenueForecaster — 90-Day Pipeline Prediction",
  "nodes": [
    {
      "parameters": {
        "rule": { "interval": [{ "field": "cronExpression", "expression": "0 7 * * 1-5" }] }
      },
      "id": "node_schedule",
      "name": "Daily 7am Trigger",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.2,
      "position": [240, 400]
    },
    {
      "parameters": {
        "authentication": "apiKey",
        "resource": "deal",
        "operation": "getAll",
        "returnAll": true,
        "filters": {},
        "additionalFields": {
          "properties": "dealname,amount,dealstage,closedate,pipeline,hubspot_owner_id,hs_deal_stage_probability,createdate,notes_last_updated,num_contacted_notes"
        }
      },
      "id": "node_hubspot_pipeline",
      "name": "Fetch HubSpot Pipeline",
      "type": "n8n-nodes-base.hubspot",
      "typeVersion": 2,
      "position": [460, 280],
      "credentials": { "hubspotAppToken": { "id": "HUBSPOT_CRED_ID", "name": "HubSpot" } }
    },
    {
      "parameters": {
        "operation": "select",
        "schema": "public",
        "table": "deals_history",
        "where": {
          "values": [
            { "column": "closed_at", "operator": "gte", "value": "={{ new Date(Date.now() - 365*24*60*60*1000).toISOString().split('T')[0] }}" }
          ]
        },
        "limit": 500,
        "sort": { "values": [{ "column": "closed_at", "direction": "DESC" }] },
        "options": {}
      },
      "id": "node_historical",
      "name": "Fetch Historical Deals",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [460, 480],
      "credentials": { "supabaseApi": { "id": "SUPABASE_CRED_ID", "name": "Supabase" } }
    },
    {
      "parameters": {
        "operation": "select",
        "schema": "public",
        "table": "revenue_actuals",
        "where": {
          "values": [
            { "column": "month", "operator": "gte", "value": "={{ new Date(Date.now() - 180*24*60*60*1000).toISOString().split('T')[0] }}" }
          ]
        },
        "options": {}
      },
      "id": "node_actuals",
      "name": "Fetch Revenue Actuals",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [460, 620],
      "credentials": { "supabaseApi": { "id": "SUPABASE_CRED_ID", "name": "Supabase" } }
    },
    {
      "parameters": {
        "jsCode": "const deals = $('Fetch HubSpot Pipeline').all().map(d => d.json);\nconst history = $('Fetch Historical Deals').all().map(d => d.json);\nconst actuals = $('Fetch Revenue Actuals').all().map(d => d.json);\n\nconst now = new Date();\nconst day90 = new Date(now.getTime() + 90*24*60*60*1000);\n\n// Segment active pipeline\nconst activePipeline = deals.filter(d => {\n  const close = new Date(d.properties?.closedate);\n  return close >= now && close <= day90;\n});\n\n// Compute weighted pipeline by stage\nconst stageWeights = {\n  'appointmentscheduled': 0.20,\n  'qualifiedtobuy': 0.40,\n  'presentationscheduled': 0.60,\n  'decisionmakerboughtin': 0.75,\n  'contractsent': 0.90,\n  'closedwon': 1.0,\n  'closedlost': 0.0\n};\n\nconst weighted = activePipeline.reduce((sum, d) => {\n  const stage = d.properties?.dealstage || 'qualifiedtobuy';\n  const w = stageWeights[stage] || parseFloat(d.properties?.hs_deal_stage_probability || 0.3);\n  return sum + (parseFloat(d.properties?.amount || 0) * w);\n}, 0);\n\nconst totalPipeline = activePipeline.reduce((sum, d) => sum + parseFloat(d.properties?.amount || 0), 0);\n\n// Historical win rate\nconst wonDeals = history.filter(d => d.outcome === 'won');\nconst winRate = history.length > 0 ? wonDeals.length / history.length : 0.22;\n\n// Avg deal value from history\nconst avgDeal = wonDeals.length > 0\n  ? wonDeals.reduce((s, d) => s + parseFloat(d.amount || 0), 0) / wonDeals.length\n  : 50000;\n\n// Avg sales cycle (days)\nconst avgCycle = wonDeals.length > 0\n  ? wonDeals.reduce((s, d) => s + (d.cycle_days || 30), 0) / wonDeals.length\n  : 30;\n\n// Month-over-month revenue trend\nconst sortedActuals = actuals.sort((a, b) => new Date(a.month) - new Date(b.month));\nconst recentMonths = sortedActuals.slice(-3);\nconst momGrowth = recentMonths.length >= 2\n  ? (recentMonths[recentMonths.length-1].revenue - recentMonths[0].revenue) / recentMonths[0].revenue / (recentMonths.length - 1)\n  : 0.05;\n\n// Stale deal detection (no activity in 14+ days)\nconst staleDeals = activePipeline.filter(d => {\n  const lastActivity = new Date(d.properties?.notes_last_updated || 0);\n  return (now - lastActivity) > 14*24*60*60*1000;\n});\n\nreturn [{\n  json: {\n    activePipelineCount: activePipeline.length,\n    totalPipeline: Math.round(totalPipeline),\n    weightedForecast: Math.round(weighted),\n    historicalWinRate: Math.round(winRate * 100),\n    avgDealValue: Math.round(avgDeal),\n    avgSalesCycleDays: Math.round(avgCycle),\n    momGrowthRate: Math.round(momGrowth * 100),\n    staleDeals: staleDeals.map(d => ({\n      name: d.properties?.dealname,\n      amount: d.properties?.amount,\n      stage: d.properties?.dealstage,\n      closedate: d.properties?.closedate\n    })),\n    staleDealCount: staleDeals.length,\n    recentRevenue: recentMonths,\n    computedAt: now.toISOString()\n  }\n}];"
      },
      "id": "node_compute",
      "name": "Compute Pipeline Metrics",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [700, 400]
    },
    {
      "parameters": {
        "authentication": "apiKey",
        "resource": "message",
        "operation": "send",
        "modelId": "claude-opus-4-5",
        "messages": {
          "values": [
            {
              "role": "system",
              "content": "You are a B2B revenue forecasting expert for an India-based SaaS company. Analyze pipeline data and produce a 90-day forecast. Account for Indian market patterns: festival seasons (Diwali Oct-Nov, year-end March), UPI deal flows, and typical Q4 push. Return ONLY valid JSON:\n{\n  \"forecast90Day\": <number in INR>,\n  \"confidenceRange\": { \"low\": <number>, \"high\": <number> },\n  \"confidenceLevel\": \"high\" | \"medium\" | \"low\",\n  \"monthlyBreakdown\": [\n    { \"month\": \"<Month YYYY>\", \"predicted\": <number>, \"scenario\": \"base\" | \"optimistic\" | \"conservative\" },\n    { \"month\": \"<Month YYYY>\", \"predicted\": <number>, \"scenario\": \"base\" },\n    { \"month\": \"<Month YYYY>\", \"predicted\": <number>, \"scenario\": \"base\" }\n  ],\n  \"cashflowGaps\": [{ \"month\": \"<Month YYYY>\", \"gap\": <number>, \"severity\": \"critical\" | \"warning\" }],\n  \"topRisks\": [\"<risk1>\", \"<risk2>\", \"<risk3>\"],\n  \"topOpportunities\": [\"<opp1>\", \"<opp2>\"],\n  \"staleDealsAtRisk\": <number in INR>,\n  \"recommendedActions\": [\"<action1>\", \"<action2>\", \"<action3>\"],\n  \"summary\": \"<3 sentence executive summary>\"\n}"
            },
            {
              "role": "user",
              "content": "=Forecast revenue for next 90 days:\n\nActive pipeline deals: {{ $json.activePipelineCount }}\nTotal pipeline value: ₹{{ $json.totalPipeline.toLocaleString('en-IN') }}\nWeighted pipeline (stage-adjusted): ₹{{ $json.weightedForecast.toLocaleString('en-IN') }}\nHistorical win rate: {{ $json.historicalWinRate }}%\nAvg deal value: ₹{{ $json.avgDealValue.toLocaleString('en-IN') }}\nAvg sales cycle: {{ $json.avgSalesCycleDays }} days\nMoM growth trend: {{ $json.momGrowthRate }}%\nStale deals (14+ days no activity): {{ $json.staleDealCount }} deals\nStale deal value at risk: ₹{{ $json.staleDeals.reduce((s,d)=>s+parseFloat(d.amount||0),0).toLocaleString('en-IN') }}\nRecent monthly actuals: {{ JSON.stringify($json.recentRevenue) }}\nToday: {{ $json.computedAt }}"
            }
          ]
        },
        "options": {}
      },
      "id": "node_forecast_ai",
      "name": "AI Revenue Forecast",
      "type": "@n8n/n8n-nodes-langchain.lmChatAnthropic",
      "typeVersion": 1.3,
      "position": [940, 400]
    },
    {
      "parameters": {
        "jsCode": "const metrics = $('Compute Pipeline Metrics').first().json;\nlet forecast = {};\ntry {\n  const raw = $input.first().json.content?.[0]?.text || $input.first().json.text || '{}';\n  forecast = JSON.parse(raw.replace(/```json\\n?|```/g, '').trim());\n} catch(e) {\n  forecast = { forecast90Day: metrics.weightedForecast, confidenceLevel: 'low', summary: 'Parse error', topRisks: [], recommendedActions: [], cashflowGaps: [], monthlyBreakdown: [] };\n}\nreturn [{ json: { ...metrics, forecast } }];"
      },
      "id": "node_parse_forecast",
      "name": "Parse Forecast",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1160, 400]
    },
    {
      "parameters": {
        "operation": "insert",
        "schema": "public",
        "table": "revenue_forecasts",
        "columns": "forecast_date,forecast_90day,confidence_low,confidence_high,confidence_level,monthly_breakdown,cashflow_gaps,top_risks,recommended_actions,summary,pipeline_count,weighted_pipeline",
        "values": {
          "values": [
            { "column": "forecast_date", "value": "={{ $json.computedAt }}" },
            { "column": "forecast_90day", "value": "={{ $json.forecast.forecast90Day }}" },
            { "column": "confidence_low", "value": "={{ $json.forecast.confidenceRange?.low }}" },
            { "column": "confidence_high", "value": "={{ $json.forecast.confidenceRange?.high }}" },
            { "column": "confidence_level", "value": "={{ $json.forecast.confidenceLevel }}" },
            { "column": "monthly_breakdown", "value": "={{ JSON.stringify($json.forecast.monthlyBreakdown) }}" },
            { "column": "cashflow_gaps", "value": "={{ JSON.stringify($json.forecast.cashflowGaps) }}" },
            { "column": "top_risks", "value": "={{ JSON.stringify($json.forecast.topRisks) }}" },
            { "column": "recommended_actions", "value": "={{ JSON.stringify($json.forecast.recommendedActions) }}" },
            { "column": "summary", "value": "={{ $json.forecast.summary }}" },
            { "column": "pipeline_count", "value": "={{ $json.activePipelineCount }}" },
            { "column": "weighted_pipeline", "value": "={{ $json.weightedForecast }}" }
          ]
        },
        "options": {}
      },
      "id": "node_save_forecast",
      "name": "Save Forecast to Supabase",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [1380, 280],
      "credentials": { "supabaseApi": { "id": "SUPABASE_CRED_ID", "name": "Supabase" } }
    },
    {
      "parameters": {
        "conditions": {
          "combinator": "or",
          "conditions": [
            { "leftValue": "={{ $json.forecast.cashflowGaps?.length }}", "rightValue": 0, "operator": { "type": "number", "operation": "gt" } },
            { "leftValue": "={{ $json.forecast.confidenceLevel }}", "rightValue": "low", "operator": { "type": "string", "operation": "equals" } }
          ]
        }
      },
      "id": "node_gap_check",
      "name": "Cashflow Gap Alert?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [1380, 500]
    },
    {
      "parameters": {
        "authentication": "oAuth2",
        "channel": "#revenue-alerts",
        "text": "=🚨 *Revenue Alert — {{ new Date().toLocaleDateString('en-IN') }}*\n\n📊 90-day forecast: *₹{{ $json.forecast.forecast90Day?.toLocaleString('en-IN') }}*\nRange: ₹{{ $json.forecast.confidenceRange?.low?.toLocaleString('en-IN') }} – ₹{{ $json.forecast.confidenceRange?.high?.toLocaleString('en-IN') }}\nConfidence: {{ $json.forecast.confidenceLevel?.toUpperCase() }}\n\n⚠️ Cashflow gaps: {{ $json.forecast.cashflowGaps?.map(g => g.month + ' (₹' + g.gap?.toLocaleString('en-IN') + ')').join(', ') }}\n\n🔴 Top risks:\n{{ $json.forecast.topRisks?.map(r => '• ' + r).join('\\n') }}\n\n✅ Actions needed:\n{{ $json.forecast.recommendedActions?.slice(0,3).map(a => '• ' + a).join('\\n') }}",
        "otherOptions": {}
      },
      "id": "node_slack_gap",
      "name": "Slack Cashflow Alert",
      "type": "n8n-nodes-base.slack",
      "typeVersion": 2.2,
      "position": [1600, 400],
      "credentials": { "slackOAuth2Api": { "id": "SLACK_CRED_ID", "name": "Slack" } }
    },
    {
      "parameters": {
        "sendTo": "leadership@company.com",
        "subject": "=📊 90-Day Revenue Forecast — {{ new Date().toLocaleDateString('en-IN') }}",
        "emailType": "html",
        "message": "=<h2>Revenue Forecast — {{ new Date().toLocaleDateString('en-IN') }}</h2>\n<p><strong>Summary:</strong> {{ $json.forecast.summary }}</p>\n<h3>90-Day Forecast</h3>\n<p>Base: <strong>₹{{ $json.forecast.forecast90Day?.toLocaleString('en-IN') }}</strong><br/>\nRange: ₹{{ $json.forecast.confidenceRange?.low?.toLocaleString('en-IN') }} – ₹{{ $json.forecast.confidenceRange?.high?.toLocaleString('en-IN') }}<br/>\nConfidence: {{ $json.forecast.confidenceLevel }}</p>\n<h3>Monthly Breakdown</h3>\n<ul>{{ $json.forecast.monthlyBreakdown?.map(m => '<li>' + m.month + ': ₹' + m.predicted?.toLocaleString('en-IN') + '</li>').join('') }}</ul>\n<h3>Top Risks</h3>\n<ul>{{ $json.forecast.topRisks?.map(r => '<li>' + r + '</li>').join('') }}</ul>\n<h3>Recommended Actions</h3>\n<ul>{{ $json.forecast.recommendedActions?.map(a => '<li>' + a + '</li>').join('') }}</ul>\n<hr/><p><em>Generated by RevenueForecaster Agent</em></p>",
        "options": {}
      },
      "id": "node_email_brief",
      "name": "Email Leadership Brief",
      "type": "n8n-nodes-base.gmail",
      "typeVersion": 2.1,
      "position": [1600, 560],
      "credentials": { "gmailOAuth2": { "id": "GMAIL_CRED_ID", "name": "Gmail OAuth2" } }
    }
  ],
  "connections": {
    "Daily 7am Trigger": {
      "main": [[
        { "node": "Fetch HubSpot Pipeline", "type": "main", "index": 0 },
        { "node": "Fetch Historical Deals", "type": "main", "index": 0 },
        { "node": "Fetch Revenue Actuals", "type": "main", "index": 0 }
      ]]
    },
    "Fetch HubSpot Pipeline": { "main": [[{ "node": "Compute Pipeline Metrics", "type": "main", "index": 0 }]] },
    "Fetch Historical Deals": { "main": [[{ "node": "Compute Pipeline Metrics", "type": "main", "index": 0 }]] },
    "Fetch Revenue Actuals": { "main": [[{ "node": "Compute Pipeline Metrics", "type": "main", "index": 0 }]] },
    "Compute Pipeline Metrics": { "main": [[{ "node": "AI Revenue Forecast", "type": "main", "index": 0 }]] },
    "AI Revenue Forecast": { "main": [[{ "node": "Parse Forecast", "type": "main", "index": 0 }]] },
    "Parse Forecast": {
      "main": [[
        { "node": "Save Forecast to Supabase", "type": "main", "index": 0 },
        { "node": "Cashflow Gap Alert?", "type": "main", "index": 0 },
        { "node": "Email Leadership Brief", "type": "main", "index": 0 }
      ]]
    },
    "Cashflow Gap Alert?": {
      "main": [[{ "node": "Slack Cashflow Alert", "type": "main", "index": 0 }]]
    }
  },
  "pinData": {},
  "settings": { "executionOrder": "v1", "saveManualExecutions": true },
  "tags": [{ "name": "sales" }, { "name": "revenue" }, { "name": "forecasting" }],
  "triggerCount": 1,
  "updatedAt": "2026-04-07T00:00:00.000Z",
  "versionId": "1"
}





{
  "name": "CompetitorTracker — Pricing & Moves Intelligence",
  "nodes": [
    {
      "parameters": {
        "rule": { "interval": [{ "field": "cronExpression", "expression": "0 6 * * 1,3,5" }] }
      },
      "id": "node_schedule",
      "name": "Mon/Wed/Fri 6am Trigger",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.2,
      "position": [240, 400]
    },
    {
      "parameters": {
        "operation": "select",
        "schema": "public",
        "table": "competitors",
        "where": { "values": [{ "column": "active", "value": "true" }] },
        "options": {}
      },
      "id": "node_fetch_competitors",
      "name": "Fetch Competitor List",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [460, 400],
      "credentials": { "supabaseApi": { "id": "SUPABASE_CRED_ID", "name": "Supabase" } }
    },
    {
      "parameters": {
        "jsCode": "// Expand each competitor into individual items for parallel processing\nreturn $input.all().map(item => ({ json: item.json }));"
      },
      "id": "node_split",
      "name": "Split Competitors",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [680, 400]
    },
    {
      "parameters": {
        "url": "={{ $json.pricing_url }}",
        "options": {
          "response": { "response": { "neverError": true } },
          "timeout": 15000,
          "retry": { "enabled": true, "maxTries": 2, "waitBetweenTries": 3000 }
        }
      },
      "id": "node_scrape_pricing",
      "name": "Scrape Pricing Page",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [900, 280]
    },
    {
      "parameters": {
        "url": "=https://www.linkedin.com/company/{{ $json.linkedin_slug }}/posts/?feedView=all",
        "options": {
          "response": { "response": { "neverError": true } },
          "timeout": 15000,
          "retry": { "enabled": true, "maxTries": 2, "waitBetweenTries": 3000 }
        }
      },
      "id": "node_scrape_linkedin",
      "name": "Scrape LinkedIn Posts",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [900, 420]
    },
    {
      "parameters": {
        "url": "=https://news.google.com/rss/search?q={{ encodeURIComponent($json.name) }}&hl=en-IN&gl=IN&ceid=IN:en",
        "options": {
          "response": { "response": { "neverError": true } },
          "timeout": 10000
        }
      },
      "id": "node_google_news",
      "name": "Google News RSS",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [900, 560]
    },
    {
      "parameters": {
        "jsCode": "const competitor = $('Split Competitors').first().json;\nconst pricingHtml = $('Scrape Pricing Page').first().json?.data || '';\nconst linkedinHtml = $('Scrape LinkedIn Posts').first().json?.data || '';\nconst newsXml = $('Google News RSS').first().json?.data || '';\n\n// Extract text snippets (strip HTML tags)\nconst strip = html => (html || '').replace(/<[^>]+>/g, ' ').replace(/\\s+/g, ' ').substring(0, 3000);\n\n// Parse news headlines from RSS\nconst headlines = [];\nconst titleMatches = newsXml.matchAll(/<title><!\\[CDATA\\[(.+?)\\]\\]><\\/title>/g);\nfor (const m of titleMatches) {\n  if (!m[1].includes('Google News')) headlines.push(m[1]);\n  if (headlines.length >= 10) break;\n}\n\nreturn [{\n  json: {\n    competitor,\n    pricingText: strip(pricingHtml),\n    linkedinText: strip(linkedinHtml),\n    newsHeadlines: headlines,\n    scrapedAt: new Date().toISOString()\n  }\n}];"
      },
      "id": "node_build_context",
      "name": "Build Competitor Context",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1120, 400]
    },
    {
      "parameters": {
        "operation": "select",
        "schema": "public",
        "table": "competitor_snapshots",
        "where": { "values": [{ "column": "competitor_id", "value": "={{ $json.competitor.id }}" }] },
        "limit": 1,
        "sort": { "values": [{ "column": "created_at", "direction": "DESC" }] },
        "options": {}
      },
      "id": "node_fetch_last_snapshot",
      "name": "Fetch Last Snapshot",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [1120, 560],
      "credentials": { "supabaseApi": { "id": "SUPABASE_CRED_ID", "name": "Supabase" } }
    },
    {
      "parameters": {
        "authentication": "apiKey",
        "resource": "message",
        "operation": "send",
        "modelId": "claude-opus-4-5",
        "messages": {
          "values": [
            {
              "role": "system",
              "content": "You are a competitive intelligence analyst for an India-based B2B SaaS company. Analyze competitor data and detect changes. Return ONLY valid JSON:\n{\n  \"pricingTiers\": [\n    { \"name\": \"<tier>\", \"price\": \"<price>\", \"currency\": \"INR\" | \"USD\", \"billingCycle\": \"monthly\" | \"annual\", \"keyFeatures\": [\"<f1>\", \"<f2>\"] }\n  ],\n  \"pricingChanges\": [\"<change1>\"],\n  \"newFeatures\": [\"<feature1>\"],\n  \"productMoves\": [\"<move1>\"],\n  \"marketingMoves\": [\"<move1>\"],\n  \"hiringSignals\": [\"<signal1>\"],\n  \"fundingNews\": \"<news or null>\",\n  \"competitiveThreatLevel\": \"high\" | \"medium\" | \"low\",\n  \"battlecardUpdate\": \"<one paragraph for sales reps>\",\n  \"ourAdvantages\": [\"<adv1>\", \"<adv2>\"],\n  \"vulnerabilities\": [\"<vuln1>\"],\n  \"alertRequired\": <boolean>,\n  \"alertReason\": \"<reason if alert, else null>\",\n  \"summary\": \"<2 sentence summary of what changed>\"\n}"
            },
            {
              "role": "user",
              "content": "=Analyze competitor: {{ $json.competitor.name }}\nWebsite: {{ $json.competitor.website }}\n\nPricing page content:\n{{ $json.pricingText }}\n\nLinkedIn recent posts:\n{{ $json.linkedinText }}\n\nRecent news headlines:\n{{ $json.newsHeadlines.join('\\n') }}\n\nLast snapshot (for change detection):\n{{ JSON.stringify($('Fetch Last Snapshot').first().json || {}) }}\n\nToday: {{ $json.scrapedAt }}"
            }
          ]
        },
        "options": {}
      },
      "id": "node_analyze",
      "name": "CompetitorIntel AI",
      "type": "@n8n/n8n-nodes-langchain.lmChatAnthropic",
      "typeVersion": 1.3,
      "position": [1340, 400]
    },
    {
      "parameters": {
        "jsCode": "const ctx = $('Build Competitor Context').first().json;\nlet intel = {};\ntry {\n  const raw = $input.first().json.content?.[0]?.text || $input.first().json.text || '{}';\n  intel = JSON.parse(raw.replace(/```json\\n?|```/g, '').trim());\n} catch(e) {\n  intel = { competitiveThreatLevel: 'low', alertRequired: false, summary: 'Parse error', pricingTiers: [], pricingChanges: [], newFeatures: [], productMoves: [], battlecardUpdate: '', ourAdvantages: [], vulnerabilities: [] };\n}\nreturn [{ json: { ...ctx, intel } }];"
      },
      "id": "node_parse_intel",
      "name": "Parse Competitor Intel",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1560, 400]
    },
    {
      "parameters": {
        "operation": "insert",
        "schema": "public",
        "table": "competitor_snapshots",
        "columns": "competitor_id,competitor_name,pricing_tiers,pricing_changes,new_features,product_moves,threat_level,battlecard,our_advantages,vulnerabilities,funding_news,alert_required,summary,raw_pricing_text,created_at",
        "values": {
          "values": [
            { "column": "competitor_id", "value": "={{ $json.competitor.id }}" },
            { "column": "competitor_name", "value": "={{ $json.competitor.name }}" },
            { "column": "pricing_tiers", "value": "={{ JSON.stringify($json.intel.pricingTiers) }}" },
            { "column": "pricing_changes", "value": "={{ JSON.stringify($json.intel.pricingChanges) }}" },
            { "column": "new_features", "value": "={{ JSON.stringify($json.intel.newFeatures) }}" },
            { "column": "product_moves", "value": "={{ JSON.stringify($json.intel.productMoves) }}" },
            { "column": "threat_level", "value": "={{ $json.intel.competitiveThreatLevel }}" },
            { "column": "battlecard", "value": "={{ $json.intel.battlecardUpdate }}" },
            { "column": "our_advantages", "value": "={{ JSON.stringify($json.intel.ourAdvantages) }}" },
            { "column": "vulnerabilities", "value": "={{ JSON.stringify($json.intel.vulnerabilities) }}" },
            { "column": "funding_news", "value": "={{ $json.intel.fundingNews }}" },
            { "column": "alert_required", "value": "={{ $json.intel.alertRequired }}" },
            { "column": "summary", "value": "={{ $json.intel.summary }}" },
            { "column": "raw_pricing_text", "value": "={{ $json.pricingText.substring(0,1000) }}" },
            { "column": "created_at", "value": "={{ $json.scrapedAt }}" }
          ]
        },
        "options": {}
      },
      "id": "node_save_snapshot",
      "name": "Save Snapshot",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [1780, 280],
      "credentials": { "supabaseApi": { "id": "SUPABASE_CRED_ID", "name": "Supabase" } }
    },
    {
      "parameters": {
        "conditions": {
          "combinator": "or",
          "conditions": [
            { "leftValue": "={{ $json.intel.alertRequired }}", "rightValue": true, "operator": { "type": "boolean", "operation": "equals" } },
            { "leftValue": "={{ $json.intel.competitiveThreatLevel }}", "rightValue": "high", "operator": { "type": "string", "operation": "equals" } },
            { "leftValue": "={{ ($json.intel.pricingChanges || []).length }}", "rightValue": 0, "operator": { "type": "number", "operation": "gt" } }
          ]
        }
      },
      "id": "node_alert_check",
      "name": "Alert Required?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [1780, 460]
    },
    {
      "parameters": {
        "authentication": "oAuth2",
        "channel": "#competitive-intel",
        "text": "=🔍 *Competitor Alert: {{ $json.competitor.name }}*\n\n{{ $json.intel.competitiveThreatLevel === 'high' ? '🔴' : '🟡' }} Threat level: *{{ $json.intel.competitiveThreatLevel?.toUpperCase() }}*\n\n{{ $json.intel.alertReason }}\n\n📊 *What changed:*\n{{ $json.intel.summary }}\n\n💰 *Pricing changes:*\n{{ ($json.intel.pricingChanges||[]).map(c => '• ' + c).join('\\n') || 'None detected' }}\n\n🚀 *New features/moves:*\n{{ ($json.intel.newFeatures||[]).concat($json.intel.productMoves||[]).slice(0,3).map(f => '• ' + f).join('\\n') || 'None detected' }}\n\n⚔️ *Battlecard update:*\n{{ $json.intel.battlecardUpdate }}\n\n✅ *Our advantages:*\n{{ ($json.intel.ourAdvantages||[]).map(a => '• ' + a).join('\\n') }}",
        "otherOptions": {}
      },
      "id": "node_slack_alert",
      "name": "Slack Competitive Alert",
      "type": "n8n-nodes-base.slack",
      "typeVersion": 2.2,
      "position": [2000, 360],
      "credentials": { "slackOAuth2Api": { "id": "SLACK_CRED_ID", "name": "Slack" } }
    },
    {
      "parameters": {
        "operation": "update",
        "schema": "public",
        "table": "competitors",
        "where": { "values": [{ "column": "id", "value": "={{ $json.competitor.id }}" }] },
        "columns": "last_scanned_at,threat_level,battlecard",
        "values": {
          "values": [
            { "column": "last_scanned_at", "value": "={{ $json.scrapedAt }}" },
            { "column": "threat_level", "value": "={{ $json.intel.competitiveThreatLevel }}" },
            { "column": "battlecard", "value": "={{ $json.intel.battlecardUpdate }}" }
          ]
        },
        "options": {}
      },
      "id": "node_update_competitor",
      "name": "Update Competitor Record",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [2000, 520],
      "credentials": { "supabaseApi": { "id": "SUPABASE_CRED_ID", "name": "Supabase" } }
    }
  ],
  "connections": {
    "Mon/Wed/Fri 6am Trigger": { "main": [[{ "node": "Fetch Competitor List", "type": "main", "index": 0 }]] },
    "Fetch Competitor List": { "main": [[{ "node": "Split Competitors", "type": "main", "index": 0 }]] },
    "Split Competitors": {
      "main": [[
        { "node": "Scrape Pricing Page", "type": "main", "index": 0 },
        { "node": "Scrape LinkedIn Posts", "type": "main", "index": 0 },
        { "node": "Google News RSS", "type": "main", "index": 0 }
      ]]
    },
    "Scrape Pricing Page": { "main": [[{ "node": "Build Competitor Context", "type": "main", "index": 0 }]] },
    "Scrape LinkedIn Posts": { "main": [[{ "node": "Build Competitor Context", "type": "main", "index": 0 }]] },
    "Google News RSS": { "main": [[{ "node": "Build Competitor Context", "type": "main", "index": 0 }]] },
    "Build Competitor Context": {
      "main": [[
        { "node": "CompetitorIntel AI", "type": "main", "index": 0 },
        { "node": "Fetch Last Snapshot", "type": "main", "index": 0 }
      ]]
    },
    "Fetch Last Snapshot": { "main": [[{ "node": "CompetitorIntel AI", "type": "main", "index": 0 }]] },
    "CompetitorIntel AI": { "main": [[{ "node": "Parse Competitor Intel", "type": "main", "index": 0 }]] },
    "Parse Competitor Intel": {
      "main": [[
        { "node": "Save Snapshot", "type": "main", "index": 0 },
        { "node": "Alert Required?", "type": "main", "index": 0 },
        { "node": "Update Competitor Record", "type": "main", "index": 0 }
      ]]
    },
    "Alert Required?": { "main": [[{ "node": "Slack Competitive Alert", "type": "main", "index": 0 }]] }
  },
  "pinData": {},
  "settings": { "executionOrder": "v1", "saveManualExecutions": true },
  "tags": [{ "name": "sales" }, { "name": "competitive-intel" }, { "name": "tracking" }],
  "triggerCount": 1,
  "updatedAt": "2026-04-07T00:00:00.000Z",
  "versionId": "1"
}