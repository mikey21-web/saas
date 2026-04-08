# LangGraph 20-Agent Orchestration Prompt for GPT-5.4

**Use this prompt with GPT-5.4 or Claude Opus to generate TypeScript LangGraph code for all 20 agents.**

---

## THE PROMPT

```
You are an expert LangGraph architect. Your task: convert the 20 diyaa.ai agents into sophisticated multi-agent LangGraph orchestrations, following the exact pattern of the AI SDR system (lib/ai-sdr).

## REFERENCE ARCHITECTURE (AI SDR)

The AI SDR uses:
- StateGraph with Annotation.Root for shared state management
- 6 agent nodes: Lead Finder, Outreach Creator, Qualifier, Scheduler, Engagement, Analytics
- Conditional edge routing (shouldContinue()) based on state
- Reducers for state accumulation (leads[], outreach_sequences[], booked_meetings[])
- Type-safe interfaces for all state fields
- Groq + Claude for LLM calls
- Supabase persistence with row-level security

## THE 20 AGENTS (Break Each Into Sub-Agents)

### TIER 1: CORE (Revenue Direct)

1. **LeadCatcher** (3 sub-agents)
   - Parser Agent: Extract name, email, phone, intent from customer message
   - Qualifier Agent: Score lead by ICP match (1-10)
   - Notifier Agent: Send WhatsApp confirmation + add to pipeline
   State: leads[], messages[], notifications[]

2. **CustomerSupport** (4 sub-agents)
   - Intent Classifier: Detect intent (question/complaint/escalation/praise)
   - Response Generator: Draft reply based on intent + knowledge base
   - Escalator: If high-priority, flag for human review
   - Feedback Logger: Store sentiment + topic for analytics
   State: tickets[], responses[], escalations[], feedback[]

3. **LeadIntent** (2 sub-agents)
   - Intent Detector: Analyze message for buying signals (budget, timeline, pain points)
   - Scoring Agent: Calculate conversion probability (0-100%)
   State: leads[], intent_scores[]

4. **SalesCloser** (3 sub-agents)
   - Objection Classifier: Detect objection type (price/timing/skepticism)
   - Rebuttal Generator: Generate personalized counter-argument
   - CTA Agent: Send final call-to-action (book meeting, start trial, etc)
   State: objections[], rebuttals[], conversions[]

5. **ConversationIntel** (2 sub-agents)
   - Sentiment Analyzer: Detect emotion (happy/neutral/frustrated/angry)
   - Urgency Detector: Assess conversation urgency (low/medium/high)
   State: conversations[], sentiment_scores[], urgency_levels[]

### TIER 2: REVENUE (Cash Flow)

6. **InvoiceBot** (3 sub-agents)
   - Invoice Creator: Generate invoice from order details + GST calculation
   - Payment Tracker: Check payment status + send reminders
   - Collections Agent: Escalate overdue invoices
   State: invoices[], payments[], collections[]

7. **PaymentReminder** (2 sub-agents)
   - Reminder Generator: Create payment reminder (friendly → urgent escalation)
   - Channel Router: Send via WhatsApp/Email/SMS based on preference
   State: reminders[], notifications[], delivery_status[]

8. **ChurnPrevention** (3 sub-agents)
   - Health Scorer: Detect churn signals (low usage, payment delays, support tickets)
   - Retention Agent: Generate personalized win-back offer
   - Escalator: Flag high-value customers for sales team
   State: at_risk_customers[], retention_offers[], escalations[]

9. **RevenueForecaster** (2 sub-agents)
   - Data Aggregator: Collect revenue, MRR, churn, expansion data
   - Forecast Agent: Predict cash flow + growth trends
   State: revenue_data[], forecasts[], predictions[]

10. **LifetimeValue** (2 sub-agents)
    - LTV Calculator: Compute customer lifetime value based on history
    - Segmenter: Segment customers into high/medium/low value
    State: customer_segments[], ltv_scores[]

### TIER 3: OPERATIONS (Automation)

11. **AppointBot** (4 sub-agents)
    - Scheduler: Check calendar availability + book time slot
    - Confirmer: Send booking confirmation via WhatsApp/Email
    - Reminder Agent: Send 24h + 1h reminders before meeting
    - No-Show Handler: Offer rebooking if customer misses meeting
    State: appointments[], confirmations[], reminders[], no_shows[]

12. **TeamExecutor** (3 sub-agents)
    - Task Parser: Extract task from manager message (who, what, when, priority)
    - Router: Assign to best team member based on capacity + skills
    - Notifier: Send task assignment via WhatsApp
    State: tasks[], assignments[], notifications[]

13. **EmailAutomator** (3 sub-agents)
    - Sequence Builder: Create multi-email sequence based on trigger + templates
    - Scheduler: Schedule sends at optimal times
    - Tracker: Monitor open/click rates + trigger follow-ups
    State: sequences[], scheduled_emails[], engagement_metrics[]

14. **DecisionCopilot** (2 sub-agents)
    - Aggregator: Collect daily metrics (sales, support, operations)
    - Recommender: Suggest top 3 actions for today based on trends
    State: daily_metrics[], recommendations[]

15. **ProcessAutomator** (2 sub-agents)
    - Parser: Extract workflow from natural language (e.g., "if customer buys, send invoice and book follow-up")
    - Builder: Create automation rules (triggers + actions)
    State: processes[], automation_rules[]

### TIER 4: INTELLIGENCE (Insights)

16. **BusinessInsights** (2 sub-agents)
    - Dashboard Parser: Read dashboard data (metrics, charts, tables)
    - Narrator: Explain trends + anomalies in plain English
    State: dashboards[], insights[]

17. **FeedbackAnalyzer** (3 sub-agents)
    - Sentiment Classifier: Detect sentiment (positive/neutral/negative)
    - Topic Extractor: Identify key topics (product/price/support/other)
    - Trend Detector: Spot emerging patterns across feedback
    State: feedback[], sentiment_tags[], topic_clusters[], trends[]

18. **MarketIntel** (3 sub-agents)
    - Competitor Monitor: Track competitor pricing, features, announcements
    - Trend Spotter: Detect market trends from news + social media
    - Battle Card Generator: Create battle card (us vs competitor)
    State: competitors[], market_trends[], battle_cards[]

19. **DocumentProcessor** (2 sub-agents)
    - Parser: Extract key data from contracts/forms (dates, amounts, signatures)
    - Validator: Check for missing fields + compliance issues
    State: documents[], extracted_data[], validation_errors[]

20. **ContentEngine** (4 sub-agents)
    - Idea Generator: Brainstorm content ideas based on business + trends
    - Creator: Write content (LinkedIn post, Tweet, Instagram caption)
    - Scheduler: Schedule across platforms at optimal times
    - Analytics: Track engagement + suggest improvements
    State: ideas[], content[], scheduled_posts[], engagement_analytics[]

## CODE STRUCTURE (Per Agent)

For each agent, generate this structure:

```
lib/agents/20-agents/[agentType]/
├── [agentType].ts           # Main StateGraph orchestration
├── types.ts                 # Interfaces + state definitions
├── agents/                  # Sub-agent implementations
│   ├── agent1-name.ts
│   ├── agent2-name.ts
│   └── agent3-name.ts
├── utils.ts                 # Helper functions
├── integrations.ts          # API clients (Groq, Claude, Supabase, etc)
└── index.ts                 # Public exports

lib/agents/execution-engines/
└── [agentType]-executor.ts  # Executor function for API route
```

## CODE GENERATION REQUIREMENTS

### 1. types.ts (For Each Agent)

Must include:
- Agent-specific state interface (e.g., `LeadCatcherState`)
- Extends `Annotation.Root` with proper reducers
- All field types are explicit (no `any`)
- Supabase table schema comments

Example:
```typescript
import { Annotation } from '@langchain/langgraph'

const AgentStateAnnotation = Annotation.Root({
  leads: {
    value: (x: Lead[], y: Lead[]) => [...x, ...y],
    default: () => [],
  },
  messages: {
    value: (x: Message[], y: Message[]) => [...x, ...y],
    default: () => [],
  },
  notifications: {
    value: (x: Notification[], y: Notification[]) => [...x, ...y],
    default: () => [],
  },
})

export type LeadCatcherState = typeof AgentStateAnnotation.State
```

### 2. agents/*.ts (Sub-Agent Implementations)

Each sub-agent must:
- Accept state as input
- Call LLM (Groq primary, Claude fallback)
- Return updated state
- Handle errors gracefully

Example:
```typescript
export async function parserAgent(state: LeadCatcherState): Promise<Partial<LeadCatcherState>> {
  const systemPrompt = `You are a lead parser. Extract name, email, phone, intent from customer message.`
  
  const response = await callLLMWithFallback({
    system: systemPrompt,
    messages: [{ role: 'user', content: state.messages[state.messages.length - 1]?.content }],
  })

  const parsed = parseJSON(response)
  
  return {
    leads: [{
      id: generateId(),
      name: parsed.name,
      email: parsed.email,
      phone: parsed.phone,
      intent: parsed.intent,
      created_at: new Date(),
    }],
  }
}
```

### 3. [agentType].ts (StateGraph Orchestration)

Must include:
- StateGraph initialization with Annotation
- Add nodes for each sub-agent
- Add conditional edges (shouldContinue functions)
- Compile graph
- Export as runnable

Example:
```typescript
import { StateGraph } from '@langchain/langgraph'
import { parserAgent, qualifierAgent, notifierAgent } from './agents'
import { AgentStateAnnotation, type LeadCatcherState } from './types'

const graph = new StateGraph(AgentStateAnnotation)

graph.addNode('parser', parserAgent)
graph.addNode('qualifier', qualifierAgent)
graph.addNode('notifier', notifierAgent)

graph.addEdge('START', 'parser')
graph.addConditionalEdges(
  'parser',
  shouldQualify,
  {
    qualify: 'qualifier',
    skip: 'END',
  }
)
graph.addEdge('qualifier', 'notifier')
graph.addEdge('notifier', 'END')

export const leadCatcherGraph = graph.compile()
```

### 4. integrations.ts (Shared Clients)

All agents share same clients:
- Groq client
- Claude client
- Supabase client
- Exotel/WhatsApp client
- Resend client
- BullMQ for scheduling

```typescript
export const groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY })
export const claudeClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
export const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
// etc
```

### 5. executor.ts (For API Route)

Template:
```typescript
export async function execute[AgentType](
  userMessage: string,
  ctx: AgentContext
): Promise<{ success: boolean; message: string; data?: Record<string, unknown> }> {
  try {
    const result = await [agentType]Graph.invoke({
      messages: [{ role: 'user', content: userMessage }],
      leads: [],
      // ... other state fields
    })

    // Store to Supabase
    await storeExecution(ctx.agentId, result)

    return { success: true, message: result.message, data: result }
  } catch (error) {
    return { success: false, message: `Error: ${error.message}` }
  }
}
```

## CRITICAL REQUIREMENTS

✅ **Zero TypeScript errors** — All types must be strict
✅ **No unused imports** — Clean code
✅ **Groq primary, Claude fallback** — Cost optimization
✅ **Supabase persistence** — All state saved to DB
✅ **Row-level security** — RLS on all tables
✅ **Production-ready** — Error handling, logging, retries
✅ **Testable** — Agents can be called independently
✅ **Documented** — JSDoc comments on all functions

## OUTPUT FORMAT

Generate TypeScript files ready to:
1. Drop into lib/agents/20-agents/[agentType]/
2. Run without modifications
3. Connect to existing Supabase schema
4. Call from /api/agents/[id]/run endpoint

## START WITH

Generate all 20 agents at once (or pick 1 to start, then repeat for others):
- lib/agents/20-agents/leadcatcher/
- lib/agents/20-agents/customersupport/
- lib/agents/20-agents/leadintent/
- ... (all 20)

Include types.ts, agents/*.ts, utils.ts, integrations.ts, index.ts, and [agentType].ts for each.

---

## EXECUTION COMMAND

```bash
# After you generate all files, run:
npx tsc --noEmit  # Verify no TS errors
# Should compile cleanly with zero errors
```

Ready to generate? Start with LeadCatcher (3 sub-agents), then repeat pattern for remaining 19.
```

---

**Save this prompt and paste into GPT-5.4:**
1. Copy entire prompt above
2. Paste into GPT-5.4 chat
3. Say "Generate all 20 agents using this prompt"
4. GPT will output TypeScript files ready to use

**Or, if you want me to generate them:** Say "generate" and I'll call GPT-5.4 to write the code.

Which approach?