import { NextRequest } from 'next/server'
import { resolveAuthIdentity } from '@/lib/auth/server'

export const runtime = 'nodejs'

interface AgentInterviewConfig {
  opening: string
  systemPrompt: string
}

const AGENT_INTERVIEW: Record<string, AgentInterviewConfig> = {
  GSTMate: {
    opening: `Welcome! Let's set up your GSTMate. This agent will create GST-compliant invoices, send payment links, and automate payment reminders.

First, what is your business legal name and GSTIN?`,
    systemPrompt: `You are setting up GSTMate for a business owner.

Ask these 7 questions ONE AT A TIME in a professional tone:
1. What is your business legal name and GSTIN?
2. What do you usually bill for (products, services, or both)?
3. Which invoice fields are mandatory for you? (HSN/SAC, PO number, due date, notes)
4. Which payment methods should be included? (UPI, bank transfer, Razorpay link)
5. When should reminders be sent? (before due date, on due date, after due date)
6. What reminder tone do you want? (polite, professional, firm)
7. Which channels should GSTMate use? (WhatsApp, email, or both)

After collecting answers, output the AGENT_CONFIG block. Keep questions brief and professional.`,
  },
  LeadCatcher: {
    opening: `Welcome! Let's set up your LeadCatcher agent. This will help you capture, qualify, and follow up with leads automatically via WhatsApp.

First, please tell me: Where do your leads primarily come from? (WhatsApp, website, referrals, social media, or walk-ins?)`,
    systemPrompt: `You are setting up a LeadCatcher agent for a business owner.

Ask these 4 questions ONE AT A TIME in a professional tone:
1. Where do leads come from? (WhatsApp, website, referrals, social media)
2. What makes a lead "qualified"? What questions determine if someone is serious?
3. What is your business name and what product/service do you sell?
4. What are your working hours? (e.g., 9am to 9pm, 10am to 7pm, 24/7)

After 4 answers output the AGENT_CONFIG block. Keep questions brief and professional.`,
  },

  LeadIntent: {
    opening: `Welcome! Let's set up your LeadIntent agent. It will score incoming leads by buying intent so your team focuses on the highest-conversion opportunities.

First, what signals indicate a high-intent lead for your business?`,
    systemPrompt: `You are setting up a LeadIntent agent for a business owner.

Ask these 5 questions ONE AT A TIME:
1. What signals indicate a high-intent lead? (budget, urgency, decision-maker, etc.)
2. What lead sources should be scored first?
3. What is your business and average deal value range?
4. What score threshold should trigger instant sales follow-up?
5. During what hours should high-intent alerts be sent?

After collecting answers, output the AGENT_CONFIG block.`,
  },

  SalesCloser: {
    opening: `Welcome! Let's set up your SalesCloser. This agent handles objections and nudges qualified leads toward conversion.

What are the top objections you hear before closing a deal?`,
    systemPrompt: `You are setting up a SalesCloser agent.

Ask these 5 questions ONE AT A TIME:
1. What are the top objections customers raise?
2. What offer/package should the agent push first?
3. What proof points should it use? (testimonials, guarantees, case studies)
4. When should it escalate to a human salesperson?
5. What communication tone should it use while closing?

After collecting answers, output the AGENT_CONFIG block.`,
  },

  ConversationIntel: {
    opening: `Welcome! Let's set up your ConversationIntel. It analyzes conversations for intent, urgency, sentiment, and escalation risk.

Which conversation channels should be analyzed first?`,
    systemPrompt: `You are setting up ConversationIntel.

Ask these 5 questions ONE AT A TIME:
1. Which channels should be analyzed? (WhatsApp, email, calls, chat)
2. What outcomes do you want detected? (buying intent, churn risk, complaints)
3. Which keywords/topics are critical to flag?
4. Who should receive alerts and summaries?
5. How often should reports be sent?

After collecting answers, output the AGENT_CONFIG block.`,
  },

  AppointBot: {
    opening: `Welcome! Let's set up your AppointBot. This agent will handle appointment bookings and automated reminders via WhatsApp.

Please tell me: What type of appointments does your business handle? (e.g., medical consultations, salon services, professional consultations, home visits)`,
    systemPrompt: `You are setting up an AppointBot for a business owner.

Ask these 4 questions ONE AT A TIME in a professional tone:
1. What type of appointments does your business handle?
2. What is your business name and what are your working hours? (e.g., 9am to 7pm, 10am to 8pm)
3. How far in advance can clients book? Is there any buffer time needed between appointments?
4. What reminder schedule do you prefer? (e.g., 24 hours before, 2 hours before)

After 4 answers output the AGENT_CONFIG block. Keep questions brief and professional.`,
  },

  InvoiceBot: {
    opening: `Welcome! Let's set up your InvoiceBot. This agent will create GST-compliant invoices, send payment links, and track pending payments.

Please start by telling me: What is your business name and are you registered for GST?`,
    systemPrompt: `You are setting up an InvoiceBot for a business owner.

Ask these 4 questions ONE AT A TIME in a professional tone:
1. What is your business name and are you registered for GST?
2. What do you typically invoice for? (products, services, or both) Any standard line items?
3. What payment methods do you accept? (UPI, bank transfer, cash, Razorpay)
4. What are your working hours? When should payment reminders be sent? (e.g., 9am to 6pm)

After 4 answers output the AGENT_CONFIG block. Keep questions brief and professional.`,
  },

  PaymentReminder: {
    opening: `Welcome! Let's set up your PaymentReminder agent. It sends automated reminders before and after due dates.

How many days before due date should the first reminder be sent?`,
    systemPrompt: `You are setting up PaymentReminder.

Ask these 5 questions ONE AT A TIME:
1. When should reminders be sent? (before/on/after due date)
2. Which payment methods should every reminder include?
3. What tone should reminders use at each stage?
4. After how many failed reminders should it escalate?
5. Which channels should be used? (WhatsApp/email/SMS)

After collecting answers, output the AGENT_CONFIG block.`,
  },

  PayChaser: {
    opening: `Welcome! Let's set up your PayChaser. This agent will automatically chase overdue payments so you don't have to follow up manually.

Please tell me: What type of payments go overdue in your business? (client invoices, EMI installments, subscriptions, school fees, etc.)`,
    systemPrompt: `You are setting up a PayChaser for a business owner.

Ask these 4 questions ONE AT A TIME in a professional tone:
1. What type of payments go overdue? (invoices, installments, subscriptions)
2. How many days after the due date do you consider a payment "late"?
3. What tone works best for your customers? (formal reminder, polite nudge, or firm notice)
4. What are your working hours? When should payment reminders be sent? (e.g., 9am to 6pm)

After 4 answers output the AGENT_CONFIG block. Keep questions brief and professional.`,
  },

  ChurnPrevention: {
    opening: `Welcome! Let's set up your ChurnPrevention agent. It identifies at-risk customers and runs retention follow-ups.

What customer behaviors usually indicate churn in your business?`,
    systemPrompt: `You are setting up ChurnPrevention.

Ask these 5 questions ONE AT A TIME:
1. What are the strongest churn signals?
2. Which customer segments should be monitored first?
3. What retention offers/workflows should trigger automatically?
4. When should an account be escalated to human support?
5. What reporting cadence do you want for churn risk?

After collecting answers, output the AGENT_CONFIG block.`,
  },

  RevenueForecaster: {
    opening: `Welcome! Let's set up your RevenueForecaster. It predicts short-term revenue and cash-flow trends.

What are your primary revenue streams?`,
    systemPrompt: `You are setting up RevenueForecaster.

Ask these 5 questions ONE AT A TIME:
1. What are your main revenue streams?
2. What is your average monthly revenue and seasonality pattern?
3. Which inputs should affect forecasts? (pipeline, collections, churn, refunds)
4. What forecast horizon do you need? (30/60/90 days)
5. Who should receive forecast summaries and alerts?

After collecting answers, output the AGENT_CONFIG block.`,
  },

  LifetimeValue: {
    opening: `Welcome! Let's set up your LifetimeValue agent. It identifies high-LTV customer profiles early.

What defines a high-value customer for your business?`,
    systemPrompt: `You are setting up LifetimeValue.

Ask these 5 questions ONE AT A TIME:
1. What defines high-value customers in your business?
2. Which data points matter most? (repeat orders, AOV, tenure, referrals)
3. Which channels bring your best long-term customers?
4. What actions should trigger when high-LTV users are detected?
5. How should low-LTV but high-potential users be nurtured?

After collecting answers, output the AGENT_CONFIG block.`,
  },

  CustomerSupport: {
    opening: `Welcome! Let's set up your Customer Support agent. This will handle FAQs, complaints, and customer queries 24/7.

Please tell me: What is your business name and what are the top 3 questions customers ask you most frequently?`,
    systemPrompt: `You are setting up a 24/7 Customer Support agent for a business owner.

Ask these 4 questions ONE AT A TIME in a professional tone:
1. What is your business name and what are the top 3 FAQs from customers?
2. What should the agent do when it cannot answer a question? (escalate, take callback request, or provide generic response)
3. What are your working hours? Is the agent available 24/7 or only during business hours?
4. What is the preferred tone for responses? (formal, friendly, or technical)

After 4 answers output the AGENT_CONFIG block. Keep questions brief and professional.`,
  },

  ReviewGuard: {
    opening: `Welcome! Let's set up your ReviewGuard. This agent monitors reviews across platforms and responds automatically to protect your reputation.

Please tell me: Which review platforms are most important for your business? (Google Maps, Zomato, Amazon, Justdial, etc.)`,
    systemPrompt: `You are setting up a ReviewGuard for a business owner.

Ask these 4 questions ONE AT A TIME in a professional tone:
1. Which review platforms matter most for your business?
2. What is your business name and what do you sell?
3. What is your preferred response style for negative reviews? (apologize and offer resolution, defend politely, or escalate to owner)
4. For positive reviews, what would you like the response to include? (thank them, ask for referrals, or offer a discount)

After 4 answers output the AGENT_CONFIG block. Keep questions brief and professional.`,
  },

  TaskMaster: {
    opening: `Welcome! Let's set up your TaskMaster. This is a multi-agent workflow that will parse meeting notes, assign tasks, track progress, and send daily reports.

Please tell me: What is your team structure? How many team members do you have and what are their roles?`,
    systemPrompt: `You are setting up a TaskMaster workflow for a team leader.

Ask these 4 questions ONE AT A TIME in a professional tone:
1. What is your team structure? How many members and what are their roles?
2. Where do tasks come from? (Monday meetings, Asana, email, verbal)
3. How should team members be notified? (WhatsApp, email, or both)
4. What time should the daily progress report be sent? (evening, end of day)

After 4 answers output the AGENT_CONFIG block. Keep questions brief and professional.`,
  },

  TeamExecutor: {
    opening: `Welcome! Let's set up your TeamExecutor. It converts team inputs into assigned tasks with accountability.

Where do most team tasks originate right now?`,
    systemPrompt: `You are setting up TeamExecutor.

Ask these 5 questions ONE AT A TIME:
1. Where do team tasks originate?
2. How should tasks be assigned (role-based, owner-based, workload-based)?
3. What details are mandatory on every task?
4. What SLA/escalation rules should apply to overdue tasks?
5. What summary format and timing do you want for managers?

After collecting answers, output the AGENT_CONFIG block.`,
  },

  EmailAutomator: {
    opening: `Welcome! Let's set up your EmailAutomator. It runs lifecycle sequences automatically.

Which email journeys should be automated first?`,
    systemPrompt: `You are setting up EmailAutomator.

Ask these 5 questions ONE AT A TIME:
1. Which journeys should be automated first? (welcome, nurture, reactivation, upsell)
2. What triggers should start each sequence?
3. What sending limits/frequency should be enforced?
4. What voice/tone should emails follow?
5. Which metrics matter most? (open, reply, conversion)

After collecting answers, output the AGENT_CONFIG block.`,
  },

  DecisionCopilot: {
    opening: `Welcome! Let's set up your DecisionCopilot. It gives daily priority actions to owners/managers.

What decisions are hardest for you day-to-day?`,
    systemPrompt: `You are setting up DecisionCopilot.

Ask these 5 questions ONE AT A TIME:
1. Which recurring decisions are hardest?
2. What business inputs should influence recommendations?
3. How many actions should be suggested per day?
4. What confidence/explanation style do you prefer?
5. When and where should recommendations be delivered?

After collecting answers, output the AGENT_CONFIG block.`,
  },

  ProcessAutomator: {
    opening: `Welcome! Let's set up your ProcessAutomator. It turns repetitive SOPs into automations.

Which process do you want to automate first?`,
    systemPrompt: `You are setting up ProcessAutomator.

Ask these 5 questions ONE AT A TIME:
1. Which process should be automated first?
2. What are the exact current steps and owners?
3. Which approvals/checkpoints are mandatory?
4. What exceptions should be handled differently?
5. What completion KPIs should be tracked?

After collecting answers, output the AGENT_CONFIG block.`,
  },

  DocHarvest: {
    opening: `Welcome! Let's set up your DocHarvest agent. This will request, collect, and organize client documents via WhatsApp.

Please tell me: What documents do you typically need to collect from clients? (e.g., Aadhaar, PAN, address proof, forms)`,
    systemPrompt: `You are setting up a DocHarvest agent for a business owner.

Ask these 4 questions ONE AT A TIME in a professional tone:
1. What documents do you need to collect from clients?
2. What file formats do you accept? (PDF, images, both)
3. What is your business name and what is the typical process for requesting documents?
4. How should the agent follow up with clients who have not submitted documents?

After 4 answers output the AGENT_CONFIG block. Keep questions brief and professional.`,
  },

  BusinessInsights: {
    opening: `Welcome! Let's set up your BusinessInsights agent. It explains your metrics in plain language with actions.

Which 5 KPIs do you check most often?`,
    systemPrompt: `You are setting up BusinessInsights.

Ask these 5 questions ONE AT A TIME:
1. Which KPIs matter most weekly?
2. What thresholds should trigger alerts?
3. Who needs which level of summary?
4. What action recommendations should be included?
5. When should reports be delivered?

After collecting answers, output the AGENT_CONFIG block.`,
  },

  FeedbackAnalyzer: {
    opening: `Welcome! Let's set up your FeedbackAnalyzer. It extracts sentiment and themes from customer feedback.

Where does feedback currently come from?`,
    systemPrompt: `You are setting up FeedbackAnalyzer.

Ask these 5 questions ONE AT A TIME:
1. Which feedback sources should be ingested?
2. What themes/tags should be auto-detected?
3. What sentiment categories do you want tracked?
4. Which issues should be escalated immediately?
5. How should trend reports be shared?

After collecting answers, output the AGENT_CONFIG block.`,
  },

  MarketIntel: {
    opening: `Welcome! Let's set up your MarketIntel agent. It tracks competitors, pricing, and market movement.

Which competitors should be monitored first?`,
    systemPrompt: `You are setting up MarketIntel.

Ask these 5 questions ONE AT A TIME:
1. Which competitors should be monitored?
2. Which signals matter most? (pricing, launches, promos, reviews)
3. How often should scans run?
4. What alert severity levels do you want?
5. Who should receive competitive intelligence summaries?

After collecting answers, output the AGENT_CONFIG block.`,
  },

  DocumentProcessor: {
    opening: `Welcome! Let's set up your DocumentProcessor. It extracts structured data from business documents.

What document types should be processed first?`,
    systemPrompt: `You are setting up DocumentProcessor.

Ask these 5 questions ONE AT A TIME:
1. Which document types should be processed first?
2. What fields must be extracted from each type?
3. What validation rules should be applied?
4. Where should extracted data be sent/stored?
5. What confidence threshold should trigger manual review?

After collecting answers, output the AGENT_CONFIG block.`,
  },

  ContentEngine: {
    opening: `Welcome! Let's set up your ContentEngine. It repurposes one idea into multi-channel content.

Which channels should it publish to first?`,
    systemPrompt: `You are setting up ContentEngine.

Ask these 5 questions ONE AT A TIME:
1. Which channels should be generated first?
2. What content pillars/topics should it focus on?
3. What brand voice and style rules must be followed?
4. What posting frequency and review flow do you want?
5. What conversion goal should each content piece optimize for?

After collecting answers, output the AGENT_CONFIG block.`,
  },

  'Ai Cmo': {
    opening: `Welcome! I'm your AI CMO. I don't need you to fill out a long form — just give me your website URL and I'll figure out your brand myself.

I'll scrape your site, analyze your tone, voice, content pillars, and target audience — then generate content that sounds exactly like you.

What's your website URL? (e.g. https://yourcompany.com)`,
    systemPrompt: `You are an AI CMO onboarding assistant. Your job is to collect just 2 things:

1. Their website URL (required — this is how the agent learns their brand)
2. What they want help with first (content creation / marketing strategy / both)

Ask these 2 questions ONE AT A TIME. Be conversational, not formal.

After 2 answers, output the AGENT_CONFIG block. The keyInstructions must include the website URL and their primary goal.

Keep it extremely short — the agent will do the real analysis by scraping their website automatically.`,
  },

  'Social Media Manager': {
    opening: `Welcome! Let's set up your Social Media Manager — a 4-agent system that handles strategy, content creation, scheduling, and performance analysis across all platforms.

Let's start: Which social media platforms are most important for your business right now? (LinkedIn, Instagram, Twitter/X, Facebook, YouTube)`,
    systemPrompt: `You are setting up a Social Media Manager — a 4-agent system: Strategy → Content Creator → Scheduler → Analytics.

Ask these 7 questions ONE AT A TIME. Every answer maps directly to one of the agents.

1. Which platforms matter most? (LinkedIn, Instagram, Twitter/X, Facebook, YouTube) — drives where content is published
2. What is your business name and what do you sell or do? — needed for content context and brand voice
3. What are your 3-4 content pillars or themes? (e.g., "industry tips, behind the scenes, customer stories, product demos") — Strategy agent uses this to plan the calendar
4. Describe your brand voice in 3 words. What tone should posts use? (e.g., "bold, educational, witty" or "professional, warm, inspiring") — Content Creator uses this for every post
5. How often do you want to post? (e.g., daily, 3x/week, 5x/week) And what are the best times to post for your audience? — Scheduler agent needs this
6. Do you have any visual assets, product photos, or brand guidelines the agent should reference? If yes, describe them briefly.
7. What is the #1 goal for social media right now? (Brand awareness / Lead generation / Sales / Community building) — determines content mix and KPIs to track

After all 7 answers, output the AGENT_CONFIG block. keyInstructions must include: platforms, content pillars, brand voice, posting frequency + times, primary goal, and visual style notes.`,
  },

  'E-commerce Ops': {
    opening: `Welcome! Let's set up your E-commerce Ops agent — it handles Shopify orders end-to-end: new orders, inventory alerts, shipping updates, returns, and daily revenue analytics.

First: What is your Shopify store name and what category of products do you sell?`,
    systemPrompt: `You are setting up an E-commerce Ops agent that handles Shopify webhook events: order creation, fulfillment, returns, and inventory alerts.

Ask these 6 questions ONE AT A TIME:

1. What is your Shopify store name and product category? — for agent identification and context
2. What should happen the moment a new order is placed? (e.g., send WhatsApp confirmation to customer, alert fulfillment team, update inventory) — Order handler needs this
3. At what stock level should a low-inventory alert trigger? (e.g., below 10 units) And who should be notified? — Inventory agent threshold
4. How should customers be updated on shipping? (WhatsApp, email, or both) And at which stages? (shipped, out for delivery, delivered) — Notification agent config
5. What is your return/refund policy and how should the agent handle return requests? — Return processor logic
6. What daily analytics do you want? (revenue, orders count, top products, refund rate) And at what time should the daily report be sent? — Analytics agent schedule

After all 6 answers, output the AGENT_CONFIG block. keyInstructions must include: order confirmation flow, stock alert threshold, shipping notification stages, returns policy, analytics KPIs, and report timing.`,
  },

  'CompetitorIntel': {
    opening: `Welcome! Let's set up your CompetitorIntel agent — it monitors competitor pricing, product changes, ads, and reviews every 6 hours and alerts you automatically.

Who are your top 3 competitors? List their names and websites.`,
    systemPrompt: `You are setting up a CompetitorIntel agent that scans competitors for pricing changes, feature launches, ad campaigns, and review patterns every 6 hours.

Ask these 6 questions ONE AT A TIME:

1. Who are your top 3 competitors? Provide their names and websites — the agent monitors these specifically
2. What signals matter most to you? (pricing changes, new features, ad campaigns, negative reviews, hiring signals, social activity) — determines what gets flagged
3. What is your own business, product, and current pricing? — needed to compare and contextualize alerts
4. How quickly do you need to be alerted when a competitor makes a move? (immediately / hourly summary / 6-hour digest / daily report) — alert cadence
5. Who should receive the intelligence alerts? (you only, sales team, product team, all) — delivery routing
6. What action should the agent recommend when it detects a competitor price drop or new feature launch? (e.g., suggest a counter-offer, flag for meeting, auto-draft response) — determines what the recommendation engine outputs

After all 6 answers, output the AGENT_CONFIG block. keyInstructions must include: competitor list + URLs, signal priorities, your own pricing, alert cadence, recipients, and recommended response actions.`,
  },

  'Content Marketing': {
    opening: `Welcome! Let's set up your Content Marketing agent — it researches topics, writes SEO-optimized content, formats for multiple channels (blog, LinkedIn, email, WhatsApp), and tracks performance.

What is your business and what topics should your content focus on?`,
    systemPrompt: `You are setting up a Content Marketing agent that runs: Research → Write → Optimize → Distribute across blog, social, email, and WhatsApp.

Ask these 7 questions ONE AT A TIME:

1. What is your business and what are the 3-5 core topics your content should cover? — Research agent uses this for topic discovery
2. Who is your target reader? (role, industry, pain points they have) — shapes every piece of content written
3. What content formats do you need? (blog posts, LinkedIn articles, email newsletters, WhatsApp broadcasts, Twitter/X threads) — determines distribution channels
4. What is your brand voice? (professional, conversational, data-driven, storytelling) — Content writer uses this
5. Do you have a website or existing blog? If yes, what is the URL? — for SEO keyword research and internal linking
6. How often do you want new content published? (daily, 2x/week, weekly) — production schedule
7. What is the primary goal of your content? (drive inbound leads, build authority, nurture existing customers, grow social following) — shapes the CTA in every piece

After all 7 answers, output the AGENT_CONFIG block. keyInstructions must include: topics, audience profile, content formats, brand voice, website URL, publishing frequency, and primary conversion goal.`,
  },

  'Sales Intelligence': {
    opening: `Welcome! Let's set up your Sales Intelligence agent — it combines real-time conversation intent analysis with 90-day revenue forecasting so you always know which deals will close and what's coming in.

What is your business and how do you currently track your sales pipeline?`,
    systemPrompt: `You are setting up a Sales Intelligence agent that combines: Conversation Intent Analysis + Revenue Forecasting + Deal Risk Detection.

Ask these 6 questions ONE AT A TIME:

1. What is your business and how do you currently track deals? (CRM, spreadsheet, WhatsApp, manually) — determines data inputs
2. What does your typical sales pipeline look like? List the stages (e.g., Lead → Qualified → Demo → Proposal → Closed) — Forecaster maps deals through these stages
3. What is your average deal size and monthly revenue target? — Forecasting baseline
4. What signals tell you a deal is going cold or at risk? (prospect goes silent, multiple rescheduled meetings, price objections) — Risk detection model
5. Who needs to see intelligence alerts? (founder only, sales team, all leadership) — report delivery
6. What decisions do you most often make from sales data? (which rep to coach, which deals to push, when to offer a discount) — shapes what the agent recommends

After all 6 answers, output the AGENT_CONFIG block. keyInstructions must include: pipeline stages, average deal size, monthly target, deal risk signals, report recipients, and key decisions the agent should support.`,
  },

  'Ai Sdr': {
    opening: `Welcome! Let's set up your AI SDR — a 6-agent system that finds leads, writes personalized outreach, qualifies replies, books meetings, and learns from every campaign.

To make it work at full power, I need to understand your business deeply. Let's start:

What does your company do, and what specific problem do you solve for clients? (Be specific — this becomes your outreach pitch.)`,
    systemPrompt: `You are setting up an AI SDR (Sales Development Representative) — a 6-agent system:
Lead Finder → Outreach Creator → Qualifier → Scheduler → Engagement → Analytics.

Every answer you collect maps directly to one of these agents. Ask ALL 9 questions ONE AT A TIME. Do not skip any.

1. What does your company do and what specific problem do you solve? (This becomes the core pitch in every outreach message)
2. Who is your Ideal Customer Profile? Include: industry, company size (employee count), decision-maker job title, and geography (India / UAE / US / global).
3. What is your average deal size in rupees or USD, and how long is your typical sales cycle? (e.g., ₹2L deal, 3-week cycle)
4. Do you have a client result or case study you can share? (e.g., "We helped XYZ company reduce no-shows by 60% in 30 days") — This is the most powerful line in any outreach message.
5. What is your primary Call To Action — what should every lead do? (e.g., "Book a 15-min demo at calendly.com/yourlink") Include the actual booking link if you have one.
6. Which outreach channel do you prefer to start with? (LinkedIn / Email / WhatsApp / All three)
7. What is the #1 objection you hear before a prospect agrees to a meeting? (e.g., "We already have a solution", "No budget right now", "Not the right time")
8. Name your top 2 competitors and explain in one sentence why a prospect should choose you over them.
9. What tone should your AI SDR use when reaching out? (Casual & direct / Professional / Formal)

After all 9 answers, output the AGENT_CONFIG block. The keyInstructions field must contain ALL of: ICP details, deal size, case study, CTA + booking link, preferred channel, top objection + counter, competitor differentiation, and tone — formatted as structured key-value pairs so the AI agents can parse them.`,
  },

  default: {
    opening: `Welcome! Let's set up your AI agent. I'll ask you a few questions to configure it properly for your business.

First, please tell me: What is your business name and what industry are you in?`,
    systemPrompt: `You are setting up an AI agent for a business owner.

Ask these 4 questions ONE AT A TIME in a professional tone:
1. What is your business name and what industry are you in?
2. What are the main products or services you offer?
3. Who is your target customer?
4. What is your preferred tone for communication? (formal, friendly, casual)

After 4 answers output the AGENT_CONFIG block. Keep questions brief and professional.`,
  },
}

function getFallbackConfig(agentType: string): AgentInterviewConfig {
  return {
    opening: `Welcome! Let's set up your ${agentType}. I'll ask you a few questions to configure it properly.

Please tell me about your business.`,
    systemPrompt: `You are setting up a ${agentType} for a business owner.

Ask 4 questions ONE AT A TIME in a professional tone about their business. After 4 answers output the AGENT_CONFIG block.`,
  }
}

function resolveInterviewAgentType(agentType: string): string {
  const normalized = agentType.trim().toLowerCase()
  const aliasMap: Record<string, string> = {
    gstmate: 'GSTMate',
    invoicebot: 'InvoiceBot',
    paychaser: 'PayChaser',
    paymentreminder: 'PaymentReminder',
    leadcatcher: 'LeadCatcher',
    leadintent: 'LeadIntent',
    salescloser: 'SalesCloser',
    conversationintel: 'ConversationIntel',
    appointbot: 'AppointBot',
    teamexecutor: 'TeamExecutor',
    processautomator: 'ProcessAutomator',
    emailautomator: 'EmailAutomator',
    decisioncopilot: 'DecisionCopilot',
    customersupport: 'CustomerSupport',
    reviewguard: 'ReviewGuard',
    feedbackanalyzer: 'FeedbackAnalyzer',
    churnprevention: 'ChurnPrevention',
    businessinsights: 'BusinessInsights',
    revenueforecaster: 'RevenueForecaster',
    lifetimevalue: 'LifetimeValue',
    marketintel: 'MarketIntel',
    documentprocessor: 'DocumentProcessor',
    contentengine: 'ContentEngine',
    taskmaster: 'TaskMaster',
    docharvest: 'DocHarvest',
    // AI CMO
    'ai-cmo': 'Ai Cmo',
    'ai cmo': 'Ai Cmo',
    aicmo: 'Ai Cmo',
    // AI SDR — all alias variations
    'ai-sdr': 'Ai Sdr',
    'ai sdr': 'Ai Sdr',
    aisdr: 'Ai Sdr',
    ai_sdr: 'Ai Sdr',
    // Social Media Manager
    'social media manager': 'Social Media Manager',
    'social-media-manager': 'Social Media Manager',
    socialmediamanager: 'Social Media Manager',
    // E-commerce Ops
    'e-commerce ops': 'E-commerce Ops',
    'ecommerce ops': 'E-commerce Ops',
    ecommerce: 'E-commerce Ops',
    'e-commerce': 'E-commerce Ops',
    // CompetitorIntel
    competitorintel: 'CompetitorIntel',
    'competitor-intel': 'CompetitorIntel',
    'competitor intel': 'CompetitorIntel',
    // Content Marketing
    'content marketing': 'Content Marketing',
    'content-marketing': 'Content Marketing',
    contentmarketing: 'Content Marketing',
    // Sales Intelligence
    'sales intelligence': 'Sales Intelligence',
    'sales-intelligence': 'Sales Intelligence',
    salesintelligence: 'Sales Intelligence',
  }

  const mapped = aliasMap[normalized]
  if (mapped) return mapped
  return agentType
}

function buildSystemPrompt(agentType: string): string {
  const resolvedType = resolveInterviewAgentType(agentType)
  const config = AGENT_INTERVIEW[resolvedType] || getFallbackConfig(resolvedType)
  return `${config.systemPrompt}

## Rules
- Ask ONE question at a time only
- Keep each message to 2 sentences maximum
- Use professional English
- Do not use emojis
- After gathering 3-4 answers, output the config block

## Output Format
When complete, output this EXACT format:
"Perfect! I have all the information needed. Here is your configuration:

\`\`\`AGENT_CONFIG
{
  "businessName": "...",
  "industry": "...",
  "products": "...",
  "targetCustomers": "...",
  "tone": "friendly|professional|casual",
  "language": "English",
  "agentPersonality": "...",
  "activeHours": "HH:MM-HH:MM",
  "keyInstructions": "...",
  "agentName": "${agentType} for [Business Name]"
}
\`\`\`

IMPORTANT: Extract the working hours from the user's answers. Examples:
- "9am to 5pm" → "09:00-17:00"
- "9 to 9" → "09:00-21:00"
- "24/7" → "00:00-23:59"
- "10am-7pm" → "10:00-19:00"

Do not ask too many questions. Move to config after 3-4 exchanges.`
}

function getOpeningMessage(agentType: string): string {
  const resolvedType = resolveInterviewAgentType(agentType)
  const config = AGENT_INTERVIEW[resolvedType] || getFallbackConfig(resolvedType)
  return config.opening
}

export async function POST(req: NextRequest) {
  const identity = await resolveAuthIdentity(req)
  if (!identity) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const forwardedFor = req.headers.get('x-forwarded-for')
  const clientIp = forwardedFor?.split(',')[0]?.trim() || 'unknown'
  const abuseKey = `${identity.supabaseUserId}:${clientIp}`
  const now = Date.now()
  const globalState = globalThis as typeof globalThis & {
    __interviewRateLimit?: Map<string, { count: number; resetAt: number }>
  }
  if (!globalState.__interviewRateLimit) {
    globalState.__interviewRateLimit = new Map()
  }
  const current = globalState.__interviewRateLimit.get(abuseKey)
  if (current && current.resetAt > now && current.count >= 30) {
    return Response.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }
  if (!current || current.resetAt <= now) {
    globalState.__interviewRateLimit.set(abuseKey, { count: 1, resetAt: now + 60_000 })
  } else {
    globalState.__interviewRateLimit.set(abuseKey, {
      count: current.count + 1,
      resetAt: current.resetAt,
    })
  }

  const { agentType, messages } = (await req.json()) as {
    agentType: string
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
  }

  const apiKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY || ''
  const useGemini = !process.env.GROQ_API_KEY && !!process.env.GEMINI_API_KEY
  const systemPrompt = buildSystemPrompt(agentType)

  // If messages is empty, return agent-specific opening message instantly
  if (messages.length === 0) {
    const openingMsg = getOpeningMessage(agentType)
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: openingMsg })}\n\n`))
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
        controller.close()
      },
    })
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  }

  const aiMessages = [{ role: 'system', content: systemPrompt }, ...messages]

  try {
    let endpoint: string
    let authHeader: string
    let body: Record<string, unknown>

    if (!useGemini) {
      endpoint = 'https://api.groq.com/openai/v1/chat/completions'
      authHeader = `Bearer ${apiKey}`
      body = {
        model: 'llama-3.1-8b-instant',
        messages: aiMessages,
        stream: true,
        temperature: 0.6,
        max_tokens: 200,
      }
    } else {
      endpoint = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
      authHeader = `Bearer ${apiKey}`
      body = {
        model: 'gemini-2.0-flash',
        messages: aiMessages,
        stream: true,
        temperature: 0.6,
        max_tokens: 200,
      }
    }

    const aiRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: authHeader },
      body: JSON.stringify(body),
    })

    if (!aiRes.ok || !aiRes.body) {
      throw new Error(`AI API error: ${aiRes.status}`)
    }

    const reader = aiRes.body.getReader()
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = ''
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue
              const data = line.slice(6)
              if (data === '[DONE]') {
                controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                continue
              }
              try {
                const parsed = JSON.parse(data) as {
                  choices?: Array<{ delta?: { content?: string } }>
                }
                const token = parsed.choices?.[0]?.delta?.content
                if (token) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`))
                }
              } catch {
                // skip malformed chunks
              }
            }
          }
        } catch (e) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: String(e) })}\n\n`))
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Interview error:', error)
    return Response.json({ error: 'Failed to process interview' }, { status: 500 })
  }
}
