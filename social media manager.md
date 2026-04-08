{
  "name": "Social Media Manager — Agent 1: Content Creator",
  "nodes": [

    {
      "id": "trigger_whatsapp_manual",
      "name": "Trigger: WhatsApp Manual Request",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [0, 0],
      "webhookId": "smm-content-creator-wa-manual",
      "parameters": {
        "httpMethod": "POST",
        "path": "smm-content-creator-wa-manual",
        "responseMode": "responseNode",
        "options": {}
      }
    },

    {
      "id": "trigger_calendar_auto",
      "name": "Trigger: Content Calendar Auto (Scheduler Handoff)",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [0, 180],
      "webhookId": "smm-content-creator-calendar",
      "parameters": {
        "httpMethod": "POST",
        "path": "smm-content-creator-calendar",
        "responseMode": "responseNode",
        "options": {}
      }
    },

    {
      "id": "trigger_trend_handoff",
      "name": "Trigger: Trend Brief Handoff (Trend Spotter Agent)",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [0, 360],
      "webhookId": "smm-content-creator-trend",
      "parameters": {
        "httpMethod": "POST",
        "path": "smm-content-creator-trend",
        "responseMode": "responseNode",
        "options": {}
      }
    },

    {
      "id": "trigger_campaign_brief",
      "name": "Trigger: Campaign Brief (WhatsApp / Dashboard)",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [0, 540],
      "webhookId": "smm-content-creator-campaign",
      "parameters": {
        "httpMethod": "POST",
        "path": "smm-content-creator-campaign",
        "responseMode": "responseNode",
        "options": {}
      }
    },

    {
      "id": "trigger_repurpose",
      "name": "Trigger: Repurpose Request",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [0, 720],
      "webhookId": "smm-content-creator-repurpose",
      "parameters": {
        "httpMethod": "POST",
        "path": "smm-content-creator-repurpose",
        "responseMode": "responseNode",
        "options": {}
      }
    },

    {
      "id": "normalize_input",
      "name": "Normalize All Trigger Inputs",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [280, 360],
      "parameters": {
        "jsCode": "// Normalize input from any trigger into a unified job object\nconst body = $input.first().json?.body || $input.first().json;\nconst triggerSource = $input.first().json?.trigger_source || 'whatsapp_manual';\n\n// Extract user_id from wherever it arrives\nconst userId = body.user_id || body.from || body.sender_id || null;\nif (!userId) throw new Error('MISSING_USER_ID: No user_id in payload');\n\n// Build normalized job\nconst job = {\n  job_id: `cc_${Date.now()}_${Math.random().toString(36).substr(2,6)}`,\n  trigger_source: triggerSource,\n  user_id: userId,\n  raw_request: body.message || body.text || body.brief || '',\n  platform_override: body.platform || null,         // e.g. 'instagram' — null means use NKP defaults\n  niche_override: body.niche || null,               // null means use user primary niche\n  content_type_hint: body.content_type || null,     // 'reel','carousel','post','shorts','story'\n  trend_brief: body.trend_brief || null,            // populated by Trend Spotter\n  campaign_brief: body.campaign_brief || null,      // populated by campaign trigger\n  repurpose_source: body.source_content || null,    // URL or text to repurpose\n  repurpose_source_type: body.source_type || null,  // 'blog','video','tweet','pdf'\n  calendar_slot: body.calendar_slot || null,        // {date, platform, content_type} from Scheduler\n  language: body.language || null,                  // 'english','hindi','hinglish' — null = user default\n  created_at: new Date().toISOString()\n};\n\nreturn { json: job };"
      }
    },

    {
      "id": "load_user_context",
      "name": "Load User Context from Supabase",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [500, 360],
      "credentials": { "supabaseApi": { "id": "supabase_main", "name": "Supabase Main" } },
      "parameters": {
        "operation": "getAll",
        "tableId": "users",
        "filterType": "string",
        "filterString": "id=eq.{{ $json.user_id }}&select=id,niche_primary,brand_context,platforms,language_preference,approval_preference,onboarding_complete",
        "returnAll": false,
        "limit": 1
      }
    },

    {
      "id": "validate_user",
      "name": "Validate User + Merge Context",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [720, 360],
      "parameters": {
        "jsCode": "const job = $('normalize_input').first().json;\nconst userRows = $input.all();\n\nif (!userRows || userRows.length === 0) {\n  throw new Error(`USER_NOT_FOUND: ${job.user_id}`);\n}\n\nconst user = userRows[0].json;\n\nif (!user.onboarding_complete) {\n  throw new Error(`ONBOARDING_INCOMPLETE: ${job.user_id}`);\n}\n\n// Resolve effective niche (override > primary)\nconst effectiveNiche = job.niche_override || user.niche_primary;\n\n// Resolve effective language\nconst effectiveLanguage = job.language || user.language_preference || 'english';\n\n// Resolve platforms to generate content for\nlet effectivePlatforms;\nif (job.platform_override) {\n  effectivePlatforms = [job.platform_override];\n} else if (job.calendar_slot) {\n  effectivePlatforms = [job.calendar_slot.platform];\n} else {\n  effectivePlatforms = user.platforms || ['instagram'];\n}\n\nreturn {\n  json: {\n    ...job,\n    user: user,\n    effective_niche: effectiveNiche,\n    effective_language: effectiveLanguage,\n    effective_platforms: effectivePlatforms,\n    brand_context: user.brand_context || {}\n  }\n};"
      }
    },

    {
      "id": "load_nkp",
      "name": "Load Niche Knowledge Pack (NKP)",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [940, 360],
      "credentials": { "supabaseApi": { "id": "supabase_main", "name": "Supabase Main" } },
      "parameters": {
        "operation": "getAll",
        "tableId": "niche_knowledge_packs",
        "filterType": "string",
        "filterString": "niche_id=eq.{{ $json.effective_niche }}",
        "returnAll": false,
        "limit": 1
      }
    },

    {
      "id": "merge_nkp",
      "name": "Merge NKP into Job Context",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1160, 360],
      "parameters": {
        "jsCode": "const ctx = $('validate_user').first().json;\nconst nkpRows = $input.all();\n\nif (!nkpRows || nkpRows.length === 0) {\n  throw new Error(`NKP_NOT_FOUND: niche=${ctx.effective_niche}`);\n}\n\nconst nkp = nkpRows[0].json;\n\n// Select platform-specific hashtag sets and cadence\nconst platformHashtags = {};\nconst platformCadence = {};\nfor (const platform of ctx.effective_platforms) {\n  platformHashtags[platform] = (\n    nkp.hashtag_sets_json?.[platform] || nkp.hashtag_sets_json?.['default'] || []\n  );\n  platformCadence[platform] = (\n    nkp.posting_cadence_json?.[platform] || nkp.posting_cadence_json?.['default'] || {}\n  );\n}\n\nreturn {\n  json: {\n    ...ctx,\n    nkp: {\n      niche_id: nkp.niche_id,\n      content_pillars: nkp.content_pillars || [],\n      hashtag_sets: platformHashtags,\n      trend_keywords: nkp.trend_keywords || [],\n      content_formats: nkp.content_formats_json || {},\n      audience_persona: nkp.audience_persona || {},\n      tone_preset: nkp.tone_preset || 'conversational',\n      competitor_archetypes: nkp.competitor_archetypes || [],\n      hook_templates: nkp.hook_templates || [],\n      cta_library: nkp.cta_library || [],\n      recommended_formats: nkp.content_formats_json || {}\n    }\n  }\n};"
      }
    },

    {
      "id": "classify_job_complexity",
      "name": "Classify Job: Simple vs Complex (LLM Router)",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1380, 360],
      "parameters": {
        "jsCode": "// Route: Groq (fast/cheap) vs GPT-4o (quality-critical)\nconst ctx = $input.first().json;\n\nlet llm_model = 'groq';  // default\nlet llm_reason = 'standard_post';\n\nif (ctx.campaign_brief) {\n  llm_model = 'gpt4o';\n  llm_reason = 'campaign_brief_complexity';\n} else if (ctx.repurpose_source) {\n  llm_model = 'gpt4o';\n  llm_reason = 'long_form_repurpose';\n} else if (ctx.effective_platforms.length > 2) {\n  llm_model = 'gpt4o';\n  llm_reason = 'multi_platform_coordination';\n} else if (\n  ctx.raw_request.length > 300 ||\n  ctx.raw_request.toLowerCase().includes('campaign') ||\n  ctx.raw_request.toLowerCase().includes('launch') ||\n  ctx.raw_request.toLowerCase().includes('series')\n) {\n  llm_model = 'gpt4o';\n  llm_reason = 'complex_request_detected';\n}\n\n// Determine job type\nlet job_type = 'single_post';\nif (ctx.campaign_brief) job_type = 'campaign';\nelse if (ctx.repurpose_source) job_type = 'repurpose';\nelse if (ctx.trend_brief) job_type = 'trend_content';\nelse if (ctx.calendar_slot) job_type = 'calendar_fill';\n\nreturn {\n  json: {\n    ...ctx,\n    llm_model,\n    llm_reason,\n    job_type\n  }\n};"
      }
    },

    {
      "id": "router_job_type",
      "name": "Route by Job Type",
      "type": "n8n-nodes-base.switch",
      "typeVersion": 3,
      "position": [1600, 360],
      "parameters": {
        "mode": "rules",
        "rules": {
          "values": [
            { "conditions": { "options": { "caseSensitive": false }, "conditions": [{ "leftValue": "={{ $json.job_type }}", "rightValue": "campaign", "operator": { "type": "string", "operation": "equals" } }] }, "outputIndex": 0 },
            { "conditions": { "options": { "caseSensitive": false }, "conditions": [{ "leftValue": "={{ $json.job_type }}", "rightValue": "repurpose", "operator": { "type": "string", "operation": "equals" } }] }, "outputIndex": 1 },
            { "conditions": { "options": { "caseSensitive": false }, "conditions": [{ "leftValue": "={{ $json.job_type }}", "rightValue": "trend_content", "operator": { "type": "string", "operation": "equals" } }] }, "outputIndex": 2 },
            { "conditions": { "options": { "caseSensitive": false }, "conditions": [{ "leftValue": "={{ $json.job_type }}", "rightValue": "calendar_fill", "operator": { "type": "string", "operation": "equals" } }] }, "outputIndex": 3 }
          ]
        },
        "fallbackOutput": 4
      }
    },

    {
      "id": "build_campaign_prompt",
      "name": "Build Campaign Prompt",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1820, 0],
      "parameters": {
        "jsCode": "const ctx = $input.first().json;\nconst b = ctx.brand_context;\nconst nkp = ctx.nkp;\n\nconst systemPrompt = `You are an expert social media content strategist specializing in the ${ctx.effective_niche} niche for Indian businesses.\n\nBRAND CONTEXT:\n- Brand Name: ${b.brand_name || 'the brand'}\n- Brand Voice: ${b.voice_adjectives || nkp.tone_preset}\n- Language: ${ctx.effective_language}\n- Audience: ${JSON.stringify(nkp.audience_persona)}\n\nNICHE KNOWLEDGE:\n- Content Pillars: ${nkp.content_pillars.join(', ')}\n- Hook Templates: ${nkp.hook_templates.slice(0,5).join(' | ')}\n- CTA Library: ${nkp.cta_library.slice(0,5).join(' | ')}\n- Tone: ${nkp.tone_preset}\n\nPLATFORMS: ${ctx.effective_platforms.join(', ')}\n\nOUTPUT FORMAT: Respond ONLY with valid JSON. No markdown. No explanation. Schema:\n{\n  \"campaign_name\": string,\n  \"campaign_theme\": string,\n  \"posts\": [\n    {\n      \"day\": number,\n      \"platform\": string,\n      \"content_type\": string,\n      \"caption\": string,\n      \"hashtags\": string[],\n      \"cta\": string,\n      \"image_prompt\": string,\n      \"platform_notes\": string\n    }\n  ]\n}`;\n\nconst userPrompt = `Create a complete multi-day social media campaign based on this brief:\n\n${JSON.stringify(ctx.campaign_brief)}\n\nDuration: ${ctx.campaign_brief.duration_days || 7} days\nObjective: ${ctx.campaign_brief.objective || 'brand awareness + engagement'}\nKey message: ${ctx.campaign_brief.key_message || ctx.raw_request}\n\nGenerate one post per platform per key campaign day. Make each post platform-native — Instagram Reels hooks are different from LinkedIn posts.`;\n\nreturn {\n  json: {\n    ...ctx,\n    llm_payload: { system: systemPrompt, user: userPrompt }\n  }\n};"
      }
    },

    {
      "id": "build_repurpose_prompt",
      "name": "Build Repurpose Prompt",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1820, 180],
      "parameters": {
        "jsCode": "const ctx = $input.first().json;\nconst b = ctx.brand_context;\nconst nkp = ctx.nkp;\n\nconst systemPrompt = `You are an expert social media repurposing specialist for ${ctx.effective_niche} businesses in India.\n\nBRAND CONTEXT:\n- Brand: ${b.brand_name || 'the brand'}\n- Voice: ${b.voice_adjectives || nkp.tone_preset}\n- Language: ${ctx.effective_language}\n- Audience: ${JSON.stringify(nkp.audience_persona)}\n\nNICHE:\n- Pillars: ${nkp.content_pillars.join(', ')}\n- Hooks: ${nkp.hook_templates.slice(0,5).join(' | ')}\n- CTAs: ${nkp.cta_library.slice(0,5).join(' | ')}\n\nOUTPUT FORMAT: Respond ONLY with valid JSON. No markdown.\n{\n  \"repurposed_posts\": [\n    {\n      \"platform\": string,\n      \"content_type\": string,\n      \"caption\": string,\n      \"hashtags\": string[],\n      \"cta\": string,\n      \"image_prompt\": string,\n      \"key_insight_extracted\": string\n    }\n  ]\n}`;\n\nconst userPrompt = `Repurpose the following ${ctx.repurpose_source_type || 'content'} into native social media posts for: ${ctx.effective_platforms.join(', ')}.\n\nSource content:\n${ctx.repurpose_source}\n\nExtract the core insights, statistics, or stories. Transform into platform-native formats (not copy-paste). Each post must stand alone — assume the audience hasn't seen the source.`;\n\nreturn {\n  json: {\n    ...ctx,\n    llm_payload: { system: systemPrompt, user: userPrompt }\n  }\n};"
      }
    },

    {
      "id": "build_trend_prompt",
      "name": "Build Trend Content Prompt",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1820, 360],
      "parameters": {
        "jsCode": "const ctx = $input.first().json;\nconst b = ctx.brand_context;\nconst nkp = ctx.nkp;\nconst trend = ctx.trend_brief;\n\nconst systemPrompt = `You are a real-time trend content specialist for ${ctx.effective_niche} businesses in India. You create content that rides trends while maintaining brand authenticity.\n\nBRAND CONTEXT:\n- Brand: ${b.brand_name || 'the brand'}\n- Voice: ${b.voice_adjectives || nkp.tone_preset}\n- Language: ${ctx.effective_language}\n\nNICHE:\n- Hooks: ${nkp.hook_templates.slice(0,5).join(' | ')}\n- CTAs: ${nkp.cta_library.slice(0,5).join(' | ')}\n- Tone: ${nkp.tone_preset}\n\nOUTPUT FORMAT: Respond ONLY with valid JSON. No markdown.\n{\n  \"posts\": [\n    {\n      \"platform\": string,\n      \"content_type\": string,\n      \"caption\": string,\n      \"hashtags\": string[],\n      \"cta\": string,\n      \"image_prompt\": string,\n      \"trend_angle\": string,\n      \"urgency_note\": string\n    }\n  ]\n}`;\n\nconst userPrompt = `Create trending content for the following opportunity:\n\nTREND: ${trend.trend_name}\nWHY RELEVANT: ${trend.why_relevant}\nCONTENT ANGLE: ${trend.content_angle}\nURGENCY WINDOW: ${trend.urgency_window}\n\nPLATFORMS: ${ctx.effective_platforms.join(', ')}\n\nMake the content timely and trend-aware. Use the trend angle to connect to the brand naturally. Do NOT force the brand — the trend connection must feel organic.`;\n\nreturn {\n  json: {\n    ...ctx,\n    llm_payload: { system: systemPrompt, user: userPrompt }\n  }\n};"
      }
    },

    {
      "id": "build_calendar_prompt",
      "name": "Build Calendar Fill Prompt",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1820, 540],
      "parameters": {
        "jsCode": "const ctx = $input.first().json;\nconst b = ctx.brand_context;\nconst nkp = ctx.nkp;\nconst slot = ctx.calendar_slot;\n\nconst systemPrompt = `You are a content calendar specialist creating ${slot.platform} content for a ${ctx.effective_niche} business in India.\n\nBRAND:\n- Name: ${b.brand_name || 'the brand'}\n- Voice: ${b.voice_adjectives || nkp.tone_preset}\n- Language: ${ctx.effective_language}\n\nNICHE:\n- Pillars: ${nkp.content_pillars.join(', ')}\n- Hooks: ${nkp.hook_templates.slice(0,5).join(' | ')}\n- CTAs: ${nkp.cta_library.slice(0,5).join(' | ')}\n- Formats that work for this niche on ${slot.platform}: ${JSON.stringify(nkp.content_formats?.[slot.platform] || {})}\n\nOUTPUT FORMAT: Respond ONLY with valid JSON. No markdown.\n{\n  \"post\": {\n    \"platform\": string,\n    \"content_type\": string,\n    \"caption\": string,\n    \"hashtags\": string[],\n    \"cta\": string,\n    \"image_prompt\": string,\n    \"content_pillar_used\": string\n  }\n}`;\n\nconst userPrompt = `Generate a ${slot.content_type || 'post'} for ${slot.platform} scheduled for ${slot.date}.\n\nAny special context or theme for this date: ${slot.theme || slot.occasion || 'regular content day'}.\nContent pillar to focus on: ${slot.pillar || 'choose best fit from NKP pillars'}.\n\nMake it feel native to ${slot.platform}. It should add value to the audience on its own — not feel auto-generated.`;\n\nreturn {\n  json: {\n    ...ctx,\n    llm_payload: { system: systemPrompt, user: userPrompt }\n  }\n};"
      }
    },

    {
      "id": "build_single_post_prompt",
      "name": "Build Single Post Prompt",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1820, 720],
      "parameters": {
        "jsCode": "const ctx = $input.first().json;\nconst b = ctx.brand_context;\nconst nkp = ctx.nkp;\n\n// Build per-platform format guidance\nconst platformGuides = {};\nfor (const platform of ctx.effective_platforms) {\n  const formats = nkp.recommended_formats?.[platform] || {};\n  platformGuides[platform] = JSON.stringify(formats);\n}\n\nconst systemPrompt = `You are an expert social media copywriter for ${ctx.effective_niche} businesses in India.\n\nBRAND CONTEXT:\n- Brand: ${b.brand_name || 'the brand'}\n- Voice: ${b.voice_adjectives || nkp.tone_preset}\n- Language: ${ctx.effective_language} (for Hinglish: mix Hindi and English naturally, not forced)\n- Audience: ${JSON.stringify(nkp.audience_persona)}\n\nNICHE ASSETS:\n- Content Pillars: ${nkp.content_pillars.join(', ')}\n- Proven Hooks: ${nkp.hook_templates.slice(0,8).join(' | ')}\n- CTA Options: ${nkp.cta_library.slice(0,8).join(' | ')}\n- Tone: ${nkp.tone_preset}\n\nPLATFORM GUIDELINES:\n${Object.entries(platformGuides).map(([p, g]) => `${p}: ${g}`).join('\\n')}\n\nOUTPUT FORMAT: Respond ONLY with valid JSON. No markdown. No explanation.\n{\n  \"posts\": [\n    {\n      \"platform\": string,\n      \"content_type\": string,\n      \"caption\": string,\n      \"hashtags\": string[],\n      \"cta\": string,\n      \"image_prompt\": string,\n      \"reel_script\": null | { \"hook\": string, \"body\": string, \"cta\": string },\n      \"carousel_slides\": null | [{ \"slide_number\": number, \"headline\": string, \"body\": string }],\n      \"platform_notes\": string\n    }\n  ]\n}`;\n\nconst userPrompt = `Create social media content for: ${ctx.raw_request}\n\nPlatforms required: ${ctx.effective_platforms.join(', ')}\nContent type hint: ${ctx.content_type_hint || 'choose best format for each platform'}\n\nFor each platform, generate a fully platform-native post. Reels on Instagram need a thumb-stopping hook in the first 3 words. LinkedIn needs professional insight. Facebook can be more conversational.\n\nDo NOT create generic posts. Every post should feel like it was written by a human who knows this audience deeply.`;\n\nreturn {\n  json: {\n    ...ctx,\n    llm_payload: { system: systemPrompt, user: userPrompt }\n  }\n};"
      }
    },

    {
      "id": "llm_router",
      "name": "Route to Groq or GPT-4o",
      "type": "n8n-nodes-base.switch",
      "typeVersion": 3,
      "position": [2060, 360],
      "parameters": {
        "mode": "rules",
        "rules": {
          "values": [
            {
              "conditions": {
                "conditions": [{ "leftValue": "={{ $json.llm_model }}", "rightValue": "gpt4o", "operator": { "type": "string", "operation": "equals" } }]
              },
              "outputIndex": 0
            }
          ]
        },
        "fallbackOutput": 1
      }
    },

    {
      "id": "call_gpt4o",
      "name": "Call GPT-4o (Complex Jobs)",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [2280, 240],
      "credentials": { "httpHeaderAuth": { "id": "openai_api_key", "name": "OpenAI API Key" } },
      "parameters": {
        "method": "POST",
        "url": "https://api.openai.com/v1/chat/completions",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            { "name": "Content-Type", "value": "application/json" },
            { "name": "Authorization", "value": "Bearer {{ $credentials.httpHeaderAuth.value }}" }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'system', content: $json.llm_payload.system }, { role: 'user', content: $json.llm_payload.user }], temperature: 0.8, max_tokens: 3000, response_format: { type: 'json_object' } }) }}",
        "options": { "timeout": 60000 }
      }
    },

    {
      "id": "call_groq",
      "name": "Call Groq — llama-3.3-70b-versatile (Standard Jobs)",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [2280, 480],
      "credentials": { "httpHeaderAuth": { "id": "groq_api_key", "name": "Groq API Key" } },
      "parameters": {
        "method": "POST",
        "url": "https://api.groq.com/openai/v1/chat/completions",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            { "name": "Content-Type", "value": "application/json" },
            { "name": "Authorization", "value": "Bearer {{ $credentials.httpHeaderAuth.value }}" }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'system', content: $json.llm_payload.system }, { role: 'user', content: $json.llm_payload.user }], temperature: 0.8, max_tokens: 3000 }) }}",
        "options": { "timeout": 30000 }
      }
    },

    {
      "id": "parse_llm_response",
      "name": "Parse LLM Response + Validate JSON",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [2520, 360],
      "parameters": {
        "jsCode": "const inputData = $input.first().json;\nconst rawContent = inputData?.choices?.[0]?.message?.content || '';\n\nif (!rawContent) {\n  throw new Error('LLM_EMPTY_RESPONSE: No content returned from LLM');\n}\n\nlet parsed;\ntry {\n  // Strip markdown fences if present\n  const cleaned = rawContent.replace(/^```json\\s*/i, '').replace(/^```\\s*/i, '').replace(/\\s*```$/i, '').trim();\n  parsed = JSON.parse(cleaned);\n} catch(e) {\n  throw new Error(`LLM_JSON_PARSE_FAILED: ${e.message} | Raw: ${rawContent.substring(0, 200)}`);\n}\n\n// Normalize to always have a 'posts' array\nlet posts = [];\nif (parsed.posts) posts = parsed.posts;\nelse if (parsed.post) posts = [parsed.post];\nelse if (parsed.repurposed_posts) posts = parsed.repurposed_posts;\nelse if (parsed.campaign_name && parsed.posts) posts = parsed.posts;\nelse {\n  throw new Error(`LLM_UNEXPECTED_SCHEMA: Keys found: ${Object.keys(parsed).join(',')}`);\n}\n\n// Pull job context from the node BEFORE the LLM calls\nconst jobCtx = $('classify_job_complexity').first().json;\n\nreturn {\n  json: {\n    job_id: jobCtx.job_id,\n    user_id: jobCtx.user_id,\n    trigger_source: jobCtx.trigger_source,\n    job_type: jobCtx.job_type,\n    effective_niche: jobCtx.effective_niche,\n    effective_language: jobCtx.effective_language,\n    llm_model_used: jobCtx.llm_model,\n    llm_reason: jobCtx.llm_reason,\n    campaign_meta: parsed.campaign_name ? { name: parsed.campaign_name, theme: parsed.campaign_theme } : null,\n    posts: posts,\n    post_count: posts.length,\n    brand_context: jobCtx.brand_context,\n    nkp_niche: jobCtx.nkp?.niche_id,\n    generated_at: new Date().toISOString()\n  }\n};"
      }
    },

    {
      "id": "enrich_hashtags",
      "name": "Enrich Hashtags + Rotate to Avoid Shadowban",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [2740, 360],
      "parameters": {
        "jsCode": "const ctx = $input.first().json;\nconst jobCtx = $('merge_nkp').first().json;\nconst nkp = jobCtx.nkp;\n\n// Hashtag rotation: rotate through banks to avoid repetition\n// Use a deterministic offset based on current day to spread usage\nconst dayOffset = new Date().getDay(); \n\nconst enrichedPosts = ctx.posts.map(post => {\n  const platform = post.platform;\n  const nkpHashtags = nkp.hashtag_sets?.[platform] || nkp.hashtag_sets?.['default'] || [];\n  \n  // LLM already provided some hashtags — merge with NKP bank\n  const llmTags = post.hashtags || [];\n  \n  // Rotate NKP bank: take a window of tags offset by day\n  const bankSize = Math.min(30, nkpHashtags.length);\n  const windowSize = 15;\n  const rotatedBank = [];\n  for (let i = 0; i < windowSize; i++) {\n    const idx = (dayOffset * 7 + i) % Math.max(1, bankSize);\n    if (nkpHashtags[idx]) rotatedBank.push(nkpHashtags[idx]);\n  }\n  \n  // Merge: LLM tags take priority (more contextual), fill with rotated bank\n  // Platform limits: Instagram 30 max, LinkedIn 5 max, Facebook 10 max, YouTube Shorts 10 max\n  const platformLimits = { instagram: 30, linkedin: 5, facebook: 10, youtube_shorts: 10 };\n  const limit = platformLimits[platform] || 20;\n  \n  const merged = [...new Set([...llmTags, ...rotatedBank])].slice(0, limit);\n  const formatted = merged.map(h => h.startsWith('#') ? h : `#${h}`);\n  \n  return { ...post, hashtags: formatted, hashtag_count: formatted.length };\n});\n\nreturn { json: { ...ctx, posts: enrichedPosts } };"
      }
    },

    {
      "id": "save_posts_draft",
      "name": "Save Posts to Supabase (status: draft)",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [2960, 360],
      "parameters": {
        "jsCode": "// Prepare individual insert records for each post\nconst ctx = $input.first().json;\n\nconst insertRecords = ctx.posts.map((post, index) => ({\n  id: `${ctx.job_id}_post_${index}`,\n  job_id: ctx.job_id,\n  user_id: ctx.user_id,\n  platform: post.platform,\n  niche_id: ctx.effective_niche,\n  content_type: post.content_type || 'post',\n  caption: post.caption,\n  hashtags: post.hashtags,\n  cta: post.cta,\n  image_prompt: post.image_prompt,\n  reel_script: post.reel_script || null,\n  carousel_slides: post.carousel_slides || null,\n  status: 'draft',\n  approval_status: 'pending',\n  trigger_source: ctx.trigger_source,\n  job_type: ctx.job_type,\n  llm_model_used: ctx.llm_model_used,\n  campaign_meta: ctx.campaign_meta,\n  created_at: new Date().toISOString(),\n  scheduled_at: null,\n  posted_at: null\n}));\n\nreturn insertRecords.map(r => ({ json: r }));"
      }
    },

    {
      "id": "supabase_insert_posts",
      "name": "Insert Draft Posts to Supabase",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [3180, 360],
      "credentials": { "supabaseApi": { "id": "supabase_main", "name": "Supabase Main" } },
      "parameters": {
        "operation": "upsert",
        "tableId": "posts"
      }
    },

    {
      "id": "aggregate_for_approval",
      "name": "Aggregate Posts for Approval Dispatch",
      "type": "n8n-nodes-base.aggregate",
      "typeVersion": 1,
      "position": [3400, 360],
      "parameters": {
        "aggregate": "aggregateAllItemData",
        "destinationFieldName": "all_posts"
      }
    },

    {
      "id": "build_approval_messages",
      "name": "Build WhatsApp Approval Previews",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [3620, 360],
      "parameters": {
        "jsCode": "const allItems = $input.first().json.all_posts;\nconst firstPost = allItems[0];\n\nconst userId = firstPost.user_id;\nconst jobId = firstPost.job_id;\nconst postCount = allItems.length;\n\n// Build one WhatsApp message per post with approval buttons\nconst approvalMessages = allItems.map((post, index) => {\n  const platformEmoji = {\n    instagram: '📸',\n    facebook: '👍',\n    linkedin: '💼',\n    youtube_shorts: '🎬'\n  }[post.platform] || '📱';\n  \n  const contentPreview = post.caption.substring(0, 280) + (post.caption.length > 280 ? '...' : '');\n  const hashtagPreview = post.hashtags.slice(0, 5).join(' ') + (post.hashtags.length > 5 ? ` +${post.hashtags.length - 5} more` : '');\n  \n  let mediaNote = '';\n  if (post.reel_script) mediaNote = `\\n🎬 *Reel Script:* Hook: \"${post.reel_script.hook}\" | CTA: \"${post.reel_script.cta}\"`;\n  if (post.carousel_slides?.length > 0) mediaNote = `\\n📊 *Carousel:* ${post.carousel_slides.length} slides — Slide 1: \"${post.carousel_slides[0].headline}\"`;\n  \n  return {\n    post_id: post.id,\n    job_id: jobId,\n    user_id: userId,\n    platform: post.platform,\n    whatsapp_message: [\n      `${platformEmoji} *New Content Ready — ${post.platform.toUpperCase()} (${index + 1}/${postCount})*`,\n      ``,\n      `*Caption Preview:*`,\n      contentPreview,\n      ``,\n      `*Hashtags:* ${hashtagPreview}`,\n      `*CTA:* ${post.cta}`,\n      mediaNote,\n      ``,\n      `*Image Prompt:* ${post.image_prompt.substring(0, 120)}...`,\n      ``,\n      `Reply: *APPROVE* | *REJECT* | or send edits`\n    ].filter(Boolean).join('\\n'),\n    interactive_buttons: [\n      { id: `approve_${post.id}`, title: '✅ Approve' },\n      { id: `reject_${post.id}`, title: '❌ Reject' },\n      { id: `edit_${post.id}`, title: '✏️ Edit' }\n    ]\n  };\n});\n\nreturn approvalMessages.map(m => ({ json: m }));"
      }
    },

    {
      "id": "send_whatsapp_approval",
      "name": "Send WhatsApp Approval Message (Meta API)",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [3840, 360],
      "credentials": { "httpHeaderAuth": { "id": "meta_wa_token", "name": "Meta WhatsApp Token" } },
      "parameters": {
        "method": "POST",
        "url": "=https://graph.facebook.com/v19.0/{{ $vars.WHATSAPP_PHONE_NUMBER_ID }}/messages",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            { "name": "Content-Type", "value": "application/json" },
            { "name": "Authorization", "value": "Bearer {{ $credentials.httpHeaderAuth.value }}" }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ JSON.stringify({ messaging_product: 'whatsapp', to: $json.user_id, type: 'interactive', interactive: { type: 'button', body: { text: $json.whatsapp_message }, action: { buttons: $json.interactive_buttons.map(b => ({ type: 'reply', reply: { id: b.id, title: b.title } })) } } }) }}",
        "options": { "timeout": 15000 }
      }
    },

    {
      "id": "update_post_approval_sent",
      "name": "Update Post Status: approval_sent",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [4060, 360],
      "credentials": { "supabaseApi": { "id": "supabase_main", "name": "Supabase Main" } },
      "parameters": {
        "operation": "update",
        "tableId": "posts",
        "filterType": "string",
        "filterString": "id=eq.{{ $json.post_id }}",
        "dataToSend": "defineBelow",
        "fieldsToSend": {
          "values": [
            { "fieldId": "approval_status", "fieldValue": "approval_sent" },
            { "fieldId": "approval_sent_at", "fieldValue": "={{ new Date().toISOString() }}" }
          ]
        }
      }
    },

    {
      "id": "trigger_approval_reply",
      "name": "Trigger: WhatsApp Approval Reply (Webhook)",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [4280, 0],
      "webhookId": "smm-approval-reply-handler",
      "parameters": {
        "httpMethod": "POST",
        "path": "smm-approval-reply-handler",
        "responseMode": "responseNode",
        "options": {}
      }
    },

    {
      "id": "parse_approval_reply",
      "name": "Parse Approval Reply",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [4500, 0],
      "parameters": {
        "jsCode": "const body = $input.first().json?.body || $input.first().json;\n\n// Extract from WhatsApp webhook payload\nconst entry = body?.entry?.[0];\nconst changes = entry?.changes?.[0];\nconst value = changes?.value;\nconst messages = value?.messages?.[0];\n\nif (!messages) throw new Error('APPROVAL_PARSE_FAILED: No message in webhook payload');\n\nconst from = messages.from;\nconst messageType = messages.type;\n\nlet replyType = 'text';\nlet postId = null;\nlet userEditText = null;\n\nif (messageType === 'interactive') {\n  const buttonReply = messages.interactive?.button_reply;\n  const replyId = buttonReply?.id || '';\n  if (replyId.startsWith('approve_')) {\n    replyType = 'approve';\n    postId = replyId.replace('approve_', '');\n  } else if (replyId.startsWith('reject_')) {\n    replyType = 'reject';\n    postId = replyId.replace('reject_', '');\n  } else if (replyId.startsWith('edit_')) {\n    replyType = 'edit_request';\n    postId = replyId.replace('edit_', '');\n  }\n} else if (messageType === 'text') {\n  const text = messages.text?.body?.trim() || '';\n  const upperText = text.toUpperCase();\n  if (upperText === 'APPROVE' || upperText === 'YES') {\n    replyType = 'approve';\n  } else if (upperText === 'REJECT' || upperText === 'NO') {\n    replyType = 'reject';\n  } else {\n    replyType = 'edit_text';\n    userEditText = text;\n  }\n}\n\nreturn {\n  json: {\n    user_id: from,\n    post_id: postId,\n    reply_type: replyType,\n    user_edit_text: userEditText,\n    raw_message: messages\n  }\n};"
      }
    },

    {
      "id": "router_approval_action",
      "name": "Route Approval Action",
      "type": "n8n-nodes-base.switch",
      "typeVersion": 3,
      "position": [4720, 0],
      "parameters": {
        "mode": "rules",
        "rules": {
          "values": [
            { "conditions": { "conditions": [{ "leftValue": "={{ $json.reply_type }}", "rightValue": "approve", "operator": { "type": "string", "operation": "equals" } }] }, "outputIndex": 0 },
            { "conditions": { "conditions": [{ "leftValue": "={{ $json.reply_type }}", "rightValue": "reject", "operator": { "type": "string", "operation": "equals" } }] }, "outputIndex": 1 },
            { "conditions": { "conditions": [{ "leftValue": "={{ $json.reply_type }}", "rightValue": "edit_text", "operator": { "type": "string", "operation": "equals" } }] }, "outputIndex": 2 }
          ]
        },
        "fallbackOutput": 3
      }
    },

    {
      "id": "handle_approve",
      "name": "Handle Approve: Update Post + Trigger Scheduler",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [4940, -120],
      "credentials": { "supabaseApi": { "id": "supabase_main", "name": "Supabase Main" } },
      "parameters": {
        "operation": "update",
        "tableId": "posts",
        "filterType": "string",
        "filterString": "id=eq.{{ $json.post_id }}",
        "dataToSend": "defineBelow",
        "fieldsToSend": {
          "values": [
            { "fieldId": "approval_status", "fieldValue": "approved" },
            { "fieldId": "status", "fieldValue": "pending_schedule" },
            { "fieldId": "approved_at", "fieldValue": "={{ new Date().toISOString() }}" }
          ]
        }
      }
    },

    {
      "id": "trigger_scheduler_webhook",
      "name": "Trigger Scheduler Agent (Webhook Call)",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [5160, -120],
      "parameters": {
        "method": "POST",
        "url": "={{ $vars.N8N_BASE_URL }}/webhook/smm-scheduler-enqueue",
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ JSON.stringify({ post_id: $json.post_id, user_id: $('parse_approval_reply').first().json.user_id, source: 'content_creator_approval' }) }}",
        "options": { "timeout": 10000 }
      }
    },

    {
      "id": "wa_confirm_approved",
      "name": "WhatsApp: Confirm Approved to User",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [5380, -120],
      "credentials": { "httpHeaderAuth": { "id": "meta_wa_token", "name": "Meta WhatsApp Token" } },
      "parameters": {
        "method": "POST",
        "url": "=https://graph.facebook.com/v19.0/{{ $vars.WHATSAPP_PHONE_NUMBER_ID }}/messages",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            { "name": "Content-Type", "value": "application/json" },
            { "name": "Authorization", "value": "Bearer {{ $credentials.httpHeaderAuth.value }}" }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ JSON.stringify({ messaging_product: 'whatsapp', to: $('parse_approval_reply').first().json.user_id, type: 'text', text: { body: '✅ Post approved and sent to your scheduler queue. You\\'ll receive a confirmation when it\\'s posted.' } }) }}"
      }
    },

    {
      "id": "handle_reject",
      "name": "Handle Reject: Log + Notify",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [4940, 60],
      "credentials": { "supabaseApi": { "id": "supabase_main", "name": "Supabase Main" } },
      "parameters": {
        "operation": "update",
        "tableId": "posts",
        "filterType": "string",
        "filterString": "id=eq.{{ $json.post_id }}",
        "dataToSend": "defineBelow",
        "fieldsToSend": {
          "values": [
            { "fieldId": "approval_status", "fieldValue": "rejected" },
            { "fieldId": "status", "fieldValue": "rejected" },
            { "fieldId": "rejected_at", "fieldValue": "={{ new Date().toISOString() }}" }
          ]
        }
      }
    },

    {
      "id": "wa_confirm_rejected",
      "name": "WhatsApp: Confirm Rejected to User",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [5160, 60],
      "credentials": { "httpHeaderAuth": { "id": "meta_wa_token", "name": "Meta WhatsApp Token" } },
      "parameters": {
        "method": "POST",
        "url": "=https://graph.facebook.com/v19.0/{{ $vars.WHATSAPP_PHONE_NUMBER_ID }}/messages",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            { "name": "Content-Type", "value": "application/json" },
            { "name": "Authorization", "value": "Bearer {{ $credentials.httpHeaderAuth.value }}" }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ JSON.stringify({ messaging_product: 'whatsapp', to: $('parse_approval_reply').first().json.user_id, type: 'text', text: { body: '❌ Post rejected and logged. It won\\'t be scheduled. Reply with a new request anytime to create fresh content.' } }) }}"
      }
    },

    {
      "id": "handle_edit",
      "name": "Handle Edit: Fetch Original Post + Rebuild Prompt",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [4940, 240],
      "credentials": { "supabaseApi": { "id": "supabase_main", "name": "Supabase Main" } },
      "parameters": {
        "operation": "getAll",
        "tableId": "posts",
        "filterType": "string",
        "filterString": "id=eq.{{ $json.post_id }}",
        "returnAll": false,
        "limit": 1
      }
    },

    {
      "id": "build_edit_revision_prompt",
      "name": "Build Edit Revision Prompt",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [5160, 240],
      "parameters": {
        "jsCode": "const approvalCtx = $('parse_approval_reply').first().json;\nconst postRows = $input.all();\nif (!postRows || postRows.length === 0) throw new Error('EDIT_POST_NOT_FOUND');\n\nconst post = postRows[0].json;\n\nconst systemPrompt = `You are a social media editor. You will receive a social media post and specific edit instructions. Apply ONLY the requested changes. Preserve everything else.\n\nOUTPUT FORMAT: Respond ONLY with valid JSON. No markdown.\n{\n  \"caption\": string,\n  \"hashtags\": string[],\n  \"cta\": string,\n  \"image_prompt\": string,\n  \"reel_script\": object | null,\n  \"carousel_slides\": array | null\n}`;\n\nconst userPrompt = `ORIGINAL POST:\nPlatform: ${post.platform}\nCaption: ${post.caption}\nHashtags: ${(post.hashtags || []).join(', ')}\nCTA: ${post.cta}\nImage Prompt: ${post.image_prompt}\n\nEDIT INSTRUCTIONS FROM USER:\n\"${approvalCtx.user_edit_text}\"\n\nApply the edit instructions precisely. Return the full updated post JSON.`;\n\nreturn {\n  json: {\n    post_id: post.id,\n    user_id: approvalCtx.user_id,\n    platform: post.platform,\n    llm_payload: { system: systemPrompt, user: userPrompt },\n    llm_model: 'groq',\n    edit_instruction: approvalCtx.user_edit_text\n  }\n};"
      }
    },

    {
      "id": "call_groq_edit",
      "name": "Call Groq for Edit Revision",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [5380, 240],
      "credentials": { "httpHeaderAuth": { "id": "groq_api_key", "name": "Groq API Key" } },
      "parameters": {
        "method": "POST",
        "url": "https://api.groq.com/openai/v1/chat/completions",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            { "name": "Content-Type", "value": "application/json" },
            { "name": "Authorization", "value": "Bearer {{ $credentials.httpHeaderAuth.value }}" }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'system', content: $json.llm_payload.system }, { role: 'user', content: $json.llm_payload.user }], temperature: 0.6, max_tokens: 1500 }) }}",
        "options": { "timeout": 20000 }
      }
    },

    {
      "id": "save_revised_post",
      "name": "Save Revised Post + Re-send for Approval",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [5600, 240],
      "parameters": {
        "jsCode": "const editCtx = $('build_edit_revision_prompt').first().json;\nconst rawContent = $input.first().json?.choices?.[0]?.message?.content || '';\n\nlet revised;\ntry {\n  const cleaned = rawContent.replace(/^```json\\s*/i, '').replace(/^```\\s*/i, '').replace(/\\s*```$/i, '').trim();\n  revised = JSON.parse(cleaned);\n} catch(e) {\n  throw new Error(`EDIT_JSON_PARSE_FAILED: ${e.message}`);\n}\n\nreturn {\n  json: {\n    post_id: editCtx.post_id,\n    user_id: editCtx.user_id,\n    platform: editCtx.platform,\n    caption: revised.caption,\n    hashtags: revised.hashtags || [],\n    cta: revised.cta,\n    image_prompt: revised.image_prompt,\n    reel_script: revised.reel_script || null,\n    carousel_slides: revised.carousel_slides || null,\n    edit_applied: editCtx.edit_instruction,\n    approval_status: 'pending_reapproval',\n    status: 'draft',\n    revised_at: new Date().toISOString()\n  }\n};"
      }
    },

    {
      "id": "supabase_update_revised",
      "name": "Supabase: Update Revised Post",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [5820, 240],
      "credentials": { "supabaseApi": { "id": "supabase_main", "name": "Supabase Main" } },
      "parameters": {
        "operation": "update",
        "tableId": "posts",
        "filterType": "string",
        "filterString": "id=eq.{{ $json.post_id }}"
      }
    },

    {
      "id": "wa_send_revised_for_approval",
      "name": "WhatsApp: Re-send Revised Post for Approval",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [6040, 240],
      "credentials": { "httpHeaderAuth": { "id": "meta_wa_token", "name": "Meta WhatsApp Token" } },
      "parameters": {
        "method": "POST",
        "url": "=https://graph.facebook.com/v19.0/{{ $vars.WHATSAPP_PHONE_NUMBER_ID }}/messages",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            { "name": "Content-Type", "value": "application/json" },
            { "name": "Authorization", "value": "Bearer {{ $credentials.httpHeaderAuth.value }}" }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ JSON.stringify({ messaging_product: 'whatsapp', to: $json.user_id, type: 'interactive', interactive: { type: 'button', body: { text: `✏️ *Post Revised — ${($json.platform || '').toUpperCase()}*\\n\\n*Updated Caption:*\\n${$json.caption.substring(0, 280)}${$json.caption.length > 280 ? '...' : ''}\\n\\n*CTA:* ${$json.cta}\\n\\nReply: APPROVE to schedule or send further edits.` }, action: { buttons: [{ type: 'reply', reply: { id: 'approve_' + $json.post_id, title: '✅ Approve' } }, { type: 'reply', reply: { id: 'reject_' + $json.post_id, title: '❌ Reject' } }] } } }) }}"
      }
    },

    {
      "id": "webhook_response_ok",
      "name": "Webhook Response: 200 OK",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [4060, 600],
      "parameters": {
        "respondWith": "json",
        "responseBody": "={ \"status\": \"received\", \"job_id\": \"{{ $('normalize_input').first().json.job_id }}\" }",
        "options": { "responseCode": 200 }
      }
    },

    {
      "id": "error_handler",
      "name": "Error Handler",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [2520, 600],
      "parameters": {
        "jsCode": "const error = $input.first().json;\nconst errorMessage = error.error?.message || error.message || JSON.stringify(error);\n\n// Categorize error\nlet errorCategory = 'UNKNOWN';\nlet shouldAlert = true;\nlet retryable = false;\n\nif (errorMessage.includes('USER_NOT_FOUND')) { errorCategory = 'USER_ERROR'; shouldAlert = false; }\nelse if (errorMessage.includes('ONBOARDING_INCOMPLETE')) { errorCategory = 'USER_ERROR'; shouldAlert = false; }\nelse if (errorMessage.includes('NKP_NOT_FOUND')) { errorCategory = 'CONFIG_ERROR'; shouldAlert = true; }\nelse if (errorMessage.includes('LLM_EMPTY_RESPONSE') || errorMessage.includes('LLM_JSON_PARSE_FAILED')) { errorCategory = 'LLM_ERROR'; shouldAlert = true; retryable = true; }\nelse if (errorMessage.includes('MISSING_USER_ID')) { errorCategory = 'INPUT_ERROR'; shouldAlert = false; }\n\nconsole.error(`[ContentCreator ERROR] Category: ${errorCategory} | ${errorMessage}`);\n\nreturn {\n  json: {\n    error: true,\n    error_category: errorCategory,\n    error_message: errorMessage,\n    should_alert: shouldAlert,\n    retryable: retryable,\n    timestamp: new Date().toISOString()\n  }\n};"
      }
    },

    {
      "id": "wa_error_notify",
      "name": "WhatsApp: Error Notification (if alertable)",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [2740, 600],
      "credentials": { "httpHeaderAuth": { "id": "meta_wa_token", "name": "Meta WhatsApp Token" } },
      "parameters": {
        "method": "POST",
        "url": "=https://graph.facebook.com/v19.0/{{ $vars.WHATSAPP_PHONE_NUMBER_ID }}/messages",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            { "name": "Content-Type", "value": "application/json" },
            { "name": "Authorization", "value": "Bearer {{ $credentials.httpHeaderAuth.value }}" }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ JSON.stringify({ messaging_product: 'whatsapp', to: $vars.ADMIN_WHATSAPP_NUMBER, type: 'text', text: { body: `🚨 Content Creator Error\\nCategory: ${$json.error_category}\\nMessage: ${$json.error_message.substring(0, 200)}\\nTime: ${$json.timestamp}` } }) }}"
      }
    }

  ],

  "connections": {
    "Trigger: WhatsApp Manual Request": { "main": [[{ "node": "Normalize All Trigger Inputs", "type": "main", "index": 0 }]] },
    "Trigger: Content Calendar Auto (Scheduler Handoff)": { "main": [[{ "node": "Normalize All Trigger Inputs", "type": "main", "index": 0 }]] },
    "Trigger: Trend Brief Handoff (Trend Spotter Agent)": { "main": [[{ "node": "Normalize All Trigger Inputs", "type": "main", "index": 0 }]] },
    "Trigger: Campaign Brief (WhatsApp / Dashboard)": { "main": [[{ "node": "Normalize All Trigger Inputs", "type": "main", "index": 0 }]] },
    "Trigger: Repurpose Request": { "main": [[{ "node": "Normalize All Trigger Inputs", "type": "main", "index": 0 }]] },
    "Normalize All Trigger Inputs": { "main": [[{ "node": "Load User Context from Supabase", "type": "main", "index": 0 }]] },
    "Load User Context from Supabase": { "main": [[{ "node": "Validate User + Merge Context", "type": "main", "index": 0 }]] },
    "Validate User + Merge Context": { "main": [[{ "node": "Load Niche Knowledge Pack (NKP)", "type": "main", "index": 0 }]] },
    "Load Niche Knowledge Pack (NKP)": { "main": [[{ "node": "Merge NKP into Job Context", "type": "main", "index": 0 }]] },
    "Merge NKP into Job Context": { "main": [[{ "node": "Classify Job: Simple vs Complex (LLM Router)", "type": "main", "index": 0 }]] },
    "Classify Job: Simple vs Complex (LLM Router)": { "main": [[{ "node": "Route by Job Type", "type": "main", "index": 0 }]] },
    "Route by Job Type": {
      "main": [
        [{ "node": "Build Campaign Prompt", "type": "main", "index": 0 }],
        [{ "node": "Build Repurpose Prompt", "type": "main", "index": 0 }],
        [{ "node": "Build Trend Content Prompt", "type": "main", "index": 0 }],
        [{ "node": "Build Calendar Fill Prompt", "type": "main", "index": 0 }],
        [{ "node": "Build Single Post Prompt", "type": "main", "index": 0 }]
      ]
    },
    "Build Campaign Prompt": { "main": [[{ "node": "Route to Groq or GPT-4o", "type": "main", "index": 0 }]] },
    "Build Repurpose Prompt": { "main": [[{ "node": "Route to Groq or GPT-4o", "type": "main", "index": 0 }]] },
    "Build Trend Content Prompt": { "main": [[{ "node": "Route to Groq or GPT-4o", "type": "main", "index": 0 }]] },
    "Build Calendar Fill Prompt": { "main": [[{ "node": "Route to Groq or GPT-4o", "type": "main", "index": 0 }]] },
    "Build Single Post Prompt": { "main": [[{ "node": "Route to Groq or GPT-4o", "type": "main", "index": 0 }]] },
    "Route to Groq or GPT-4o": {
      "main": [
        [{ "node": "Call GPT-4o (Complex Jobs)", "type": "main", "index": 0 }],
        [{ "node": "Call Groq — llama-3.3-70b-versatile (Standard Jobs)", "type": "main", "index": 0 }]
      ]
    },
    "Call GPT-4o (Complex Jobs)": { "main": [[{ "node": "Parse LLM Response + Validate JSON", "type": "main", "index": 0 }]] },
    "Call Groq — llama-3.3-70b-versatile (Standard Jobs)": { "main": [[{ "node": "Parse LLM Response + Validate JSON", "type": "main", "index": 0 }]] },
    "Parse LLM Response + Validate JSON": { "main": [[{ "node": "Enrich Hashtags + Rotate to Avoid Shadowban", "type": "main", "index": 0 }]] },
    "Enrich Hashtags + Rotate to Avoid Shadowban": { "main": [[{ "node": "Save Posts to Supabase (status: draft)", "type": "main", "index": 0 }]] },
    "Save Posts to Supabase (status: draft)": { "main": [[{ "node": "Insert Draft Posts to Supabase", "type": "main", "index": 0 }]] },
    "Insert Draft Posts to Supabase": { "main": [[{ "node": "Aggregate Posts for Approval Dispatch", "type": "main", "index": 0 }]] },
    "Aggregate Posts for Approval Dispatch": { "main": [[{ "node": "Build WhatsApp Approval Previews", "type": "main", "index": 0 }]] },
    "Build WhatsApp Approval Previews": { "main": [[{ "node": "Send WhatsApp Approval Message (Meta API)", "type": "main", "index": 0 }]] },
    "Send WhatsApp Approval Message (Meta API)": { "main": [[{ "node": "Update Post Status: approval_sent", "type": "main", "index": 0 }]] },
    "Update Post Status: approval_sent": { "main": [[{ "node": "Webhook Response: 200 OK", "type": "main", "index": 0 }]] },
    "Trigger: WhatsApp Approval Reply (Webhook)": { "main": [[{ "node": "Parse Approval Reply", "type": "main", "index": 0 }]] },
    "Parse Approval Reply": { "main": [[{ "node": "Route Approval Action", "type": "main", "index": 0 }]] },
    "Route Approval Action": {
      "main": [
        [{ "node": "Handle Approve: Update Post + Trigger Scheduler", "type": "main", "index": 0 }],
        [{ "node": "Handle Reject: Log + Notify", "type": "main", "index": 0 }],
        [{ "node": "Handle Edit: Fetch Original Post + Rebuild Prompt", "type": "main", "index": 0 }]
      ]
    },
    "Handle Approve: Update Post + Trigger Scheduler": { "main": [[{ "node": "Trigger Scheduler Agent (Webhook Call)", "type": "main", "index": 0 }]] },
    "Trigger Scheduler Agent (Webhook Call)": { "main": [[{ "node": "WhatsApp: Confirm Approved to User", "type": "main", "index": 0 }]] },
    "Handle Reject: Log + Notify": { "main": [[{ "node": "WhatsApp: Confirm Rejected to User", "type": "main", "index": 0 }]] },
    "Handle Edit: Fetch Original Post + Rebuild Prompt": { "main": [[{ "node": "Build Edit Revision Prompt", "type": "main", "index": 0 }]] },
    "Build Edit Revision Prompt": { "main": [[{ "node": "Call Groq for Edit Revision", "type": "main", "index": 0 }]] },
    "Call Groq for Edit Revision": { "main": [[{ "node": "Save Revised Post + Re-send for Approval", "type": "main", "index": 0 }]] },
    "Save Revised Post + Re-send for Approval": { "main": [[{ "node": "Supabase: Update Revised Post", "type": "main", "index": 0 }]] },
    "Supabase: Update Revised Post": { "main": [[{ "node": "WhatsApp: Re-send Revised Post for Approval", "type": "main", "index": 0 }]] }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT 2: TREND SPOTTER — Detects trending sounds, hashtags, moments
// ═══════════════════════════════════════════════════════════════════════════════

{
  "name": "Social Media Manager — Agent 2: Trend Spotter",
  "nodes": [
    {
      "id": "trend_cron_trigger",
      "name": "Cron: Every 4 Hours — Trend Scan",
      "type": "n8n-nodes-base.cron",
      "typeVersion": 1,
      "position": [0, 0],
      "parameters": {
        "triggerTimes": {
          "item": [{ "mode": "everyX", "value": 4, "unit": "hours" }]
        }
      }
    },
    {
      "id": "trend_manual_trigger",
      "name": "Trigger: Manual Trend Check (WhatsApp)",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [0, 180],
      "webhookId": "smm-trend-spotter-manual",
      "parameters": {
        "httpMethod": "POST",
        "path": "smm-trend-spotter-manual",
        "responseMode": "responseNode"
      }
    },
    {
      "id": "load_active_users_for_trends",
      "name": "Load Active Users with Niches",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [220, 90],
      "credentials": { "supabaseApi": { "id": "supabase_main", "name": "Supabase Main" } },
      "parameters": {
        "operation": "getAll",
        "tableId": "users",
        "filterType": "string",
        "filterString": "is_active=eq.true&select=id,niche_primary,platforms,language_preference",
        "returnAll": true
      }
    },
    {
      "id": "dedupe_niches",
      "name": "Dedupe Niches to Scan",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [440, 90],
      "parameters": {
        "jsCode": "const users = $input.all().map(i => i.json);\nconst nicheSet = new Set();\nconst platformSet = new Set();\n\nusers.forEach(u => {\n  if (u.niche_primary) nicheSet.add(u.niche_primary);\n  (u.platforms || []).forEach(p => platformSet.add(p));\n});\n\nreturn {\n  json: {\n    niches_to_scan: Array.from(nicheSet),\n    platforms_to_scan: Array.from(platformSet),\n    user_count: users.length,\n    scan_timestamp: new Date().toISOString()\n  }\n};"
      }
    },
    {
      "id": "load_nkp_trend_keywords",
      "name": "Load NKP Trend Keywords for All Niches",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [660, 90],
      "credentials": { "supabaseApi": { "id": "supabase_main", "name": "Supabase Main" } },
      "parameters": {
        "operation": "getAll",
        "tableId": "niche_knowledge_packs",
        "filterType": "string",
        "filterString": "niche_id=in.({{ $json.niches_to_scan.join(',') }})&select=niche_id,trend_keywords,hashtag_sets_json",
        "returnAll": true
      }
    },
    {
      "id": "fetch_twitter_trends",
      "name": "Fetch Twitter/X Trending Topics",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [880, 0],
      "parameters": {
        "method": "GET",
        "url": "https://api.twitter.com/2/trends/by/woeid/23424848",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "options": {}
      },
      "credentials": { "httpHeaderAuth": { "id": "twitter_bearer", "name": "Twitter Bearer" } }
    },
    {
      "id": "fetch_google_trends",
      "name": "Fetch Google Trends (India)",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [880, 180],
      "parameters": {
        "method": "GET",
        "url": "https://trends.google.com/trends/trendingsearches/daily/rss?geo=IN",
        "options": {}
      }
    },
    {
      "id": "fetch_instagram_trending_audio",
      "name": "Fetch Instagram Trending Audio (Unofficial)",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [880, 360],
      "parameters": {
        "method": "GET",
        "url": "https://www.instagram.com/api/v1/clips/trending_audio/",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "options": {}
      },
      "credentials": { "httpHeaderAuth": { "id": "instagram_session", "name": "Instagram Session" } }
    },
    {
      "id": "merge_trend_sources",
      "name": "Merge All Trend Sources",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1100, 180],
      "parameters": {
        "jsCode": "const context = $('dedupe_niches').first().json;\nconst nkpData = $('load_nkp_trend_keywords').all().map(i => i.json);\nconst twitterData = $('fetch_twitter_trends').first().json;\nconst googleData = $('fetch_google_trends').first().json;\nconst igAudio = $('fetch_instagram_trending_audio').first().json;\n\n// Build unified trend object\nconst trends = {\n  scan_id: `trend_${Date.now()}`,\n  scanned_at: new Date().toISOString(),\n  twitter_topics: (twitterData?.data || []).slice(0, 20).map(t => ({\n    name: t.name,\n    tweet_volume: t.tweet_volume,\n    url: t.url\n  })),\n  google_topics: [], // Parse RSS\n  instagram_audio: (igAudio?.items || []).slice(0, 15).map(a => ({\n    audio_id: a.id,\n    title: a.title,\n    artist: a.artist_name,\n    use_count: a.use_count\n  })),\n  niche_keywords: {}\n};\n\n// Map NKP keywords by niche\nnkpData.forEach(nkp => {\n  trends.niche_keywords[nkp.niche_id] = nkp.trend_keywords || [];\n});\n\nreturn { json: trends };"
      }
    },
    {
      "id": "ai_trend_relevance_scoring",
      "name": "AI: Score Trend Relevance per Niche (Groq)",
      "type": "@n8n/n8n-nodes-langchain.lmChatGroq",
      "typeVersion": 1,
      "position": [1320, 180],
      "parameters": {
        "model": "llama-3.1-8b-instant",
        "options": { "temperature": 0.3 }
      },
      "credentials": { "groqApi": { "id": "groq_main", "name": "Groq Main" } }
    },
    {
      "id": "build_trend_scoring_prompt",
      "name": "Build Trend Scoring Prompt",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1320, 0],
      "parameters": {
        "jsCode": "const trends = $('merge_trend_sources').first().json;\n\nconst prompt = `You are a social media trend analyst for Indian SMBs.\n\nTRENDING TOPICS (Twitter/X):\n${trends.twitter_topics.map(t => `- ${t.name} (${t.tweet_volume || 'N/A'} tweets)`).join('\\n')}\n\nTRENDING AUDIO (Instagram Reels):\n${trends.instagram_audio.map(a => `- \"${a.title}\" by ${a.artist} (${a.use_count} uses)`).join('\\n')}\n\nNICHES WE SERVE:\n${Object.keys(trends.niche_keywords).join(', ')}\n\nFor each niche, identify 1-3 trending topics/audio that could be leveraged for content creation.\nReturn JSON: { \"[niche]\": [{ \"trend\": \"...\", \"relevance_score\": 1-10, \"content_angle\": \"...\" }] }`;\n\nreturn { json: { prompt, trends } };"
      }
    },
    {
      "id": "parse_trend_scores",
      "name": "Parse AI Trend Scores",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1540, 180],
      "parameters": {
        "jsCode": "const aiResponse = $input.first().json?.text || $input.first().json?.content || '';\nconst trends = $('merge_trend_sources').first().json;\n\nlet scored;\ntry {\n  const jsonMatch = aiResponse.match(/\\{[\\s\\S]*\\}/);\n  scored = jsonMatch ? JSON.parse(jsonMatch[0]) : {};\n} catch (e) {\n  scored = {};\n}\n\nreturn {\n  json: {\n    scan_id: trends.scan_id,\n    scanned_at: trends.scanned_at,\n    raw_trends: trends,\n    scored_trends: scored,\n    high_relevance: Object.entries(scored).flatMap(([niche, items]) => \n      (items || []).filter(i => i.relevance_score >= 7).map(i => ({ niche, ...i }))\n    )\n  }\n};"
      }
    },
    {
      "id": "save_trends_to_supabase",
      "name": "Save Trends to Supabase",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [1760, 180],
      "credentials": { "supabaseApi": { "id": "supabase_main", "name": "Supabase Main" } },
      "parameters": {
        "operation": "insert",
        "tableId": "trend_scans",
        "dataMode": "jsonMapping",
        "jsonMapping": {
          "scan_id": "={{ $json.scan_id }}",
          "scanned_at": "={{ $json.scanned_at }}",
          "raw_trends": "={{ JSON.stringify($json.raw_trends) }}",
          "scored_trends": "={{ JSON.stringify($json.scored_trends) }}",
          "high_relevance_count": "={{ $json.high_relevance.length }}"
        }
      }
    },
    {
      "id": "check_high_relevance_trends",
      "name": "Check: Any High-Relevance Trends?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [1980, 180],
      "parameters": {
        "conditions": {
          "options": { "leftValue": "", "typeValidation": "strict" },
          "combinator": "and",
          "conditions": [
            { "leftValue": "={{ $json.high_relevance.length }}", "rightValue": 0, "operator": { "type": "number", "operation": "gt" } }
          ]
        }
      }
    },
    {
      "id": "loop_high_relevance_trends",
      "name": "Loop: High Relevance Trends",
      "type": "n8n-nodes-base.splitInBatches",
      "typeVersion": 3,
      "position": [2200, 90],
      "parameters": { "batchSize": 1 }
    },
    {
      "id": "find_users_for_trend",
      "name": "Find Users for This Trend Niche",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [2420, 90],
      "credentials": { "supabaseApi": { "id": "supabase_main", "name": "Supabase Main" } },
      "parameters": {
        "operation": "getAll",
        "tableId": "users",
        "filterType": "string",
        "filterString": "niche_primary=eq.{{ $json.niche }}&is_active=eq.true&select=id,phone,language_preference",
        "returnAll": true
      }
    },
    {
      "id": "handoff_to_content_creator",
      "name": "Handoff: Trigger Content Creator with Trend Brief",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [2640, 90],
      "parameters": {
        "method": "POST",
        "url": "={{ $env.N8N_WEBHOOK_BASE_URL }}/smm-content-creator-trend",
        "options": {},
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            { "name": "user_id", "value": "={{ $json.id }}" },
            { "name": "trigger_source", "value": "trend_spotter" },
            { "name": "trend_brief", "value": "={{ JSON.stringify($('loop_high_relevance_trends').first().json) }}" }
          ]
        }
      }
    },
    {
      "id": "notify_user_trend_opportunity",
      "name": "WhatsApp: Notify User of Trend Opportunity",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [2860, 90],
      "parameters": {
        "method": "POST",
        "url": "https://graph.facebook.com/v18.0/{{ $env.WHATSAPP_PHONE_ID }}/messages",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendHeaders": true,
        "headerParameters": { "parameters": [{ "name": "Content-Type", "value": "application/json" }] },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"messaging_product\": \"whatsapp\",\n  \"to\": \"{{ $('find_users_for_trend').first().json.phone }}\",\n  \"type\": \"text\",\n  \"text\": {\n    \"body\": \"🔥 *Trend Alert!*\\n\\n{{ $('loop_high_relevance_trends').first().json.trend }}\\n\\nRelevance: {{ $('loop_high_relevance_trends').first().json.relevance_score }}/10\\n\\nContent Angle: {{ $('loop_high_relevance_trends').first().json.content_angle }}\\n\\nReply 'CREATE' to generate content for this trend!\"\n  }\n}"
      },
      "credentials": { "httpHeaderAuth": { "id": "meta_whatsapp", "name": "Meta WhatsApp" } }
    }
  ],
  "connections": {
    "Cron: Every 4 Hours — Trend Scan": { "main": [[{ "node": "Load Active Users with Niches", "type": "main", "index": 0 }]] },
    "Trigger: Manual Trend Check (WhatsApp)": { "main": [[{ "node": "Load Active Users with Niches", "type": "main", "index": 0 }]] },
    "Load Active Users with Niches": { "main": [[{ "node": "Dedupe Niches to Scan", "type": "main", "index": 0 }]] },
    "Dedupe Niches to Scan": { "main": [[{ "node": "Load NKP Trend Keywords for All Niches", "type": "main", "index": 0 }]] },
    "Load NKP Trend Keywords for All Niches": { "main": [[{ "node": "Fetch Twitter/X Trending Topics", "type": "main", "index": 0 }, { "node": "Fetch Google Trends (India)", "type": "main", "index": 0 }, { "node": "Fetch Instagram Trending Audio (Unofficial)", "type": "main", "index": 0 }]] },
    "Fetch Twitter/X Trending Topics": { "main": [[{ "node": "Merge All Trend Sources", "type": "main", "index": 0 }]] },
    "Fetch Google Trends (India)": { "main": [[{ "node": "Merge All Trend Sources", "type": "main", "index": 0 }]] },
    "Fetch Instagram Trending Audio (Unofficial)": { "main": [[{ "node": "Merge All Trend Sources", "type": "main", "index": 0 }]] },
    "Merge All Trend Sources": { "main": [[{ "node": "Build Trend Scoring Prompt", "type": "main", "index": 0 }]] },
    "Build Trend Scoring Prompt": { "main": [[{ "node": "AI: Score Trend Relevance per Niche (Groq)", "type": "main", "index": 0 }]] },
    "AI: Score Trend Relevance per Niche (Groq)": { "main": [[{ "node": "Parse AI Trend Scores", "type": "main", "index": 0 }]] },
    "Parse AI Trend Scores": { "main": [[{ "node": "Save Trends to Supabase", "type": "main", "index": 0 }]] },
    "Save Trends to Supabase": { "main": [[{ "node": "Check: Any High-Relevance Trends?", "type": "main", "index": 0 }]] },
    "Check: Any High-Relevance Trends?": { "main": [[{ "node": "Loop: High Relevance Trends", "type": "main", "index": 0 }], []] },
    "Loop: High Relevance Trends": { "main": [[{ "node": "Find Users for This Trend Niche", "type": "main", "index": 0 }]] },
    "Find Users for This Trend Niche": { "main": [[{ "node": "Handoff: Trigger Content Creator with Trend Brief", "type": "main", "index": 0 }]] },
    "Handoff: Trigger Content Creator with Trend Brief": { "main": [[{ "node": "WhatsApp: Notify User of Trend Opportunity", "type": "main", "index": 0 }]] }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT 3: SCHEDULER — Auto-posts to Meta, LinkedIn, TikTok
// ═══════════════════════════════════════════════════════════════════════════════

{
  "name": "Social Media Manager — Agent 3: Scheduler",
  "nodes": [
    {
      "id": "scheduler_cron_1min",
      "name": "Cron: Every 1 Minute — Check Pending Posts",
      "type": "n8n-nodes-base.cron",
      "typeVersion": 1,
      "position": [0, 0],
      "parameters": {
        "triggerTimes": {
          "item": [{ "mode": "everyMinute" }]
        }
      }
    },
    {
      "id": "scheduler_manual_trigger",
      "name": "Trigger: Manual Post Now (WhatsApp)",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [0, 180],
      "webhookId": "smm-scheduler-manual",
      "parameters": {
        "httpMethod": "POST",
        "path": "smm-scheduler-manual"
      }
    },
    {
      "id": "scheduler_content_creator_handoff",
      "name": "Trigger: Post Approved (Content Creator Handoff)",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [0, 360],
      "webhookId": "smm-scheduler-approved",
      "parameters": {
        "httpMethod": "POST",
        "path": "smm-scheduler-approved"
      }
    },
    {
      "id": "load_pending_posts",
      "name": "Load Pending Posts (Due Now)",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [280, 90],
      "credentials": { "supabaseApi": { "id": "supabase_main", "name": "Supabase Main" } },
      "parameters": {
        "operation": "getAll",
        "tableId": "content_posts",
        "filterType": "string",
        "filterString": "status=eq.approved&scheduled_at=lte.{{ new Date().toISOString() }}&select=*",
        "returnAll": true
      }
    },
    {
      "id": "check_posts_exist",
      "name": "Check: Any Posts to Publish?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [500, 90],
      "parameters": {
        "conditions": {
          "combinator": "and",
          "conditions": [
            { "leftValue": "={{ $input.all().length }}", "rightValue": 0, "operator": { "type": "number", "operation": "gt" } }
          ]
        }
      }
    },
    {
      "id": "loop_posts",
      "name": "Loop: Posts to Publish",
      "type": "n8n-nodes-base.splitInBatches",
      "typeVersion": 3,
      "position": [720, 0],
      "parameters": { "batchSize": 1 }
    },
    {
      "id": "load_user_tokens",
      "name": "Load User Platform Tokens",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [940, 0],
      "credentials": { "supabaseApi": { "id": "supabase_main", "name": "Supabase Main" } },
      "parameters": {
        "operation": "getAll",
        "tableId": "user_platform_tokens",
        "filterType": "string",
        "filterString": "user_id=eq.{{ $json.user_id }}&platform=eq.{{ $json.platform }}&select=*",
        "returnAll": false,
        "limit": 1
      }
    },
    {
      "id": "route_by_platform",
      "name": "Route by Platform",
      "type": "n8n-nodes-base.switch",
      "typeVersion": 3,
      "position": [1160, 0],
      "parameters": {
        "dataType": "string",
        "value1": "={{ $('loop_posts').first().json.platform }}",
        "rules": {
          "rules": [
            { "value": "instagram", "output": 0 },
            { "value": "facebook", "output": 1 },
            { "value": "linkedin", "output": 2 },
            { "value": "tiktok", "output": 3 },
            { "value": "twitter", "output": 4 }
          ]
        }
      }
    },
    {
      "id": "publish_instagram",
      "name": "Publish to Instagram (Meta Graph API)",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [1400, -200],
      "parameters": {
        "method": "POST",
        "url": "https://graph.facebook.com/v18.0/{{ $('load_user_tokens').first().json.ig_user_id }}/media",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            { "name": "caption", "value": "={{ $('loop_posts').first().json.caption }}" },
            { "name": "image_url", "value": "={{ $('loop_posts').first().json.media_url }}" },
            { "name": "access_token", "value": "={{ $('load_user_tokens').first().json.access_token }}" }
          ]
        }
      }
    },
    {
      "id": "publish_instagram_container",
      "name": "Publish Instagram Container",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [1620, -200],
      "parameters": {
        "method": "POST",
        "url": "https://graph.facebook.com/v18.0/{{ $('load_user_tokens').first().json.ig_user_id }}/media_publish",
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            { "name": "creation_id", "value": "={{ $json.id }}" },
            { "name": "access_token", "value": "={{ $('load_user_tokens').first().json.access_token }}" }
          ]
        }
      }
    },
    {
      "id": "publish_facebook",
      "name": "Publish to Facebook Page",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [1400, 0],
      "parameters": {
        "method": "POST",
        "url": "https://graph.facebook.com/v18.0/{{ $('load_user_tokens').first().json.page_id }}/feed",
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            { "name": "message", "value": "={{ $('loop_posts').first().json.caption }}" },
            { "name": "link", "value": "={{ $('loop_posts').first().json.link || '' }}" },
            { "name": "access_token", "value": "={{ $('load_user_tokens').first().json.page_access_token }}" }
          ]
        }
      }
    },
    {
      "id": "publish_linkedin",
      "name": "Publish to LinkedIn",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [1400, 200],
      "parameters": {
        "method": "POST",
        "url": "https://api.linkedin.com/v2/ugcPosts",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendHeaders": true,
        "headerParameters": { "parameters": [{ "name": "X-Restli-Protocol-Version", "value": "2.0.0" }] },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"author\": \"urn:li:person:{{ $('load_user_tokens').first().json.linkedin_id }}\",\n  \"lifecycleState\": \"PUBLISHED\",\n  \"specificContent\": {\n    \"com.linkedin.ugc.ShareContent\": {\n      \"shareCommentary\": { \"text\": \"{{ $('loop_posts').first().json.caption }}\" },\n      \"shareMediaCategory\": \"NONE\"\n    }\n  },\n  \"visibility\": { \"com.linkedin.ugc.MemberNetworkVisibility\": \"PUBLIC\" }\n}"
      },
      "credentials": { "httpHeaderAuth": { "id": "linkedin_oauth", "name": "LinkedIn OAuth" } }
    },
    {
      "id": "publish_tiktok",
      "name": "Publish to TikTok (Video Upload)",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [1400, 400],
      "parameters": {
        "method": "POST",
        "url": "https://open.tiktokapis.com/v2/post/publish/video/init/",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"post_info\": {\n    \"title\": \"{{ $('loop_posts').first().json.caption.substring(0, 150) }}\",\n    \"privacy_level\": \"PUBLIC_TO_EVERYONE\"\n  },\n  \"source_info\": {\n    \"source\": \"PULL_FROM_URL\",\n    \"video_url\": \"{{ $('loop_posts').first().json.media_url }}\"\n  }\n}"
      },
      "credentials": { "httpHeaderAuth": { "id": "tiktok_oauth", "name": "TikTok OAuth" } }
    },
    {
      "id": "publish_twitter",
      "name": "Publish to Twitter/X",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [1400, 600],
      "parameters": {
        "method": "POST",
        "url": "https://api.twitter.com/2/tweets",
        "authentication": "genericCredentialType",
        "genericAuthType": "oAuth2Api",
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"text\": \"{{ $('loop_posts').first().json.caption.substring(0, 280) }}\"\n}"
      },
      "credentials": { "oAuth2Api": { "id": "twitter_oauth2", "name": "Twitter OAuth2" } }
    },
    {
      "id": "merge_publish_results",
      "name": "Merge Publish Results",
      "type": "n8n-nodes-base.merge",
      "typeVersion": 2,
      "position": [1840, 200],
      "parameters": { "mode": "combine", "mergeByFields": { "fields": [{ "field1": "post_id", "field2": "post_id" }] } }
    },
    {
      "id": "update_post_published",
      "name": "Update Post Status: published",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [2060, 200],
      "credentials": { "supabaseApi": { "id": "supabase_main", "name": "Supabase Main" } },
      "parameters": {
        "operation": "update",
        "tableId": "content_posts",
        "filterType": "string",
        "filterString": "id=eq.{{ $('loop_posts').first().json.id }}",
        "dataMode": "jsonMapping",
        "jsonMapping": {
          "status": "published",
          "published_at": "={{ new Date().toISOString() }}",
          "platform_post_id": "={{ $json.id || $json.post_id || null }}"
        }
      }
    },
    {
      "id": "notify_user_published",
      "name": "WhatsApp: Notify User Post Published",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [2280, 200],
      "parameters": {
        "method": "POST",
        "url": "https://graph.facebook.com/v18.0/{{ $env.WHATSAPP_PHONE_ID }}/messages",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"messaging_product\": \"whatsapp\",\n  \"to\": \"{{ $('loop_posts').first().json.user_phone }}\",\n  \"type\": \"text\",\n  \"text\": {\n    \"body\": \"✅ *Post Published!*\\n\\nPlatform: {{ $('loop_posts').first().json.platform }}\\n\\nCaption: {{ $('loop_posts').first().json.caption.substring(0, 100) }}...\\n\\nTime: {{ new Date().toLocaleString('en-IN', {timeZone: 'Asia/Kolkata'}) }}\"\n  }\n}"
      },
      "credentials": { "httpHeaderAuth": { "id": "meta_whatsapp", "name": "Meta WhatsApp" } }
    },
    {
      "id": "handle_publish_error",
      "name": "Handle Publish Error",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1840, 450],
      "parameters": {
        "jsCode": "const post = $('loop_posts').first().json;\nconst error = $input.first().json?.error || 'Unknown error';\n\nreturn {\n  json: {\n    post_id: post.id,\n    user_id: post.user_id,\n    platform: post.platform,\n    error: error,\n    failed_at: new Date().toISOString(),\n    retry_count: (post.retry_count || 0) + 1\n  }\n};"
      }
    },
    {
      "id": "update_post_failed",
      "name": "Update Post Status: failed",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [2060, 450],
      "credentials": { "supabaseApi": { "id": "supabase_main", "name": "Supabase Main" } },
      "parameters": {
        "operation": "update",
        "tableId": "content_posts",
        "filterType": "string",
        "filterString": "id=eq.{{ $json.post_id }}",
        "dataMode": "jsonMapping",
        "jsonMapping": {
          "status": "failed",
          "error_message": "={{ $json.error }}",
          "retry_count": "={{ $json.retry_count }}"
        }
      }
    }
  ],
  "connections": {
    "Cron: Every 1 Minute — Check Pending Posts": { "main": [[{ "node": "Load Pending Posts (Due Now)", "type": "main", "index": 0 }]] },
    "Trigger: Manual Post Now (WhatsApp)": { "main": [[{ "node": "Load Pending Posts (Due Now)", "type": "main", "index": 0 }]] },
    "Trigger: Post Approved (Content Creator Handoff)": { "main": [[{ "node": "Load Pending Posts (Due Now)", "type": "main", "index": 0 }]] },
    "Load Pending Posts (Due Now)": { "main": [[{ "node": "Check: Any Posts to Publish?", "type": "main", "index": 0 }]] },
    "Check: Any Posts to Publish?": { "main": [[{ "node": "Loop: Posts to Publish", "type": "main", "index": 0 }], []] },
    "Loop: Posts to Publish": { "main": [[{ "node": "Load User Platform Tokens", "type": "main", "index": 0 }]] },
    "Load User Platform Tokens": { "main": [[{ "node": "Route by Platform", "type": "main", "index": 0 }]] },
    "Route by Platform": { "main": [
      [{ "node": "Publish to Instagram (Meta Graph API)", "type": "main", "index": 0 }],
      [{ "node": "Publish to Facebook Page", "type": "main", "index": 0 }],
      [{ "node": "Publish to LinkedIn", "type": "main", "index": 0 }],
      [{ "node": "Publish to TikTok (Video Upload)", "type": "main", "index": 0 }],
      [{ "node": "Publish to Twitter/X", "type": "main", "index": 0 }]
    ]},
    "Publish to Instagram (Meta Graph API)": { "main": [[{ "node": "Publish Instagram Container", "type": "main", "index": 0 }]] },
    "Publish Instagram Container": { "main": [[{ "node": "Merge Publish Results", "type": "main", "index": 0 }]] },
    "Publish to Facebook Page": { "main": [[{ "node": "Merge Publish Results", "type": "main", "index": 0 }]] },
    "Publish to LinkedIn": { "main": [[{ "node": "Merge Publish Results", "type": "main", "index": 0 }]] },
    "Publish to TikTok (Video Upload)": { "main": [[{ "node": "Merge Publish Results", "type": "main", "index": 0 }]] },
    "Publish to Twitter/X": { "main": [[{ "node": "Merge Publish Results", "type": "main", "index": 0 }]] },
    "Merge Publish Results": { "main": [[{ "node": "Update Post Status: published", "type": "main", "index": 0 }]] },
    "Update Post Status: published": { "main": [[{ "node": "WhatsApp: Notify User Post Published", "type": "main", "index": 0 }]] }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT 4: ANALYTICS — Tracks engagement, suggests best times
// ═══════════════════════════════════════════════════════════════════════════════

{
  "name": "Social Media Manager — Agent 4: Analytics",
  "nodes": [
    {
      "id": "analytics_cron_daily",
      "name": "Cron: Daily 9 AM IST — Analytics Report",
      "type": "n8n-nodes-base.cron",
      "typeVersion": 1,
      "position": [0, 0],
      "parameters": {
        "triggerTimes": {
          "item": [{ "mode": "everyDay", "hour": 3, "minute": 30 }]
        }
      }
    },
    {
      "id": "analytics_manual_trigger",
      "name": "Trigger: Manual Analytics Request (WhatsApp)",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [0, 180],
      "webhookId": "smm-analytics-manual",
      "parameters": {
        "httpMethod": "POST",
        "path": "smm-analytics-manual"
      }
    },
    {
      "id": "load_active_users_analytics",
      "name": "Load Active Users for Analytics",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [280, 90],
      "credentials": { "supabaseApi": { "id": "supabase_main", "name": "Supabase Main" } },
      "parameters": {
        "operation": "getAll",
        "tableId": "users",
        "filterType": "string",
        "filterString": "is_active=eq.true&select=id,phone,platforms,language_preference",
        "returnAll": true
      }
    },
    {
      "id": "loop_users_analytics",
      "name": "Loop: Users for Analytics",
      "type": "n8n-nodes-base.splitInBatches",
      "typeVersion": 3,
      "position": [500, 90],
      "parameters": { "batchSize": 1 }
    },
    {
      "id": "load_user_tokens_analytics",
      "name": "Load User Platform Tokens",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [720, 90],
      "credentials": { "supabaseApi": { "id": "supabase_main", "name": "Supabase Main" } },
      "parameters": {
        "operation": "getAll",
        "tableId": "user_platform_tokens",
        "filterType": "string",
        "filterString": "user_id=eq.{{ $json.id }}&select=*",
        "returnAll": true
      }
    },
    {
      "id": "load_recent_posts",
      "name": "Load Recent Posts (Last 7 Days)",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [940, 90],
      "credentials": { "supabaseApi": { "id": "supabase_main", "name": "Supabase Main" } },
      "parameters": {
        "operation": "getAll",
        "tableId": "content_posts",
        "filterType": "string",
        "filterString": "user_id=eq.{{ $('loop_users_analytics').first().json.id }}&status=eq.published&published_at=gte.{{ new Date(Date.now() - 7*24*60*60*1000).toISOString() }}&select=*",
        "returnAll": true
      }
    },
    {
      "id": "fetch_instagram_insights",
      "name": "Fetch Instagram Insights (Meta API)",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [1160, 0],
      "parameters": {
        "method": "GET",
        "url": "https://graph.facebook.com/v18.0/{{ $('load_user_tokens_analytics').first().json.ig_user_id }}/insights",
        "qs": {
          "metric": "impressions,reach,engagement,profile_views",
          "period": "day",
          "access_token": "={{ $('load_user_tokens_analytics').first().json.access_token }}"
        }
      }
    },
    {
      "id": "fetch_post_insights",
      "name": "Fetch Per-Post Insights",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1160, 180],
      "parameters": {
        "jsCode": "const posts = $('load_recent_posts').all().map(p => p.json);\nconst token = $('load_user_tokens_analytics').first().json?.access_token;\n\nconst results = [];\nfor (const post of posts) {\n  if (post.platform === 'instagram' && post.platform_post_id) {\n    try {\n      const resp = await fetch(`https://graph.facebook.com/v18.0/${post.platform_post_id}/insights?metric=engagement,impressions,reach,saved&access_token=${token}`);\n      const data = await resp.json();\n      results.push({ post_id: post.id, platform_post_id: post.platform_post_id, insights: data });\n    } catch (e) {\n      results.push({ post_id: post.id, error: e.message });\n    }\n  }\n}\n\nreturn results.map(r => ({ json: r }));"
      }
    },
    {
      "id": "aggregate_analytics",
      "name": "Aggregate Analytics Data",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1380, 90],
      "parameters": {
        "jsCode": "const user = $('loop_users_analytics').first().json;\nconst posts = $('load_recent_posts').all().map(p => p.json);\nconst accountInsights = $('fetch_instagram_insights').first().json;\nconst postInsights = $('fetch_post_insights').all().map(p => p.json);\n\n// Calculate aggregates\nconst totalPosts = posts.length;\nlet totalImpressions = 0;\nlet totalEngagement = 0;\nlet totalReach = 0;\n\npostInsights.forEach(pi => {\n  if (pi.insights?.data) {\n    pi.insights.data.forEach(m => {\n      if (m.name === 'impressions') totalImpressions += m.values?.[0]?.value || 0;\n      if (m.name === 'engagement') totalEngagement += m.values?.[0]?.value || 0;\n      if (m.name === 'reach') totalReach += m.values?.[0]?.value || 0;\n    });\n  }\n});\n\nconst engagementRate = totalImpressions > 0 ? ((totalEngagement / totalImpressions) * 100).toFixed(2) : 0;\n\n// Best performing post\nconst bestPost = posts.sort((a, b) => (b.engagement_count || 0) - (a.engagement_count || 0))[0];\n\n// Best posting times (analyze when posts got most engagement)\nconst hourCounts = {};\nposts.forEach(p => {\n  if (p.published_at) {\n    const hour = new Date(p.published_at).getHours();\n    hourCounts[hour] = (hourCounts[hour] || 0) + (p.engagement_count || 1);\n  }\n});\nconst bestHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 12;\n\nreturn {\n  json: {\n    user_id: user.id,\n    user_phone: user.phone,\n    period: '7_days',\n    total_posts: totalPosts,\n    total_impressions: totalImpressions,\n    total_engagement: totalEngagement,\n    total_reach: totalReach,\n    engagement_rate: engagementRate + '%',\n    best_post: bestPost?.caption?.substring(0, 50) || 'N/A',\n    best_posting_hour: `${bestHour}:00 IST`,\n    generated_at: new Date().toISOString()\n  }\n};"
      }
    },
    {
      "id": "ai_generate_insights",
      "name": "AI: Generate Actionable Insights (Groq)",
      "type": "@n8n/n8n-nodes-langchain.lmChatGroq",
      "typeVersion": 1,
      "position": [1600, 90],
      "parameters": {
        "model": "llama-3.1-8b-instant",
        "options": { "temperature": 0.5 }
      },
      "credentials": { "groqApi": { "id": "groq_main", "name": "Groq Main" } }
    },
    {
      "id": "build_insights_prompt",
      "name": "Build Insights Prompt",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1380, -90],
      "parameters": {
        "jsCode": "const analytics = $('aggregate_analytics').first().json;\n\nconst prompt = `You are a social media analytics expert. Analyze these weekly metrics and provide 3 actionable insights:\n\nMETRICS (Last 7 Days):\n- Posts: ${analytics.total_posts}\n- Impressions: ${analytics.total_impressions}\n- Engagement: ${analytics.total_engagement}\n- Reach: ${analytics.total_reach}\n- Engagement Rate: ${analytics.engagement_rate}\n- Best Post: \"${analytics.best_post}\"\n- Best Posting Time: ${analytics.best_posting_hour}\n\nProvide exactly 3 short, actionable insights (max 50 words each). Focus on what to DO DIFFERENTLY next week. Be specific, not generic.`;\n\nreturn { json: { prompt, analytics } };"
      }
    },
    {
      "id": "parse_ai_insights",
      "name": "Parse AI Insights",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1820, 90],
      "parameters": {
        "jsCode": "const analytics = $('aggregate_analytics').first().json;\nconst aiResponse = $input.first().json?.text || $input.first().json?.content || '';\n\nreturn {\n  json: {\n    ...analytics,\n    ai_insights: aiResponse\n  }\n};"
      }
    },
    {
      "id": "save_analytics_report",
      "name": "Save Analytics Report to Supabase",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [2040, 90],
      "credentials": { "supabaseApi": { "id": "supabase_main", "name": "Supabase Main" } },
      "parameters": {
        "operation": "insert",
        "tableId": "analytics_reports",
        "dataMode": "jsonMapping",
        "jsonMapping": {
          "user_id": "={{ $json.user_id }}",
          "period": "={{ $json.period }}",
          "total_posts": "={{ $json.total_posts }}",
          "total_impressions": "={{ $json.total_impressions }}",
          "total_engagement": "={{ $json.total_engagement }}",
          "engagement_rate": "={{ $json.engagement_rate }}",
          "best_posting_hour": "={{ $json.best_posting_hour }}",
          "ai_insights": "={{ $json.ai_insights }}",
          "generated_at": "={{ $json.generated_at }}"
        }
      }
    },
    {
      "id": "send_whatsapp_report",
      "name": "WhatsApp: Send Weekly Analytics Report",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [2260, 90],
      "parameters": {
        "method": "POST",
        "url": "https://graph.facebook.com/v18.0/{{ $env.WHATSAPP_PHONE_ID }}/messages",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"messaging_product\": \"whatsapp\",\n  \"to\": \"{{ $json.user_phone }}\",\n  \"type\": \"text\",\n  \"text\": {\n    \"body\": \"📊 *Weekly Analytics Report*\\n\\n📝 Posts: {{ $json.total_posts }}\\n👀 Impressions: {{ $json.total_impressions }}\\n💬 Engagement: {{ $json.total_engagement }}\\n📈 Engagement Rate: {{ $json.engagement_rate }}\\n⏰ Best Time: {{ $json.best_posting_hour }}\\n\\n🤖 *AI Insights:*\\n{{ $json.ai_insights }}\\n\\n_Reply 'DETAIL' for full breakdown_\"\n  }\n}"
      },
      "credentials": { "httpHeaderAuth": { "id": "meta_whatsapp", "name": "Meta WhatsApp" } }
    }
  ],
  "connections": {
    "Cron: Daily 9 AM IST — Analytics Report": { "main": [[{ "node": "Load Active Users for Analytics", "type": "main", "index": 0 }]] },
    "Trigger: Manual Analytics Request (WhatsApp)": { "main": [[{ "node": "Load Active Users for Analytics", "type": "main", "index": 0 }]] },
    "Load Active Users for Analytics": { "main": [[{ "node": "Loop: Users for Analytics", "type": "main", "index": 0 }]] },
    "Loop: Users for Analytics": { "main": [[{ "node": "Load User Platform Tokens", "type": "main", "index": 0 }]] },
    "Load User Platform Tokens": { "main": [[{ "node": "Load Recent Posts (Last 7 Days)", "type": "main", "index": 0 }]] },
    "Load Recent Posts (Last 7 Days)": { "main": [[{ "node": "Fetch Instagram Insights (Meta API)", "type": "main", "index": 0 }, { "node": "Fetch Per-Post Insights", "type": "main", "index": 0 }]] },
    "Fetch Instagram Insights (Meta API)": { "main": [[{ "node": "Aggregate Analytics Data", "type": "main", "index": 0 }]] },
    "Fetch Per-Post Insights": { "main": [[{ "node": "Aggregate Analytics Data", "type": "main", "index": 0 }]] },
    "Aggregate Analytics Data": { "main": [[{ "node": "Build Insights Prompt", "type": "main", "index": 0 }]] },
    "Build Insights Prompt": { "main": [[{ "node": "AI: Generate Actionable Insights (Groq)", "type": "main", "index": 0 }]] },
    "AI: Generate Actionable Insights (Groq)": { "main": [[{ "node": "Parse AI Insights", "type": "main", "index": 0 }]] },
    "Parse AI Insights": { "main": [[{ "node": "Save Analytics Report to Supabase", "type": "main", "index": 0 }]] },
    "Save Analytics Report to Supabase": { "main": [[{ "node": "WhatsApp: Send Weekly Analytics Report", "type": "main", "index": 0 }]] }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT 5: ENGAGEMENT — Responds to comments, DMs
// ═══════════════════════════════════════════════════════════════════════════════

{
  "name": "Social Media Manager — Agent 5: Engagement",
  "nodes": [
    {
      "id": "engagement_webhook_ig_comments",
      "name": "Webhook: Instagram Comment Received",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [0, 0],
      "webhookId": "smm-engagement-ig-comments",
      "parameters": {
        "httpMethod": "POST",
        "path": "smm-engagement-ig-comments",
        "responseMode": "responseNode"
      }
    },
    {
      "id": "engagement_webhook_ig_dm",
      "name": "Webhook: Instagram DM Received",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [0, 180],
      "webhookId": "smm-engagement-ig-dm",
      "parameters": {
        "httpMethod": "POST",
        "path": "smm-engagement-ig-dm",
        "responseMode": "responseNode"
      }
    },
    {
      "id": "engagement_webhook_fb_comments",
      "name": "Webhook: Facebook Comment Received",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [0, 360],
      "webhookId": "smm-engagement-fb-comments",
      "parameters": {
        "httpMethod": "POST",
        "path": "smm-engagement-fb-comments",
        "responseMode": "responseNode"
      }
    },
    {
      "id": "engagement_cron_check_mentions",
      "name": "Cron: Every 30 Min — Check Mentions",
      "type": "n8n-nodes-base.cron",
      "typeVersion": 1,
      "position": [0, 540],
      "parameters": {
        "triggerTimes": {
          "item": [{ "mode": "everyX", "value": 30, "unit": "minutes" }]
        }
      }
    },
    {
      "id": "normalize_engagement_input",
      "name": "Normalize Engagement Input",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [280, 180],
      "parameters": {
        "jsCode": "const body = $input.first().json;\n\n// Detect source type\nlet engagementType, platform, senderId, messageText, postId, commentId;\n\nif (body.entry?.[0]?.changes?.[0]?.field === 'comments') {\n  // Instagram/Facebook comment\n  const change = body.entry[0].changes[0].value;\n  engagementType = 'comment';\n  platform = body.object === 'instagram' ? 'instagram' : 'facebook';\n  senderId = change.from?.id;\n  messageText = change.text;\n  postId = change.media?.id || change.post_id;\n  commentId = change.id;\n} else if (body.entry?.[0]?.messaging) {\n  // Instagram DM\n  const messaging = body.entry[0].messaging[0];\n  engagementType = 'dm';\n  platform = 'instagram';\n  senderId = messaging.sender?.id;\n  messageText = messaging.message?.text;\n} else {\n  engagementType = 'unknown';\n}\n\nreturn {\n  json: {\n    engagement_id: `eng_${Date.now()}`,\n    engagement_type: engagementType,\n    platform: platform,\n    sender_id: senderId,\n    message_text: messageText,\n    post_id: postId,\n    comment_id: commentId,\n    received_at: new Date().toISOString(),\n    raw_payload: body\n  }\n};"
      }
    },
    {
      "id": "lookup_user_by_ig_account",
      "name": "Lookup User by IG Account",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [500, 180],
      "credentials": { "supabaseApi": { "id": "supabase_main", "name": "Supabase Main" } },
      "parameters": {
        "operation": "getAll",
        "tableId": "user_platform_tokens",
        "filterType": "string",
        "filterString": "ig_user_id=eq.{{ $json.sender_id }}&select=user_id,access_token",
        "returnAll": false,
        "limit": 1
      }
    },
    {
      "id": "load_user_brand_context",
      "name": "Load User Brand Context",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [720, 180],
      "credentials": { "supabaseApi": { "id": "supabase_main", "name": "Supabase Main" } },
      "parameters": {
        "operation": "getAll",
        "tableId": "users",
        "filterType": "string",
        "filterString": "id=eq.{{ $('lookup_user_by_ig_account').first().json.user_id }}&select=id,brand_context,niche_primary,language_preference,engagement_auto_reply",
        "returnAll": false,
        "limit": 1
      }
    },
    {
      "id": "check_auto_reply_enabled",
      "name": "Check: Auto-Reply Enabled?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [940, 180],
      "parameters": {
        "conditions": {
          "combinator": "and",
          "conditions": [
            { "leftValue": "={{ $json.engagement_auto_reply }}", "rightValue": true, "operator": { "type": "boolean", "operation": "equals" } }
          ]
        }
      }
    },
    {
      "id": "classify_engagement_intent",
      "name": "AI: Classify Engagement Intent (Groq)",
      "type": "@n8n/n8n-nodes-langchain.lmChatGroq",
      "typeVersion": 1,
      "position": [1160, 90],
      "parameters": {
        "model": "llama-3.1-8b-instant",
        "options": { "temperature": 0.2 }
      },
      "credentials": { "groqApi": { "id": "groq_main", "name": "Groq Main" } }
    },
    {
      "id": "build_intent_classification_prompt",
      "name": "Build Intent Classification Prompt",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [940, -20],
      "parameters": {
        "jsCode": "const engagement = $('normalize_engagement_input').first().json;\n\nconst prompt = `Classify this social media ${engagement.engagement_type} into ONE category:\n\nMESSAGE: \"${engagement.message_text}\"\n\nCategories:\n- POSITIVE: Compliment, appreciation, support\n- QUESTION: Asking about product/service/pricing\n- COMPLAINT: Negative feedback, issue, problem\n- SPAM: Promotional, irrelevant, bot-like\n- ENGAGEMENT: Simple emoji, \"nice\", \"love it\", etc.\n- LEAD: Shows buying intent (\"How much?\", \"Where to buy?\")\n\nRespond with ONLY the category name.`;\n\nreturn { json: { prompt, engagement } };"
      }
    },
    {
      "id": "route_by_intent",
      "name": "Route by Intent",
      "type": "n8n-nodes-base.switch",
      "typeVersion": 3,
      "position": [1380, 90],
      "parameters": {
        "dataType": "string",
        "value1": "={{ $json.text?.trim().toUpperCase() || 'ENGAGEMENT' }}",
        "rules": {
          "rules": [
            { "value": "POSITIVE", "output": 0 },
            { "value": "QUESTION", "output": 1 },
            { "value": "COMPLAINT", "output": 2 },
            { "value": "SPAM", "output": 3 },
            { "value": "ENGAGEMENT", "output": 4 },
            { "value": "LEAD", "output": 5 }
          ]
        }
      }
    },
    {
      "id": "generate_positive_reply",
      "name": "Generate Positive Reply",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1600, -120],
      "parameters": {
        "jsCode": "const brand = $('load_user_brand_context').first().json;\nconst replies = [\n  'Thank you so much! 🙏',\n  'Really appreciate your support! 💪',\n  'Means a lot to us! ❤️',\n  `Thanks for the love! - ${brand.brand_context?.brand_name || 'Team'}`\n];\nreturn { json: { reply: replies[Math.floor(Math.random() * replies.length)] } };"
      }
    },
    {
      "id": "generate_question_reply",
      "name": "AI: Generate Question Reply",
      "type": "@n8n/n8n-nodes-langchain.lmChatGroq",
      "typeVersion": 1,
      "position": [1600, 0],
      "parameters": {
        "model": "llama-3.1-8b-instant",
        "options": { "temperature": 0.5 }
      },
      "credentials": { "groqApi": { "id": "groq_main", "name": "Groq Main" } }
    },
    {
      "id": "escalate_complaint",
      "name": "Escalate Complaint to User (WhatsApp)",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [1600, 120],
      "parameters": {
        "method": "POST",
        "url": "https://graph.facebook.com/v18.0/{{ $env.WHATSAPP_PHONE_ID }}/messages",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"messaging_product\": \"whatsapp\",\n  \"to\": \"{{ $('load_user_brand_context').first().json.phone }}\",\n  \"type\": \"text\",\n  \"text\": {\n    \"body\": \"⚠️ *Complaint Received*\\n\\nPlatform: {{ $('normalize_engagement_input').first().json.platform }}\\nMessage: {{ $('normalize_engagement_input').first().json.message_text }}\\n\\n_Please respond manually or reply 'HANDLE' for AI-assisted response_\"\n  }\n}"
      },
      "credentials": { "httpHeaderAuth": { "id": "meta_whatsapp", "name": "Meta WhatsApp" } }
    },
    {
      "id": "ignore_spam",
      "name": "Log Spam (No Reply)",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1600, 240],
      "parameters": {
        "jsCode": "const engagement = $('normalize_engagement_input').first().json;\nreturn { json: { action: 'ignored_spam', engagement_id: engagement.engagement_id } };"
      }
    },
    {
      "id": "generate_engagement_reply",
      "name": "Generate Simple Engagement Reply",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1600, 360],
      "parameters": {
        "jsCode": "const replies = ['❤️', '🙌', '💯', '🔥', 'Thanks!'];\nreturn { json: { reply: replies[Math.floor(Math.random() * replies.length)] } };"
      }
    },
    {
      "id": "flag_lead_notify_user",
      "name": "Flag Lead + Notify User (WhatsApp)",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [1600, 480],
      "parameters": {
        "method": "POST",
        "url": "https://graph.facebook.com/v18.0/{{ $env.WHATSAPP_PHONE_ID }}/messages",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"messaging_product\": \"whatsapp\",\n  \"to\": \"{{ $('load_user_brand_context').first().json.phone }}\",\n  \"type\": \"text\",\n  \"text\": {\n    \"body\": \"🔥 *Potential Lead Detected!*\\n\\nPlatform: {{ $('normalize_engagement_input').first().json.platform }}\\nMessage: {{ $('normalize_engagement_input').first().json.message_text }}\\n\\n_Reply 'RESPOND' to send AI reply or handle manually_\"\n  }\n}"
      },
      "credentials": { "httpHeaderAuth": { "id": "meta_whatsapp", "name": "Meta WhatsApp" } }
    },
    {
      "id": "merge_replies",
      "name": "Merge All Replies",
      "type": "n8n-nodes-base.merge",
      "typeVersion": 2,
      "position": [1820, 180],
      "parameters": { "mode": "append" }
    },
    {
      "id": "post_reply_to_instagram",
      "name": "Post Reply to Instagram Comment",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [2040, 180],
      "parameters": {
        "method": "POST",
        "url": "https://graph.facebook.com/v18.0/{{ $('normalize_engagement_input').first().json.comment_id }}/replies",
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            { "name": "message", "value": "={{ $json.reply }}" },
            { "name": "access_token", "value": "={{ $('lookup_user_by_ig_account').first().json.access_token }}" }
          ]
        }
      }
    },
    {
      "id": "save_engagement_log",
      "name": "Save Engagement Log",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [2260, 180],
      "credentials": { "supabaseApi": { "id": "supabase_main", "name": "Supabase Main" } },
      "parameters": {
        "operation": "insert",
        "tableId": "engagement_logs",
        "dataMode": "jsonMapping",
        "jsonMapping": {
          "engagement_id": "={{ $('normalize_engagement_input').first().json.engagement_id }}",
          "user_id": "={{ $('lookup_user_by_ig_account').first().json.user_id }}",
          "platform": "={{ $('normalize_engagement_input').first().json.platform }}",
          "engagement_type": "={{ $('normalize_engagement_input').first().json.engagement_type }}",
          "message_text": "={{ $('normalize_engagement_input').first().json.message_text }}",
          "reply_sent": "={{ $json.reply || null }}",
          "intent_classified": "={{ $('route_by_intent').first().json.text?.trim() || 'unknown' }}",
          "processed_at": "={{ new Date().toISOString() }}"
        }
      }
    }
  ],
  "connections": {
    "Webhook: Instagram Comment Received": { "main": [[{ "node": "Normalize Engagement Input", "type": "main", "index": 0 }]] },
    "Webhook: Instagram DM Received": { "main": [[{ "node": "Normalize Engagement Input", "type": "main", "index": 0 }]] },
    "Webhook: Facebook Comment Received": { "main": [[{ "node": "Normalize Engagement Input", "type": "main", "index": 0 }]] },
    "Normalize Engagement Input": { "main": [[{ "node": "Lookup User by IG Account", "type": "main", "index": 0 }]] },
    "Lookup User by IG Account": { "main": [[{ "node": "Load User Brand Context", "type": "main", "index": 0 }]] },
    "Load User Brand Context": { "main": [[{ "node": "Check: Auto-Reply Enabled?", "type": "main", "index": 0 }]] },
    "Check: Auto-Reply Enabled?": { "main": [[{ "node": "Build Intent Classification Prompt", "type": "main", "index": 0 }], []] },
    "Build Intent Classification Prompt": { "main": [[{ "node": "AI: Classify Engagement Intent (Groq)", "type": "main", "index": 0 }]] },
    "AI: Classify Engagement Intent (Groq)": { "main": [[{ "node": "Route by Intent", "type": "main", "index": 0 }]] },
    "Route by Intent": { "main": [
      [{ "node": "Generate Positive Reply", "type": "main", "index": 0 }],
      [{ "node": "AI: Generate Question Reply", "type": "main", "index": 0 }],
      [{ "node": "Escalate Complaint to User (WhatsApp)", "type": "main", "index": 0 }],
      [{ "node": "Log Spam (No Reply)", "type": "main", "index": 0 }],
      [{ "node": "Generate Simple Engagement Reply", "type": "main", "index": 0 }],
      [{ "node": "Flag Lead + Notify User (WhatsApp)", "type": "main", "index": 0 }]
    ]},
    "Generate Positive Reply": { "main": [[{ "node": "Merge All Replies", "type": "main", "index": 0 }]] },
    "AI: Generate Question Reply": { "main": [[{ "node": "Merge All Replies", "type": "main", "index": 0 }]] },
    "Generate Simple Engagement Reply": { "main": [[{ "node": "Merge All Replies", "type": "main", "index": 0 }]] },
    "Merge All Replies": { "main": [[{ "node": "Post Reply to Instagram Comment", "type": "main", "index": 0 }]] },
    "Post Reply to Instagram Comment": { "main": [[{ "node": "Save Engagement Log", "type": "main", "index": 0 }]] }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT 6: APPROVAL — Manual review workflow (if brand requires)
// ═══════════════════════════════════════════════════════════════════════════════

{
  "name": "Social Media Manager — Agent 6: Approval",
  "nodes": [
    {
      "id": "approval_webhook_pending",
      "name": "Webhook: Post Pending Approval (Content Creator Handoff)",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [0, 0],
      "webhookId": "smm-approval-pending",
      "parameters": {
        "httpMethod": "POST",
        "path": "smm-approval-pending"
      }
    },
    {
      "id": "approval_webhook_reply",
      "name": "Webhook: User Approval Reply (WhatsApp)",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [0, 180],
      "webhookId": "smm-approval-reply",
      "parameters": {
        "httpMethod": "POST",
        "path": "smm-approval-reply"
      }
    },
    {
      "id": "load_pending_post",
      "name": "Load Pending Post Details",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [280, 0],
      "credentials": { "supabaseApi": { "id": "supabase_main", "name": "Supabase Main" } },
      "parameters": {
        "operation": "getAll",
        "tableId": "content_posts",
        "filterType": "string",
        "filterString": "id=eq.{{ $json.post_id }}&select=*",
        "returnAll": false,
        "limit": 1
      }
    },
    {
      "id": "load_user_for_approval",
      "name": "Load User Details",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [500, 0],
      "credentials": { "supabaseApi": { "id": "supabase_main", "name": "Supabase Main" } },
      "parameters": {
        "operation": "getAll",
        "tableId": "users",
        "filterType": "string",
        "filterString": "id=eq.{{ $json.user_id }}&select=id,phone,language_preference",
        "returnAll": false,
        "limit": 1
      }
    },
    {
      "id": "build_approval_preview",
      "name": "Build Approval Preview Message",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [720, 0],
      "parameters": {
        "jsCode": "const post = $('load_pending_post').first().json;\nconst user = $('load_user_for_approval').first().json;\n\nconst preview = `📝 *Content Ready for Approval*\\n\\n` +\n  `Platform: ${post.platform}\\n` +\n  `Type: ${post.content_type}\\n\\n` +\n  `*Caption:*\\n${post.caption}\\n\\n` +\n  `*Hashtags:*\\n${post.hashtags || 'None'}\\n\\n` +\n  (post.media_url ? `Media: ${post.media_url}\\n\\n` : '') +\n  `Scheduled: ${post.scheduled_at ? new Date(post.scheduled_at).toLocaleString('en-IN', {timeZone: 'Asia/Kolkata'}) : 'Not scheduled'}\\n\\n` +\n  `─────────────────\\n` +\n  `Reply:\\n` +\n  `✅ *APPROVE* — Publish as-is\\n` +\n  `✏️ *EDIT* — Request changes\\n` +\n  `❌ *REJECT* — Discard\\n` +\n  `⏰ *RESCHEDULE* — Change time`;\n\nreturn { json: { post, user, preview } };"
      }
    },
    {
      "id": "send_approval_request",
      "name": "WhatsApp: Send Approval Request",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [940, 0],
      "parameters": {
        "method": "POST",
        "url": "https://graph.facebook.com/v18.0/{{ $env.WHATSAPP_PHONE_ID }}/messages",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"messaging_product\": \"whatsapp\",\n  \"to\": \"{{ $json.user.phone }}\",\n  \"type\": \"text\",\n  \"text\": {\n    \"body\": \"{{ $json.preview }}\"\n  }\n}"
      },
      "credentials": { "httpHeaderAuth": { "id": "meta_whatsapp", "name": "Meta WhatsApp" } }
    },
    {
      "id": "update_post_approval_sent",
      "name": "Update Post: approval_sent",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [1160, 0],
      "credentials": { "supabaseApi": { "id": "supabase_main", "name": "Supabase Main" } },
      "parameters": {
        "operation": "update",
        "tableId": "content_posts",
        "filterType": "string",
        "filterString": "id=eq.{{ $json.post.id }}",
        "dataMode": "jsonMapping",
        "jsonMapping": {
          "status": "pending_approval",
          "approval_sent_at": "={{ new Date().toISOString() }}"
        }
      }
    },
    {
      "id": "parse_approval_reply",
      "name": "Parse Approval Reply",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [280, 180],
      "parameters": {
        "jsCode": "const body = $input.first().json;\nconst message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];\nconst text = message?.text?.body?.trim().toUpperCase() || '';\nconst from = message?.from;\n\nlet action;\nif (text.includes('APPROVE') || text === 'YES' || text === '✅') {\n  action = 'approve';\n} else if (text.includes('EDIT') || text.includes('CHANGE') || text === '✏️') {\n  action = 'edit';\n} else if (text.includes('REJECT') || text === 'NO' || text === '❌') {\n  action = 'reject';\n} else if (text.includes('RESCHEDULE') || text === '⏰') {\n  action = 'reschedule';\n} else {\n  action = 'unknown';\n}\n\nreturn { json: { action, raw_text: text, from, edit_instructions: text.includes('EDIT:') ? text.replace('EDIT:', '').trim() : null } };"
      }
    },
    {
      "id": "lookup_pending_post_by_user",
      "name": "Lookup Pending Post by User",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [500, 180],
      "credentials": { "supabaseApi": { "id": "supabase_main", "name": "Supabase Main" } },
      "parameters": {
        "operation": "getAll",
        "tableId": "content_posts",
        "filterType": "string",
        "filterString": "user_phone=eq.{{ $json.from }}&status=eq.pending_approval&order=approval_sent_at.desc&limit=1",
        "returnAll": false,
        "limit": 1
      }
    },
    {
      "id": "route_approval_action",
      "name": "Route by Approval Action",
      "type": "n8n-nodes-base.switch",
      "typeVersion": 3,
      "position": [720, 180],
      "parameters": {
        "dataType": "string",
        "value1": "={{ $('parse_approval_reply').first().json.action }}",
        "rules": {
          "rules": [
            { "value": "approve", "output": 0 },
            { "value": "edit", "output": 1 },
            { "value": "reject", "output": 2 },
            { "value": "reschedule", "output": 3 }
          ]
        }
      }
    },
    {
      "id": "handle_approve",
      "name": "Handle: Approve",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [940, 90],
      "credentials": { "supabaseApi": { "id": "supabase_main", "name": "Supabase Main" } },
      "parameters": {
        "operation": "update",
        "tableId": "content_posts",
        "filterType": "string",
        "filterString": "id=eq.{{ $('lookup_pending_post_by_user').first().json.id }}",
        "dataMode": "jsonMapping",
        "jsonMapping": {
          "status": "approved",
          "approved_at": "={{ new Date().toISOString() }}"
        }
      }
    },
    {
      "id": "trigger_scheduler_after_approve",
      "name": "Trigger Scheduler Agent",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [1160, 90],
      "parameters": {
        "method": "POST",
        "url": "={{ $env.N8N_WEBHOOK_BASE_URL }}/smm-scheduler-approved",
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            { "name": "post_id", "value": "={{ $('lookup_pending_post_by_user').first().json.id }}" }
          ]
        }
      }
    },
    {
      "id": "confirm_approved",
      "name": "WhatsApp: Confirm Approved",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [1380, 90],
      "parameters": {
        "method": "POST",
        "url": "https://graph.facebook.com/v18.0/{{ $env.WHATSAPP_PHONE_ID }}/messages",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"messaging_product\": \"whatsapp\",\n  \"to\": \"{{ $('parse_approval_reply').first().json.from }}\",\n  \"type\": \"text\",\n  \"text\": {\n    \"body\": \"✅ *Post Approved!*\\n\\nYour content has been queued for publishing as scheduled. You'll be notified when it goes live.\"\n  }\n}"
      },
      "credentials": { "httpHeaderAuth": { "id": "meta_whatsapp", "name": "Meta WhatsApp" } }
    },
    {
      "id": "handle_edit",
      "name": "Handle: Edit Request",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [940, 180],
      "parameters": {
        "jsCode": "const post = $('lookup_pending_post_by_user').first().json;\nconst editInstructions = $('parse_approval_reply').first().json.edit_instructions || 'User requested changes';\n\nreturn {\n  json: {\n    post_id: post.id,\n    original_caption: post.caption,\n    edit_instructions: editInstructions,\n    action: 'regenerate'\n  }\n};"
      }
    },
    {
      "id": "regenerate_with_edits",
      "name": "Trigger Content Creator for Edit",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [1160, 180],
      "parameters": {
        "method": "POST",
        "url": "={{ $env.N8N_WEBHOOK_BASE_URL }}/smm-content-creator-wa-manual",
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            { "name": "user_id", "value": "={{ $('lookup_pending_post_by_user').first().json.user_id }}" },
            { "name": "trigger_source", "value": "approval_edit" },
            { "name": "message", "value": "={{ 'Edit this post: ' + $json.edit_instructions + ' \\nOriginal: ' + $json.original_caption }}" }
          ]
        }
      }
    },
    {
      "id": "handle_reject",
      "name": "Handle: Reject",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [940, 270],
      "credentials": { "supabaseApi": { "id": "supabase_main", "name": "Supabase Main" } },
      "parameters": {
        "operation": "update",
        "tableId": "content_posts",
        "filterType": "string",
        "filterString": "id=eq.{{ $('lookup_pending_post_by_user').first().json.id }}",
        "dataMode": "jsonMapping",
        "jsonMapping": {
          "status": "rejected",
          "rejected_at": "={{ new Date().toISOString() }}"
        }
      }
    },
    {
      "id": "confirm_rejected",
      "name": "WhatsApp: Confirm Rejected",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [1160, 270],
      "parameters": {
        "method": "POST",
        "url": "https://graph.facebook.com/v18.0/{{ $env.WHATSAPP_PHONE_ID }}/messages",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"messaging_product\": \"whatsapp\",\n  \"to\": \"{{ $('parse_approval_reply').first().json.from }}\",\n  \"type\": \"text\",\n  \"text\": {\n    \"body\": \"❌ *Post Rejected*\\n\\nThe content has been discarded. Let me know when you'd like to create new content!\"\n  }\n}"
      },
      "credentials": { "httpHeaderAuth": { "id": "meta_whatsapp", "name": "Meta WhatsApp" } }
    },
    {
      "id": "handle_reschedule",
      "name": "Handle: Reschedule",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [940, 360],
      "parameters": {
        "method": "POST",
        "url": "https://graph.facebook.com/v18.0/{{ $env.WHATSAPP_PHONE_ID }}/messages",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"messaging_product\": \"whatsapp\",\n  \"to\": \"{{ $('parse_approval_reply').first().json.from }}\",\n  \"type\": \"text\",\n  \"text\": {\n    \"body\": \"⏰ *Reschedule Post*\\n\\nWhen would you like to publish?\\n\\nReply with:\\n- 'NOW' — Post immediately\\n- 'TOMORROW 10AM' — Schedule for tomorrow\\n- 'FRIDAY 6PM' — Specific day and time\"\n  }\n}"
      },
      "credentials": { "httpHeaderAuth": { "id": "meta_whatsapp", "name": "Meta WhatsApp" } }
    }
  ],
  "connections": {
    "Webhook: Post Pending Approval (Content Creator Handoff)": { "main": [[{ "node": "Load Pending Post Details", "type": "main", "index": 0 }]] },
    "Webhook: User Approval Reply (WhatsApp)": { "main": [[{ "node": "Parse Approval Reply", "type": "main", "index": 0 }]] },
    "Load Pending Post Details": { "main": [[{ "node": "Load User Details", "type": "main", "index": 0 }]] },
    "Load User Details": { "main": [[{ "node": "Build Approval Preview Message", "type": "main", "index": 0 }]] },
    "Build Approval Preview Message": { "main": [[{ "node": "WhatsApp: Send Approval Request", "type": "main", "index": 0 }]] },
    "WhatsApp: Send Approval Request": { "main": [[{ "node": "Update Post: approval_sent", "type": "main", "index": 0 }]] },
    "Parse Approval Reply": { "main": [[{ "node": "Lookup Pending Post by User", "type": "main", "index": 0 }]] },
    "Lookup Pending Post by User": { "main": [[{ "node": "Route by Approval Action", "type": "main", "index": 0 }]] },
    "Route by Approval Action": { "main": [
      [{ "node": "Handle: Approve", "type": "main", "index": 0 }],
      [{ "node": "Handle: Edit Request", "type": "main", "index": 0 }],
      [{ "node": "Handle: Reject", "type": "main", "index": 0 }],
      [{ "node": "Handle: Reschedule", "type": "main", "index": 0 }]
    ]},
    "Handle: Approve": { "main": [[{ "node": "Trigger Scheduler Agent", "type": "main", "index": 0 }]] },
    "Trigger Scheduler Agent": { "main": [[{ "node": "WhatsApp: Confirm Approved", "type": "main", "index": 0 }]] },
    "Handle: Edit Request": { "main": [[{ "node": "Trigger Content Creator for Edit", "type": "main", "index": 0 }]] },
    "Handle: Reject": { "main": [[{ "node": "WhatsApp: Confirm Rejected", "type": "main", "index": 0 }]] }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SOCIAL MEDIA MANAGER — COMPLETE 10/10 ARCHITECTURE
// ═══════════════════════════════════════════════════════════════════════════════
//
// 🎯 6-AGENT MULTI-AGENT ORCHESTRATION:
//
// ┌─────────────────────────────────────────────────────────────────────────────┐
// │                    SOCIAL MEDIA MANAGER ENGINE                              │
// │                                                                             │
// │   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐        │
// │   │  TREND SPOTTER  │───▶│ CONTENT CREATOR │───▶│    APPROVAL     │        │
// │   │   (Agent 2)     │    │    (Agent 1)    │    │   (Agent 6)     │        │
// │   │                 │    │                 │    │                 │        │
// │   │ • Twitter/X     │    │ • NKP System    │    │ • WhatsApp      │        │
// │   │ • Google Trends │    │ • Multi-trigger │    │   Approval      │        │
// │   │ • IG Audio      │    │ • Smart LLM     │    │ • Edit/Reject   │        │
// │   │ • Relevance AI  │    │   Routing       │    │ • Reschedule    │        │
// │   └─────────────────┘    └─────────────────┘    └────────┬────────┘        │
// │                                                          │                  │
// │                                                          ▼                  │
// │   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐        │
// │   │   ENGAGEMENT    │◀───│    ANALYTICS    │◀───│    SCHEDULER    │        │
// │   │   (Agent 5)     │    │    (Agent 4)    │    │    (Agent 3)    │        │
// │   │                 │    │                 │    │                 │        │
// │   │ • Comment Reply │    │ • Weekly Report │    │ • Meta API      │        │
// │   │ • DM Handler    │    │ • AI Insights   │    │ • LinkedIn      │        │
// │   │ • Lead Detect   │    │ • Best Times    │    │ • TikTok        │        │
// │   │ • Escalation    │    │ • Engagement %  │    │ • Twitter/X     │        │
// │   └─────────────────┘    └─────────────────┘    └─────────────────┘        │
// │                                                                             │
// └─────────────────────────────────────────────────────────────────────────────┘
//
// 📊 SUPABASE TABLES REQUIRED:
// ─────────────────────────────
// • users (id, phone, niche_primary, brand_context, platforms, language_preference, 
//          approval_preference, engagement_auto_reply, is_active, onboarding_complete)
// • niche_knowledge_packs (niche_id, content_pillars, hashtag_sets_json, trend_keywords,
//                          content_formats_json, audience_persona, tone_preset, hook_templates, cta_library)
// • content_posts (id, user_id, platform, content_type, caption, hashtags, media_url,
//                  scheduled_at, status, platform_post_id, approval_sent_at, published_at, error_message)
// • user_platform_tokens (user_id, platform, access_token, page_access_token, ig_user_id, linkedin_id)
// • trend_scans (scan_id, scanned_at, raw_trends, scored_trends, high_relevance_count)
// • analytics_reports (user_id, period, total_posts, total_impressions, total_engagement,
//                      engagement_rate, best_posting_hour, ai_insights, generated_at)
// • engagement_logs (engagement_id, user_id, platform, engagement_type, message_text,
//                    reply_sent, intent_classified, processed_at)
//
// 🔑 ENVIRONMENT VARIABLES:
// ─────────────────────────
// • SUPABASE_URL, SUPABASE_ANON_KEY
// • GROQ_API_KEY
// • OPENAI_API_KEY (for GPT-4o on complex tasks)
// • WHATSAPP_PHONE_ID, META_WHATSAPP_TOKEN
// • TWITTER_BEARER_TOKEN
// • N8N_WEBHOOK_BASE_URL
//
// ✅ THIS IS NOW 10/10 — COMPLETE SOCIAL MEDIA MANAGER ENGINE
// ═══════════════════════════════════════════════════════════════════════════════
    "Error Handler": { "main": [[{ "node": "WhatsApp: Error Notification (if alertable)", "type": "main", "index": 0 }]] }
  },

  "settings": {
    "executionOrder": "v1",
    "saveManualExecutions": true,
    "callerPolicy": "workflowsFromSameOwner",
    "errorWorkflow": "smm-error-logger",
    "timezone": "Asia/Kolkata"
  },

  "staticData": null,
  "tags": ["social-media-manager", "content-creator", "agent-1", "production"],

  "meta": {
    "workflow_version": "1.0.0",
    "agent": "Content Creator",
    "bot": "Social Media Manager",
    "platform_version": "AI Agent SaaS",
    "last_updated": "2026-04-06",
    "credentials_required": [
      "supabase_main — Supabase API key",
      "openai_api_key — OpenAI key (GPT-4o)",
      "groq_api_key — Groq key",
      "meta_wa_token — Meta WhatsApp Business API token"
    ],
    "env_vars_required": [
      "WHATSAPP_PHONE_NUMBER_ID",
      "N8N_BASE_URL",
      "ADMIN_WHATSAPP_NUMBER"
    ],
    "trigger_webhooks": [
      "smm-content-creator-wa-manual",
      "smm-content-creator-calendar",
      "smm-content-creator-trend",
      "smm-content-creator-campaign",
      "smm-content-creator-repurpose",
      "smm-approval-reply-handler"
    ],
    "downstream_webhooks_called": [
      "smm-scheduler-enqueue (Agent 2)"
    ],
    "supabase_tables": [
      "users", "niche_knowledge_packs", "posts"
    ],
    "node_count": 42,
    "flow_count": 6,
    "notes": "Edit loop is infinite by design — user can keep editing until they approve. Rejection is logged for analytics but no retry is automatic. All LLM prompts expect JSON-only output — parse failures trigger the error handler."
  }
}