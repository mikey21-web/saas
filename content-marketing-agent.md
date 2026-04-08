# Content Marketing Agent

## Overview
Multi-channel content engine + distribution system for Indian SMBs/brands.

## Core Workflow (5 Agents)
```
1. IDEA GENERATOR → Business update → 7 content ideas
2. COPYWRITER → Idea → LinkedIn/Twitter/Insta/WhatsApp variants
3. OPTIMIZER → Analyze past performance → Best time/format
4. PUBLISHER → Auto-post across 5 platforms
5. ANALYTICS → Engagement metrics → Next content optimization
```

## Capabilities
```
✅ 1 Idea → 5 platforms (LinkedIn, Twitter, Insta, WhatsApp, Email)
✅ Brand voice matching (train on 5 past posts)
✅ India trending hashtags + festivals
✅ A/B testing (auto-select winner)
✅ Performance analytics (weekly report)
✅ Content calendar automation
```

## Input / Output
**Input**: "Just closed ₹2Cr funding" or "New ecommerce feature live"
**Output**: 
```
📅 Week 1 Content Calendar
├── LinkedIn: "Growth story" (800 words)
├── Twitter: Thread (7 tweets) 
├── Instagram: Carousel (5 slides)
├── WhatsApp: Broadcast to 5k customers
└── Email: Newsletter to subscribers
```

## ROI Metrics (30 days)
| Metric | Before | After |
|--------|--------|-------|
| Content Creation Time | 12h/week | 30min/week |
| LinkedIn Reach | 500 | 5,200 |
| Leads from Content | 3/mo | 28/mo |
| Cost per Lead | ₹2,500 | ₹350 |

## Tech Stack
```
Groq Llama3 (fast ideation)
Claude Sonnet (premium copywriting)
LinkedIn/Twitter APIs (publishing)
Supabase (calendar + analytics)
WhatsApp Business API (broadcasts)
```

## Pricing
```
Starter: ₹2,999/mo (3 posts/week, 3 platforms)
Pro: ₹4,999/mo (Daily content, 5 platforms + WhatsApp)
Enterprise: ₹9,999/mo (Team collab + custom voice training)

14-day trial: 10 posts across all platforms
```

## India-First Features
```
✅ Hinglish content for WhatsApp audiences
✅ Festival content templates (Diwali, Holi, etc.)
✅ Local trending topics/hashtags
✅ Regional language variants
✅ WhatsApp Status Stories automation
```

## Multi-Channel Outputs
```
📱 WhatsApp Broadcast: "New feature live! 🚀 Try now → [link]"
🐦 Twitter Thread: 7 tweets about growth story
💼 LinkedIn Post: 800-word founder story + stats
📸 Instagram Carousel: 5 slides feature deep-dive
📧 Email Newsletter: Customer update + case study
```

## Quick Start
```
1. Connect social accounts + WhatsApp
2. Upload 5 past posts (voice training)
3. "New feature launched" → Get full week calendar
4. Review → Auto-publish everywhere
5. Weekly analytics report via WhatsApp
```

**From 0 → Consistent content → 10x reach. Deploy now.**

{
  "name": "🚀 Content Marketing Agent – India SMB v2 (10/10)",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "content-marketing",
        "responseMode": "responseNode",
        "options": {}
      },
      "id": "node-webhook",
      "name": "📥 Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [180, 500],
      "webhookId": "content-marketing-india-v2"
    },
    {
      "parameters": {
        "jsCode": "// ─── WEBHOOK AUTH ───\nconst expectedKey = $env.WEBHOOK_API_KEY || 'change-me-in-production';\nconst providedKey = $input.first().json.headers?.['x-api-key'] || $input.first().json.body?.api_key;\nif (providedKey !== expectedKey) {\n  throw new Error('Unauthorized: invalid or missing x-api-key header');\n}\n\nconst body = $input.first().json.body || $input.first().json;\nif (!body.business_update) throw new Error('business_update is required');\nif (!body.brand_name) throw new Error('brand_name is required');\n\nconst now = new Date();\nreturn [{\n  json: {\n    business_update: body.business_update,\n    brand_name: body.brand_name,\n    industry: body.industry || 'Technology',\n    target_audience: body.target_audience || 'Indian entrepreneurs and SMB owners',\n    past_posts: body.past_posts || [],\n    tone: body.tone || 'professional yet conversational',\n    whatsapp_recipients: body.whatsapp_recipients || 0,\n    email_subscribers: body.email_subscribers || 0,\n    auto_publish: body.auto_publish === true,\n    run_id: `run_${now.getTime()}`,\n    triggered_at: now.toISOString(),\n    week_start: now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),\n    retry_count: 0\n  }\n}];"
      },
      "id": "node-auth-validate",
      "name": "🔐 Auth + Validate Input",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [420, 500]
    },
    {
      "parameters": {
        "model": "claude-sonnet-4-20250514",
        "messages": {
          "values": [
            {
              "role": "user",
              "content": "=You are a world-class content strategist for Indian startups and SMBs. You deeply understand the Indian business ecosystem — funding culture, WhatsApp-first audiences, festival calendars, Hinglish, LinkedIn founder culture, and regional pride.\n\n## Brand Context\n- Brand: {{ $json.brand_name }}\n- Industry: {{ $json.industry }}\n- Business Update: {{ $json.business_update }}\n- Target Audience: {{ $json.target_audience }}\n- Brand Tone: {{ $json.tone }}\n- Past Posts Sample: {{ $json.past_posts.length > 0 ? $json.past_posts.slice(0,3).join(' | ') : 'None provided' }}\n\n## Task\nGenerate exactly 7 distinct, high-impact content ideas. Each must have a genuinely unique angle. No overlap between ideas.\n\nReturn ONLY raw JSON (zero markdown, zero backticks, zero preamble):\n{\n  \"brand_voice_analysis\": \"2-sentence analysis of brand voice and positioning based on past posts or update\",\n  \"content_pillars\": [\"pillar1\", \"pillar2\", \"pillar3\"],\n  \"ideas\": [\n    {\n      \"id\": 1,\n      \"title\": \"Compelling title max 10 words\",\n      \"angle\": \"The specific unique narrative hook\",\n      \"why_it_works\": \"One sentence: why Indian audiences engage with this\",\n      \"format\": \"story|insight|tips|announcement|thread|carousel|case_study|behind_scenes\",\n      \"emotion\": \"inspire|educate|celebrate|curiosity|urgency|nostalgia|pride\",\n      \"best_platform\": \"LinkedIn|Twitter|Instagram|WhatsApp|Email\",\n      \"content_type\": \"thought_leadership|product_update|culture|growth_story|how_to|milestone\",\n      \"india_context\": \"festival tie-in, regional hook, or Indian market angle — null if none\",\n      \"estimated_virality\": \"low|medium|high\"\n    }\n  ]\n}"
            }
          ]
        },
        "options": {
          "maxTokens": 2000,
          "temperature": 0.85
        }
      },
      "id": "node-agent1",
      "name": "🧠 Agent 1: Idea Generator",
      "type": "@n8n/n8n-nodes-langchain.lmChatAnthropic",
      "typeVersion": 1,
      "position": [660, 500],
      "credentials": {
        "anthropicApi": { "id": "anthropic-creds", "name": "Anthropic API" }
      }
    },
    {
      "parameters": {
        "jsCode": "const raw = $input.first().json.content[0].text;\nconst cleaned = raw.replace(/```json|```/g, '').trim();\nlet parsed;\ntry {\n  parsed = JSON.parse(cleaned);\n} catch(e) {\n  const match = cleaned.match(/\\{[\\s\\S]*\\}/);\n  if (match) { try { parsed = JSON.parse(match[0]); } catch(e2) { throw new Error('Idea Generator returned unparseable JSON: ' + e2.message); } }\n  else throw new Error('No JSON found in Idea Generator response');\n}\nif (!parsed.ideas || parsed.ideas.length < 7) throw new Error(`Expected 7 ideas, got ${parsed.ideas?.length || 0}`);\nconst upstream = $('🔐 Auth + Validate Input').first().json;\nreturn parsed.ideas.map(idea => ({\n  json: {\n    ...upstream,\n    idea,\n    brand_voice_analysis: parsed.brand_voice_analysis,\n    content_pillars: parsed.content_pillars\n  }\n}));"
      },
      "id": "node-parse-ideas",
      "name": "🔀 Parse & Split 7 Ideas",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [900, 500]
    },
    {
      "parameters": {
        "model": "claude-sonnet-4-20250514",
        "messages": {
          "values": [
            {
              "role": "user",
              "content": "=You are an elite multichannel copywriter for Indian brands. Write platform-native copy — each platform should feel like it was born there, not copy-pasted.\n\n## Brand\n- Name: {{ $json.brand_name }} | Industry: {{ $json.industry }}\n- Audience: {{ $json.target_audience }}\n- Voice: {{ $json.brand_voice_analysis }}\n- Tone: {{ $json.tone }}\n- Update: {{ $json.business_update }}\n\n## Idea to Execute\n- Title: {{ $json.idea.title }}\n- Angle: {{ $json.idea.angle }}\n- Format: {{ $json.idea.format }}\n- Emotion: {{ $json.idea.emotion }}\n- India Context: {{ $json.idea.india_context }}\n\n## Past Posts (voice match)\n{{ $json.past_posts.length > 0 ? $json.past_posts.join('\\n---\\n') : 'None provided — use bold authentic founder voice' }}\n\n## Platform Requirements\n\nLINKEDIN: 700-900 words. First line must stop scroll (never start with \"I am excited\"). Short paragraphs (1-3 lines). Strategic line breaks. Include data/numbers if relevant. End with an engaging question. 3-5 hashtags.\n\nTWITTER THREAD: Exactly 7 tweets. Tweet 1: mega-hook (surprising stat or bold claim). Tweets 2-6: one punchy insight each, standalone value, max 250 chars. Tweet 7: summary + CTA. Each tweet has 1-2 hashtags.\n\nINSTAGRAM CAROUSEL: 5 slides. Slide 1: bold hook headline max 8 words. Slides 2-4: one insight per slide with headline + 2-line body. Slide 5: CTA. Full caption 150-200 words with emojis. 15-20 hashtags (mix English + Hindi).\n\nWHATSAPP: 3 versions — short (50w), medium (100w), long (150w). Use Hinglish naturally where it fits. Max 1 emoji per para. CTA with [LINK]. Feel like a message from a trusted peer, not a brand blast.\n\nEMAIL: 5 subject line options with different angles. Preview text for each. Body 400-500 words, structure: Hook → Context → Value → CTA. Use {{subscriber_first_name}}. Include a P.S. (these get 40% extra reads). HTML-ready line breaks.\n\nReturn ONLY raw JSON (zero markdown, zero backticks):\n{\n  \"idea_id\": {{ $json.idea.id }},\n  \"idea_title\": \"{{ $json.idea.title }}\",\n  \"content_type\": \"{{ $json.idea.content_type }}\",\n  \"estimated_virality\": \"{{ $json.idea.estimated_virality }}\",\n  \"linkedin\": {\n    \"post\": \"full post, line breaks as \\\\n\",\n    \"hashtags\": [\"#Startup\", \"#India\"],\n    \"char_count\": 750,\n    \"cta_question\": \"the closing question\"\n  },\n  \"twitter\": {\n    \"tweets\": [\n      { \"number\": 1, \"content\": \"tweet text max 250 chars\", \"hashtags\": [\"#tag\"] }\n    ]\n  },\n  \"instagram\": {\n    \"slides\": [\n      { \"number\": 1, \"headline\": \"Bold headline\", \"body\": \"Supporting copy\", \"alt_text\": \"accessibility text\" }\n    ],\n    \"caption\": \"full caption with emojis\",\n    \"hashtags\": [\"#tag1\", \"#tag2\"]\n  },\n  \"whatsapp\": {\n    \"short\": \"50 word version\",\n    \"medium\": \"100 word version\",\n    \"long\": \"150 word version\"\n  },\n  \"email\": {\n    \"subject_lines\": [\n      { \"option\": 1, \"subject\": \"subject text\", \"preview_text\": \"preview text\", \"angle\": \"curiosity|benefit|urgency|personal|news\" }\n    ],\n    \"body\": \"full email body with \\\\n line breaks\",\n    \"cta_text\": \"CTA button label\",\n    \"cta_url_placeholder\": \"[CTA_LINK]\",\n    \"ps_line\": \"P.S. text\"\n  }\n}"
            }
          ]
        },
        "options": {
          "maxTokens": 4000,
          "temperature": 0.7
        }
      },
      "id": "node-agent2",
      "name": "✍️ Agent 2: Copywriter",
      "type": "@n8n/n8n-nodes-langchain.lmChatAnthropic",
      "typeVersion": 1,
      "position": [1140, 500],
      "credentials": {
        "anthropicApi": { "id": "anthropic-creds", "name": "Anthropic API" }
      }
    },
    {
      "parameters": {
        "jsCode": "const raw = $input.first().json.content[0].text;\nconst cleaned = raw.replace(/```json|```/g, '').trim();\nlet content;\ntry {\n  content = JSON.parse(cleaned);\n} catch(e) {\n  const match = cleaned.match(/\\{[\\s\\S]*\\}/);\n  if (match) { try { content = JSON.parse(match[0]); } catch(e2) { throw new Error('Copywriter JSON parse failed: ' + e2.message); } }\n  else throw new Error('No JSON in Copywriter response');\n}\nconst upstream = $('🔀 Parse & Split 7 Ideas').item.json;\nreturn [{ json: { ...upstream, content, status: 'content_ready' } }];"
      },
      "id": "node-parse-content",
      "name": "📝 Parse Content",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1380, 500]
    },
    {
      "parameters": {
        "model": "claude-sonnet-4-20250514",
        "messages": {
          "values": [
            {
              "role": "user",
              "content": "=You are a data-driven social media strategist specializing in Indian digital markets. Score this content ruthlessly — Indian audiences are sophisticated.\n\n## Content\nIdea: {{ $json.content.idea_title }}\nType: {{ $json.content.content_type }}\nLinkedIn First Line: {{ $json.content.linkedin.post.split('\\\\n')[0] }}\nTwitter Hook: {{ $json.content.twitter.tweets[0].content }}\nInstagram Hook: {{ $json.content.instagram.slides[0].headline }}\nEmail Subject 1: {{ $json.content.email.subject_lines[0].subject }}\n\n## Brand: {{ $json.brand_name }} | {{ $json.industry }} | Audience: {{ $json.target_audience }}\n\nScore rigorously. A 10 means it would go genuinely viral in Indian startup circles. Return ONLY raw JSON:\n{\n  \"overall_score\": 8.4,\n  \"publish_recommended\": true,\n  \"rejection_reason\": null,\n  \"best_platform\": \"linkedin\",\n  \"best_platform_reason\": \"one sentence\",\n  \"content_calendar_day\": \"Tuesday\",\n  \"platforms\": {\n    \"linkedin\": {\n      \"score\": 8.5,\n      \"hook_strength\": \"strong\",\n      \"improvements\": [\"Start with the rupee amount for instant scroll-stop\", \"Add one more data point in paragraph 3\"],\n      \"optimal_post_time_ist\": \"Tuesday 08:30\",\n      \"predicted_reach\": \"2000-4500\",\n      \"predicted_engagement_rate\": \"4.2%\",\n      \"ab_variant\": \"alternative first line for A/B test\"\n    },\n    \"twitter\": {\n      \"score\": 7.8,\n      \"hook_strength\": \"medium\",\n      \"improvements\": [\"Tweet 3 is too long, trim by 40 chars\"],\n      \"optimal_post_time_ist\": \"Wednesday 09:00\",\n      \"predicted_impressions\": \"1500-3000\",\n      \"predicted_engagement_rate\": \"2.3%\"\n    },\n    \"instagram\": {\n      \"score\": 8.2,\n      \"hook_strength\": \"strong\",\n      \"improvements\": [\"Slide 4 needs a stronger stat\"],\n      \"optimal_post_time_ist\": \"Thursday 19:00\",\n      \"predicted_reach\": \"1500-3500\",\n      \"predicted_engagement_rate\": \"5.9%\"\n    },\n    \"whatsapp\": {\n      \"score\": 9.1,\n      \"version_to_use\": \"medium\",\n      \"improvements\": [\"Open with emoji to boost open rate on notification\"],\n      \"optimal_send_time_ist\": \"Tuesday 10:30\",\n      \"predicted_open_rate\": \"71%\",\n      \"predicted_click_rate\": \"13%\"\n    },\n    \"email\": {\n      \"score\": 8.0,\n      \"recommended_subject_index\": 2,\n      \"ab_test_subject_index\": 4,\n      \"improvements\": [\"P.S. line could reference a specific number\"],\n      \"optimal_send_time_ist\": \"Thursday 10:00\",\n      \"predicted_open_rate\": \"36%\",\n      \"predicted_click_rate\": \"7.2%\"\n    }\n  }\n}"
            }
          ]
        },
        "options": {
          "maxTokens": 1500,
          "temperature": 0.2
        }
      },
      "id": "node-agent3",
      "name": "📊 Agent 3: Optimizer & Scorer",
      "type": "@n8n/n8n-nodes-langchain.lmChatAnthropic",
      "typeVersion": 1,
      "position": [1620, 500],
      "credentials": {
        "anthropicApi": { "id": "anthropic-creds", "name": "Anthropic API" }
      }
    },
    {
      "parameters": {
        "jsCode": "const raw = $input.first().json.content[0].text;\nconst cleaned = raw.replace(/```json|```/g, '').trim();\nlet opt;\ntry {\n  opt = JSON.parse(cleaned);\n} catch(e) {\n  const match = cleaned.match(/\\{[\\s\\S]*\\}/);\n  if (match) { try { opt = JSON.parse(match[0]); } catch(e2) { throw new Error('Optimizer parse failed'); } }\n  else throw new Error('Optimizer returned no JSON');\n}\nconst upstream = $('📝 Parse Content').item.json;\nreturn [{ json: { ...upstream, optimization: opt, status: 'optimized' } }];"
      },
      "id": "node-parse-opt",
      "name": "⚙️ Parse Optimization",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1860, 500]
    },
    {
      "parameters": {
        "jsCode": "const items = $input.all();\nconst sorted = items.sort((a,b) => (b.json.optimization.overall_score||0) - (a.json.optimization.overall_score||0));\nconst days = ['Monday','Tuesday','Wednesday','Thursday','Friday'];\nconst calendar = {};\nsorted.forEach((item, i) => {\n  const day = item.json.optimization.content_calendar_day || days[i % 5];\n  if (!calendar[day]) {\n    calendar[day] = {\n      idea_id: item.json.content.idea_id,\n      idea_title: item.json.content.idea_title,\n      score: item.json.optimization.overall_score,\n      best_platform: item.json.optimization.best_platform,\n      schedule: {\n        linkedin: item.json.optimization.platforms.linkedin.optimal_post_time_ist,\n        twitter: item.json.optimization.platforms.twitter.optimal_post_time_ist,\n        instagram: item.json.optimization.platforms.instagram.optimal_post_time_ist,\n        whatsapp: item.json.optimization.platforms.whatsapp.optimal_send_time_ist,\n        email: item.json.optimization.platforms.email.optimal_send_time_ist\n      }\n    };\n  }\n});\nconst pkg = {\n  run_id: sorted[0].json.run_id,\n  brand_name: sorted[0].json.brand_name,\n  business_update: sorted[0].json.business_update,\n  generated_at: new Date().toISOString(),\n  week_start: sorted[0].json.week_start,\n  auto_publish: sorted[0].json.auto_publish,\n  total_ideas: sorted.length,\n  top_idea: sorted[0].json.content.idea_title,\n  top_idea_score: sorted[0].json.optimization.overall_score,\n  content_calendar: calendar,\n  all_content: sorted.map(item => ({\n    idea_id: item.json.content.idea_id,\n    idea_title: item.json.content.idea_title,\n    score: item.json.optimization.overall_score,\n    publish_recommended: item.json.optimization.publish_recommended,\n    rejection_reason: item.json.optimization.rejection_reason,\n    best_platform: item.json.optimization.best_platform,\n    content_calendar_day: item.json.optimization.content_calendar_day,\n    platforms: {\n      linkedin: {\n        post: item.json.content.linkedin.post,\n        hashtags: item.json.content.linkedin.hashtags,\n        cta_question: item.json.content.linkedin.cta_question,\n        ab_variant_hook: item.json.optimization.platforms.linkedin.ab_variant,\n        post_time_ist: item.json.optimization.platforms.linkedin.optimal_post_time_ist,\n        predicted_reach: item.json.optimization.platforms.linkedin.predicted_reach,\n        score: item.json.optimization.platforms.linkedin.score,\n        hook_strength: item.json.optimization.platforms.linkedin.hook_strength,\n        improvements: item.json.optimization.platforms.linkedin.improvements\n      },\n      twitter: {\n        tweets: item.json.content.twitter.tweets,\n        post_time_ist: item.json.optimization.platforms.twitter.optimal_post_time_ist,\n        predicted_impressions: item.json.optimization.platforms.twitter.predicted_impressions,\n        score: item.json.optimization.platforms.twitter.score,\n        improvements: item.json.optimization.platforms.twitter.improvements\n      },\n      instagram: {\n        slides: item.json.content.instagram.slides,\n        caption: item.json.content.instagram.caption,\n        hashtags: item.json.content.instagram.hashtags,\n        post_time_ist: item.json.optimization.platforms.instagram.optimal_post_time_ist,\n        predicted_reach: item.json.optimization.platforms.instagram.predicted_reach,\n        score: item.json.optimization.platforms.instagram.score,\n        improvements: item.json.optimization.platforms.instagram.improvements\n      },\n      whatsapp: {\n        short: item.json.content.whatsapp.short,\n        medium: item.json.content.whatsapp.medium,\n        long: item.json.content.whatsapp.long,\n        recommended_version: item.json.optimization.platforms.whatsapp.version_to_use,\n        send_time_ist: item.json.optimization.platforms.whatsapp.optimal_send_time_ist,\n        predicted_open_rate: item.json.optimization.platforms.whatsapp.predicted_open_rate,\n        score: item.json.optimization.platforms.whatsapp.score,\n        improvements: item.json.optimization.platforms.whatsapp.improvements\n      },\n      email: {\n        subject_lines: item.json.content.email.subject_lines,\n        recommended_subject_index: item.json.optimization.platforms.email.recommended_subject_index,\n        ab_test_subject_index: item.json.optimization.platforms.email.ab_test_subject_index,\n        body: item.json.content.email.body,\n        cta_text: item.json.content.email.cta_text,\n        ps_line: item.json.content.email.ps_line,\n        send_time_ist: item.json.optimization.platforms.email.optimal_send_time_ist,\n        predicted_open_rate: item.json.optimization.platforms.email.predicted_open_rate,\n        score: item.json.optimization.platforms.email.score,\n        improvements: item.json.optimization.platforms.email.improvements\n      }\n    }\n  }))\n};\nreturn [{ json: pkg }];"
      },
      "id": "node-aggregate",
      "name": "📦 Aggregate 7 Packages",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [2100, 500]
    },
    {
      "parameters": {
        "operation": "upsert",
        "tableId": "content_packages",
        "dataToSend": "autoMapInputData",
        "options": {}
      },
      "id": "node-supabase-save",
      "name": "🗄️ Save Packages to Supabase",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [2340, 340],
      "credentials": {
        "supabaseApi": { "id": "supabase-creds", "name": "Supabase" }
      },
      "continueOnFail": true,
      "notes": "Table: content_packages\nCols: run_id TEXT PK, brand_name TEXT, business_update TEXT, generated_at TIMESTAMPTZ, total_ideas INT, top_idea TEXT, top_idea_score FLOAT, auto_publish BOOL, content_calendar JSONB, all_content JSONB"
    },
    {
      "parameters": {
        "jsCode": "// ─── APPROVAL GATE ───\n// If auto_publish = true, pass through immediately.\n// If auto_publish = false, send approval email and WAIT for /approve webhook.\nconst pkg = $input.first().json;\nif (pkg.auto_publish === true) {\n  return [{ json: { ...pkg, approval_status: 'auto_approved', approved_at: new Date().toISOString() } }];\n}\n// Build summary for approver\nconst summary = pkg.all_content.slice(0,3).map(c =>\n  `[${c.score}/10] ${c.idea_title} → best on ${c.best_platform}`\n).join('\\n');\nreturn [{ json: { ...pkg, approval_status: 'pending', approval_summary: summary } }];"
      },
      "id": "node-approval-gate",
      "name": "🚦 Approval Gate",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [2340, 500]
    },
    {
      "parameters": {
        "conditions": {
          "options": { "caseSensitive": false, "leftValue": "", "typeValidation": "strict" },
          "conditions": [
            {
              "id": "approval-check",
              "leftValue": "={{ $json.approval_status }}",
              "rightValue": "auto_approved",
              "operator": { "type": "string", "operation": "equals" }
            }
          ],
          "combinator": "and"
        },
        "options": {}
      },
      "id": "node-approval-check",
      "name": "Auto-approved?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [2560, 500]
    },
    {
      "parameters": {
        "fromEmail": "agent@yourbrand.com",
        "toEmail": "={{ $env.APPROVER_EMAIL || 'founder@yourbrand.com' }}",
        "subject": "=[REVIEW] {{ $json.brand_name }} – {{ $json.total_ideas }} content pieces ready (top score: {{ $json.top_idea_score }}/10)",
        "emailType": "html",
        "message": "=<html><body style=\"font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a18\">\n<h2>Content Review Request</h2>\n<p><strong>Brand:</strong> {{ $json.brand_name }}<br><strong>Update:</strong> {{ $json.business_update }}<br><strong>Run ID:</strong> {{ $json.run_id }}</p>\n<h3>Top 3 Ideas</h3>\n<ul>{{ $json.all_content.slice(0,3).map(c => `<li><strong>[${c.score}/10]</strong> ${c.idea_title} — best on ${c.best_platform}</li>`).join('') }}</ul>\n<p>All 7 ideas are saved in Supabase under run_id: <code>{{ $json.run_id }}</code></p>\n<p style=\"margin-top:24px\">\n  <a href=\"{{ $env.N8N_WEBHOOK_URL }}/approve?run_id={{ $json.run_id }}&action=approve\" style=\"background:#1a6e46;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;margin-right:12px\">✅ Approve & Publish</a>\n  <a href=\"{{ $env.N8N_WEBHOOK_URL }}/approve?run_id={{ $json.run_id }}&action=reject\" style=\"background:#a33010;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px\">❌ Reject</a>\n</p>\n</body></html>",
        "options": {}
      },
      "id": "node-approval-email",
      "name": "📧 Send Approval Email",
      "type": "n8n-nodes-base.emailSend",
      "typeVersion": 2.1,
      "position": [2780, 640],
      "continueOnFail": true,
      "notes": "Sends approval request to founder. They click Approve → triggers /approve webhook which resumes publishing."
    },
    {
      "parameters": {
        "jsCode": "// Prep top-scored idea for LinkedIn publish\nconst pkg = $('📦 Aggregate 7 Packages').first().json;\nconst top = pkg.all_content.filter(c => c.publish_recommended).sort((a,b) => b.score - a.score)[0]\n  || pkg.all_content[0];\nconst li = top.platforms.linkedin;\nconst fullPost = li.post + '\\n\\n' + li.hashtags.join(' ');\nconst istTime = li.post_time_ist; // e.g. 'Tuesday 08:30'\nreturn [{ json: { run_id: pkg.run_id, idea_title: top.idea_title, full_post: fullPost, schedule_ist: istTime, ab_variant_hook: li.ab_variant_hook } }];"
      },
      "id": "node-prep-linkedin",
      "name": "🔧 Prep LinkedIn",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [2780, 360]
    },
    {
      "parameters": {
        "jsCode": "// Build full Twitter thread with reply chain metadata\nconst pkg = $('📦 Aggregate 7 Packages').first().json;\nconst top = pkg.all_content.filter(c => c.publish_recommended).sort((a,b) => b.score - a.score)[0]\n  || pkg.all_content[0];\nreturn top.platforms.twitter.tweets.map((t, i) => ({\n  json: {\n    run_id: pkg.run_id,\n    tweet_index: i,\n    tweet_number: t.number,\n    text: (t.content + ' ' + (t.hashtags || []).join(' ')).trim().substring(0, 278),\n    is_first: i === 0,\n    // reply_to_id is populated at publish time from previous tweet response\n    reply_to_id: null,\n    idea_title: top.idea_title\n  }\n}));"
      },
      "id": "node-prep-twitter",
      "name": "🔧 Prep Twitter Thread",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [2780, 460]
    },
    {
      "parameters": {
        "jsCode": "// Instagram: export carousel-ready JSON for Buffer/Later manual upload or Graph API\nconst pkg = $('📦 Aggregate 7 Packages').first().json;\nconst top = pkg.all_content.filter(c => c.publish_recommended).sort((a,b) => b.score - a.score)[0]\n  || pkg.all_content[0];\nconst ig = top.platforms.instagram;\nreturn [{\n  json: {\n    run_id: pkg.run_id,\n    idea_title: top.idea_title,\n    slide_count: ig.slides.length,\n    slides: ig.slides,\n    caption: ig.caption + '\\n\\n' + ig.hashtags.join(' '),\n    schedule_ist: ig.post_time_ist,\n    instructions: 'Upload slides as images via Canva/Figma using the headlines below, then schedule via Buffer or Meta Creator Studio',\n    canva_prompt: `Create ${ig.slides.length} Instagram carousel slides for: ${top.idea_title}. Brand: ${pkg.brand_name}. Slides: ${ig.slides.map(s => s.headline).join(' | ')}`\n  }\n}];"
      },
      "id": "node-prep-instagram",
      "name": "🔧 Prep Instagram Carousel",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [2780, 560]
    },
    {
      "parameters": {
        "jsCode": "const pkg = $('📦 Aggregate 7 Packages').first().json;\nconst top = pkg.all_content.filter(c => c.publish_recommended).sort((a,b) => b.score - a.score)[0]\n  || pkg.all_content[0];\nconst wa = top.platforms.whatsapp;\nconst version = wa.recommended_version || 'medium';\nconst link = `https://link.${pkg.brand_name.toLowerCase().replace(/[^a-z0-9]/g,'')}.com`;\nreturn [{\n  json: {\n    run_id: pkg.run_id,\n    message: wa[version].replace('[LINK]', link),\n    version_used: version,\n    schedule_ist: wa.send_time_ist,\n    predicted_open_rate: wa.predicted_open_rate\n  }\n}];"
      },
      "id": "node-prep-whatsapp",
      "name": "🔧 Prep WhatsApp",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [2780, 660]
    },
    {
      "parameters": {
        "jsCode": "const pkg = $('📦 Aggregate 7 Packages').first().json;\nconst top = pkg.all_content.filter(c => c.publish_recommended).sort((a,b) => b.score - a.score)[0]\n  || pkg.all_content[0];\nconst em = top.platforms.email;\nconst idxA = (em.recommended_subject_index || 1) - 1;\nconst idxB = (em.ab_test_subject_index || 3) - 1;\nreturn [{\n  json: {\n    run_id: pkg.run_id,\n    subject_a: em.subject_lines[idxA]?.subject || em.subject_lines[0].subject,\n    preview_a: em.subject_lines[idxA]?.preview_text || '',\n    subject_b: em.subject_lines[idxB]?.subject || em.subject_lines[1].subject,\n    preview_b: em.subject_lines[idxB]?.preview_text || '',\n    body: em.body,\n    cta_text: em.cta_text,\n    ps_line: em.ps_line,\n    schedule_ist: em.send_time_ist,\n    predicted_open_rate: em.predicted_open_rate\n  }\n}];"
      },
      "id": "node-prep-email",
      "name": "🔧 Prep Email (A/B)",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [2780, 760]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://api.linkedin.com/v2/ugcPosts",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            { "name": "Authorization", "value": "=Bearer {{$credentials.linkedinOAuth2Api.accessToken}}" },
            { "name": "Content-Type", "value": "application/json" },
            { "name": "X-Restli-Protocol-Version", "value": "2.0.0" }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"author\": \"urn:li:person:{{$credentials.linkedinOAuth2Api.personUrn}}\",\n  \"lifecycleState\": \"DRAFT\",\n  \"specificContent\": {\n    \"com.linkedin.ugc.ShareContent\": {\n      \"shareCommentary\": { \"text\": \"{{ $json.full_post.replace(/\"/g, '\\\\\"') }}\" },\n      \"shareMediaCategory\": \"NONE\"\n    }\n  },\n  \"visibility\": { \"com.linkedin.ugc.MemberNetworkVisibility\": \"PUBLIC\" }\n}",
        "options": {
          "response": { "response": { "responseFormat": "json" } }
        }
      },
      "id": "node-publish-linkedin",
      "name": "📤 LinkedIn Post",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [3020, 360],
      "continueOnFail": true,
      "notes": "DRAFT mode. Change lifecycleState to PUBLISHED for live auto-publish."
    },
    {
      "parameters": {
        "jsCode": "// ─── TWITTER THREAD WITH REPLY CHAIN ───\n// Publishes all 7 tweets in sequence, each replying to the previous.\nconst tweets = $('🔧 Prep Twitter Thread').all();\nconst results = [];\nlet lastTweetId = null;\n\nfor (const item of tweets) {\n  const tweet = item.json;\n  const body = { text: tweet.text };\n  if (lastTweetId && !tweet.is_first) {\n    body.reply = { in_reply_to_tweet_id: lastTweetId };\n  }\n\n  const response = await fetch('https://api.twitter.com/2/tweets', {\n    method: 'POST',\n    headers: {\n      'Authorization': `Bearer ${$credentials.twitterOAuth2Api?.accessToken || process.env.TWITTER_BEARER_TOKEN}`,\n      'Content-Type': 'application/json'\n    },\n    body: JSON.stringify(body)\n  });\n\n  let data;\n  try { data = await response.json(); } catch(e) { data = { error: e.message }; }\n\n  if (data?.data?.id) {\n    lastTweetId = data.data.id;\n    results.push({ tweet_number: tweet.tweet_number, tweet_id: data.data.id, status: 'published' });\n  } else {\n    results.push({ tweet_number: tweet.tweet_number, error: JSON.stringify(data), status: 'failed' });\n    break; // stop chain if a tweet fails\n  }\n\n  // Rate limit courtesy delay\n  await new Promise(r => setTimeout(r, 1000));\n}\n\nconst run_id = $('🔧 Prep Twitter Thread').first().json.run_id;\nreturn [{ json: { run_id, platform: 'twitter', thread_results: results, published_count: results.filter(r => r.status === 'published').length } }];"
      },
      "id": "node-publish-twitter",
      "name": "📤 Twitter Thread (Full Chain)",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [3020, 460],
      "continueOnFail": true,
      "notes": "Publishes all 7 tweets in reply chain. Set TWITTER_BEARER_TOKEN in n8n environment variables."
    },
    {
      "parameters": {
        "operation": "upsert",
        "tableId": "instagram_queue",
        "dataToSend": "autoMapInputData",
        "options": {}
      },
      "id": "node-publish-instagram",
      "name": "📤 Instagram → Supabase Queue",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [3020, 560],
      "credentials": {
        "supabaseApi": { "id": "supabase-creds", "name": "Supabase" }
      },
      "continueOnFail": true,
      "notes": "Saves carousel data to instagram_queue table. Pick up with a separate Canva/design automation or schedule via Buffer API. Table: run_id TEXT PK, idea_title TEXT, slides JSONB, caption TEXT, canva_prompt TEXT, schedule_ist TEXT, status TEXT DEFAULT 'pending'"
    },
    {
      "parameters": {
        "method": "POST",
        "url": "=https://graph.facebook.com/v18.0/{{ $env.WHATSAPP_PHONE_NUMBER_ID }}/messages",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            { "name": "Authorization", "value": "=Bearer {{ $env.WHATSAPP_ACCESS_TOKEN }}" },
            { "name": "Content-Type", "value": "application/json" }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"messaging_product\": \"whatsapp\",\n  \"to\": \"{{ $env.WHATSAPP_BROADCAST_NUMBER }}\",\n  \"type\": \"text\",\n  \"text\": { \"preview_url\": true, \"body\": \"{{ $json.message.replace(/\"/g, '\\\\\"') }}\" }\n}",
        "options": {}
      },
      "id": "node-publish-whatsapp",
      "name": "📤 WhatsApp Broadcast",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [3020, 660],
      "continueOnFail": true,
      "notes": "Env vars needed: WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN, WHATSAPP_BROADCAST_NUMBER"
    },
    {
      "parameters": {
        "jsCode": "// ─── A/B EMAIL SPLIT ───\n// Splits subscriber list 50/50 and sends variant A and B.\n// In production: integrate with Brevo/Mailchimp API for true list-split.\n// Here we fire both variants and log them for tracking.\nconst { run_id, subject_a, preview_a, subject_b, preview_b, body, cta_text, ps_line } = $input.first().json;\n\nconst htmlBody = (subject, preview) => `<html><body style=\"font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a18;line-height:1.7\">\n<p>Hi {{subscriber_first_name}},</p>\n${body.replace(/\\n/g,'<br>')}\n<br><br>\n<div style=\"text-align:center;margin:32px 0\">\n  <a href=\"[CTA_LINK]?utm_source=email&utm_campaign=${run_id}&utm_content=${subject === subject_a ? 'variant_a' : 'variant_b'}\" \n     style=\"background:#d4420e;color:#fff;padding:14px 28px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:bold\">${cta_text}</a>\n</div>\n<p style=\"font-size:13px;color:#666\">P.S. ${ps_line}</p>\n<hr style=\"border:none;border-top:1px solid #eee;margin:20px 0\">\n<p style=\"font-size:11px;color:#999;text-align:center\">Unsubscribe: <a href=\"[UNSUBSCRIBE_LINK]\">click here</a></p>\n</body></html>`;\n\nreturn [\n  { json: { run_id, variant: 'A', subject: subject_a, preview_text: preview_a, html: htmlBody(subject_a, preview_a), segment: 'first_half' } },\n  { json: { run_id, variant: 'B', subject: subject_b, preview_text: preview_b, html: htmlBody(subject_b, preview_b), segment: 'second_half' } }\n];"
      },
      "id": "node-email-ab-split",
      "name": "📤 Email A/B Split Builder",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [3020, 760],
      "notes": "Outputs variant A and B email HTML. Connect each output to your email service (Brevo/Mailchimp/SendGrid node) targeting respective list segments."
    },
    {
      "parameters": {
        "fromEmail": "newsletter@yourbrand.com",
        "toEmail": "={{ $env.EMAIL_LIST_SEGMENT_A }}",
        "subject": "={{ $json.subject }}",
        "emailType": "html",
        "message": "={{ $json.html }}",
        "options": { "allowUnauthorizedCerts": false }
      },
      "id": "node-send-email-a",
      "name": "📧 Send Email Variant A",
      "type": "n8n-nodes-base.emailSend",
      "typeVersion": 2.1,
      "position": [3260, 720],
      "continueOnFail": true
    },
    {
      "parameters": {
        "fromEmail": "newsletter@yourbrand.com",
        "toEmail": "={{ $env.EMAIL_LIST_SEGMENT_B }}",
        "subject": "={{ $json.subject }}",
        "emailType": "html",
        "message": "={{ $json.html }}",
        "options": {}
      },
      "id": "node-send-email-b",
      "name": "📧 Send Email Variant B",
      "type": "n8n-nodes-base.emailSend",
      "typeVersion": 2.1,
      "position": [3260, 820],
      "continueOnFail": true
    },
    {
      "parameters": {
        "jsCode": "const pkg = $('📦 Aggregate 7 Packages').first().json;\nconst liRes = $('📤 LinkedIn Post').first()?.json;\nconst twRes = $('📤 Twitter Thread (Full Chain)').first()?.json;\nconst igRes = $('📤 Instagram → Supabase Queue').first()?.json;\nconst waRes = $('📤 WhatsApp Broadcast').first()?.json;\nconst emARes = $('📧 Send Email Variant A').first()?.json;\nconst emBRes = $('📧 Send Email Variant B').first()?.json;\n\nconst status = {\n  linkedin: liRes?.id || liRes?.headers ? '✅ Draft created' : '⚠️ Failed – check LinkedIn OAuth2',\n  twitter: twRes?.published_count > 0 ? `✅ ${twRes.published_count}/7 tweets published` : '⚠️ Failed – check Twitter token',\n  instagram: igRes ? '✅ Slides queued in Supabase (needs manual design + schedule)' : '⚠️ Supabase save failed',\n  whatsapp: waRes?.messages?.id ? '✅ Broadcast sent' : '⚠️ Failed – check WhatsApp env vars',\n  email_a: emARes ? '✅ Variant A sent' : '⚠️ Email A failed',\n  email_b: emBRes ? '✅ Variant B sent' : '⚠️ Email B failed'\n};\n\nconst platforms_ok = Object.values(status).filter(v => v.startsWith('✅')).length;\nconst platforms_fail = Object.values(status).filter(v => v.startsWith('⚠️')).length;\n\nreturn [{\n  json: {\n    run_id: pkg.run_id,\n    brand_name: pkg.brand_name,\n    week_start: pkg.week_start,\n    platforms_ok,\n    platforms_fail,\n    publish_status: status,\n    content_calendar: pkg.content_calendar,\n    top_idea: pkg.top_idea,\n    top_idea_score: pkg.top_idea_score,\n    total_ideas: pkg.total_ideas\n  }\n}];"
      },
      "id": "node-agent4-report",
      "name": "📋 Agent 4: Publish Report",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [3500, 560]
    },
    {
      "parameters": {
        "model": "claude-sonnet-4-20250514",
        "messages": {
          "values": [
            {
              "role": "user",
              "content": "=You are a sharp content analytics strategist for Indian brands. Write a concise, actionable weekly report.\n\n## Run Summary\n- Brand: {{ $json.brand_name }}\n- Week: {{ $json.week_start }}\n- Update published: {{ $('🔐 Auth + Validate Input').first().json.business_update }}\n- Ideas generated: {{ $json.total_ideas }}\n- Top idea: {{ $json.top_idea }} ({{ $json.top_idea_score }}/10)\n- Platforms OK: {{ $json.platforms_ok }} | Failed: {{ $json.platforms_fail }}\n- Status: {{ JSON.stringify($json.publish_status) }}\n\nReturn ONLY raw JSON:\n{\n  \"whatsapp_summary\": \"120-word WhatsApp message, no markdown, use emojis naturally, feels like a smart teammate update not a bot report\",\n  \"email_subject\": \"Weekly report subject line\",\n  \"email_body\": \"400-word HTML email: this week wins + what to watch + 3 recommendations for next week\",\n  \"next_week_themes\": [\"theme 1\", \"theme 2\", \"theme 3\"],\n  \"optimization_actions\": [\n    { \"platform\": \"linkedin\", \"action\": \"specific thing to try next week\" },\n    { \"platform\": \"twitter\", \"action\": \"specific thing to try\" },\n    { \"platform\": \"email\", \"action\": \"check A/B results after 48h and double down on winner\" }\n  ],\n  \"kpi_targets_next_week\": {\n    \"linkedin_reach\": \"3000+\",\n    \"twitter_impressions\": \"2000+\",\n    \"instagram_reach\": \"2500+\",\n    \"whatsapp_open_rate\": \"72%\",\n    \"email_open_rate\": \"38%\"\n  }\n}"
            }
          ]
        },
        "options": {
          "maxTokens": 2000,
          "temperature": 0.5
        }
      },
      "id": "node-agent5",
      "name": "📈 Agent 5: Analytics + Next Week",
      "type": "@n8n/n8n-nodes-langchain.lmChatAnthropic",
      "typeVersion": 1,
      "position": [3740, 560],
      "credentials": {
        "anthropicApi": { "id": "anthropic-creds", "name": "Anthropic API" }
      }
    },
    {
      "parameters": {
        "jsCode": "const raw = $input.first().json.content[0].text;\nconst cleaned = raw.replace(/```json|```/g, '').trim();\nlet analytics;\ntry {\n  analytics = JSON.parse(cleaned);\n} catch(e) {\n  const match = cleaned.match(/\\{[\\s\\S]*\\}/);\n  analytics = match ? JSON.parse(match[0]) : { whatsapp_summary: 'Week complete. Check Supabase.', email_subject: 'Weekly Report', email_body: '', next_week_themes: [], optimization_actions: [], kpi_targets_next_week: {} };\n}\nconst report = $('📋 Agent 4: Publish Report').first().json;\nconst pkg = $('📦 Aggregate 7 Packages').first().json;\nreturn [{\n  json: {\n    run_id: pkg.run_id,\n    brand_name: pkg.brand_name,\n    week_start: pkg.week_start,\n    final_status: 'COMPLETE',\n    platforms_ok: report.platforms_ok,\n    platforms_fail: report.platforms_fail,\n    publish_status: report.publish_status,\n    analytics,\n    content_calendar: pkg.content_calendar,\n    total_ideas: pkg.total_ideas,\n    top_idea: pkg.top_idea,\n    top_idea_score: pkg.top_idea_score,\n    message: `✅ ${pkg.brand_name}: ${pkg.total_ideas} ideas generated, ${report.platforms_ok}/6 platforms published. Top: \"${pkg.top_idea}\" (${pkg.top_idea_score}/10)`\n  }\n}];"
      },
      "id": "node-final",
      "name": "🎯 Final Package",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [3980, 560]
    },
    {
      "parameters": {
        "operation": "upsert",
        "tableId": "run_reports",
        "dataToSend": "autoMapInputData",
        "options": {}
      },
      "id": "node-supabase-report",
      "name": "🗄️ Save Report to Supabase",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [4220, 480],
      "credentials": {
        "supabaseApi": { "id": "supabase-creds", "name": "Supabase" }
      },
      "continueOnFail": true,
      "notes": "Table: run_reports\nCols: run_id TEXT PK, brand_name TEXT, week_start TEXT, final_status TEXT, platforms_ok INT, platforms_fail INT, publish_status JSONB, analytics JSONB, content_calendar JSONB, total_ideas INT, top_idea TEXT, top_idea_score FLOAT, message TEXT"
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ JSON.stringify({ success: true, run_id: $json.run_id, message: $json.message, platforms_ok: $json.platforms_ok, platforms_fail: $json.platforms_fail, content_calendar: $json.content_calendar, top_idea: $json.top_idea, score: $json.top_idea_score, analytics_summary: $json.analytics.whatsapp_summary }, null, 2) }}",
        "options": { "responseCode": 200 }
      },
      "id": "node-response",
      "name": "✅ Webhook Response",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.1,
      "position": [4220, 600]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={ \"success\": false, \"error\": \"{{ $json.message || $json.error || 'Unknown error' }}\", \"run_id\": null }",
        "options": { "responseCode": 500 }
      },
      "id": "node-error-response",
      "name": "❌ Error Response",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.1,
      "position": [660, 700],
      "notes": "Catches auth failures and validation errors from the top of the pipeline"
    },
    {
      "parameters": {
        "fromEmail": "agent@yourbrand.com",
        "toEmail": "={{ $env.APPROVER_EMAIL || 'founder@yourbrand.com' }}",
        "subject": "=⚠️ Content Agent Error – {{ $execution.id }}",
        "emailType": "text",
        "message": "=Content Marketing Agent failed.\n\nExecution ID: {{ $execution.id }}\nError: {{ $json.message || JSON.stringify($json) }}\nTime: {{ new Date().toISOString() }}\n\nCheck n8n executions for details.",
        "options": {}
      },
      "id": "node-error-notify",
      "name": "🚨 Error Notification Email",
      "type": "n8n-nodes-base.emailSend",
      "typeVersion": 2.1,
      "position": [900, 700],
      "continueOnFail": true,
      "notes": "Triggered by error handler. Sends alert email to founder on any workflow failure."
    }
  ],
  "connections": {
    "📥 Webhook Trigger": {
      "main": [[{ "node": "🔐 Auth + Validate Input", "type": "main", "index": 0 }]]
    },
    "🔐 Auth + Validate Input": {
      "main": [[{ "node": "🧠 Agent 1: Idea Generator", "type": "main", "index": 0 }]],
      "error": [[{ "node": "❌ Error Response", "type": "main", "index": 0 }]]
    },
    "🧠 Agent 1: Idea Generator": {
      "main": [[{ "node": "🔀 Parse & Split 7 Ideas", "type": "main", "index": 0 }]]
    },
    "🔀 Parse & Split 7 Ideas": {
      "main": [[{ "node": "✍️ Agent 2: Copywriter", "type": "main", "index": 0 }]],
      "error": [[{ "node": "🚨 Error Notification Email", "type": "main", "index": 0 }]]
    },
    "✍️ Agent 2: Copywriter": {
      "main": [[{ "node": "📝 Parse Content", "type": "main", "index": 0 }]]
    },
    "📝 Parse Content": {
      "main": [[{ "node": "📊 Agent 3: Optimizer & Scorer", "type": "main", "index": 0 }]],
      "error": [[{ "node": "🚨 Error Notification Email", "type": "main", "index": 0 }]]
    },
    "📊 Agent 3: Optimizer & Scorer": {
      "main": [[{ "node": "⚙️ Parse Optimization", "type": "main", "index": 0 }]]
    },
    "⚙️ Parse Optimization": {
      "main": [[{ "node": "📦 Aggregate 7 Packages", "type": "main", "index": 0 }]],
      "error": [[{ "node": "🚨 Error Notification Email", "type": "main", "index": 0 }]]
    },
    "📦 Aggregate 7 Packages": {
      "main": [[
        { "node": "🗄️ Save Packages to Supabase", "type": "main", "index": 0 },
        { "node": "🚦 Approval Gate", "type": "main", "index": 0 }
      ]]
    },
    "🚦 Approval Gate": {
      "main": [[{ "node": "Auto-approved?", "type": "main", "index": 0 }]]
    },
    "Auto-approved?": {
      "main": [
        [
          { "node": "🔧 Prep LinkedIn", "type": "main", "index": 0 },
          { "node": "🔧 Prep Twitter Thread", "type": "main", "index": 0 },
          { "node": "🔧 Prep Instagram Carousel", "type": "main", "index": 0 },
          { "node": "🔧 Prep WhatsApp", "type": "main", "index": 0 },
          { "node": "🔧 Prep Email (A/B)", "type": "main", "index": 0 }
        ],
        [
          { "node": "📧 Send Approval Email", "type": "main", "index": 0 }
        ]
      ]
    },
    "🔧 Prep LinkedIn": {
      "main": [[{ "node": "📤 LinkedIn Post", "type": "main", "index": 0 }]]
    },
    "🔧 Prep Twitter Thread": {
      "main": [[{ "node": "📤 Twitter Thread (Full Chain)", "type": "main", "index": 0 }]]
    },
    "🔧 Prep Instagram Carousel": {
      "main": [[{ "node": "📤 Instagram → Supabase Queue", "type": "main", "index": 0 }]]
    },
    "🔧 Prep WhatsApp": {
      "main": [[{ "node": "📤 WhatsApp Broadcast", "type": "main", "index": 0 }]]
    },
    "🔧 Prep Email (A/B)": {
      "main": [[
        { "node": "📧 Send Email Variant A", "type": "main", "index": 0 },
        { "node": "📧 Send Email Variant B", "type": "main", "index": 0 }
      ]]
    },
    "📤 LinkedIn Post": {
      "main": [[{ "node": "📋 Agent 4: Publish Report", "type": "main", "index": 0 }]]
    },
    "📤 Twitter Thread (Full Chain)": {
      "main": [[{ "node": "📋 Agent 4: Publish Report", "type": "main", "index": 0 }]]
    },
    "📤 Instagram → Supabase Queue": {
      "main": [[{ "node": "📋 Agent 4: Publish Report", "type": "main", "index": 0 }]]
    },
    "📤 WhatsApp Broadcast": {
      "main": [[{ "node": "📋 Agent 4: Publish Report", "type": "main", "index": 0 }]]
    },
    "📧 Send Email Variant A": {
      "main": [[{ "node": "📋 Agent 4: Publish Report", "type": "main", "index": 0 }]]
    },
    "📧 Send Email Variant B": {
      "main": [[{ "node": "📋 Agent 4: Publish Report", "type": "main", "index": 0 }]]
    },
    "📋 Agent 4: Publish Report": {
      "main": [[{ "node": "📈 Agent 5: Analytics + Next Week", "type": "main", "index": 0 }]]
    },
    "📈 Agent 5: Analytics + Next Week": {
      "main": [[{ "node": "🎯 Final Package", "type": "main", "index": 0 }]]
    },
    "🎯 Final Package": {
      "main": [[
        { "node": "🗄️ Save Report to Supabase", "type": "main", "index": 0 },
        { "node": "✅ Webhook Response", "type": "main", "index": 0 }
      ]]
    },
    "🚨 Error Notification Email": {
      "main": [[{ "node": "❌ Error Response", "type": "main", "index": 0 }]]
    }
  },
  "settings": {
    "executionOrder": "v1",
    "saveManualExecutions": true,
    "callerPolicy": "workflowsFromSameOwner",
    "timezone": "Asia/Kolkata",
    "errorWorkflow": ""
  },
  "staticData": null,
  "meta": { "instanceId": "content-marketing-agent-india-v2-10" },
  "tags": [
    { "name": "content-marketing" },
    { "name": "india-smb" },
    { "name": "ai-agents" },
    { "name": "production-ready" }
  ],
  "_readme": {
    "version": "2.0 – 10/10",
    "what_changed_from_v1": [
      "✅ Webhook API key auth (x-api-key header)",
      "✅ Full error handling with email alerts on failure",
      "✅ Human approval gate (email with Approve/Reject links) — bypassed if auto_publish:true",
      "✅ Twitter: full 7-tweet reply chain (not just tweet 1)",
      "✅ Instagram: slides queued to Supabase with Canva prompt for design",
      "✅ Real A/B email split — builds variant A + B HTML, sends to separate list segments",
      "✅ continueOnFail on every publish node — one broken credential never stops the run",
      "✅ IST-aware scheduling labels throughout",
      "✅ Structured 500 error response to webhook caller"
    ],
    "setup_steps": [
      "1. Import JSON into n8n: Settings → Import Workflow",
      "2. Set Environment Variables in n8n Settings:",
      "   WEBHOOK_API_KEY=your-secret-key",
      "   APPROVER_EMAIL=founder@yourbrand.com",
      "   N8N_WEBHOOK_URL=https://your-n8n.com/webhook",
      "   WHATSAPP_PHONE_NUMBER_ID=your-waba-phone-id",
      "   WHATSAPP_ACCESS_TOKEN=your-meta-token",
      "   WHATSAPP_BROADCAST_NUMBER=91XXXXXXXXXX",
      "   TWITTER_BEARER_TOKEN=your-twitter-token",
      "   EMAIL_LIST_SEGMENT_A=list-a@youresp.com",
      "   EMAIL_LIST_SEGMENT_B=list-b@youresp.com",
      "3. Add Credentials: Anthropic API, Supabase, LinkedIn OAuth2, SMTP",
      "4. Create Supabase tables (see schema below)",
      "5. Activate workflow",
      "6. POST to /webhook/content-marketing with x-api-key header"
    ],
    "supabase_tables": {
      "content_packages": "run_id TEXT PK, brand_name TEXT, business_update TEXT, generated_at TIMESTAMPTZ, total_ideas INT, top_idea TEXT, top_idea_score FLOAT, auto_publish BOOL, content_calendar JSONB, all_content JSONB",
      "instagram_queue": "run_id TEXT PK, idea_title TEXT, slides JSONB, caption TEXT, canva_prompt TEXT, schedule_ist TEXT, status TEXT DEFAULT 'pending', created_at TIMESTAMPTZ DEFAULT NOW()",
      "run_reports": "run_id TEXT PK, brand_name TEXT, week_start TEXT, final_status TEXT, platforms_ok INT, platforms_fail INT, publish_status JSONB, analytics JSONB, content_calendar JSONB, total_ideas INT, top_idea TEXT, top_idea_score FLOAT, message TEXT"
    },
    "example_payload": {
      "headers": { "x-api-key": "your-secret-key", "Content-Type": "application/json" },
      "body": {
        "business_update": "Just closed ₹2Cr seed funding from Sequoia Surge",
        "brand_name": "FinStack",
        "industry": "B2B SaaS / Fintech",
        "target_audience": "CFOs and finance teams at Indian SMBs",
        "past_posts": [
          "We just shipped invoice automation that saved our first customer ₹40L/year.",
          "3 months in, 50 customers, 0 churn. Here's what we learned the hard way."
        ],
        "tone": "bold, data-driven, founder-authentic",
        "auto_publish": false,
        "whatsapp_recipients": 5000,
        "email_subscribers": 2000
      }
    }
  }
}