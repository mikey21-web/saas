{
  "name": "TaskMaster v2 - 10/10 Complete AI Meeting to Task Agent",
  "nodes": [
    {
      "id": "1",
      "name": "Webhook - Receive Input",
      "type": "n8n-nodes-base.webhook",
      "position": [100, 300],
      "parameters": {
        "path": "taskmaster/input",
        "method": "POST",
        "responseMode": "lastNode",
        "options": {}
      }
    },
    {
      "id": "2",
      "name": "Switch - Input Type",
      "type": "n8n-nodes-base.switch",
      "position": [300, 300],
      "parameters": {
        "dataType": "string",
        "value": "={{ $json.input_type }}",
        "rules": {
          "rules": [
            { "value": "audio", "output": 0 },
            { "value": "text", "output": 1 },
            { "value": "google_calendar", "output": 2 },
            { "value": "notion", "output": 3 },
            { "value": "google_docs", "output": 4 }
          ]
        }
      }
    },
    {
      "id": "3",
      "name": "OpenAI - Transcribe Audio (Whisper)",
      "type": "n8n-nodes-base.openAi",
      "position": [500, 100],
      "parameters": {
        "resource": "audio",
        "operation": "transcribe",
        "binaryPropertyName": "audio_file",
        "options": { "language": "en" }
      }
    },
    {
      "id": "4",
      "name": "HTTP - Fetch Notion Meeting Notes",
      "type": "n8n-nodes-base.httpRequest",
      "position": [500, 400],
      "parameters": {
        "method": "GET",
        "url": "https://api.notion.com/v1/pages/={{ $json.notion_page_id }}",
        "headers": {
          "Authorization": "Bearer {{ $env.NOTION_TOKEN }}",
          "Notion-Version": "2022-06-28"
        }
      }
    },
    {
      "id": "5",
      "name": "HTTP - Fetch Google Docs Notes",
      "type": "n8n-nodes-base.httpRequest",
      "position": [500, 500],
      "parameters": {
        "method": "GET",
        "url": "https://docs.googleapis.com/v1/documents/={{ $json.doc_id }}",
        "authentication": "oAuth2",
        "credentials": "googleDocsOAuth2Api"
      }
    },
    {
      "id": "6",
      "name": "Google Calendar - Get Meeting Notes",
      "type": "n8n-nodes-base.googleCalendar",
      "position": [500, 200],
      "parameters": {
        "resource": "event",
        "operation": "get",
        "calendarId": "={{ $json.calendar_id }}",
        "eventId": "={{ $json.event_id }}"
      }
    },
    {
      "id": "7",
      "name": "Merge - All Inputs to Text",
      "type": "n8n-nodes-base.merge",
      "position": [700, 300],
      "parameters": { "mode": "passThrough" }
    },
    {
      "id": "8",
      "name": "OpenAI - Extract Tasks (GPT-4)",
      "type": "n8n-nodes-base.openAi",
      "position": [900, 300],
      "parameters": {
        "resource": "chat",
        "operation": "message",
        "model": "gpt-4o",
        "messages": {
          "values": [
            {
              "role": "system",
              "content": "You are a task extraction AI. Extract all action items from the meeting notes. For each task return: title, assignee_name, deadline (ISO 8601, default to tomorrow 5PM IST if not mentioned), priority (high/medium/low), dependencies (list of task titles this depends on), subtasks (list of strings), is_recurring (boolean), recurrence_pattern (if recurring: daily/weekly/monthly). Return ONLY valid JSON: { tasks: [...] }. No explanation."
            },
            {
              "role": "user",
              "content": "={{ $json.meeting_text }}"
            }
          ]
        },
        "options": {
          "temperature": 0.1,
          "response_format": { "type": "json_object" }
        }
      }
    },
    {
      "id": "9",
      "name": "Code - Parse & Validate Tasks",
      "type": "n8n-nodes-base.code",
      "position": [1100, 300],
      "parameters": {
        "language": "javaScript",
        "jsCode": "const raw = JSON.parse($input.first().json.message.content);\nconst tasks = raw.tasks || [];\nconst now = new Date();\nconst meetingId = $input.first().json.meeting_id || `meeting_${Date.now()}`;\n\nreturn tasks.map((task, i) => ({\n  json: {\n    task_id: `task_${Date.now()}_${i}`,\n    title: task.title,\n    assignee_name: task.assignee_name,\n    deadline: task.deadline || new Date(now.getTime() + 24*60*60*1000).toISOString(),\n    priority: task.priority || 'medium',\n    dependencies: task.dependencies || [],\n    subtasks: task.subtasks || [],\n    is_recurring: task.is_recurring || false,\n    recurrence_pattern: task.recurrence_pattern || null,\n    status: 'pending',\n    completion_percent: 0,\n    created_at: now.toISOString(),\n    meeting_id: meetingId,\n    reminder_24h_sent: false,\n    reminder_2h_sent: false,\n    retry_count: 0\n  }\n}));"
      }
    },
    {
      "id": "10",
      "name": "HTTP - Check Existing Tasks for Duplicates",
      "type": "n8n-nodes-base.httpRequest",
      "position": [1300, 300],
      "parameters": {
        "method": "GET",
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/tasks?assignee_name=eq.{{ $json.assignee_name }}&status=neq.completed&select=task_id,title",
        "headers": {
          "apikey": "={{ $env.SUPABASE_ANON_KEY }}",
          "Authorization": "Bearer {{ $env.SUPABASE_ANON_KEY }}"
        }
      }
    },
    {
      "id": "11",
      "name": "OpenAI - Check Duplicate",
      "type": "n8n-nodes-base.openAi",
      "position": [1500, 300],
      "parameters": {
        "resource": "chat",
        "operation": "message",
        "model": "gpt-4o-mini",
        "messages": {
          "values": [
            {
              "role": "system",
              "content": "You are a duplicate task detector. Given a new task title and a list of existing tasks, return JSON: { is_duplicate: boolean, duplicate_task_id: string | null, similarity_score: number }. Consider semantic similarity, not just exact match. Threshold: similarity > 0.85 = duplicate."
            },
            {
              "role": "user",
              "content": "=New task: {{ $json.title }}\n\nExisting tasks: {{ JSON.stringify($input.last().json) }}"
            }
          ]
        },
        "options": {
          "response_format": { "type": "json_object" }
        }
      }
    },
    {
      "id": "12",
      "name": "IF - Is Duplicate?",
      "type": "n8n-nodes-base.if",
      "position": [1700, 300],
      "parameters": {
        "conditions": {
          "boolean": [
            {
              "value1": "={{ JSON.parse($json.message.content).is_duplicate }}",
              "value2": false
            }
          ]
        }
      }
    },
    {
      "id": "13",
      "name": "Switch - Directory Source",
      "type": "n8n-nodes-base.switch",
      "position": [1900, 200],
      "parameters": {
        "dataType": "string",
        "value": "={{ $json.directory_source }}",
        "rules": {
          "rules": [
            { "value": "google_sheets", "output": 0 },
            { "value": "supabase", "output": 1 },
            { "value": "notion", "output": 2 },
            { "value": "airtable", "output": 3 }
          ]
        },
        "fallbackOutput": 1
      }
    },
    {
      "id": "14",
      "name": "Google Sheets - Lookup Contact",
      "type": "n8n-nodes-base.googleSheets",
      "position": [2100, 100],
      "parameters": {
        "operation": "read",
        "sheetId": "={{ $env.TEAM_SHEET_ID }}",
        "range": "Team!A:D",
        "options": { "headerRow": true }
      }
    },
    {
      "id": "15",
      "name": "HTTP - Supabase Lookup Contact",
      "type": "n8n-nodes-base.httpRequest",
      "position": [2100, 200],
      "parameters": {
        "method": "GET",
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/team_members?name=ilike.*{{ $json.assignee_name }}*&select=name,phone,email,whatsapp_id",
        "headers": {
          "apikey": "={{ $env.SUPABASE_ANON_KEY }}",
          "Authorization": "Bearer {{ $env.SUPABASE_ANON_KEY }}"
        }
      }
    },
    {
      "id": "16",
      "name": "HTTP - Notion DB Lookup Contact",
      "type": "n8n-nodes-base.httpRequest",
      "position": [2100, 300],
      "parameters": {
        "method": "POST",
        "url": "https://api.notion.com/v1/databases/{{ $env.NOTION_TEAM_DB_ID }}/query",
        "headers": {
          "Authorization": "Bearer {{ $env.NOTION_TOKEN }}",
          "Notion-Version": "2022-06-28"
        },
        "body": {
          "filter": {
            "property": "Name",
            "rich_text": { "contains": "={{ $json.assignee_name }}" }
          }
        }
      }
    },
    {
      "id": "17",
      "name": "HTTP - Airtable Lookup Contact",
      "type": "n8n-nodes-base.httpRequest",
      "position": [2100, 400],
      "parameters": {
        "method": "GET",
        "url": "https://api.airtable.com/v0/{{ $env.AIRTABLE_BASE_ID }}/Team?filterByFormula=SEARCH('{{ $json.assignee_name }}',{Name})",
        "headers": {
          "Authorization": "Bearer {{ $env.AIRTABLE_API_KEY }}"
        }
      }
    },
    {
      "id": "18",
      "name": "Code - Normalize Contact Data",
      "type": "n8n-nodes-base.code",
      "position": [2300, 250],
      "parameters": {
        "language": "javaScript",
        "jsCode": "const task = $input.first().json;\nconst contactRaw = $input.last().json;\n\nlet phone = null, email = null, whatsapp_id = null;\n\nif (Array.isArray(contactRaw)) {\n  const match = contactRaw.find(c => c.name?.toLowerCase().includes(task.assignee_name?.toLowerCase()));\n  phone = match?.phone; email = match?.email; whatsapp_id = match?.whatsapp_id || match?.phone;\n} else if (contactRaw.results) {\n  const r = contactRaw.results[0];\n  phone = r?.properties?.Phone?.phone_number; email = r?.properties?.Email?.email; whatsapp_id = phone;\n} else if (contactRaw.records) {\n  const r = contactRaw.records[0];\n  phone = r?.fields?.Phone; email = r?.fields?.Email; whatsapp_id = phone;\n}\n\nreturn [{ json: { ...task, assignee_phone: phone, assignee_email: email, assignee_whatsapp_id: whatsapp_id, contact_found: !!phone } }];"
      }
    },
    {
      "id": "19",
      "name": "IF - Contact Found?",
      "type": "n8n-nodes-base.if",
      "position": [2500, 250],
      "parameters": {
        "conditions": {
          "boolean": [{ "value1": "={{ $json.contact_found }}", "value2": true }]
        }
      }
    },
    {
      "id": "20",
      "name": "IF - Has Dependencies?",
      "type": "n8n-nodes-base.if",
      "position": [2700, 150],
      "parameters": {
        "conditions": {
          "number": [{ "value1": "={{ $json.dependencies.length }}", "operation": "larger", "value2": 0 }]
        }
      }
    },
    {
      "id": "21",
      "name": "HTTP - Check Dependency Status",
      "type": "n8n-nodes-base.httpRequest",
      "position": [2900, 100],
      "parameters": {
        "method": "GET",
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/tasks?title=in.({{ $json.dependencies.map(d => `\"${d}\"`).join(',') }})&select=title,status",
        "headers": {
          "apikey": "={{ $env.SUPABASE_ANON_KEY }}",
          "Authorization": "Bearer {{ $env.SUPABASE_ANON_KEY }}"
        }
      }
    },
    {
      "id": "22",
      "name": "IF - All Dependencies Done?",
      "type": "n8n-nodes-base.if",
      "position": [3100, 100],
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{ $json.every(d => d.status === 'completed') ? 'yes' : 'no' }}",
              "value2": "yes"
            }
          ]
        }
      }
    },
    {
      "id": "23",
      "name": "HTTP - Save Task as Blocked",
      "type": "n8n-nodes-base.httpRequest",
      "position": [3300, 50],
      "parameters": {
        "method": "POST",
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/tasks",
        "headers": {
          "apikey": "={{ $env.SUPABASE_ANON_KEY }}",
          "Authorization": "Bearer {{ $env.SUPABASE_ANON_KEY }}",
          "Content-Type": "application/json",
          "Prefer": "return=representation"
        },
        "body": "={{ JSON.stringify({ ...$json, status: 'blocked' }) }}"
      }
    },
    {
      "id": "24",
      "name": "HTTP - Save Task to Supabase",
      "type": "n8n-nodes-base.httpRequest",
      "position": [2900, 200],
      "parameters": {
        "method": "POST",
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/tasks",
        "headers": {
          "apikey": "={{ $env.SUPABASE_ANON_KEY }}",
          "Authorization": "Bearer {{ $env.SUPABASE_ANON_KEY }}",
          "Content-Type": "application/json",
          "Prefer": "return=representation"
        },
        "body": "={{ JSON.stringify($json) }}"
      }
    },
    {
      "id": "25",
      "name": "HTTP - Flag Unrouted Task",
      "type": "n8n-nodes-base.httpRequest",
      "position": [2700, 350],
      "parameters": {
        "method": "POST",
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/unrouted_tasks",
        "headers": {
          "apikey": "={{ $env.SUPABASE_ANON_KEY }}",
          "Authorization": "Bearer {{ $env.SUPABASE_ANON_KEY }}",
          "Content-Type": "application/json"
        },
        "body": "={{ JSON.stringify({ ...$json, reason: 'contact_not_found' }) }}"
      }
    },
    {
      "id": "26",
      "name": "HTTP - Alert Manager Unrouted",
      "type": "n8n-nodes-base.httpRequest",
      "position": [2900, 350],
      "parameters": {
        "method": "POST",
        "url": "https://graph.facebook.com/v18.0/{{ $env.WHATSAPP_PHONE_NUMBER_ID }}/messages",
        "headers": {
          "Authorization": "Bearer {{ $env.WHATSAPP_TOKEN }}",
          "Content-Type": "application/json"
        },
        "body": "={\n  \"messaging_product\": \"whatsapp\",\n  \"to\": \"{{ $env.MANAGER_WHATSAPP }}\",\n  \"type\": \"text\",\n  \"text\": {\n    \"body\": \"⚠️ Could not assign task:\\n*{{ $json.title }}*\\n\\nAssignee *{{ $json.assignee_name }}* not found in directory.\\n\\nPlease add them to the team directory and reply *retry {{ $json.task_id }}*\"\n  }\n}"
      }
    },
    {
      "id": "27",
      "name": "Code - Build WhatsApp Message",
      "type": "n8n-nodes-base.code",
      "position": [3100, 200],
      "parameters": {
        "language": "javaScript",
        "jsCode": "const task = $input.first().json;\nconst deadline = new Date(task.deadline).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });\nconst subtaskList = task.subtasks?.length ? '\\n\\n📋 Subtasks:\\n' + task.subtasks.map((s, i) => `  ${i+1}. ${s}`).join('\\n') : '';\nconst depList = task.dependencies?.length ? `\\n\\n⚠️ Note: Depends on: ${task.dependencies.join(', ')}` : '';\nconst priorityEmoji = { high: '🔴', medium: '🟡', low: '🟢' }[task.priority] || '🟡';\nconst recurringNote = task.is_recurring ? `\\n\\n🔁 This is a recurring task (${task.recurrence_pattern})` : '';\n\nreturn [{\n  json: {\n    ...task,\n    whatsapp_message: `👋 Hi ${task.assignee_name}!\\n\\nYou have a new task from today's meeting:\\n\\n${priorityEmoji} *${task.title}*\\n📅 Deadline: ${deadline}${subtaskList}${depList}${recurringNote}\\n\\nReply with:\\n✅ *Done* — mark complete\\n📊 *50%* — update progress\\n⏰ *More time* — request extension\\n❓ *Help* — get assistance\\n\\nTask ID: \`${task.task_id}\``\n  }\n}];"
      }
    },
    {
      "id": "28",
      "name": "HTTP - Send WhatsApp via Meta API",
      "type": "n8n-nodes-base.httpRequest",
      "position": [3300, 200],
      "parameters": {
        "method": "POST",
        "url": "https://graph.facebook.com/v18.0/{{ $env.WHATSAPP_PHONE_NUMBER_ID }}/messages",
        "headers": {
          "Authorization": "Bearer {{ $env.WHATSAPP_TOKEN }}",
          "Content-Type": "application/json"
        },
        "body": "={\n  \"messaging_product\": \"whatsapp\",\n  \"to\": \"{{ $json.assignee_whatsapp_id }}\",\n  \"type\": \"text\",\n  \"text\": { \"body\": \"{{ $json.whatsapp_message }}\" }\n}",
        "options": {
          "retry": {
            "enabled": true,
            "maxTries": 3,
            "waitBetweenTries": 5000
          }
        }
      }
    },
    {
      "id": "29",
      "name": "IF - WhatsApp Send Success?",
      "type": "n8n-nodes-base.if",
      "position": [3500, 200],
      "parameters": {
        "conditions": {
          "string": [{ "value1": "={{ $json.messages?.[0]?.id ? 'yes' : 'no' }}", "value2": "yes" }]
        }
      }
    },
    {
      "id": "30",
      "name": "HTTP - Update Task WhatsApp Sent",
      "type": "n8n-nodes-base.httpRequest",
      "position": [3700, 150],
      "parameters": {
        "method": "PATCH",
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/tasks?task_id=eq.{{ $json.task_id }}",
        "headers": {
          "apikey": "={{ $env.SUPABASE_ANON_KEY }}",
          "Authorization": "Bearer {{ $env.SUPABASE_ANON_KEY }}",
          "Content-Type": "application/json"
        },
        "body": "={ \"whatsapp_sent\": true, \"whatsapp_message_id\": \"{{ $json.messages[0].id }}\", \"notified_at\": \"{{ new Date().toISOString() }}\", \"retry_count\": 0 }"
      }
    },
    {
      "id": "31",
      "name": "HTTP - Queue Failed WhatsApp for Retry",
      "type": "n8n-nodes-base.httpRequest",
      "position": [3700, 300],
      "parameters": {
        "method": "POST",
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/failed_notifications",
        "headers": {
          "apikey": "={{ $env.SUPABASE_ANON_KEY }}",
          "Authorization": "Bearer {{ $env.SUPABASE_ANON_KEY }}",
          "Content-Type": "application/json"
        },
        "body": "={{ JSON.stringify({ task_id: $json.task_id, assignee_whatsapp_id: $json.assignee_whatsapp_id, message: $json.whatsapp_message, retry_count: $json.retry_count + 1, next_retry_at: new Date(Date.now() + 15*60*1000).toISOString() }) }}"
      }
    },
    {
      "id": "32",
      "name": "Jira - Create Ticket (Optional)",
      "type": "n8n-nodes-base.jira",
      "position": [3700, 400],
      "parameters": {
        "resource": "issue",
        "operation": "create",
        "project": "={{ $env.JIRA_PROJECT_KEY }}",
        "summary": "={{ $json.title }}",
        "issueType": "Task",
        "priority": "={{ $json.priority === 'high' ? 'High' : $json.priority === 'medium' ? 'Medium' : 'Low' }}",
        "description": "=Assigned to: {{ $json.assignee_name }}\nDeadline: {{ $json.deadline }}\nTask ID: {{ $json.task_id }}"
      }
    },
    {
      "id": "33",
      "name": "Slack - Send Notification (Optional)",
      "type": "n8n-nodes-base.slack",
      "position": [3700, 500],
      "parameters": {
        "resource": "message",
        "operation": "post",
        "channel": "={{ $env.SLACK_CHANNEL_ID }}",
        "text": "=🆕 New Task Assigned\n*{{ $json.title }}*\nAssignee: {{ $json.assignee_name }}\nDeadline: {{ $json.deadline }}\nPriority: {{ $json.priority }}"
      }
    },

    {
      "id": "40",
      "name": "Webhook - Receive WhatsApp Reply",
      "type": "n8n-nodes-base.webhook",
      "position": [100, 900],
      "parameters": {
        "path": "taskmaster/whatsapp-reply",
        "method": "POST",
        "responseMode": "lastNode"
      }
    },
    {
      "id": "41",
      "name": "Code - Extract Reply Data",
      "type": "n8n-nodes-base.code",
      "position": [300, 900],
      "parameters": {
        "language": "javaScript",
        "jsCode": "const entry = $input.first().json.entry?.[0];\nconst change = entry?.changes?.[0]?.value;\nconst message = change?.messages?.[0];\nconst from = message?.from;\nconst body = message?.text?.body || '';\n\n// Check if manager replying to extension request\nconst isManager = from === process.env.MANAGER_WHATSAPP?.replace('+','');\n\nreturn [{ json: { reply_text: body, from_number: from, is_manager: isManager, raw: $input.first().json } }];"
      }
    },
    {
      "id": "42",
      "name": "OpenAI - Parse Reply Intent",
      "type": "n8n-nodes-base.openAi",
      "position": [500, 900],
      "parameters": {
        "resource": "chat",
        "operation": "message",
        "model": "gpt-4o-mini",
        "messages": {
          "values": [
            {
              "role": "system",
              "content": "Parse the WhatsApp reply and return JSON: { intent: 'completed' | 'progress' | 'extension_request' | 'extension_approve' | 'extension_deny' | 'help' | 'query' | 'retry' | 'unknown', progress_percent: number | null, extension_days: number | null, task_id: string | null, query_text: string | null }. For 'retry <task_id>' messages, extract the task_id."
            },
            { "role": "user", "content": "={{ $json.reply_text }}" }
          ]
        },
        "options": { "response_format": { "type": "json_object" } }
      }
    },
    {
      "id": "43",
      "name": "Switch - Reply Intent",
      "type": "n8n-nodes-base.switch",
      "position": [700, 900],
      "parameters": {
        "dataType": "string",
        "value": "={{ JSON.parse($json.message.content).intent }}",
        "rules": {
          "rules": [
            { "value": "completed", "output": 0 },
            { "value": "progress", "output": 1 },
            { "value": "extension_request", "output": 2 },
            { "value": "extension_approve", "output": 3 },
            { "value": "extension_deny", "output": 4 },
            { "value": "help", "output": 5 },
            { "value": "query", "output": 6 },
            { "value": "retry", "output": 7 }
          ]
        },
        "fallbackOutput": 8
      }
    },
    {
      "id": "44",
      "name": "HTTP - Mark Task Complete",
      "type": "n8n-nodes-base.httpRequest",
      "position": [900, 800],
      "parameters": {
        "method": "PATCH",
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/tasks?task_id=eq.{{ JSON.parse($json.message.content).task_id }}",
        "headers": {
          "apikey": "={{ $env.SUPABASE_ANON_KEY }}",
          "Authorization": "Bearer {{ $env.SUPABASE_ANON_KEY }}",
          "Content-Type": "application/json"
        },
        "body": "={ \"status\": \"completed\", \"completed_at\": \"{{ new Date().toISOString() }}\", \"completion_percent\": 100 }"
      }
    },
    {
      "id": "45",
      "name": "HTTP - Check Blocked Dependents After Completion",
      "type": "n8n-nodes-base.httpRequest",
      "position": [1100, 800],
      "parameters": {
        "method": "GET",
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/tasks?status=eq.blocked&select=*",
        "headers": {
          "apikey": "={{ $env.SUPABASE_ANON_KEY }}",
          "Authorization": "Bearer {{ $env.SUPABASE_ANON_KEY }}"
        }
      }
    },
    {
      "id": "46",
      "name": "Code - Find Newly Unblocked Tasks",
      "type": "n8n-nodes-base.code",
      "position": [1300, 800],
      "parameters": {
        "language": "javaScript",
        "jsCode": "const completedTitle = $input.first().json.title;\nconst blockedTasks = $input.last().json;\n\nconst unblocked = blockedTasks.filter(t => \n  t.dependencies?.includes(completedTitle)\n);\n\nreturn unblocked.map(t => ({ json: t }));"
      }
    },
    {
      "id": "47",
      "name": "HTTP - Unblock Task + Notify Assignee",
      "type": "n8n-nodes-base.httpRequest",
      "position": [1500, 800],
      "parameters": {
        "method": "PATCH",
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/tasks?task_id=eq.{{ $json.task_id }}",
        "headers": {
          "apikey": "={{ $env.SUPABASE_ANON_KEY }}",
          "Authorization": "Bearer {{ $env.SUPABASE_ANON_KEY }}",
          "Content-Type": "application/json"
        },
        "body": "={ \"status\": \"pending\" }"
      }
    },
    {
      "id": "48",
      "name": "HTTP - Send Unblocked WhatsApp",
      "type": "n8n-nodes-base.httpRequest",
      "position": [1700, 800],
      "parameters": {
        "method": "POST",
        "url": "https://graph.facebook.com/v18.0/{{ $env.WHATSAPP_PHONE_NUMBER_ID }}/messages",
        "headers": {
          "Authorization": "Bearer {{ $env.WHATSAPP_TOKEN }}",
          "Content-Type": "application/json"
        },
        "body": "={\n  \"messaging_product\": \"whatsapp\",\n  \"to\": \"{{ $json.assignee_whatsapp_id }}\",\n  \"type\": \"text\",\n  \"text\": { \"body\": \"✅ Good news! Your task *{{ $json.title }}* is now unblocked and ready to start.\\n\\nDeadline: {{ $json.deadline }}\\n\\nReply *Done*, *50%*, or *More time*\" }\n}"
      }
    },
    {
      "id": "49",
      "name": "HTTP - Update Progress",
      "type": "n8n-nodes-base.httpRequest",
      "position": [900, 900],
      "parameters": {
        "method": "PATCH",
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/tasks?task_id=eq.{{ JSON.parse($json.message.content).task_id }}",
        "headers": {
          "apikey": "={{ $env.SUPABASE_ANON_KEY }}",
          "Authorization": "Bearer {{ $env.SUPABASE_ANON_KEY }}",
          "Content-Type": "application/json"
        },
        "body": "={ \"status\": \"in_progress\", \"completion_percent\": {{ JSON.parse($json.message.content).progress_percent }} }"
      }
    },
    {
      "id": "50",
      "name": "HTTP - Save Extension Request",
      "type": "n8n-nodes-base.httpRequest",
      "position": [900, 1000],
      "parameters": {
        "method": "POST",
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/extension_requests",
        "headers": {
          "apikey": "={{ $env.SUPABASE_ANON_KEY }}",
          "Authorization": "Bearer {{ $env.SUPABASE_ANON_KEY }}",
          "Content-Type": "application/json"
        },
        "body": "={{ JSON.stringify({ task_id: JSON.parse($json.message.content).task_id, extension_days: JSON.parse($json.message.content).extension_days, requested_at: new Date().toISOString(), status: 'pending' }) }}"
      }
    },
    {
      "id": "51",
      "name": "HTTP - Fetch Task for Extension Request",
      "type": "n8n-nodes-base.httpRequest",
      "position": [1100, 1000],
      "parameters": {
        "method": "GET",
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/tasks?task_id=eq.{{ JSON.parse($json.message.content).task_id }}&select=*",
        "headers": {
          "apikey": "={{ $env.SUPABASE_ANON_KEY }}",
          "Authorization": "Bearer {{ $env.SUPABASE_ANON_KEY }}"
        }
      }
    },
    {
      "id": "52",
      "name": "HTTP - Notify Manager Extension Request",
      "type": "n8n-nodes-base.httpRequest",
      "position": [1300, 1000],
      "parameters": {
        "method": "POST",
        "url": "https://graph.facebook.com/v18.0/{{ $env.WHATSAPP_PHONE_NUMBER_ID }}/messages",
        "headers": {
          "Authorization": "Bearer {{ $env.WHATSAPP_TOKEN }}",
          "Content-Type": "application/json"
        },
        "body": "={\n  \"messaging_product\": \"whatsapp\",\n  \"to\": \"{{ $env.MANAGER_WHATSAPP }}\",\n  \"type\": \"text\",\n  \"text\": {\n    \"body\": \"⏰ Extension Request\\n\\n*{{ $json[0].assignee_name }}* needs more time for:\\n*{{ $json[0].title }}*\\n\\nOriginal deadline: {{ $json[0].deadline }}\\nDays requested: {{ JSON.parse($input.first().json.message.content).extension_days || 'Not specified' }}\\n\\nReply:\\n✅ *Approve {{ $json[0].task_id }}*\\n❌ *Deny {{ $json[0].task_id }}*\"\n  }\n}"
      }
    },
    {
      "id": "53",
      "name": "HTTP - Approve Extension in DB",
      "type": "n8n-nodes-base.httpRequest",
      "position": [900, 1100],
      "parameters": {
        "method": "PATCH",
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/extension_requests?task_id=eq.{{ JSON.parse($json.message.content).task_id }}&status=eq.pending",
        "headers": {
          "apikey": "={{ $env.SUPABASE_ANON_KEY }}",
          "Authorization": "Bearer {{ $env.SUPABASE_ANON_KEY }}",
          "Content-Type": "application/json"
        },
        "body": "={ \"status\": \"approved\", \"resolved_at\": \"{{ new Date().toISOString() }}\" }"
      }
    },
    {
      "id": "54",
      "name": "HTTP - Fetch Task for Extension Update",
      "type": "n8n-nodes-base.httpRequest",
      "position": [1100, 1100],
      "parameters": {
        "method": "GET",
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/tasks?task_id=eq.{{ JSON.parse($json.message.content).task_id }}&select=*",
        "headers": {
          "apikey": "={{ $env.SUPABASE_ANON_KEY }}",
          "Authorization": "Bearer {{ $env.SUPABASE_ANON_KEY }}"
        }
      }
    },
    {
      "id": "55",
      "name": "Code - Calculate New Deadline",
      "type": "n8n-nodes-base.code",
      "position": [1300, 1100],
      "parameters": {
        "language": "javaScript",
        "jsCode": "const task = $input.last().json[0];\nconst extensionDays = JSON.parse($input.first().json.message.content).extension_days || 2;\nconst newDeadline = new Date(new Date(task.deadline).getTime() + extensionDays * 24*60*60*1000).toISOString();\n\nreturn [{ json: { ...task, new_deadline: newDeadline, extension_days: extensionDays } }];"
      }
    },
    {
      "id": "56",
      "name": "HTTP - Update Task Deadline",
      "type": "n8n-nodes-base.httpRequest",
      "position": [1500, 1100],
      "parameters": {
        "method": "PATCH",
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/tasks?task_id=eq.{{ $json.task_id }}",
        "headers": {
          "apikey": "={{ $env.SUPABASE_ANON_KEY }}",
          "Authorization": "Bearer {{ $env.SUPABASE_ANON_KEY }}",
          "Content-Type": "application/json"
        },
        "body": "={ \"deadline\": \"{{ $json.new_deadline }}\", \"extension_granted\": true }"
      }
    },
    {
      "id": "57",
      "name": "HTTP - Notify Assignee Extension Approved",
      "type": "n8n-nodes-base.httpRequest",
      "position": [1700, 1100],
      "parameters": {
        "method": "POST",
        "url": "https://graph.facebook.com/v18.0/{{ $env.WHATSAPP_PHONE_NUMBER_ID }}/messages",
        "headers": {
          "Authorization": "Bearer {{ $env.WHATSAPP_TOKEN }}",
          "Content-Type": "application/json"
        },
        "body": "={\n  \"messaging_product\": \"whatsapp\",\n  \"to\": \"{{ $json.assignee_whatsapp_id }}\",\n  \"type\": \"text\",\n  \"text\": { \"body\": \"✅ Extension approved!\\n\\nYour new deadline for *{{ $json.title }}* is:\\n📅 {{ new Date($json.new_deadline).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) }}\\n\\nYou got {{ $json.extension_days }} extra day(s). Make it count! 💪\" }\n}"
      }
    },
    {
      "id": "58",
      "name": "HTTP - Deny Extension in DB",
      "type": "n8n-nodes-base.httpRequest",
      "position": [900, 1200],
      "parameters": {
        "method": "PATCH",
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/extension_requests?task_id=eq.{{ JSON.parse($json.message.content).task_id }}&status=eq.pending",
        "headers": {
          "apikey": "={{ $env.SUPABASE_ANON_KEY }}",
          "Authorization": "Bearer {{ $env.SUPABASE_ANON_KEY }}",
          "Content-Type": "application/json"
        },
        "body": "={ \"status\": \"denied\", \"resolved_at\": \"{{ new Date().toISOString() }}\" }"
      }
    },
    {
      "id": "59",
      "name": "HTTP - Notify Assignee Extension Denied",
      "type": "n8n-nodes-base.httpRequest",
      "position": [1100, 1200],
      "parameters": {
        "method": "POST",
        "url": "https://graph.facebook.com/v18.0/{{ $env.WHATSAPP_PHONE_NUMBER_ID }}/messages",
        "headers": {
          "Authorization": "Bearer {{ $env.WHATSAPP_TOKEN }}",
          "Content-Type": "application/json"
        },
        "body": "={\n  \"messaging_product\": \"whatsapp\",\n  \"to\": \"{{ $json.assignee_whatsapp_id }}\",\n  \"type\": \"text\",\n  \"text\": { \"body\": \"❌ Extension not approved.\\n\\nPlease complete *{{ $json.title }}* by the original deadline.\\n\\nReply *Help* if you need support.\" }\n}"
      }
    },

    {
      "id": "60",
      "name": "Cron - 24hr Reminder (9AM Daily)",
      "type": "n8n-nodes-base.cron",
      "position": [100, 1500],
      "parameters": {
        "triggerTimes": { "item": [{ "hour": 9, "minute": 0 }] }
      }
    },
    {
      "id": "61",
      "name": "HTTP - Get Tasks Due in 24h",
      "type": "n8n-nodes-base.httpRequest",
      "position": [300, 1500],
      "parameters": {
        "method": "GET",
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/tasks?status=in.(pending,in_progress)&deadline=lte.{{ new Date(Date.now() + 24*60*60*1000).toISOString() }}&deadline=gte.{{ new Date().toISOString() }}&reminder_24h_sent=eq.false&select=*",
        "headers": {
          "apikey": "={{ $env.SUPABASE_ANON_KEY }}",
          "Authorization": "Bearer {{ $env.SUPABASE_ANON_KEY }}"
        }
      }
    },
    {
      "id": "62",
      "name": "HTTP - Send 24hr Reminder",
      "type": "n8n-nodes-base.httpRequest",
      "position": [500, 1500],
      "parameters": {
        "method": "POST",
        "url": "https://graph.facebook.com/v18.0/{{ $env.WHATSAPP_PHONE_NUMBER_ID }}/messages",
        "headers": {
          "Authorization": "Bearer {{ $env.WHATSAPP_TOKEN }}",
          "Content-Type": "application/json"
        },
        "body": "={\n  \"messaging_product\": \"whatsapp\",\n  \"to\": \"{{ $json.assignee_whatsapp_id }}\",\n  \"type\": \"text\",\n  \"text\": { \"body\": \"⏰ Reminder: *{{ $json.title }}* is due in 24 hours!\\n\\nProgress: {{ $json.completion_percent }}%\\nDeadline: {{ new Date($json.deadline).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) }}\\n\\nReply *Done*, *50%*, or *More time*\" }\n}"
      }
    },
    {
      "id": "63",
      "name": "HTTP - Mark 24h Reminder Sent",
      "type": "n8n-nodes-base.httpRequest",
      "position": [700, 1500],
      "parameters": {
        "method": "PATCH",
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/tasks?task_id=eq.{{ $json.task_id }}",
        "headers": {
          "apikey": "={{ $env.SUPABASE_ANON_KEY }}",
          "Authorization": "Bearer {{ $env.SUPABASE_ANON_KEY }}",
          "Content-Type": "application/json"
        },
        "body": "={ \"reminder_24h_sent\": true }"
      }
    },

    {
      "id": "64",
      "name": "Cron - 2hr Reminder (Every 30 min Check)",
      "type": "n8n-nodes-base.cron",
      "position": [100, 1650],
      "parameters": {
        "triggerTimes": { "item": [{ "mode": "everyX", "value": 30, "unit": "minutes" }] }
      }
    },
    {
      "id": "65",
      "name": "HTTP - Get Tasks Due in 2h",
      "type": "n8n-nodes-base.httpRequest",
      "position": [300, 1650],
      "parameters": {
        "method": "GET",
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/tasks?status=in.(pending,in_progress)&deadline=lte.{{ new Date(Date.now() + 2*60*60*1000).toISOString() }}&deadline=gte.{{ new Date().toISOString() }}&reminder_2h_sent=eq.false&select=*",
        "headers": {
          "apikey": "={{ $env.SUPABASE_ANON_KEY }}",
          "Authorization": "Bearer {{ $env.SUPABASE_ANON_KEY }}"
        }
      }
    },
    {
      "id": "66",
      "name": "HTTP - Send 2hr Reminder",
      "type": "n8n-nodes-base.httpRequest",
      "position": [500, 1650],
      "parameters": {
        "method": "POST",
        "url": "https://graph.facebook.com/v18.0/{{ $env.WHATSAPP_PHONE_NUMBER_ID }}/messages",
        "headers": {
          "Authorization": "Bearer {{ $env.WHATSAPP_TOKEN }}",
          "Content-Type": "application/json"
        },
        "body": "={\n  \"messaging_product\": \"whatsapp\",\n  \"to\": \"{{ $json.assignee_whatsapp_id }}\",\n  \"type\": \"text\",\n  \"text\": { \"body\": \"🚨 URGENT: *{{ $json.title }}* is due in 2 hours!\\n\\nProgress: {{ $json.completion_percent }}%\\n\\nReply now: *Done*, *80%*, or *More time*\" }\n}"
      }
    },
    {
      "id": "67",
      "name": "HTTP - Mark 2h Reminder Sent",
      "type": "n8n-nodes-base.httpRequest",
      "position": [700, 1650],
      "parameters": {
        "method": "PATCH",
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/tasks?task_id=eq.{{ $json.task_id }}",
        "headers": {
          "apikey": "={{ $env.SUPABASE_ANON_KEY }}",
          "Authorization": "Bearer {{ $env.SUPABASE_ANON_KEY }}",
          "Content-Type": "application/json"
        },
        "body": "={ \"reminder_2h_sent\": true }"
      }
    },

    {
      "id": "70",
      "name": "Cron - Retry Failed Notifications (Every 15 min)",
      "type": "n8n-nodes-base.cron",
      "position": [100, 1800],
      "parameters": {
        "triggerTimes": { "item": [{ "mode": "everyX", "value": 15, "unit": "minutes" }] }
      }
    },
    {
      "id": "71",
      "name": "HTTP - Get Failed Notifications",
      "type": "n8n-nodes-base.httpRequest",
      "position": [300, 1800],
      "parameters": {
        "method": "GET",
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/failed_notifications?next_retry_at=lte.{{ new Date().toISOString() }}&retry_count=lt.5&select=*",
        "headers": {
          "apikey": "={{ $env.SUPABASE_ANON_KEY }}",
          "Authorization": "Bearer {{ $env.SUPABASE_ANON_KEY }}"
        }
      }
    },
    {
      "id": "72",
      "name": "HTTP - Retry WhatsApp Send",
      "type": "n8n-nodes-base.httpRequest",
      "position": [500, 1800],
      "parameters": {
        "method": "POST",
        "url": "https://graph.facebook.com/v18.0/{{ $env.WHATSAPP_PHONE_NUMBER_ID }}/messages",
        "headers": {
          "Authorization": "Bearer {{ $env.WHATSAPP_TOKEN }}",
          "Content-Type": "application/json"
        },
        "body": "={\n  \"messaging_product\": \"whatsapp\",\n  \"to\": \"{{ $json.assignee_whatsapp_id }}\",\n  \"type\": \"text\",\n  \"text\": { \"body\": \"{{ $json.message }}\" }\n}"
      }
    },
    {
      "id": "73",
      "name": "IF - Retry Succeeded?",
      "type": "n8n-nodes-base.if",
      "position": [700, 1800],
      "parameters": {
        "conditions": {
          "string": [{ "value1": "={{ $json.messages?.[0]?.id ? 'yes' : 'no' }}", "value2": "yes" }]
        }
      }
    },
    {
      "id": "74",
      "name": "HTTP - Delete from Failed Queue",
      "type": "n8n-nodes-base.httpRequest",
      "position": [900, 1750],
      "parameters": {
        "method": "DELETE",
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/failed_notifications?task_id=eq.{{ $json.task_id }}",
        "headers": {
          "apikey": "={{ $env.SUPABASE_ANON_KEY }}",
          "Authorization": "Bearer {{ $env.SUPABASE_ANON_KEY }}"
        }
      }
    },
    {
      "id": "75",
      "name": "HTTP - Increment Retry Count",
      "type": "n8n-nodes-base.httpRequest",
      "position": [900, 1850],
      "parameters": {
        "method": "PATCH",
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/failed_notifications?task_id=eq.{{ $json.task_id }}",
        "headers": {
          "apikey": "={{ $env.SUPABASE_ANON_KEY }}",
          "Authorization": "Bearer {{ $env.SUPABASE_ANON_KEY }}",
          "Content-Type": "application/json"
        },
        "body": "={ \"retry_count\": {{ $json.retry_count + 1 }}, \"next_retry_at\": \"{{ new Date(Date.now() + 15*60*1000).toISOString() }}\" }"
      }
    },

    {
      "id": "80",
      "name": "Cron - Handle Recurring Tasks (Midnight)",
      "type": "n8n-nodes-base.cron",
      "position": [100, 2000],
      "parameters": {
        "triggerTimes": { "item": [{ "hour": 0, "minute": 0 }] }
      }
    },
    {
      "id": "81",
      "name": "HTTP - Get Completed Recurring Tasks",
      "type": "n8n-nodes-base.httpRequest",
      "position": [300, 2000],
      "parameters": {
        "method": "GET",
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/tasks?status=eq.completed&is_recurring=eq.true&select=*",
        "headers": {
          "apikey": "={{ $env.SUPABASE_ANON_KEY }}",
          "Authorization": "Bearer {{ $env.SUPABASE_ANON_KEY }}"
        }
      }
    },
    {
      "id": "82",
      "name": "Code - Calculate Next Recurrence",
      "type": "n8n-nodes-base.code",
      "position": [500, 2000],
      "parameters": {
        "language": "javaScript",
        "jsCode": "const tasks = $input.all();\nconst now = new Date();\n\nreturn tasks.map(item => {\n  const task = item.json;\n  let nextDeadline = new Date(task.deadline);\n  \n  switch(task.recurrence_pattern) {\n    case 'daily': nextDeadline.setDate(nextDeadline.getDate() + 1); break;\n    case 'weekly': nextDeadline.setDate(nextDeadline.getDate() + 7); break;\n    case 'monthly': nextDeadline.setMonth(nextDeadline.getMonth() + 1); break;\n  }\n  \n  // Only recreate if next deadline is in the future\n  if (nextDeadline > now) {\n    return { json: {\n      ...task,\n      task_id: `task_${Date.now()}_recur`,\n      status: 'pending',\n      completion_percent: 0,\n      deadline: nextDeadline.toISOString(),\n      whatsapp_sent: false,\n      reminder_24h_sent: false,\n      reminder_2h_sent: false,\n      created_at: now.toISOString(),\n      parent_task_id: task.task_id\n    }};\n  }\n  return null;\n}).filter(Boolean);"
      }
    },
    {
      "id": "83",
      "name": "HTTP - Create Recurring Task Instance",
      "type": "n8n-nodes-base.httpRequest",
      "position": [700, 2000],
      "parameters": {
        "method": "POST",
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/tasks",
        "headers": {
          "apikey": "={{ $env.SUPABASE_ANON_KEY }}",
          "Authorization": "Bearer {{ $env.SUPABASE_ANON_KEY }}",
          "Content-Type": "application/json",
          "Prefer": "return=representation"
        },
        "body": "={{ JSON.stringify($json) }}"
      }
    },
    {
      "id": "84",
      "name": "HTTP - Send Recurring Task WhatsApp",
      "type": "n8n-nodes-base.httpRequest",
      "position": [900, 2000],
      "parameters": {
        "method": "POST",
        "url": "https://graph.facebook.com/v18.0/{{ $env.WHATSAPP_PHONE_NUMBER_ID }}/messages",
        "headers": {
          "Authorization": "Bearer {{ $env.WHATSAPP_TOKEN }}",
          "Content-Type": "application/json"
        },
        "body": "={\n  \"messaging_product\": \"whatsapp\",\n  \"to\": \"{{ $json.assignee_whatsapp_id }}\",\n  \"type\": \"text\",\n  \"text\": { \"body\": \"🔁 Recurring task reminder:\\n\\n*{{ $json.title }}*\\n📅 Due: {{ new Date($json.deadline).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) }}\\n\\nReply *Done*, *50%*, or *More time*\" }\n}"
      }
    },

    {
      "id": "90",
      "name": "Cron - Evening Summary (6PM IST)",
      "type": "n8n-nodes-base.cron",
      "position": [100, 2200],
      "parameters": {
        "triggerTimes": { "item": [{ "hour": 18, "minute": 0 }] }
      }
    },
    {
      "id": "91",
      "name": "HTTP - Get All Todays Tasks",
      "type": "n8n-nodes-base.httpRequest",
      "position": [300, 2200],
      "parameters": {
        "method": "GET",
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/tasks?created_at=gte.{{ new Date().toISOString().split('T')[0] }}&select=*",
        "headers": {
          "apikey": "={{ $env.SUPABASE_ANON_KEY }}",
          "Authorization": "Bearer {{ $env.SUPABASE_ANON_KEY }}"
        }
      }
    },
    {
      "id": "92",
      "name": "HTTP - Get Unrouted Tasks Today",
      "type": "n8n-nodes-base.httpRequest",
      "position": [300, 2300],
      "parameters": {
        "method": "GET",
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/unrouted_tasks?created_at=gte.{{ new Date().toISOString().split('T')[0] }}&select=*",
        "headers": {
          "apikey": "={{ $env.SUPABASE_ANON_KEY }}",
          "Authorization": "Bearer {{ $env.SUPABASE_ANON_KEY }}"
        }
      }
    },
    {
      "id": "93",
      "name": "OpenAI - Generate Evening Summary",
      "type": "n8n-nodes-base.openAi",
      "position": [500, 2250],
      "parameters": {
        "resource": "chat",
        "operation": "message",
        "model": "gpt-4o",
        "messages": {
          "values": [
            {
              "role": "system",
              "content": "Generate a concise WhatsApp-friendly evening task summary for the manager. Use emojis. Include: completed tasks ✅, in-progress with % 🔄, overdue ❌, blocked tasks 🔒, unrouted tasks ⚠️, overall completion rate 📈, and one insight about team performance. Keep under 300 words. Format for WhatsApp readability."
            },
            {
              "role": "user",
              "content": "=Tasks: {{ JSON.stringify($input.first().json) }}\nUnrouted: {{ JSON.stringify($input.last().json) }}"
            }
          ]
        }
      }
    },
    {
      "id": "94",
      "name": "HTTP - Send Evening Summary to Manager",
      "type": "n8n-nodes-base.httpRequest",
      "position": [700, 2250],
      "parameters": {
        "method": "POST",
        "url": "https://graph.facebook.com/v18.0/{{ $env.WHATSAPP_PHONE_NUMBER_ID }}/messages",
        "headers": {
          "Authorization": "Bearer {{ $env.WHATSAPP_TOKEN }}",
          "Content-Type": "application/json"
        },
        "body": "={\n  \"messaging_product\": \"whatsapp\",\n  \"to\": \"{{ $env.MANAGER_WHATSAPP }}\",\n  \"type\": \"text\",\n  \"text\": { \"body\": \"{{ $json.message.content }}\" }\n}"
      }
    },

    {
      "id": "95",
      "name": "Cron - Pre-Meeting Summary (30 min before)",
      "type": "n8n-nodes-base.cron",
      "position": [100, 2400],
      "parameters": {
        "triggerTimes": { "item": [{ "mode": "everyX", "value": 30, "unit": "minutes" }] }
      }
    },
    {
      "id": "96",
      "name": "Google Calendar - Get Upcoming Meetings",
      "type": "n8n-nodes-base.googleCalendar",
      "position": [300, 2400],
      "parameters": {
        "resource": "event",
        "operation": "getAll",
        "calendarId": "={{ $env.GOOGLE_CALENDAR_ID }}",
        "options": {
          "timeMin": "={{ new Date().toISOString() }}",
          "timeMax": "={{ new Date(Date.now() + 60*60*1000).toISOString() }}"
        }
      }
    },
    {
      "id": "97",
      "name": "IF - Meeting in 30 min?",
      "type": "n8n-nodes-base.if",
      "position": [500, 2400],
      "parameters": {
        "conditions": {
          "number": [{ "value1": "={{ $json.items?.length }}", "operation": "larger", "value2": 0 }]
        }
      }
    },
    {
      "id": "98",
      "name": "HTTP - Get All Pending Tasks",
      "type": "n8n-nodes-base.httpRequest",
      "position": [700, 2400],
      "parameters": {
        "method": "GET",
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/tasks?status=in.(pending,in_progress,overdue,blocked)&select=*&order=priority.desc",
        "headers": {
          "apikey": "={{ $env.SUPABASE_ANON_KEY }}",
          "Authorization": "Bearer {{ $env.SUPABASE_ANON_KEY }}"
        }
      }
    },
    {
      "id": "99",
      "name": "OpenAI - Generate Pre-Meeting Briefing",
      "type": "n8n-nodes-base.openAi",
      "position": [900, 2400],
      "parameters": {
        "resource": "chat",
        "operation": "message",
        "model": "gpt-4o",
        "messages": {
          "values": [
            {
              "role": "system",
              "content": "Generate a pre-meeting briefing for the manager. Include: pending tasks from last meeting that are still open, who hasn't completed their tasks, overdue items to discuss, blocked tasks needing manager decision. Format for WhatsApp. Start with 'Meeting starts in 30 minutes. Here's what's pending:'"
            },
            {
              "role": "user",
              "content": "=Upcoming meeting: {{ $input.first().json.items[0].summary }}\nPending tasks: {{ JSON.stringify($input.last().json) }}"
            }
          ]
        }
      }
    },
    {
      "id": "100",
      "name": "HTTP - Send Pre-Meeting Briefing",
      "type": "n8n-nodes-base.httpRequest",
      "position": [1100, 2400],
      "parameters": {
        "method": "POST",
        "url": "https://graph.facebook.com/v18.0/{{ $env.WHATSAPP_PHONE_NUMBER_ID }}/messages",
        "headers": {
          "Authorization": "Bearer {{ $env.WHATSAPP_TOKEN }}",
          "Content-Type": "application/json"
        },
        "body": "={\n  \"messaging_product\": \"whatsapp\",\n  \"to\": \"{{ $env.MANAGER_WHATSAPP }}\",\n  \"type\": \"text\",\n  \"text\": { \"body\": \"{{ $json.message.content }}\" }\n}"
      }
    },

    {
      "id": "101",
      "name": "Cron - Overdue Detection (Every Hour)",
      "type": "n8n-nodes-base.cron",
      "position": [100, 2600],
      "parameters": {
        "triggerTimes": { "item": [{ "mode": "everyHour" }] }
      }
    },
    {
      "id": "102",
      "name": "HTTP - Get Overdue Tasks",
      "type": "n8n-nodes-base.httpRequest",
      "position": [300, 2600],
      "parameters": {
        "method": "GET",
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/tasks?status=neq.completed&status=neq.overdue&deadline=lt.{{ new Date().toISOString() }}&select=*",
        "headers": {
          "apikey": "={{ $env.SUPABASE_ANON_KEY }}",
          "Authorization": "Bearer {{ $env.SUPABASE_ANON_KEY }}"
        }
      }
    },
    {
      "id": "103",
      "name": "HTTP - Mark Overdue in DB",
      "type": "n8n-nodes-base.httpRequest",
      "position": [500, 2600],
      "parameters": {
        "method": "PATCH",
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/tasks?task_id=eq.{{ $json.task_id }}",
        "headers": {
          "apikey": "={{ $env.SUPABASE_ANON_KEY }}",
          "Authorization": "Bearer {{ $env.SUPABASE_ANON_KEY }}",
          "Content-Type": "application/json"
        },
        "body": "={ \"status\": \"overdue\" }"
      }
    },
    {
      "id": "104",
      "name": "HTTP - Alert Manager Overdue",
      "type": "n8n-nodes-base.httpRequest",
      "position": [700, 2600],
      "parameters": {
        "method": "POST",
        "url": "https://graph.facebook.com/v18.0/{{ $env.WHATSAPP_PHONE_NUMBER_ID }}/messages",
        "headers": {
          "Authorization": "Bearer {{ $env.WHATSAPP_TOKEN }}",
          "Content-Type": "application/json"
        },
        "body": "={\n  \"messaging_product\": \"whatsapp\",\n  \"to\": \"{{ $env.MANAGER_WHATSAPP }}\",\n  \"type\": \"text\",\n  \"text\": { \"body\": \"❌ Overdue Task Alert\\n\\n*{{ $json.title }}*\\nAssignee: {{ $json.assignee_name }}\\nWas due: {{ new Date($json.deadline).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) }}\\nProgress: {{ $json.completion_percent }}%\" }\n}"
      }
    },

    {
      "id": "110",
      "name": "Cron - Weekly Report (Monday 8AM)",
      "type": "n8n-nodes-base.cron",
      "position": [100, 2800],
      "parameters": {
        "triggerTimes": { "item": [{ "mode": "everyWeek", "hour": 8, "minute": 0, "weekday": 1 }] }
      }
    },
    {
      "id": "111",
      "name": "HTTP - Get Last 7 Days Tasks",
      "type": "n8n-nodes-base.httpRequest",
      "position": [300, 2800],
      "parameters": {
        "method": "GET",
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/tasks?created_at=gte.{{ new Date(Date.now() - 7*24*60*60*1000).toISOString() }}&select=*",
        "headers": {
          "apikey": "={{ $env.SUPABASE_ANON_KEY }}",
          "Authorization": "Bearer {{ $env.SUPABASE_ANON_KEY }}"
        }
      }
    },
    {
      "id": "112",
      "name": "OpenAI - Generate Weekly Report",
      "type": "n8n-nodes-base.openAi",
      "position": [500, 2800],
      "parameters": {
        "resource": "chat",
        "operation": "message",
        "model": "gpt-4o",
        "messages": {
          "values": [
            {
              "role": "system",
              "content": "Generate a detailed weekly productivity report. Include: per-person completion rates, most productive person 🏆, most overdue person ⚠️, total tasks assigned vs completed, average completion time, recurring tasks status, extension requests granted/denied, blocked tasks count, and 3 actionable insights. Format for WhatsApp with emojis and clear sections."
            },
            {
              "role": "user",
              "content": "={{ JSON.stringify($json) }}"
            }
          ]
        }
      }
    },
    {
      "id": "113",
      "name": "HTTP - Send Weekly Report to Manager",
      "type": "n8n-nodes-base.httpRequest",
      "position": [700, 2800],
      "parameters": {
        "method": "POST",
        "url": "https://graph.facebook.com/v18.0/{{ $env.WHATSAPP_PHONE_NUMBER_ID }}/messages",
        "headers": {
          "Authorization": "Bearer {{ $env.WHATSAPP_TOKEN }}",
          "Content-Type": "application/json"
        },
        "body": "={\n  \"messaging_product\": \"whatsapp\",\n  \"to\": \"{{ $env.MANAGER_WHATSAPP }}\",\n  \"type\": \"text\",\n  \"text\": { \"body\": \"{{ $json.message.content }}\" }\n}"
      }
    },
    {
      "id": "114",
      "name": "Google Sheets - Export Weekly Report",
      "type": "n8n-nodes-base.googleSheets",
      "position": [900, 2800],
      "parameters": {
        "operation": "append",
        "sheetId": "={{ $env.REPORTS_SHEET_ID }}",
        "range": "WeeklyReports!A:Z",
        "options": { "headerRow": true },
        "dataMode": "autoMap"
      }
    }
  ],
  "connections": {
    "Webhook - Receive Input": { "main": [[{ "node": "Switch - Input Type", "type": "main", "index": 0 }]] },
    "Switch - Input Type": { "main": [
      [{ "node": "OpenAI - Transcribe Audio (Whisper)", "type": "main", "index": 0 }],
      [{ "node": "Merge - All Inputs to Text", "type": "main", "index": 0 }],
      [{ "node": "Google Calendar - Get Meeting Notes", "type": "main", "index": 0 }],
      [{ "node": "HTTP - Fetch Notion Meeting Notes", "type": "main", "index": 0 }],
      [{ "node": "HTTP - Fetch Google Docs Notes", "type": "main", "index": 0 }]
    ]},
    "OpenAI - Transcribe Audio (Whisper)": { "main": [[{ "node": "Merge - All Inputs to Text", "type": "main", "index": 0 }]] },
    "Google Calendar - Get Meeting Notes": { "main": [[{ "node": "Merge - All Inputs to Text", "type": "main", "index": 0 }]] },
    "HTTP - Fetch Notion Meeting Notes": { "main": [[{ "node": "Merge - All Inputs to Text", "type": "main", "index": 0 }]] },
    "HTTP - Fetch Google Docs Notes": { "main": [[{ "node": "Merge - All Inputs to Text", "type": "main", "index": 0 }]] },
    "Merge - All Inputs to Text": { "main": [[{ "node": "OpenAI - Extract Tasks (GPT-4)", "type": "main", "index": 0 }]] },
    "OpenAI - Extract Tasks (GPT-4)": { "main": [[{ "node": "Code - Parse & Validate Tasks", "type": "main", "index": 0 }]] },
    "Code - Parse & Validate Tasks": { "main": [[{ "node": "HTTP - Check Existing Tasks for Duplicates", "type": "main", "index": 0 }]] },
    "HTTP - Check Existing Tasks for Duplicates": { "main": [[{ "node": "OpenAI - Check Duplicate", "type": "main", "index": 0 }]] },
    "OpenAI - Check Duplicate": { "main": [[{ "node": "IF - Is Duplicate?", "type": "main", "index": 0 }]] },
    "IF - Is Duplicate?": { "main": [
      [{ "node": "Switch - Directory Source", "type": "main", "index": 0 }],
      []
    ]},
    "Switch - Directory Source": { "main": [
      [{ "node": "Google Sheets - Lookup Contact", "type": "main", "index": 0 }],
      [{ "node": "HTTP - Supabase Lookup Contact", "type": "main", "index": 0 }],
      [{ "node": "HTTP - Notion DB Lookup Contact", "type": "main", "index": 0 }],
      [{ "node": "HTTP - Airtable Lookup Contact", "type": "main", "index": 0 }]
    ]},
    "Google Sheets - Lookup Contact": { "main": [[{ "node": "Code - Normalize Contact Data", "type": "main", "index": 0 }]] },
    "HTTP - Supabase Lookup Contact": { "main": [[{ "node": "Code - Normalize Contact Data", "type": "main", "index": 0 }]] },
    "HTTP - Notion DB Lookup Contact": { "main": [[{ "node": "Code - Normalize Contact Data", "type": "main", "index": 0 }]] },
    "HTTP - Airtable Lookup Contact": { "main": [[{ "node": "Code - Normalize Contact Data", "type": "main", "index": 0 }]] },
    "Code - Normalize Contact Data": { "main": [[{ "node": "IF - Contact Found?", "type": "main", "index": 0 }]] },
    "IF - Contact Found?": { "main": [
      [{ "node": "IF - Has Dependencies?", "type": "main", "index": 0 }],
      [{ "node": "HTTP - Flag Unrouted Task", "type": "main", "index": 0 }]
    ]},
    "HTTP - Flag Unrouted Task": { "main": [[{ "node": "HTTP - Alert Manager Unrouted", "type": "main", "index": 0 }]] },
    "IF - Has Dependencies?": { "main": [
      [{ "node": "HTTP - Check Dependency Status", "type": "main", "index": 0 }],
      [{ "node": "HTTP - Save Task to Supabase", "type": "main", "index": 0 }]
    ]},
    "HTTP - Check Dependency Status": { "main": [[{ "node": "IF - All Dependencies Done?", "type": "main", "index": 0 }]] },
    "IF - All Dependencies Done?": { "main": [
      [{ "node": "HTTP - Save Task to Supabase", "type": "main", "index": 0 }],
      [{ "node": "HTTP - Save Task as Blocked", "type": "main", "index": 0 }]
    ]},
    "HTTP - Save Task to Supabase": { "main": [[{ "node": "Code - Build WhatsApp Message", "type": "main", "index": 0 }]] },
    "Code - Build WhatsApp Message": { "main": [[{ "node": "HTTP - Send WhatsApp via Meta API", "type": "main", "index": 0 }]] },
    "HTTP - Send WhatsApp via Meta API": { "main": [[{ "node": "IF - WhatsApp Send Success?", "type": "main", "index": 0 }]] },
    "IF - WhatsApp Send Success?": { "main": [
      [{ "node": "HTTP - Update Task WhatsApp Sent", "type": "main", "index": 0 }],
      [{ "node": "HTTP - Queue Failed WhatsApp for Retry", "type": "main", "index": 0 }]
    ]},
    "HTTP - Update Task WhatsApp Sent": { "main": [
      [{ "node": "Jira - Create Ticket (Optional)", "type": "main", "index": 0 }],
      [{ "node": "Slack - Send Notification (Optional)", "type": "main", "index": 0 }]
    ]},
    "Webhook - Receive WhatsApp Reply": { "main": [[{ "node": "Code - Extract Reply Data", "type": "main", "index": 0 }]] },
    "Code - Extract Reply Data": { "main": [[{ "node": "OpenAI - Parse Reply Intent", "type": "main", "index": 0 }]] },
    "OpenAI - Parse Reply Intent": { "main": [[{ "node": "Switch - Reply Intent", "type": "main", "index": 0 }]] },
    "Switch - Reply Intent": { "main": [
      [{ "node": "HTTP - Mark Task Complete", "type": "main", "index": 0 }],
      [{ "node": "HTTP - Update Progress", "type": "main", "index": 0 }],
      [{ "node": "HTTP - Save Extension Request", "type": "main", "index": 0 }],
      [{ "node": "HTTP - Approve Extension in DB", "type": "main", "index": 0 }],
      [{ "node": "HTTP - Deny Extension in DB", "type": "main", "index": 0 }]
    ]},
    "HTTP - Mark Task Complete": { "main": [[{ "node": "HTTP - Check Blocked Dependents After Completion", "type": "main", "index": 0 }]] },
    "HTTP - Check Blocked Dependents After Completion": { "main": [[{ "node": "Code - Find Newly Unblocked Tasks", "type": "main", "index": 0 }]] },
    "Code - Find Newly Unblocked Tasks": { "main": [[{ "node": "HTTP - Unblock Task + Notify Assignee", "type": "main", "index": 0 }]] },
    "HTTP - Unblock Task + Notify Assignee": { "main": [[{ "node": "HTTP - Send Unblocked WhatsApp", "type": "main", "index": 0 }]] },
    "HTTP - Save Extension Request": { "main": [[{ "node": "HTTP - Fetch Task for Extension Request", "type": "main", "index": 0 }]] },
    "HTTP - Fetch Task for Extension Request": { "main": [[{ "node": "HTTP - Notify Manager Extension Request", "type": "main", "index": 0 }]] },
    "HTTP - Approve Extension in DB": { "main": [[{ "node": "HTTP - Fetch Task for Extension Update", "type": "main", "index": 0 }]] },
    "HTTP - Fetch Task for Extension Update": { "main": [[{ "node": "Code - Calculate New Deadline", "type": "main", "index": 0 }]] },
    "Code - Calculate New Deadline": { "main": [[{ "node": "HTTP - Update Task Deadline", "type": "main", "index": 0 }]] },
    "HTTP - Update Task Deadline": { "main": [[{ "node": "HTTP - Notify Assignee Extension Approved", "type": "main", "index": 0 }]] },
    "HTTP - Deny Extension in DB": { "main": [[{ "node": "HTTP - Notify Assignee Extension Denied", "type": "main", "index": 0 }]] },
    "Cron - 24hr Reminder (9AM Daily)": { "main": [[{ "node": "HTTP - Get Tasks Due in 24h", "type": "main", "index": 0 }]] },
    "HTTP - Get Tasks Due in 24h": { "main": [[{ "node": "HTTP - Send 24hr Reminder", "type": "main", "index": 0 }]] },
    "HTTP - Send 24hr Reminder": { "main": [[{ "node": "HTTP - Mark 24h Reminder Sent", "type": "main", "index": 0 }]] },
    "Cron - 2hr Reminder (Every 30 min Check)": { "main": [[{ "node": "HTTP - Get Tasks Due in 2h", "type": "main", "index": 0 }]] },
    "HTTP - Get Tasks Due in 2h": { "main": [[{ "node": "HTTP - Send 2hr Reminder", "type": "main", "index": 0 }]] },
    "HTTP - Send 2hr Reminder": { "main": [[{ "node": "HTTP - Mark 2h Reminder Sent", "type": "main", "index": 0 }]] },
    "Cron - Retry Failed Notifications (Every 15 min)": { "main": [[{ "node": "HTTP - Get Failed Notifications", "type": "main", "index": 0 }]] },
    "HTTP - Get Failed Notifications": { "main": [[{ "node": "HTTP - Retry WhatsApp Send", "type": "main", "index": 0 }]] },
    "HTTP - Retry WhatsApp Send": { "main": [[{ "node": "IF - Retry Succeeded?", "type": "main", "index": 0 }]] },
    "IF - Retry Succeeded?": { "main": [
      [{ "node": "HTTP - Delete from Failed Queue", "type": "main", "index": 0 }],
      [{ "node": "HTTP - Increment Retry Count", "type": "main", "index": 0 }]
    ]},
    "Cron - Handle Recurring Tasks (Midnight)": { "main": [[{ "node": "HTTP - Get Completed Recurring Tasks", "type": "main", "index": 0 }]] },
    "HTTP - Get Completed Recurring Tasks": { "main": [[{ "node": "Code - Calculate Next Recurrence", "type": "main", "index": 0 }]] },
    "Code - Calculate Next Recurrence": { "main": [[{ "node": "HTTP - Create Recurring Task Instance", "type": "main", "index": 0 }]] },
    "HTTP - Create Recurring Task Instance": { "main": [[{ "node": "HTTP - Send Recurring Task WhatsApp", "type": "main", "index": 0 }]] },
    "Cron - Evening Summary (6PM IST)": { "main": [[{ "node": "HTTP - Get All Todays Tasks", "type": "main", "index": 0 }]] },
    "HTTP - Get All Todays Tasks": { "main": [[{ "node": "OpenAI - Generate Evening Summary", "type": "main", "index": 0 }]] },
    "HTTP - Get Unrouted Tasks Today": { "main": [[{ "node": "OpenAI - Generate Evening Summary", "type": "main", "index": 1 }]] },
    "OpenAI - Generate Evening Summary": { "main": [[{ "node": "HTTP - Send Evening Summary to Manager", "type": "main", "index": 0 }]] },
    "Cron - Pre-Meeting Summary (30 min before)": { "main": [[{ "node": "Google Calendar - Get Upcoming Meetings", "type": "main", "index": 0 }]] },
    "Google Calendar - Get Upcoming Meetings": { "main": [[{ "node": "IF - Meeting in 30 min?", "type": "main", "index": 0 }]] },
    "IF - Meeting in 30 min?": { "main": [
      [{ "node": "HTTP - Get All Pending Tasks", "type": "main", "index": 0 }],
      []
    ]},
    "HTTP - Get All Pending Tasks": { "main": [[{ "node": "OpenAI - Generate Pre-Meeting Briefing", "type": "main", "index": 0 }]] },
    "OpenAI - Generate Pre-Meeting Briefing": { "main": [[{ "node": "HTTP - Send Pre-Meeting Briefing", "type": "main", "index": 0 }]] },
    "Cron - Overdue Detection (Every Hour)": { "main": [[{ "node": "HTTP - Get Overdue Tasks", "type": "main", "index": 0 }]] },
    "HTTP - Get Overdue Tasks": { "main": [[{ "node": "HTTP - Mark Overdue in DB", "type": "main", "index": 0 }]] },
    "HTTP - Mark Overdue in DB": { "main": [[{ "node": "HTTP - Alert Manager Overdue", "type": "main", "index": 0 }]] },
    "Cron - Weekly Report (Monday 8AM)": { "main": [[{ "node": "HTTP - Get Last 7 Days Tasks", "type": "main", "index": 0 }]] },
    "HTTP - Get Last 7 Days Tasks": { "main": [[{ "node": "OpenAI - Generate Weekly Report", "type": "main", "index": 0 }]] },
    "OpenAI - Generate Weekly Report": { "main": [
      [{ "node": "HTTP - Send Weekly Report to Manager", "type": "main", "index": 0 }],
      [{ "node": "Google Sheets - Export Weekly Report", "type": "main", "index": 0 }]
    ]}
  },
  "settings": { "executionOrder": "v1" },
  "tags": ["taskmaster", "ai-agent", "whatsapp", "meeting", "tasks", "v2"],
  "env_variables_required": {
    "WHATSAPP_TOKEN": "Meta WhatsApp Business API token",
    "WHATSAPP_PHONE_NUMBER_ID": "Meta WhatsApp Phone Number ID",
    "MANAGER_WHATSAPP": "Manager WhatsApp number with country code e.g. 919876543210",
    "SUPABASE_URL": "Your Supabase project URL",
    "SUPABASE_ANON_KEY": "Your Supabase anon key",
    "OPENAI_API_KEY": "OpenAI API key for GPT-4o + Whisper",
    "GOOGLE_CALENDAR_ID": "Google Calendar ID to watch for meetings",
    "NOTION_TOKEN": "Notion integration token (optional)",
    "NOTION_TEAM_DB_ID": "Notion team members database ID (optional)",
    "AIRTABLE_API_KEY": "Airtable API key (optional)",
    "AIRTABLE_BASE_ID": "Airtable base ID (optional)",
    "TEAM_SHEET_ID": "Google Sheets ID for team directory (optional)",
    "REPORTS_SHEET_ID": "Google Sheets ID for weekly reports (optional)",
    "JIRA_PROJECT_KEY": "Jira project key (optional)",
    "SLACK_CHANNEL_ID": "Slack channel ID (optional)"
  },
  "supabase_tables_required": [
    {
      "table": "tasks",
      "columns": ["task_id", "title", "assignee_name", "assignee_phone", "assignee_email", "assignee_whatsapp_id", "deadline", "priority", "status", "completion_percent", "subtasks", "dependencies", "is_recurring", "recurrence_pattern", "parent_task_id", "whatsapp_sent", "whatsapp_message_id", "notified_at", "completed_at", "meeting_id", "reminder_24h_sent", "reminder_2h_sent", "extension_granted", "retry_count", "created_at"]
    },
    {
      "table": "unrouted_tasks",
      "columns": ["task_id", "title", "assignee_name", "reason", "created_at"]
    },
    {
      "table": "team_members",
      "columns": ["id", "name", "phone", "email", "whatsapp_id"]
    },
    {
      "table": "extension_requests",
      "columns": ["id", "task_id", "extension_days", "requested_at", "status", "resolved_at"]
    },
    {
      "table": "failed_notifications",
      "columns": ["id", "task_id", "assignee_whatsapp_id", "message", "retry_count", "next_retry_at", "created_at"]
    }
  ]
}