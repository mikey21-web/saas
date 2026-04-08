/**
 * Detailed Agent Descriptions
 *
 * Each agent has comprehensive information:
 * - Clear value proposition
 * - Detailed capabilities (what it actually does)
 * - Built-in skills
 * - Credentials required
 * - India-specific features
 */

export interface AgentDetails {
  id: string
  valueProposition: string // Short benefit statement
  capabilities: string[] // 6-8 specific things it does
  builtInSkills: string[] // Skills included
  credentialsRequired: string[] // What user must provide
  indianSpecific?: string[] // India-native features
  costPerMonth: {
    inr: number
    usd: number
  }
  bestFor: string // Target user persona
  implementation: string // How it works (the flow/orchestration)
}

export const AGENT_DETAILS: Record<string, AgentDetails> = {
  'task-master': {
    id: 'task-master',
    valueProposition:
      'Parse meetings, assign tasks, send notifications, track progress, report daily',
    capabilities: [
      'Extract actionable tasks from unstructured meeting notes',
      'Intelligently assign tasks to appropriate team members',
      'Send task assignments via WhatsApp with context',
      'Track task completion status in real-time',
      'Generate daily progress reports with completion metrics',
      'Escalate blocked/overdue tasks automatically',
      'Learn team member capacity and optimize assignments',
      'Reduce post-meeting admin time by 80%',
    ],
    builtInSkills: [
      'Meeting Parser',
      'Task Router',
      'WhatsApp Notifier',
      'Progress Tracker',
      'Daily Reporter',
    ],
    credentialsRequired: [
      'WhatsApp Business Number (+91...)',
      'AI Model (diyaa.ai Powered or bring your own)',
    ],
    indianSpecific: [
      'WhatsApp group assignment (not email)',
      'Hindi/Hinglish meeting note parsing',
      'IST timezone for scheduling',
    ],
    costPerMonth: { inr: 4999, usd: 60 },
    bestFor: 'Engineering teams, operations teams, startups',
    implementation:
      '5-agent orchestration: Meeting Parser → Task Router → WhatsApp Notifier → Progress Tracker → Daily Reporter. Each step autonomous, escalates to manager on delay.',
  },

  'lead-catcher': {
    id: 'lead-catcher',
    valueProposition: 'Capture leads 24/7, score instantly, follow up automatically',
    capabilities: [
      'Capture leads from WhatsApp, SMS, and web forms automatically',
      'Score leads in real-time based on engagement and fit',
      'Send personalized follow-up messages within seconds',
      'Ask qualifying questions to understand buyer intent',
      'Route hot leads to your team via WhatsApp/email',
      'Track lead status through your entire sales pipeline',
      'Generate daily lead report with conversion metrics',
      'Never miss a lead again—24/7 autonomous capture',
    ],
    builtInSkills: ['WhatsApp Receiver', 'Lead Scoring', 'Email/SMS Sender', 'Scheduling'],
    credentialsRequired: [
      'WhatsApp Business Number (+91...)',
      'AI Model (diyaa.ai Powered or bring your own)',
    ],
    indianSpecific: [
      'WhatsApp-native (not email-first)',
      'UPI payment link integration for instant booking',
      'Hindi/Hinglish auto-detection',
    ],
    costPerMonth: { inr: 2499, usd: 30 },
    bestFor: 'Sales teams, D2C brands, service businesses',
    implementation:
      'Multi-agent: Capture → Score → Qualify → Route → Track. Each step autonomous, escalates to human on demand.',
  },

  'customer-support': {
    id: 'customer-support',
    valueProposition: 'Answer every customer instantly. On WhatsApp, email, and phone. 24/7.',
    capabilities: [
      'Respond to customer questions instantly via WhatsApp, email, or SMS',
      'Search your website knowledge base automatically for accurate answers',
      'Understand context and provide personalized, brand-voice responses',
      'Escalate complex issues to your team with full conversation history',
      'Learn from your FAQs, product docs, and past customer responses',
      'Track customer satisfaction and feedback automatically',
      'Generate weekly support performance reports',
      'Handle 100+ simultaneous conversations without lag',
    ],
    builtInSkills: [
      'WhatsApp/Email/SMS Receiver',
      'Knowledge Base Search',
      'Sentiment Analysis',
      'Escalation Logic',
    ],
    credentialsRequired: [
      'WhatsApp Business Number (+91...)',
      'Website URL (for knowledge base scraping)',
      'AI Model (diyaa.ai Powered or bring your own)',
    ],
    indianSpecific: [
      'WhatsApp as primary channel',
      'Local language support (Hindi, Hinglish, Tamil, Telugu)',
      'Exotel integration for phone support',
    ],
    costPerMonth: { inr: 4999, usd: 60 },
    bestFor: 'E-commerce, SaaS, D2C, retail',
    implementation:
      'Multi-agent: Receive message → Understand intent → Search knowledge base → Generate response → Send across channel → Log & track.',
  },

  'lead-qualifier': {
    id: 'lead-qualifier',
    valueProposition: 'Score, follow up, and book qualified leads automatically',
    capabilities: [
      'Score inbound leads based on company size, role, industry, and engagement',
      'Send personalized follow-up emails within minutes (not hours)',
      'Ask qualifying questions naturally via email or WhatsApp',
      'Track lead status and payment timeline automatically',
      'Route hot leads (high-score) to your team instantly',
      'Generate weekly pipeline reports with conversion metrics',
      'Escalate urgent/stalled leads for manual intervention',
      'Maintain consistent follow-up cadence (no leads fall through)',
    ],
    builtInSkills: ['Lead Scoring', 'Email Automation', 'Question Logic', 'Pipeline Tracking'],
    credentialsRequired: ['AI Model (diyaa.ai Powered or bring your own)'],
    indianSpecific: ['GST validation for B2B leads', 'Indian business size classification'],
    costPerMonth: { inr: 2999, usd: 35 },
    bestFor: 'B2B SaaS, consulting, agencies',
    implementation:
      'Multi-agent: Ingest lead → Score qualification → Generate personalized message → Send follow-up → Track response → Route/escalate.',
  },

  'invoice-chaser': {
    id: 'invoice-chaser',
    valueProposition: 'Get paid faster. Stop chasing invoices manually.',
    capabilities: [
      'Send payment reminders automatically on your schedule',
      'Track invoice status and payment timelines in real-time',
      'Escalate aging invoices based on urgency (30/60/90 days)',
      'Compose professional follow-up emails in client voice',
      'Generate UPI payment links for instant mobile payments',
      'Send late-payment alerts to your team',
      'Create aging reports with outstanding balance details',
      'Learn from payment patterns and optimize reminder timing',
    ],
    builtInSkills: [
      'Email Sender',
      'Invoice Tracker',
      'Payment Link Generator',
      'Escalation Logic',
    ],
    credentialsRequired: ['AI Model (diyaa.ai Powered or bring your own)'],
    indianSpecific: [
      'UPI payment link integration (Razorpay, PayU)',
      'GST invoice format support',
      'WhatsApp payment reminders (not just email)',
    ],
    costPerMonth: { inr: 3499, usd: 42 },
    bestFor: 'Consulting firms, CA practices, freelancers, agencies',
    implementation:
      'Multi-agent: Monitor invoice due dates → Escalate on threshold → Generate reminder → Send via email/WhatsApp → Track payment → Update status.',
  },

  'appoint-bot': {
    id: 'appoint-bot',
    valueProposition: 'Book appointments. Send reminders. Eliminate no-shows.',
    capabilities: [
      'Capture appointment requests via WhatsApp form automatically',
      'Check availability and confirm bookings instantly',
      'Send reminders 24 hours before (reduces no-shows by 40%)',
      'Handle rescheduling and cancellations automatically',
      'Ask pre-appointment questions (insurance details, symptoms, etc)',
      'Escalate complex bookings to your team',
      'Generate daily appointment report with no-show analysis',
      'Sync with your calendar (Google Calendar, Outlook)',
    ],
    builtInSkills: [
      'WhatsApp Form',
      'Calendar Integration',
      'Reminder Scheduler',
      'Confirmation Logic',
    ],
    credentialsRequired: [
      'WhatsApp Business Number (+91...)',
      'AI Model (diyaa.ai Powered or bring your own)',
    ],
    indianSpecific: [
      'WhatsApp-first booking (better UX than web forms)',
      'Hindi language support',
      'Indian timezone (IST) handling',
    ],
    costPerMonth: { inr: 2999, usd: 35 },
    bestFor: 'Clinics, salons, gyms, consultants, service businesses',
    implementation:
      'Multi-agent: WhatsApp booking → Check availability → Confirm slot → Send reminder → Handle reschedule → Track no-shows.',
  },

  'pay-chaser': {
    id: 'pay-chaser',
    valueProposition: 'Automatic payment reminders. Zero manual follow-up.',
    capabilities: [
      'Send WhatsApp payment reminders (better open rate than email)',
      'Generate UPI payment links for instant mobile payment',
      'Track payment status automatically',
      'Escalate overdue payments to collections team',
      'Send professional, customizable reminder messages',
      'Generate aging reports with payment metrics',
      'Learn from payment patterns to optimize reminder timing',
      'Handle multiple payment methods (UPI, bank transfer, check)',
    ],
    builtInSkills: ['WhatsApp Sender', 'Payment Link Generator', 'Status Tracker', 'Email Sender'],
    credentialsRequired: [
      'WhatsApp Business Number (+91...)',
      'AI Model (diyaa.ai Powered or bring your own)',
    ],
    indianSpecific: [
      'UPI-native (₹ in minutes, not days)',
      'WhatsApp reminders (2x higher engagement than email)',
      'Hindi/Hinglish support',
      'GST invoice integration',
    ],
    costPerMonth: { inr: 2499, usd: 30 },
    bestFor: 'Any business with invoices (freelancers, agencies, consulting)',
    implementation:
      'Multi-agent: Monitor due dates → Generate reminder → Send via WhatsApp → Create UPI link → Track payment → Escalate if late.',
  },

  'gst-mate': {
    id: 'gst-mate',
    valueProposition: 'GST invoices. GSTR reconciliation. Compliance automated.',
    capabilities: [
      'Generate GST-compliant invoices automatically',
      'Sync invoices with GSTR-1 filing automatically',
      'Reconcile GSTR-2 with vendor invoices automatically',
      'Calculate tax liability and suggest payment dates',
      'Alert you before GST due dates (avoid penalties)',
      'Generate compliance reports for your accountant',
      'Handle HSN/SAC codes and tax rates automatically',
      'Support multiple states and GST registrations',
    ],
    builtInSkills: ['Invoice Generator', 'GSTR Sync', 'Tax Calculator', 'Compliance Alerter'],
    credentialsRequired: ['AI Model (diyaa.ai Powered or bring your own)'],
    indianSpecific: [
      'GSTIN validation',
      'GSTR-1/GSTR-2 API integration',
      'State-wise tax rate handling',
      'Indian invoice format (mandatory)',
    ],
    costPerMonth: { inr: 3999, usd: 48 },
    bestFor: 'Every registered Indian business, CA firms, MSMEs',
    implementation:
      'Multi-agent: Receive invoice data → Validate GST → Generate invoice → Sync to GSTR → Monitor deadlines → Alert on due dates.',
  },

  'review-guard': {
    id: 'review-guard',
    valueProposition: 'Monitor reviews. Respond instantly. Protect your reputation.',
    capabilities: [
      'Monitor Google, Zomato, Yelp for new reviews automatically',
      'Generate personalized responses in seconds (brand-voice matching)',
      'Escalate negative reviews to your team for action',
      'Track sentiment and identify trends automatically',
      'Send alerts for critical reviews (respond immediately)',
      'Generate reputation report with trends and metrics',
      'Learn from your past responses and improve',
      'Handle 100+ reviews simultaneously',
    ],
    builtInSkills: [
      'Review Monitoring',
      'Sentiment Analysis',
      'Response Generator',
      'Alert System',
    ],
    credentialsRequired: [
      'Website URL (for review source scraping)',
      'AI Model (diyaa.ai Powered or bring your own)',
    ],
    indianSpecific: ['Zomato/Justdial integration', 'Hindi review understanding'],
    costPerMonth: { inr: 2999, usd: 35 },
    bestFor: 'Restaurants, hotels, salons, retail, service businesses',
    implementation:
      'Multi-agent: Monitor review platforms → Detect new review → Analyze sentiment → Generate response → Send reply → Escalate if critical.',
  },

  'nurture-bot': {
    id: 'nurture-bot',
    valueProposition: 'Keep leads warm. Convert cold leads to customers.',
    capabilities: [
      'Create personalized drip sequences for each lead automatically',
      'Send multi-channel messages (WhatsApp, email, SMS)',
      'Tailor messaging based on lead behavior and interests',
      'Track engagement and adjust follow-up timing',
      'Escalate engaged leads to sales team automatically',
      'A/B test subject lines and messaging automatically',
      'Generate nurture effectiveness reports',
      'Remove unengaged leads from sequence (avoid spam complaints)',
    ],
    builtInSkills: ['Email Sequence', 'WhatsApp/SMS Sender', 'Behavior Tracking', 'Lead Scoring'],
    credentialsRequired: [
      'WhatsApp Business Number (+91...)',
      'AI Model (diyaa.ai Powered or bring your own)',
    ],
    indianSpecific: ['WhatsApp as primary nurture channel', 'Local business language support'],
    costPerMonth: { inr: 3499, usd: 42 },
    bestFor: 'D2C brands, SaaS, consulting, sales teams',
    implementation:
      'Multi-agent: Ingest lead → Build sequence → Send message → Track engagement → Adjust timing → Escalate → Report metrics.',
  },

  'doc-harvest': {
    id: 'doc-harvest',
    valueProposition: 'Collect documents. Stop chasing clients.',
    capabilities: [
      'Send document requests via WhatsApp with secure upload links',
      'Remind clients automatically (no manual follow-ups)',
      'Validate document completeness automatically',
      'Organize documents by client and document type',
      'Alert you when all required documents received',
      'Generate compliance checklist for each client',
      'Track completion status and pending documents',
      'Store documents securely with access logs',
    ],
    builtInSkills: [
      'WhatsApp Sender',
      'Document Validator',
      'Reminder Scheduler',
      'Organization System',
    ],
    credentialsRequired: [
      'WhatsApp Business Number (+91...)',
      'AI Model (diyaa.ai Powered or bring your own)',
    ],
    indianSpecific: [
      'WhatsApp-native document collection',
      'Secure Indian data storage compliance',
    ],
    costPerMonth: { inr: 2499, usd: 30 },
    bestFor: 'CA firms, legal practices, immigration consultants, financial advisors',
    implementation:
      'Multi-agent: Create checklist → Send request → Remind client → Validate docs → Organize → Alert completion.',
  },

  'invoice-bot': {
    id: 'invoice-bot',
    valueProposition: 'Auto invoice + GST compliance + instant UPI reconciliation',
    capabilities: [
      'Generate GST-compliant invoices automatically from orders',
      'Extract invoice data from email/WhatsApp and validate GST',
      'Reconcile payments against invoices in real-time',
      'Generate UPI payment links for instant mobile payment collection',
      'Sync invoices with GSTR-1 filing automatically',
      'Calculate tax liability and suggest payment dates',
      'Send invoice reminders with payment links via WhatsApp',
      'Generate monthly reconciliation report for accountant',
    ],
    builtInSkills: [
      'Invoice Generator',
      'GST Validator',
      'Payment Link Creator',
      'GSTR Reconciler',
    ],
    credentialsRequired: ['AI Model (diyaa.ai Powered or bring your own)'],
    indianSpecific: [
      'GSTIN-based invoice generation',
      'GSTR-1/GSTR-2 API integration',
      'UPI payment link generation (Razorpay)',
      'HSN/SAC code auto-categorization',
    ],
    costPerMonth: { inr: 3999, usd: 48 },
    bestFor: 'CA firms, freelancers, MSMEs, service providers',
    implementation:
      'Multi-agent: Receive invoice → Validate GST → Generate invoice → Sync to GSTR → Create UPI link → Send reminder.',
  },

  'whats-blast': {
    id: 'whats-blast',
    valueProposition: 'WhatsApp campaign broadcast + intelligent segmentation',
    capabilities: [
      'Send WhatsApp campaigns to 1000s of customers instantly',
      'Segment audience by behavior, purchase history, and engagement',
      'Auto-detect language and send personalized messages',
      'A/B test subject lines and messaging automatically',
      'Track delivery rate, read rate, and response rate per campaign',
      'Generate follow-up sequences automatically',
      'Respect TRAI DND compliance automatically',
      'Generate campaign performance report with ROI metrics',
    ],
    builtInSkills: [
      'WhatsApp Broadcaster',
      'Audience Segmenter',
      'Campaign Tracker',
      'Response Manager',
    ],
    credentialsRequired: ['WhatsApp Business Number (+91...)'],
    indianSpecific: [
      'WhatsApp as primary channel',
      'Hindi/Hinglish campaign support',
      'TRAI compliance built-in',
      'Indian timezone handling',
    ],
    costPerMonth: { inr: 2999, usd: 35 },
    bestFor: 'D2C brands, e-commerce, consumer businesses',
    implementation:
      'Multi-agent: Segment audience → Personalize message → Send broadcast → Track delivery → Manage responses → Report metrics.',
  },

  'stock-sentinel': {
    id: 'stock-sentinel',
    valueProposition: 'Inventory reorder alert + automated supplier ordering',
    capabilities: [
      'Monitor inventory levels in real-time across multiple locations',
      'Generate reorder alerts automatically when stock falls below threshold',
      'Analyze sales velocity and predict stockout risk',
      'Auto-generate and send purchase orders to suppliers',
      'Track supplier lead times and optimize reorder timing',
      'Manage multiple SKUs across product categories',
      'Generate weekly inventory health report',
      'Prevent lost revenue from stockouts',
    ],
    builtInSkills: [
      'Inventory Monitor',
      'Reorder Alerter',
      'PO Generator',
      'Supplier Manager',
      'Analytics Reporter',
    ],
    credentialsRequired: [
      'WhatsApp Business Number (+91...)',
      'AI Model (diyaa.ai Powered or bring your own)',
    ],
    indianSpecific: [
      'WhatsApp supplier ordering',
      'Local distributor integration',
      'Regional supply chain optimization',
    ],
    costPerMonth: { inr: 3499, usd: 42 },
    bestFor: 'Pharmacy, retail, FMCG, wholesale distribution',
    implementation:
      'Multi-agent: Monitor inventory → Analyze velocity → Generate alert → Create PO → Send to supplier → Track delivery → Report.',
  },

  'patient-pulse': {
    id: 'patient-pulse',
    valueProposition: 'Patient follow-up reminders + prescription refill automation',
    capabilities: [
      'Send automatic follow-up reminders post-consultation via WhatsApp',
      'Remind patients about prescription refill dates automatically',
      'Capture patient health feedback via voice/text surveys',
      'Escalate critical health issues to doctor for immediate attention',
      'Track patient compliance with prescribed medications',
      'Generate appointment slot availability notifications',
      'Create health record summaries for doctor reference',
      'Reduce no-shows and improve patient compliance rates',
    ],
    builtInSkills: [
      'Patient Notifier',
      'Prescription Tracker',
      'Feedback Collector',
      'Health Escalator',
      'Compliance Monitor',
    ],
    credentialsRequired: [
      'WhatsApp Business Number (+91...)',
      'AI Model (diyaa.ai Powered or bring your own)',
    ],
    indianSpecific: [
      'WhatsApp-native patient communication',
      'Hindi/Hinglish health guidance',
      'Indian medication pricing integration',
      'HIPAA-compliant secure data storage',
    ],
    costPerMonth: { inr: 4999, usd: 60 },
    bestFor: 'Clinic, hospital, diagnostic center, healthcare practitioners',
    implementation:
      'Multi-agent: Send follow-up → Track prescription → Collect feedback → Escalate critical → Monitor compliance → Report outcomes.',
  },

  'resume-filter': {
    id: 'resume-filter',
    valueProposition: 'AI resume screening + automated shortlisting + ranking',
    capabilities: [
      'Screen 1000s of resumes automatically against job criteria',
      'Extract key information from unstructured resume PDFs',
      'Rank candidates by job fit using machine learning',
      'Identify red flags and inconsistencies automatically',
      'Generate shortlist with match scores and justification',
      'Schedule first-round calls with top candidates automatically',
      'Provide detailed candidate scorecard for hiring team',
      'Reduce recruiting time by 90%',
    ],
    builtInSkills: [
      'Resume Parser',
      'Candidate Scorer',
      'Fit Analyzer',
      'Call Scheduler',
      'Report Generator',
    ],
    credentialsRequired: ['AI Model (diyaa.ai Powered or bring your own)'],
    indianSpecific: [
      'Handle Indian CV formats and institutions',
      'Support Hindi resume parsing',
      'Indian salary range context',
    ],
    costPerMonth: { inr: 3499, usd: 42 },
    bestFor: 'HR departments, recruitment agencies, tech companies',
    implementation:
      'Multi-agent: Receive resumes → Parse content → Score fit → Analyze patterns → Shortlist → Schedule calls → Report.',
  },

  'social-sched': {
    id: 'social-sched',
    valueProposition: 'Social media calendar + multi-platform publisher + analytics',
    capabilities: [
      'Plan and schedule content across Instagram, Twitter, LinkedIn, Facebook',
      'Auto-optimize post timing for maximum engagement per platform',
      'Generate social media content ideas from your business updates',
      'Monitor comments and mentions across all platforms in one inbox',
      'Auto-respond to common questions with brand-voice matching',
      'Track engagement metrics and generate performance reports',
      'A/B test post variations and auto-publish winners',
      'Maintain consistent posting schedule across all channels',
    ],
    builtInSkills: [
      'Content Scheduler',
      'Multi-Platform Publisher',
      'Engagement Monitor',
      'Analytics Tracker',
      'Content Generator',
    ],
    credentialsRequired: ['AI Model (diyaa.ai Powered or bring your own)'],
    indianSpecific: [
      'Local trending hashtags detection',
      'Hindi/Hinglish content generation',
      'Indian influencer partnership tracking',
    ],
    costPerMonth: { inr: 2999, usd: 35 },
    bestFor: 'Agency, D2C brand, content creator, influencer',
    implementation:
      'Multi-agent: Plan content → Optimize timing → Generate ideas → Publish → Monitor → Respond → Analyze → Report.',
  },

  'fee-collect': {
    id: 'fee-collect',
    valueProposition: 'Fee reminders + installment tracking + automated collections',
    capabilities: [
      'Send automatic fee due reminders via WhatsApp and email',
      'Track installment payment status in real-time',
      'Generate UPI payment links for instant fee collection',
      'Create flexible payment plans (monthly, quarterly, semester)',
      'Send automated follow-up for pending payments',
      'Generate collection report with payment trends',
      'Escalate overdue accounts for manual intervention',
      'Reduce payment follow-up time by 95%',
    ],
    builtInSkills: [
      'Fee Reminder',
      'Installment Tracker',
      'Payment Link Generator',
      'Collection Manager',
      'Report Generator',
    ],
    credentialsRequired: [
      'WhatsApp Business Number (+91...)',
      'AI Model (diyaa.ai Powered or bring your own)',
    ],
    indianSpecific: [
      'WhatsApp-first fee collection',
      'UPI payment link integration',
      'Educational institution SMS compliance',
      'Local holiday calendar awareness',
    ],
    costPerMonth: { inr: 3499, usd: 42 },
    bestFor: 'School, coaching institute, tuition center, educational organization',
    implementation:
      'Multi-agent: Create payment plan → Send reminder → Track payment → Generate link → Follow-up overdue → Escalate → Report.',
  },

  'lead-intent': {
    id: 'lead-intent',
    valueProposition:
      'AI scores every lead by buying intent so your sales team chases the right people',
    capabilities: [
      'Analyze every conversation for buying signals',
      'Score leads 1-10 based on urgency, budget, and intent',
      'Detect emotion (excited, frustrated, undecided)',
      'Identify upsell and referral opportunities',
      'Prioritize hot leads and route to sales instantly',
      'Track lead source and intent patterns over time',
      'Auto-segment leads into hot / warm / cold buckets',
    ],
    builtInSkills: ['Intent Scorer', 'Sentiment Analyzer', 'Lead Router', 'Opportunity Detector'],
    credentialsRequired: ['WhatsApp Business Number or Website Chat'],
    indianSpecific: ['Hinglish intent detection', 'WhatsApp conversation scoring'],
    costPerMonth: { inr: 2999, usd: 36 },
    bestFor: 'D2C brands, SaaS sales teams, real estate agents',
    implementation:
      'Reads every inbound message → extracts intent signals → scores 1-10 → routes hot leads to CRM/WhatsApp sales queue immediately.',
  },

  'sales-closer': {
    id: 'sales-closer',
    valueProposition: 'Handles objections, builds urgency, and closes deals while you sleep',
    capabilities: [
      'Identify and counter price, timing, and trust objections',
      'Build scarcity and urgency without being pushy',
      'Present social proof and case studies at the right moment',
      'Create personalized offers based on conversation history',
      'Send follow-up sequences for undecided prospects',
      'Track deals by stage and push stalled ones forward',
      'Escalate warm deals to human sales rep with context',
    ],
    builtInSkills: ['Objection Handler', 'Urgency Builder', 'Social Proof Engine', 'Deal Tracker'],
    credentialsRequired: ['WhatsApp Business Number', 'Product/Pricing knowledge upload'],
    indianSpecific: [
      'UPI payment link generation',
      'Festive season offer automation',
      'Hinglish sales conversations',
    ],
    costPerMonth: { inr: 3999, usd: 48 },
    bestFor: 'Consultants, SaaS startups, real estate brokers, D2C founders',
    implementation:
      'Intercepts leads from LeadCatcher → handles objections via dynamic prompts → pushes to close → sends payment link → logs outcome.',
  },

  'conversation-intel': {
    id: 'conversation-intel',
    valueProposition:
      'Understands what customers really mean — intent, emotion, and urgency in every message',
    capabilities: [
      'Classify intent: purchase, support, complaint, referral',
      'Detect customer emotion in real-time',
      'Flag urgent messages for immediate human review',
      'Identify upsell and cross-sell signals',
      'Summarize long conversation threads in 3 bullets',
      'Track sentiment trends per customer over time',
      'Alert team when VIP customer sends negative message',
    ],
    builtInSkills: [
      'Intent Classifier',
      'Emotion Detector',
      'Urgency Flagger',
      'Conversation Summarizer',
    ],
    credentialsRequired: ['WhatsApp Business or Email integration'],
    indianSpecific: ['Hinglish emotion detection', 'Festive season sentiment spikes'],
    costPerMonth: { inr: 2499, usd: 30 },
    bestFor: 'Customer success teams, support managers, e-commerce brands',
    implementation:
      'Runs on every inbound message → classifies intent + emotion → scores urgency → routes to right queue → logs insights to dashboard.',
  },

  'churn-prevention': {
    id: 'churn-prevention',
    valueProposition:
      'Detect at-risk customers before they leave and bring them back automatically',
    capabilities: [
      'Score churn risk 1-10 based on usage and engagement signals',
      'Detect "going silent" customers before they cancel',
      'Send personalized win-back messages via WhatsApp/email',
      'Offer targeted discounts or service upgrades to at-risk users',
      'Create re-engagement sequences for inactive customers',
      'Track intervention success rate over time',
      'Escalate high-value at-risk accounts to account manager',
    ],
    builtInSkills: [
      'Churn Scorer',
      'Win-back Messenger',
      'Discount Engine',
      'Re-engagement Sequencer',
    ],
    credentialsRequired: ['Customer data source (CRM/CSV upload)', 'WhatsApp Business Number'],
    indianSpecific: [
      'WhatsApp re-engagement (higher open rate than email)',
      'Subscription renewal reminders with UPI link',
    ],
    costPerMonth: { inr: 3499, usd: 42 },
    bestFor: 'SaaS companies, gyms, subscription boxes, coaching programs',
    implementation:
      'Daily scan of customer activity → churn risk scoring → automated win-back trigger → personalized offer → response tracking.',
  },

  'revenue-forecaster': {
    id: 'revenue-forecaster',
    valueProposition:
      'Predict your revenue and cash flow 90 days out so you can plan with confidence',
    capabilities: [
      'Forecast revenue for next 30, 60, and 90 days',
      'Identify best and worst case scenarios with confidence scores',
      'Track pipeline health and conversion rate trends',
      'Alert on cash flow gaps before they become crises',
      'Break down revenue by product, channel, and customer segment',
      'Compare actual vs forecast and explain variance',
      'Generate weekly revenue outlook report automatically',
    ],
    builtInSkills: [
      'Revenue Modeler',
      'Pipeline Analyzer',
      'Cash Flow Tracker',
      'Variance Explainer',
    ],
    credentialsRequired: ['Sales/CRM data (CSV or integration)', 'Historical revenue data'],
    indianSpecific: [
      'GST-inclusive revenue reporting',
      'INR-denominated forecasts',
      'Quarterly advance tax planning',
    ],
    costPerMonth: { inr: 3999, usd: 48 },
    bestFor: 'Founders, CFOs, sales managers, growing SMBs',
    implementation:
      'Ingests pipeline + historical data → applies ML forecasting → generates weekly report → sends alert on anomaly detection.',
  },

  'lifetime-value': {
    id: 'lifetime-value',
    valueProposition: 'Identify your highest-value customers early and treat them differently',
    capabilities: [
      'Calculate predicted lifetime value for every customer',
      'Segment customers by LTV tier (VIP / Growth / Standard)',
      'Trigger VIP treatment flows for high-LTV accounts',
      'Identify low-LTV customers draining support resources',
      'Recommend upsell timing based on LTV trajectory',
      'Track LTV changes after campaigns or price changes',
      'Alert when a high-LTV customer shows churn signals',
    ],
    builtInSkills: ['LTV Calculator', 'Customer Segmenter', 'VIP Flow Trigger', 'Upsell Timer'],
    credentialsRequired: ['Transaction history (CSV or CRM)', 'Customer contact data'],
    indianSpecific: [
      'Festival purchase pattern recognition',
      'Referral-driven LTV multiplier tracking',
    ],
    costPerMonth: { inr: 2999, usd: 36 },
    bestFor: 'E-commerce brands, SaaS companies, subscription services',
    implementation:
      'Pulls transaction data → computes LTV score → segments into tiers → triggers VIP flows → monitors for churn signals in VIP segment.',
  },

  'email-automator': {
    id: 'email-automator',
    valueProposition: 'Automated email sequences for every stage of the customer journey',
    capabilities: [
      'Write and send personalized onboarding email sequences',
      'Trigger follow-up emails based on customer behavior',
      'Create drip campaigns for leads who are not ready to buy',
      'Send re-engagement sequences to dormant subscribers',
      'A/B test subject lines and report winning variants',
      'Handle reply parsing and route responses to right team',
      'Track open rates, click rates, and conversion per sequence',
    ],
    builtInSkills: ['Sequence Builder', 'Behavior Trigger', 'Reply Parser', 'A/B Tester'],
    credentialsRequired: ['Resend API Key (email sending)', 'Customer list (CSV or CRM sync)'],
    indianSpecific: [
      'Hinglish email templates',
      'Festival greeting sequences',
      'UPI payment link in emails',
    ],
    costPerMonth: { inr: 2499, usd: 30 },
    bestFor: 'Marketers, SaaS onboarding teams, e-commerce brands, coaches',
    implementation:
      'Customer action triggers sequence → personalized email generated → sent via Resend → reply parsed → next step triggered → stats logged.',
  },

  'decision-copilot': {
    id: 'decision-copilot',
    valueProposition:
      'Every morning, your top 3 most important business decisions — explained and ready to act',
    capabilities: [
      'Analyze sales, ops, and finance data overnight',
      'Surface the 3 highest-impact decisions for today',
      'Explain why each decision matters with supporting data',
      'Suggest the recommended action and expected outcome',
      'Track which decisions were acted on and their results',
      'Learn from past decisions to improve future recommendations',
      'Alert on time-sensitive decisions before the window closes',
    ],
    builtInSkills: ['Data Analyzer', 'Decision Ranker', 'Action Suggester', 'Outcome Tracker'],
    credentialsRequired: [
      'Business data source (CRM/spreadsheet/Supabase)',
      'WhatsApp or email for daily brief',
    ],
    indianSpecific: [
      'Morning WhatsApp brief (not email)',
      'Tax deadline and compliance alerts',
      'GST filing reminders',
    ],
    costPerMonth: { inr: 3499, usd: 42 },
    bestFor: 'Founders, CEOs, business owners managing multiple priorities',
    implementation:
      'Overnight data scan → priority ranking → morning WhatsApp brief → decision logging → feedback loop improves next day recommendations.',
  },

  'process-automator': {
    id: 'process-automator',
    valueProposition: 'Turn natural language into automated workflows — no code needed',
    capabilities: [
      'Convert plain English instructions into step-by-step automations',
      'Auto-execute repetitive operational tasks on schedule',
      'Connect data between tools (CRM, spreadsheet, WhatsApp)',
      'Handle conditional logic and exception cases intelligently',
      'Generate audit logs for every automated action',
      'Pause and escalate to human when uncertain',
      'Build and iterate workflows through conversation',
    ],
    builtInSkills: [
      'NL-to-Workflow Converter',
      'Task Executor',
      'Exception Handler',
      'Audit Logger',
    ],
    credentialsRequired: ['Description of your process (plain text)', 'Relevant tool integrations'],
    indianSpecific: [
      'Hindi/Hinglish workflow instructions',
      'GST workflow templates',
      'Tally/Zoho integration support',
    ],
    costPerMonth: { inr: 3999, usd: 48 },
    bestFor: 'Operations managers, admin teams, finance departments',
    implementation:
      'User describes process in plain text → AI breaks into steps → executes each step → logs audit trail → escalates edge cases to human.',
  },

  'business-insights': {
    id: 'business-insights',
    valueProposition:
      'Explains your dashboards in plain language — what happened, why, and what to do next',
    capabilities: [
      'Translate complex metrics into plain business language',
      'Identify what drove a spike or drop in key numbers',
      'Compare performance across time periods automatically',
      'Answer questions about your data conversationally',
      'Generate weekly performance summary in WhatsApp',
      'Alert on anomalies and explain their likely cause',
      'Recommend specific actions based on data patterns',
    ],
    builtInSkills: ['Metric Explainer', 'Anomaly Detector', 'Trend Comparator', 'Insight Narrator'],
    credentialsRequired: ['Data source (Google Sheets, CRM, or CSV upload)'],
    indianSpecific: [
      'INR-denominated reporting',
      'GST revenue vs net revenue breakdown',
      'Festive season performance context',
    ],
    costPerMonth: { inr: 2999, usd: 36 },
    bestFor: 'Non-technical founders, business owners, branch managers',
    implementation:
      'Connects to data source → analyzes trends → generates narrative insights → sends weekly WhatsApp summary → answers ad-hoc questions.',
  },

  'market-intel': {
    id: 'market-intel',
    valueProposition: 'Track your competitors and spot market trends before your team does',
    capabilities: [
      'Monitor competitor pricing and offer changes',
      'Track industry news and surface what matters to your business',
      'Analyze customer feedback patterns across markets',
      'Alert on competitor product launches or major moves',
      'Generate weekly competitive intelligence digest',
      'Identify gaps in the market from customer conversations',
      'Track share-of-voice trends across social platforms',
    ],
    builtInSkills: [
      'Competitor Tracker',
      'News Monitor',
      'Trend Analyzer',
      'Intel Digest Generator',
    ],
    credentialsRequired: ['List of competitors to monitor', 'Industry keywords to track'],
    indianSpecific: [
      'India-specific news sources',
      'Regional competitor tracking',
      'Flipkart/Amazon pricing monitoring',
    ],
    costPerMonth: { inr: 3499, usd: 42 },
    bestFor: 'Founders, marketing heads, product managers in competitive markets',
    implementation:
      'Daily scan of competitor sites, news, and social → pattern detection → weekly digest via WhatsApp/email → real-time alerts on major moves.',
  },

  'document-processor': {
    id: 'document-processor',
    valueProposition: 'Extract structured data from contracts, invoices, and forms instantly',
    capabilities: [
      'Parse invoices and extract vendor, amount, dates, and line items',
      'Review contracts and flag non-standard clauses automatically',
      'Extract data from filled forms and push to spreadsheet/CRM',
      'Verify documents against predefined rules or templates',
      'Handle bulk document processing without manual entry',
      'Generate summaries of long legal or financial documents',
      'Route documents to the right person based on content',
    ],
    builtInSkills: ['Invoice Parser', 'Contract Reviewer', 'Form Extractor', 'Document Router'],
    credentialsRequired: [
      'Document upload (PDF/image)',
      'Destination for extracted data (Google Sheets or email)',
    ],
    indianSpecific: [
      'GST invoice parsing',
      'PAN/Aadhaar extraction',
      'Form 16 and ITR document handling',
    ],
    costPerMonth: { inr: 3499, usd: 42 },
    bestFor: 'Finance teams, legal departments, HR, logistics companies',
    implementation:
      'Document uploaded → AI extracts structured fields → validation rules applied → data pushed to destination → flagged items escalated for review.',
  },

  'content-engine': {
    id: 'content-engine',
    valueProposition:
      'One idea → LinkedIn post, Twitter thread, Instagram caption, and WhatsApp broadcast — all done',
    capabilities: [
      'Transform one idea or URL into 4 platform-native formats',
      'Write LinkedIn long-form posts with hooks and CTA',
      'Create Twitter/X threads with numbered structure',
      'Generate Instagram captions with relevant hashtags',
      'Craft WhatsApp broadcast messages for your audience',
      'Maintain your brand voice across every platform',
      'Schedule and batch-generate a week of content in one session',
    ],
    builtInSkills: [
      'Content Transformer',
      'Platform Adapter',
      'Brand Voice Keeper',
      'Hashtag Generator',
    ],
    credentialsRequired: ['Brand voice description (1 paragraph)', 'Topic/niche description'],
    indianSpecific: [
      'Hinglish content for WhatsApp audiences',
      'Festive season content calendar',
      'LinkedIn content for Indian professional audience',
    ],
    costPerMonth: { inr: 1999, usd: 24 },
    bestFor: 'Founders, marketers, personal brand builders, agencies',
    implementation:
      'User provides 1 idea or URL → agent produces 4 platform-specific variants → review and approve → optionally schedule via connected channels.',
  },
}

/**
 * Get full details for an agent
 */
export function getAgentDetails(agentId: string): AgentDetails | undefined {
  return AGENT_DETAILS[agentId]
}

/**
 * Format credentials required for display
 */
export function formatCredentialsRequired(agentId: string): string {
  const details = getAgentDetails(agentId)
  if (!details) return ''
  return details.credentialsRequired.join(' • ')
}
