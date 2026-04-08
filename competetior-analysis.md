# Competitor Analysis — diyaa.ai vs Market

## Overview
Analysis of key competitors in AI agent/automation space for Indian SMBs.

## Primary Competitors

### 1. actionagents.io
```
✅ Pros:
├── $50/mo per agent (low price)
├── 449 skills marketplace
├── Simple single-agent UX
├── Marketing templates (Cold Outreach, LinkedIn)

❌ Cons:
├── Single-agent only (no orchestration)
├── Marketing focus only
├── No India customization
├── Low LTV ($50/mo)
```

### 2. n8n / Make.com / Zapier
```
✅ Pros:
├── No-code workflows
├── 1000+ integrations
├── Visual builder

❌ Cons:
├── Non-technical users struggle
├── No AI agents
├── Expensive for SMBs ($20-100/mo)
├── No India-first features
```

## diyaa.ai Advantages
| Feature | diyaa.ai | actionagents | n8n/Zapier |
|---------|----------|-------------|------------|
| Multi-Agent | ✅ | ❌ | ❌ |
| India-First | ✅ WhatsApp/UPI | ❌ | ❌ |
| Price | ₹4,999 (high LTV) | ₹50 (low LTV) | ₹2,000+ |
| Biz Interview | ✅ AI Config | ❌ Static | ❌ Manual |
| Operational Focus | ✅ ₹50L leakage | ❌ Marketing | ❌ Generic |

## Market Gap Opportunity
**₹1,000Cr TAM**: Indian SMBs with operational leakage (no good solution exists).

**Position**: "AI employees that actually run your operations, not just marketing automation."

**Win Condition**: 100 customers @ ₹4,999/mo = ₹60L ARR (Month 3 goal).

**Moat**: Multi-agent orchestration + India-native channels (un-copyable).
{
  "name": "🕵️ Competitor Intelligence Agent — 10/10",
  "nodes": [

    {
      "parameters": { "rule": { "interval": [{ "field": "hours", "hoursInterval": 6 }] } },
      "id": "1", "name": "Schedule — Every 6 Hours",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.2, "position": [100, 200]
    },
    {
      "parameters": {},
      "id": "2", "name": "Manual Trigger",
      "type": "n8n-nodes-base.manualTrigger",
      "typeVersion": 1, "position": [100, 360]
    },
    {
      "parameters": { "mode": "passThrough", "output": "input1" },
      "id": "3", "name": "Merge Triggers",
      "type": "n8n-nodes-base.merge",
      "typeVersion": 3, "position": [300, 280]
    },

    {
      "parameters": {
        "jsCode": "// Load competitor config from n8n variables\n// Edit COMPETITOR_CONFIG in n8n Variables to add/remove competitors\nconst raw = $vars.COMPETITOR_CONFIG || '[]';\nlet competitors;\ntry {\n  competitors = JSON.parse(raw);\n} catch(e) {\n  // Default example competitors\n  competitors = [\n    {\n      name: 'Competitor A',\n      pricing_url: 'https://competitorA.com/pricing',\n      features_url: 'https://competitorA.com/features',\n      rss_url: 'https://competitorA.com/blog/rss.xml',\n      meta_page_id: '123456789',\n      website: 'competitorA.com'\n    },\n    {\n      name: 'Competitor B',\n      pricing_url: 'https://competitorB.com/pricing',\n      features_url: 'https://competitorB.com/product',\n      rss_url: 'https://competitorB.com/feed',\n      meta_page_id: '987654321',\n      website: 'competitorB.com'\n    }\n  ];\n}\nreturn competitors.map(c => ({ json: { ...c, run_id: `run-${Date.now()}`, run_at: new Date().toISOString() } }));"
      },
      "id": "4", "name": "Load Competitor Config",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2, "position": [500, 280]
    },

    {
      "parameters": { "batchSize": 1, "options": {} },
      "id": "5", "name": "Loop: For Each Competitor",
      "type": "n8n-nodes-base.splitInBatches",
      "typeVersion": 3, "position": [700, 280]
    },

    {
      "parameters": {
        "url": "={{ $json.pricing_url }}",
        "options": {
          "timeout": 15000,
          "retry": { "enabled": true, "maxTries": 3, "waitBetweenTries": 3000 }
        }
      },
      "id": "6", "name": "Scrape: Pricing Page",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2, "position": [940, 80],
      "onError": "continueErrorOutput"
    },
    {
      "parameters": {
        "url": "={{ $('Loop: For Each Competitor').item.json.features_url }}",
        "options": {
          "timeout": 15000,
          "retry": { "enabled": true, "maxTries": 3, "waitBetweenTries": 3000 }
        }
      },
      "id": "7", "name": "Scrape: Features Page",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2, "position": [940, 220],
      "onError": "continueErrorOutput"
    },
    {
      "parameters": {
        "url": "={{ $('Loop: For Each Competitor').item.json.rss_url }}",
        "options": {
          "timeout": 15000,
          "retry": { "enabled": true, "maxTries": 3, "waitBetweenTries": 3000 }
        }
      },
      "id": "8", "name": "Fetch: RSS / Blog Feed",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2, "position": [940, 360],
      "onError": "continueErrorOutput"
    },
    {
      "parameters": {
        "url": "=https://graph.facebook.com/v19.0/ads_archive?access_token={{ $vars.META_ACCESS_TOKEN }}&ad_reached_countries=['IN']&search_page_ids={{ $('Loop: For Each Competitor').item.json.meta_page_id }}&ad_active_status=ACTIVE&fields=id,ad_creative_body,ad_creative_link_title,ad_delivery_start_time,impressions&limit=10",
        "options": {
          "timeout": 15000,
          "retry": { "enabled": true, "maxTries": 2, "waitBetweenTries": 2000 }
        }
      },
      "id": "9", "name": "Fetch: Meta Ad Library",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2, "position": [940, 500],
      "onError": "continueErrorOutput"
    },

    {
      "parameters": {
        "jsCode": "const crypto = require('crypto');\nconst competitor = $('Loop: For Each Competitor').item.json;\n\n// Get scraped content\nconst pricingBody = $('Scrape: Pricing Page').item?.json?.data || $('Scrape: Pricing Page').item?.json?.body || '';\nconst featuresBody = $('Scrape: Features Page').item?.json?.data || $('Scrape: Features Page').item?.json?.body || '';\nconst rssBody = $('Fetch: RSS / Blog Feed').item?.json?.data || $('Fetch: RSS / Blog Feed').item?.json?.body || '';\nconst adsData = $('Fetch: Meta Ad Library').item?.json?.data || [];\n\n// Clean HTML to plain text (basic)\nconst clean = (html) => String(html).replace(/<[^>]+>/g, ' ').replace(/\\s+/g, ' ').trim().substring(0, 8000);\n\nconst pricingText = clean(pricingBody);\nconst featuresText = clean(featuresBody);\nconst rssText = clean(rssBody);\nconst adsText = JSON.stringify(adsData).substring(0, 3000);\n\n// Compute content hashes for deduplication\nconst hash = (s) => crypto.createHash('md5').update(s).digest('hex');\nconst pricingHash = hash(pricingText);\nconst featuresHash = hash(featuresText);\nconst rssHash = hash(rssText);\nconst adsHash = hash(adsText);\n\n// Check stored hashes (stored in static data)\nconst stored = $getWorkflowStaticData('global');\nconst key = competitor.name.replace(/\\s/g, '_').toLowerCase();\n\nconst prevPricingHash = stored[`${key}_pricing_hash`] || '';\nconst prevFeaturesHash = stored[`${key}_features_hash`] || '';\nconst prevRssHash = stored[`${key}_rss_hash`] || '';\nconst prevAdsHash = stored[`${key}_ads_hash`] || '';\n\nconst pricingChanged = pricingHash !== prevPricingHash;\nconst featuresChanged = featuresHash !== prevFeaturesHash;\nconst contentChanged = rssHash !== prevRssHash;\nconst adsChanged = adsHash !== prevAdsHash;\nconst anythingChanged = pricingChanged || featuresChanged || contentChanged || adsChanged;\n\n// Update stored hashes\nstored[`${key}_pricing_hash`] = pricingHash;\nstored[`${key}_features_hash`] = featuresHash;\nstored[`${key}_rss_hash`] = rssHash;\nstored[`${key}_ads_hash`] = adsHash;\n\nreturn [{\n  json: {\n    competitor,\n    pricingText,\n    featuresText,\n    rssText,\n    adsText,\n    adsData,\n    pricingChanged,\n    featuresChanged,\n    contentChanged,\n    adsChanged,\n    anythingChanged,\n    run_at: competitor.run_at\n  }\n}];"
      },
      "id": "10", "name": "Hash Check + Dedup",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2, "position": [1160, 280]
    },

    {
      "parameters": {
        "conditions": {
          "conditions": [
            { "leftValue": "={{ $json.anythingChanged }}", "rightValue": true, "operator": { "type": "boolean", "operation": "true" } }
          ]
        }
      },
      "id": "11", "name": "Skip If Nothing Changed",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2, "position": [1360, 280]
    },

    {
      "parameters": {
        "model": "claude-sonnet-4-20250514",
        "messages": {
          "values": [
            {
              "role": "user",
              "content": "=You are a competitive intelligence analyst.\n\nAnalyze the following data for competitor: {{ $json.competitor.name }}\nWebsite: {{ $json.competitor.website }}\nRun Time: {{ $json.run_at }}\n\n---\n🏷️ PRICING PAGE CONTENT:\n{{ $json.pricingText.substring(0, 2000) }}\n\n---\n🔧 FEATURES PAGE CONTENT:\n{{ $json.featuresText.substring(0, 2000) }}\n\n---\n📝 BLOG / CONTENT FEED:\n{{ $json.rssText.substring(0, 1500) }}\n\n---\n📢 ACTIVE ADS DATA:\n{{ $json.adsText.substring(0, 1000) }}\n\n---\nCHANGES DETECTED:\n- Pricing changed: {{ $json.pricingChanged }}\n- Features changed: {{ $json.featuresChanged }}\n- Content changed: {{ $json.contentChanged }}\n- Ads changed: {{ $json.adsChanged }}\n\nAnalyze all of the above and respond ONLY in valid JSON:\n{\n  \"competitor_name\": \"...\",\n  \"threat_level\": \"LOW|MEDIUM|HIGH|CRITICAL\",\n  \"threat_score\": 7,\n  \"threat_reason\": \"...\",\n  \"pricing\": {\n    \"changed\": true,\n    \"tiers\": [{\"name\": \"Starter\", \"price\": \"$29/mo\", \"features\": [\"...\"]}, {\"name\": \"Pro\", \"price\": \"$99/mo\", \"features\": [\"...\"]}],\n    \"key_change\": \"Reduced Pro plan from $149 to $99\",\n    \"strategic_signal\": \"Aggressive pricing to capture mid-market\",\n    \"our_advantage\": \"We offer more integrations at same price point\"\n  },\n  \"features\": {\n    \"changed\": true,\n    \"new_features\": [\"AI assistant\", \"Mobile app\"],\n    \"removed_features\": [],\n    \"key_change\": \"Launched native mobile app\",\n    \"strategic_signal\": \"Targeting mobile-first users\",\n    \"our_advantage\": \"Our mobile app has been live for 2 years\"\n  },\n  \"content\": {\n    \"changed\": true,\n    \"latest_posts\": [{\"title\": \"...\", \"topic\": \"...\", \"date\": \"...\"}],\n    \"content_themes\": [\"AI\", \"automation\", \"SMB\"],\n    \"strategic_signal\": \"Targeting SMB market with AI content\"\n  },\n  \"ads\": {\n    \"changed\": true,\n    \"active_ad_count\": 5,\n    \"ad_themes\": [\"Free trial\", \"vs competitors\"],\n    \"key_message\": \"30-day free trial, no credit card\",\n    \"strategic_signal\": \"Heavy acquisition push with free trial offer\"\n  },\n  \"battle_card_summary\": \"2-3 sentence battle card summary for sales team\",\n  \"recommended_actions\": [\"Action 1\", \"Action 2\", \"Action 3\"]\n}"
            }
          ]
        },
        "options": { "maxTokens": 1500, "temperature": 0.2 }
      },
      "id": "12", "name": "Claude: Full Intelligence Analysis",
      "type": "@n8n/n8n-nodes-langchain.lmChatAnthropic",
      "typeVersion": 1, "position": [1580, 280],
      "credentials": { "anthropicApi": { "id": "2", "name": "Anthropic Claude" } }
    },

    {
      "parameters": {
        "jsCode": "const raw = $input.first().json.text || $input.first().json.content?.[0]?.text || '{}';\nlet analysis;\ntry {\n  const clean = raw.replace(/```json|```/g, '').trim();\n  const match = clean.match(/\\{[\\s\\S]*\\}/);\n  analysis = JSON.parse(match ? match[0] : clean);\n} catch(e) {\n  analysis = {\n    competitor_name: $('Hash Check + Dedup').item.json.competitor.name,\n    threat_level: 'UNKNOWN',\n    threat_score: 0,\n    threat_reason: 'AI parse error: ' + e.message,\n    pricing: { changed: false, tiers: [], key_change: 'Parse error', strategic_signal: '', our_advantage: '' },\n    features: { changed: false, new_features: [], key_change: 'Parse error', strategic_signal: '', our_advantage: '' },\n    content: { changed: false, latest_posts: [], content_themes: [], strategic_signal: '' },\n    ads: { changed: false, active_ad_count: 0, ad_themes: [], key_message: '', strategic_signal: '' },\n    battle_card_summary: 'Analysis failed — manual review needed',\n    recommended_actions: ['Review competitor manually']\n  };\n}\n\nconst ctx = $('Hash Check + Dedup').item.json;\nconst threatEmoji = { LOW: '🟢', MEDIUM: '🟡', HIGH: '🔴', CRITICAL: '🚨', UNKNOWN: '⚪' };\n\nreturn [{\n  json: {\n    ...analysis,\n    competitor: ctx.competitor,\n    run_at: ctx.run_at,\n    pricingChanged: ctx.pricingChanged,\n    featuresChanged: ctx.featuresChanged,\n    contentChanged: ctx.contentChanged,\n    adsChanged: ctx.adsChanged,\n    anythingChanged: ctx.anythingChanged,\n    threat_emoji: threatEmoji[analysis.threat_level] || '⚪',\n    timestamp: new Date().toISOString()\n  }\n}];"
      },
      "id": "13", "name": "Parse Intelligence Output",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2, "position": [1780, 280]
    },

    {
      "parameters": {
        "operation": "upsert",
        "documentId": "={{ $vars.GOOGLE_SHEET_ID }}",
        "sheetName": "battle_cards",
        "columns": {
          "mappingMode": "defineBelow",
          "value": {
            "Competitor": "={{ $json.competitor_name }}",
            "Threat Level": "={{ $json.threat_emoji }} {{ $json.threat_level }}",
            "Threat Score": "={{ $json.threat_score }}/10",
            "Threat Reason": "={{ $json.threat_reason }}",
            "Pricing Summary": "={{ $json.pricing?.key_change || 'No change' }}",
            "Pricing Tiers": "={{ JSON.stringify($json.pricing?.tiers || []) }}",
            "Our Pricing Advantage": "={{ $json.pricing?.our_advantage || '' }}",
            "New Features": "={{ ($json.features?.new_features || []).join(', ') }}",
            "Features Signal": "={{ $json.features?.strategic_signal || '' }}",
            "Our Feature Advantage": "={{ $json.features?.our_advantage || '' }}",
            "Content Themes": "={{ ($json.content?.content_themes || []).join(', ') }}",
            "Content Signal": "={{ $json.content?.strategic_signal || '' }}",
            "Active Ads": "={{ $json.ads?.active_ad_count || 0 }}",
            "Ad Key Message": "={{ $json.ads?.key_message || '' }}",
            "Ads Signal": "={{ $json.ads?.strategic_signal || '' }}",
            "Battle Card Summary": "={{ $json.battle_card_summary }}",
            "Recommended Actions": "={{ ($json.recommended_actions || []).join(' | ') }}",
            "Last Updated": "={{ $json.timestamp }}",
            "Pricing Changed": "={{ $json.pricingChanged }}",
            "Features Changed": "={{ $json.featuresChanged }}",
            "Content Changed": "={{ $json.contentChanged }}",
            "Ads Changed": "={{ $json.adsChanged }}"
          }
        },
        "options": { "upsertKeys": "Competitor" }
      },
      "id": "14", "name": "Sheets: Update Battle Cards",
      "type": "n8n-nodes-base.googleSheets",
      "typeVersion": 4.5, "position": [2000, 80],
      "credentials": { "googleSheetsOAuth2Api": { "id": "5", "name": "Google Sheets" } }
    },

    {
      "parameters": {
        "operation": "append",
        "documentId": "={{ $vars.GOOGLE_SHEET_ID }}",
        "sheetName": "pricing_history",
        "columns": {
          "mappingMode": "defineBelow",
          "value": {
            "Timestamp": "={{ $json.timestamp }}",
            "Competitor": "={{ $json.competitor_name }}",
            "Changed": "={{ $json.pricingChanged }}",
            "Tiers Snapshot": "={{ JSON.stringify($json.pricing?.tiers || []) }}",
            "Key Change": "={{ $json.pricing?.key_change || 'No change' }}",
            "Strategic Signal": "={{ $json.pricing?.strategic_signal || '' }}",
            "Our Advantage": "={{ $json.pricing?.our_advantage || '' }}",
            "Threat Level": "={{ $json.threat_level }}"
          }
        },
        "options": {}
      },
      "id": "15", "name": "Sheets: Log Pricing History",
      "type": "n8n-nodes-base.googleSheets",
      "typeVersion": 4.5, "position": [2000, 220],
      "credentials": { "googleSheetsOAuth2Api": { "id": "5", "name": "Google Sheets" } }
    },

    {
      "parameters": {
        "operation": "append",
        "documentId": "={{ $vars.GOOGLE_SHEET_ID }}",
        "sheetName": "content_feed",
        "columns": {
          "mappingMode": "defineBelow",
          "value": {
            "Timestamp": "={{ $json.timestamp }}",
            "Competitor": "={{ $json.competitor_name }}",
            "Latest Posts": "={{ JSON.stringify($json.content?.latest_posts || []) }}",
            "Content Themes": "={{ ($json.content?.content_themes || []).join(', ') }}",
            "Strategic Signal": "={{ $json.content?.strategic_signal || '' }}"
          }
        },
        "options": {}
      },
      "id": "16", "name": "Sheets: Log Content Feed",
      "type": "n8n-nodes-base.googleSheets",
      "typeVersion": 4.5, "position": [2000, 360],
      "credentials": { "googleSheetsOAuth2Api": { "id": "5", "name": "Google Sheets" } }
    },

    {
      "parameters": {
        "operation": "append",
        "documentId": "={{ $vars.GOOGLE_SHEET_ID }}",
        "sheetName": "ads_tracker",
        "columns": {
          "mappingMode": "defineBelow",
          "value": {
            "Timestamp": "={{ $json.timestamp }}",
            "Competitor": "={{ $json.competitor_name }}",
            "Active Ad Count": "={{ $json.ads?.active_ad_count || 0 }}",
            "Ad Themes": "={{ ($json.ads?.ad_themes || []).join(', ') }}",
            "Key Message": "={{ $json.ads?.key_message || '' }}",
            "Strategic Signal": "={{ $json.ads?.strategic_signal || '' }}",
            "Changed": "={{ $json.adsChanged }}"
          }
        },
        "options": {}
      },
      "id": "17", "name": "Sheets: Log Ads Tracker",
      "type": "n8n-nodes-base.googleSheets",
      "typeVersion": 4.5, "position": [2000, 500],
      "credentials": { "googleSheetsOAuth2Api": { "id": "5", "name": "Google Sheets" } }
    },

    {
      "parameters": {
        "operation": "append",
        "documentId": "={{ $vars.GOOGLE_SHEET_ID }}",
        "sheetName": "change_log",
        "columns": {
          "mappingMode": "defineBelow",
          "value": {
            "Timestamp": "={{ $json.timestamp }}",
            "Competitor": "={{ $json.competitor_name }}",
            "Threat Level": "={{ $json.threat_emoji }} {{ $json.threat_level }}",
            "Threat Score": "={{ $json.threat_score }}",
            "Pricing Changed": "={{ $json.pricingChanged }}",
            "Features Changed": "={{ $json.featuresChanged }}",
            "Content Changed": "={{ $json.contentChanged }}",
            "Ads Changed": "={{ $json.adsChanged }}",
            "Battle Card Summary": "={{ $json.battle_card_summary }}",
            "Recommended Actions": "={{ ($json.recommended_actions || []).join(' | ') }}",
            "Threat Reason": "={{ $json.threat_reason }}"
          }
        },
        "options": {}
      },
      "id": "18", "name": "Sheets: Append Change Log",
      "type": "n8n-nodes-base.googleSheets",
      "typeVersion": 4.5, "position": [2000, 640],
      "credentials": { "googleSheetsOAuth2Api": { "id": "5", "name": "Google Sheets" } }
    },

    {
      "parameters": {
        "conditions": {
          "conditions": [
            { "leftValue": "={{ $json.threat_score }}", "rightValue": 5, "operator": { "type": "number", "operation": "gte" } }
          ]
        }
      },
      "id": "19", "name": "Threat Score ≥ 5?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2, "position": [2220, 280]
    },

    {
      "parameters": {
        "method": "POST",
        "url": "={{ $vars.SLACK_WEBHOOK_URL }}",
        "sendBody": true,
        "contentType": "json",
        "body": "={\n  \"text\": \"{{ $json.threat_emoji }} *Competitor Alert: {{ $json.competitor_name }}*\",\n  \"blocks\": [\n    {\n      \"type\": \"header\",\n      \"text\": { \"type\": \"plain_text\", \"text\": \"{{ $json.threat_emoji }} Competitor Intel: {{ $json.competitor_name }}\" }\n    },\n    {\n      \"type\": \"section\",\n      \"fields\": [\n        { \"type\": \"mrkdwn\", \"text\": \"*Threat Level:*\\n{{ $json.threat_level }} ({{ $json.threat_score }}/10)\" },\n        { \"type\": \"mrkdwn\", \"text\": \"*Detected At:*\\n{{ $json.timestamp }}\" },\n        { \"type\": \"mrkdwn\", \"text\": \"*Pricing Changed:*\\n{{ $json.pricingChanged ? '✅ Yes' : '❌ No' }}\" },\n        { \"type\": \"mrkdwn\", \"text\": \"*Features Changed:*\\n{{ $json.featuresChanged ? '✅ Yes' : '❌ No' }}\" },\n        { \"type\": \"mrkdwn\", \"text\": \"*Content Changed:*\\n{{ $json.contentChanged ? '✅ Yes' : '❌ No' }}\" },\n        { \"type\": \"mrkdwn\", \"text\": \"*Ads Changed:*\\n{{ $json.adsChanged ? '✅ Yes' : '❌ No' }}\" }\n      ]\n    },\n    {\n      \"type\": \"section\",\n      \"text\": { \"type\": \"mrkdwn\", \"text\": \"*Battle Card Summary:*\\n{{ $json.battle_card_summary }}\" }\n    },\n    {\n      \"type\": \"section\",\n      \"text\": { \"type\": \"mrkdwn\", \"text\": \"*Recommended Actions:*\\n{{ ($json.recommended_actions || []).map((a,i) => (i+1)+'. '+a).join('\\n') }}\" }\n    },\n    {\n      \"type\": \"context\",\n      \"elements\": [{ \"type\": \"mrkdwn\", \"text\": \"🤖 Competitor Intelligence Agent | <{{ $vars.GOOGLE_SHEET_ID && 'https://docs.google.com/spreadsheets/d/' + $vars.GOOGLE_SHEET_ID }}|View Battle Card Sheet>\" }]\n    }\n  ]\n}",
        "options": {}
      },
      "id": "20", "name": "Slack: Send Threat Alert",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2, "position": [2440, 180]
    },

    {
      "parameters": {
        "jsCode": "// Aggregate all competitor results for daily email digest\nconst staticData = $getWorkflowStaticData('global');\nconst digestKey = 'digest_items';\n\nconst item = $input.first().json;\nconst existing = staticData[digestKey] || [];\nexisting.push({\n  name: item.competitor_name,\n  threat_level: item.threat_level,\n  threat_score: item.threat_score,\n  threat_emoji: item.threat_emoji,\n  summary: item.battle_card_summary,\n  pricing_changed: item.pricingChanged,\n  features_changed: item.featuresChanged,\n  content_changed: item.contentChanged,\n  ads_changed: item.adsChanged,\n  actions: item.recommended_actions || []\n});\nstaticData[digestKey] = existing;\n\n// Check if this is the last competitor (4 AM run = daily digest trigger)\nconst hour = new Date().getHours();\nconst sendDigest = hour === 8; // Send digest at 8 AM run\n\nreturn [{ json: { ...item, digestReady: sendDigest, digestItems: existing } }];"
      },
      "id": "21", "name": "Aggregate for Digest",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2, "position": [2440, 380]
    },

    {
      "parameters": {
        "conditions": {
          "conditions": [
            { "leftValue": "={{ $json.digestReady }}", "rightValue": true, "operator": { "type": "boolean", "operation": "true" } }
          ]
        }
      },
      "id": "22", "name": "Is 8 AM Digest Time?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2, "position": [2640, 380]
    },

    {
      "parameters": {
        "jsCode": "const items = $json.digestItems || [];\nconst sorted = [...items].sort((a,b) => b.threat_score - a.threat_score);\n\nconst rows = sorted.map(c => `\n  <tr style=\"border-bottom:1px solid #eee\">\n    <td style=\"padding:10px\">${c.threat_emoji} <strong>${c.name}</strong></td>\n    <td style=\"padding:10px;text-align:center\">${c.threat_level}</td>\n    <td style=\"padding:10px;text-align:center\">${c.threat_score}/10</td>\n    <td style=\"padding:10px;font-size:12px\">${c.summary}</td>\n    <td style=\"padding:10px;font-size:11px;color:#666\">${c.actions.slice(0,2).join('<br/>')}</td>\n  </tr>`).join('');\n\nconst html = `\n<div style=\"font-family:Arial,sans-serif;max-width:800px;margin:auto;padding:24px\">\n  <div style=\"background:#1d3557;padding:20px;border-radius:8px 8px 0 0;text-align:center\">\n    <h1 style=\"color:white;margin:0;font-size:22px\">🕵️ Competitor Intelligence Daily Digest</h1>\n    <p style=\"color:#a8c8f0;margin:4px 0 0\">${new Date().toDateString()}</p>\n  </div>\n  <div style=\"padding:20px;background:#f8f9fa;border:1px solid #eee\">\n    <p>Here's your daily competitor intelligence summary. ${sorted.filter(c=>c.threat_score>=7).length} competitor(s) flagged as HIGH/CRITICAL threat today.</p>\n    <table style=\"width:100%;border-collapse:collapse;background:white;border-radius:6px;overflow:hidden\">\n      <thead>\n        <tr style=\"background:#1d3557;color:white\">\n          <th style=\"padding:12px;text-align:left\">Competitor</th>\n          <th style=\"padding:12px\">Threat</th>\n          <th style=\"padding:12px\">Score</th>\n          <th style=\"padding:12px;text-align:left\">Summary</th>\n          <th style=\"padding:12px;text-align:left\">Actions</th>\n        </tr>\n      </thead>\n      <tbody>${rows}</tbody>\n    </table>\n    <p style=\"margin-top:20px\"><a href=\"https://docs.google.com/spreadsheets/d/${$vars.GOOGLE_SHEET_ID}\" style=\"background:#1d3557;color:white;padding:10px 20px;border-radius:6px;text-decoration:none\">📊 View Full Battle Cards</a></p>\n  </div>\n  <p style=\"color:#aaa;font-size:11px;text-align:center;margin-top:10px\">Automated by Competitor Intelligence Agent · Runs every 6 hours</p>\n</div>`;\n\nreturn [{ json: { html, subject: `🕵️ Competitor Intel Digest — ${new Date().toDateString()} — ${sorted.length} competitors monitored` } }];"
      },
      "id": "23", "name": "Build Email Digest HTML",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2, "position": [2840, 300]
    },

    {
      "parameters": {
        "fromEmail": "intel@yourcompany.com",
        "toEmail": "={{ $vars.TEAM_EMAIL }}",
        "subject": "={{ $json.subject }}",
        "emailType": "html",
        "message": "={{ $json.html }}",
        "options": { "replyTo": "ops@yourcompany.com" }
      },
      "id": "24", "name": "Email: Send Daily Digest",
      "type": "n8n-nodes-base.emailSend",
      "typeVersion": 2.1, "position": [3040, 300],
      "credentials": { "smtp": { "id": "3", "name": "SMTP Email" } }
    },

    {
      "parameters": {
        "jsCode": "// Collect error details from failed scrape nodes\nconst competitor = $('Loop: For Each Competitor').item?.json || {};\nconst errors = [];\n\nconst checkNode = (nodeName) => {\n  try {\n    const item = $(nodeName).item;\n    if (item?.json?.error || item?.json?.statusCode >= 400) {\n      errors.push({ node: nodeName, error: item.json.error || `HTTP ${item.json.statusCode}` });\n    }\n  } catch(e) { /* node may not have run */ }\n};\n\ncheckNode('Scrape: Pricing Page');\ncheckNode('Scrape: Features Page');\ncheckNode('Fetch: RSS / Blog Feed');\ncheckNode('Fetch: Meta Ad Library');\n\nreturn [{ json: {\n  timestamp: new Date().toISOString(),\n  competitor_name: competitor.name || 'Unknown',\n  errors: errors,\n  error_count: errors.length,\n  error_summary: errors.map(e => `${e.node}: ${e.error}`).join(' | ')\n}}];"
      },
      "id": "25", "name": "Collect Scrape Errors",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2, "position": [1160, 520]
    },

    {
      "parameters": {
        "operation": "append",
        "documentId": "={{ $vars.GOOGLE_SHEET_ID }}",
        "sheetName": "failed_checks",
        "columns": {
          "mappingMode": "defineBelow",
          "value": {
            "Timestamp": "={{ $json.timestamp }}",
            "Competitor": "={{ $json.competitor_name }}",
            "Error Count": "={{ $json.error_count }}",
            "Error Summary": "={{ $json.error_summary }}",
            "Status": "NEEDS MANUAL REVIEW"
          }
        },
        "options": {}
      },
      "id": "26", "name": "Sheets: Log Failed Checks",
      "type": "n8n-nodes-base.googleSheets",
      "typeVersion": 4.5, "position": [1360, 520],
      "credentials": { "googleSheetsOAuth2Api": { "id": "5", "name": "Google Sheets" } }
    }

  ],

  "connections": {
    "Schedule — Every 6 Hours": { "main": [[{ "node": "Merge Triggers", "type": "main", "index": 0 }]] },
    "Manual Trigger": { "main": [[{ "node": "Merge Triggers", "type": "main", "index": 1 }]] },
    "Merge Triggers": { "main": [[{ "node": "Load Competitor Config", "type": "main", "index": 0 }]] },
    "Load Competitor Config": { "main": [[{ "node": "Loop: For Each Competitor", "type": "main", "index": 0 }]] },
    "Loop: For Each Competitor": {
      "main": [
        [
          { "node": "Scrape: Pricing Page", "type": "main", "index": 0 },
          { "node": "Scrape: Features Page", "type": "main", "index": 0 },
          { "node": "Fetch: RSS / Blog Feed", "type": "main", "index": 0 },
          { "node": "Fetch: Meta Ad Library", "type": "main", "index": 0 }
        ]
      ]
    },
    "Scrape: Pricing Page": {
      "main": [[{ "node": "Hash Check + Dedup", "type": "main", "index": 0 }]],
      "error": [[{ "node": "Collect Scrape Errors", "type": "main", "index": 0 }]]
    },
    "Scrape: Features Page": {
      "main": [[{ "node": "Hash Check + Dedup", "type": "main", "index": 0 }]],
      "error": [[{ "node": "Collect Scrape Errors", "type": "main", "index": 0 }]]
    },
    "Fetch: RSS / Blog Feed": {
      "main": [[{ "node": "Hash Check + Dedup", "type": "main", "index": 0 }]],
      "error": [[{ "node": "Collect Scrape Errors", "type": "main", "index": 0 }]]
    },
    "Fetch: Meta Ad Library": {
      "main": [[{ "node": "Hash Check + Dedup", "type": "main", "index": 0 }]],
      "error": [[{ "node": "Collect Scrape Errors", "type": "main", "index": 0 }]]
    },
    "Hash Check + Dedup": { "main": [[{ "node": "Skip If Nothing Changed", "type": "main", "index": 0 }]] },
    "Skip If Nothing Changed": {
      "main": [
        [{ "node": "Claude: Full Intelligence Analysis", "type": "main", "index": 0 }],
        [{ "node": "Loop: For Each Competitor", "type": "main", "index": 0 }]
      ]
    },
    "Claude: Full Intelligence Analysis": { "main": [[{ "node": "Parse Intelligence Output", "type": "main", "index": 0 }]] },
    "Parse Intelligence Output": {
      "main": [
        [
          { "node": "Sheets: Update Battle Cards", "type": "main", "index": 0 },
          { "node": "Sheets: Log Pricing History", "type": "main", "index": 0 },
          { "node": "Sheets: Log Content Feed", "type": "main", "index": 0 },
          { "node": "Sheets: Log Ads Tracker", "type": "main", "index": 0 },
          { "node": "Sheets: Append Change Log", "type": "main", "index": 0 },
          { "node": "Threat Score ≥ 5?", "type": "main", "index": 0 },
          { "node": "Aggregate for Digest", "type": "main", "index": 0 }
        ]
      ]
    },
    "Threat Score ≥ 5?": {
      "main": [
        [{ "node": "Slack: Send Threat Alert", "type": "main", "index": 0 }],
        []
      ]
    },
    "Sheets: Update Battle Cards": { "main": [[{ "node": "Loop: For Each Competitor", "type": "main", "index": 0 }]] },
    "Aggregate for Digest": { "main": [[{ "node": "Is 8 AM Digest Time?", "type": "main", "index": 0 }]] },
    "Is 8 AM Digest Time?": {
      "main": [
        [{ "node": "Build Email Digest HTML", "type": "main", "index": 0 }],
        []
      ]
    },
    "Build Email Digest HTML": { "main": [[{ "node": "Email: Send Daily Digest", "type": "main", "index": 0 }]] },
    "Collect Scrape Errors": { "main": [[{ "node": "Sheets: Log Failed Checks", "type": "main", "index": 0 }]] }
  },

  "active": false,
  "settings": {
    "executionOrder": "v1",
    "saveManualExecutions": true,
    "callerPolicy": "workflowsFromSameOwner"
  },
  "tags": [
    { "name": "Competitor Intelligence" },
    { "name": "AI Agent" },
    { "name": "Shopify" },
    { "name": "Production-Ready" }
  ],

  "_setup_guide": {
    "step_1_variables": {
      "COMPETITOR_CONFIG": "JSON array — see example below",
      "GOOGLE_SHEET_ID": "Your Google Sheet ID from URL",
      "SLACK_WEBHOOK_URL": "Slack incoming webhook URL",
      "TEAM_EMAIL": "Sales/marketing team email for daily digest",
      "META_ACCESS_TOKEN": "Meta Graph API token (free, for Ad Library)"
    },
    "step_2_competitor_config_example": [
      {
        "name": "Competitor A",
        "pricing_url": "https://competitor-a.com/pricing",
        "features_url": "https://competitor-a.com/features",
        "rss_url": "https://competitor-a.com/blog/feed.xml",
        "meta_page_id": "123456789",
        "website": "competitor-a.com"
      }
    ],
    "step_3_google_sheet_tabs": [
      "battle_cards",
      "pricing_history",
      "content_feed",
      "ads_tracker",
      "change_log",
      "failed_checks"
    ],
    "step_4_credentials": [
      "Anthropic Claude API",
      "Google Sheets OAuth2",
      "SMTP Email",
      "Slack Webhook (HTTP Request node — no credential needed, just URL in variable)"
    ],
    "step_5_meta_ad_library": "Get free token at https://developers.facebook.com — create app → get User Access Token → use Ad Library API (public data, no special permissions needed)",
    "step_6_digest_timing": "Digest email sends on the 8 AM run. Adjust hour check in 'Aggregate for Digest' node (line: const hour = new Date().getHours(); sendDigest = hour === 8)"
  }
}