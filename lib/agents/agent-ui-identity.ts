export interface AgentUIIdentity {
  /** Hex accent color unique to this agent */
  accent: string
  /** Hex light bg tint (accent at ~10% opacity) */
  accentBg: string
  /** Short role tagline shown under name */
  tagline: string
  /** What this agent does in one line */
  roleDescription: string
  /** Tabs relevant to this agent (ordered) */
  tabs: Array<'chat' | 'dashboard' | 'settings' | 'sequences' | 'inbox' | 'contacts'>
  /** Dashboard metric cards */
  metrics: Array<{
    label: string
    key: 'total' | 'successful' | 'today' | 'avgDuration'
    format?: 'number' | 'duration' | 'percent'
    description: string
  }>
  /** Quick action buttons shown on dashboard */
  quickActions: Array<{ label: string; description: string }>
  /** Emoji icon (fallback if agent.icon not set) */
  defaultIcon: string
}

const AGENT_UI_IDENTITY: Record<string, AgentUIIdentity> = {
  leadcatcher: {
    accent: '#f59e0b',
    accentBg: 'rgba(245,158,11,0.1)',
    tagline: 'Lead Capture & Qualification',
    roleDescription:
      'Captures leads from WhatsApp, qualifies them with smart questions, and follows up automatically',
    tabs: ['dashboard', 'chat', 'inbox', 'contacts', 'sequences', 'settings'],
    defaultIcon: '🎯',
    metrics: [
      {
        label: 'Leads Captured',
        key: 'total',
        format: 'number',
        description: 'Total leads captured',
      },
      {
        label: 'Qualified Leads',
        key: 'successful',
        format: 'number',
        description: 'Leads that passed qualification',
      },
      { label: 'Captured Today', key: 'today', format: 'number', description: 'New leads today' },
      {
        label: 'Avg Response Time',
        key: 'avgDuration',
        format: 'duration',
        description: 'Time to first response',
      },
    ],
    quickActions: [
      { label: 'View Lead Pipeline', description: 'See all leads by stage' },
      { label: 'Send Broadcast', description: 'Re-engage cold leads' },
      { label: 'Edit Qualification Questions', description: 'Change what qualifies a lead' },
    ],
  },

  appointbot: {
    accent: '#3b82f6',
    accentBg: 'rgba(59,130,246,0.1)',
    tagline: 'Appointment Booking & Reminders',
    roleDescription:
      'Books appointments via WhatsApp and sends automated reminders to reduce no-shows',
    tabs: ['dashboard', 'chat', 'inbox', 'sequences', 'contacts', 'settings'],
    defaultIcon: '📅',
    metrics: [
      {
        label: 'Appointments Booked',
        key: 'total',
        format: 'number',
        description: 'Total bookings',
      },
      {
        label: 'Confirmed',
        key: 'successful',
        format: 'number',
        description: 'Confirmed appointments',
      },
      { label: 'Booked Today', key: 'today', format: 'number', description: 'Bookings made today' },
      {
        label: 'Avg Booking Time',
        key: 'avgDuration',
        format: 'duration',
        description: 'Time to complete a booking',
      },
    ],
    quickActions: [
      { label: 'View Calendar', description: 'See upcoming appointments' },
      { label: 'Send Reminders Now', description: 'Trigger reminder batch' },
      { label: 'Block Slots', description: 'Mark dates unavailable' },
    ],
  },

  invoicebot: {
    accent: '#10b981',
    accentBg: 'rgba(16,185,129,0.1)',
    tagline: 'GST Invoice & Payment Tracking',
    roleDescription:
      "Creates GST-compliant invoices, sends UPI payment links, and tracks who hasn't paid",
    tabs: ['dashboard', 'chat', 'inbox', 'sequences', 'settings'],
    defaultIcon: '🧾',
    metrics: [
      {
        label: 'Invoices Sent',
        key: 'total',
        format: 'number',
        description: 'Total invoices generated',
      },
      { label: 'Paid', key: 'successful', format: 'number', description: 'Invoices marked paid' },
      { label: 'Sent Today', key: 'today', format: 'number', description: 'Invoices sent today' },
      {
        label: 'Avg Payment Time',
        key: 'avgDuration',
        format: 'duration',
        description: 'Time from invoice to payment',
      },
    ],
    quickActions: [
      { label: 'Create Invoice', description: 'Generate a new GST invoice' },
      { label: 'Chase Overdue', description: 'Send reminders to unpaid clients' },
      { label: 'View GST Report', description: 'Monthly GST summary' },
    ],
  },

  paychaser: {
    accent: '#ef4444',
    accentBg: 'rgba(239,68,68,0.1)',
    tagline: 'Payment Recovery & Reminders',
    roleDescription:
      'Chases overdue payments with automated WhatsApp reminders so you get paid faster',
    tabs: ['dashboard', 'chat', 'sequences', 'contacts', 'settings'],
    defaultIcon: '💰',
    metrics: [
      {
        label: 'Reminders Sent',
        key: 'total',
        format: 'number',
        description: 'Total payment reminders sent',
      },
      {
        label: 'Payments Recovered',
        key: 'successful',
        format: 'number',
        description: 'Overdue payments collected',
      },
      { label: 'Sent Today', key: 'today', format: 'number', description: 'Reminders sent today' },
      {
        label: 'Avg Recovery Time',
        key: 'avgDuration',
        format: 'duration',
        description: 'Time to recover payment',
      },
    ],
    quickActions: [
      { label: 'Add Overdue List', description: 'Upload list of debtors' },
      { label: 'Escalate Reminders', description: 'Send firm final notice' },
      { label: 'View Recovery Report', description: "What's collected vs pending" },
    ],
  },

  customersupport: {
    accent: '#8b5cf6',
    accentBg: 'rgba(139,92,246,0.1)',
    tagline: '24/7 Customer Support',
    roleDescription:
      'Handles FAQs, complaints, and queries round the clock across WhatsApp, email, and phone',
    tabs: ['chat', 'dashboard', 'inbox', 'contacts', 'sequences', 'settings'],
    defaultIcon: '🤝',
    metrics: [
      {
        label: 'Queries Handled',
        key: 'total',
        format: 'number',
        description: 'Total support queries',
      },
      {
        label: 'Resolved',
        key: 'successful',
        format: 'number',
        description: 'Queries fully resolved',
      },
      {
        label: 'Handled Today',
        key: 'today',
        format: 'number',
        description: 'Support queries today',
      },
      {
        label: 'Avg Resolution Time',
        key: 'avgDuration',
        format: 'duration',
        description: 'Time to resolve a query',
      },
    ],
    quickActions: [
      { label: 'View Open Tickets', description: 'Unresolved queries' },
      { label: 'Update FAQs', description: 'Add new common questions' },
      { label: 'Escalation Rules', description: 'When to alert a human' },
    ],
  },

  reviewguard: {
    accent: '#f59e0b',
    accentBg: 'rgba(245,158,11,0.1)',
    tagline: 'Review Monitoring & Response',
    roleDescription:
      'Monitors reviews on Google, Zomato, and other platforms and auto-responds to protect your reputation',
    tabs: ['dashboard', 'chat', 'inbox', 'settings'],
    defaultIcon: '⭐',
    metrics: [
      {
        label: 'Reviews Monitored',
        key: 'total',
        format: 'number',
        description: 'Total reviews tracked',
      },
      {
        label: 'Responded',
        key: 'successful',
        format: 'number',
        description: 'Reviews responded to',
      },
      { label: 'New Today', key: 'today', format: 'number', description: 'New reviews today' },
      {
        label: 'Avg Response Time',
        key: 'avgDuration',
        format: 'duration',
        description: 'Time to respond to a review',
      },
    ],
    quickActions: [
      { label: 'See Negative Reviews', description: 'Reviews needing urgent attention' },
      { label: 'Edit Response Templates', description: 'Customize auto-response tone' },
      { label: 'Request Reviews', description: 'Ask happy customers to review' },
    ],
  },

  whatsblast: {
    accent: '#25d366',
    accentBg: 'rgba(37,211,102,0.1)',
    tagline: 'WhatsApp Broadcast Campaigns',
    roleDescription:
      'Sends bulk WhatsApp campaigns to segmented customer lists — offers, updates, event invites',
    tabs: ['dashboard', 'chat', 'sequences', 'contacts', 'settings'],
    defaultIcon: '📣',
    metrics: [
      {
        label: 'Messages Sent',
        key: 'total',
        format: 'number',
        description: 'Total broadcast messages sent',
      },
      {
        label: 'Delivered',
        key: 'successful',
        format: 'number',
        description: 'Messages delivered',
      },
      { label: 'Sent Today', key: 'today', format: 'number', description: 'Messages sent today' },
      {
        label: 'Avg Send Time',
        key: 'avgDuration',
        format: 'duration',
        description: 'Time to send campaign batch',
      },
    ],
    quickActions: [
      { label: 'New Campaign', description: 'Create a broadcast' },
      { label: 'Manage Segments', description: 'Edit customer groups' },
      { label: 'View Delivery Report', description: 'Sent / delivered / read stats' },
    ],
  },

  docharvest: {
    accent: '#0ea5e9',
    accentBg: 'rgba(14,165,233,0.1)',
    tagline: 'Document Collection Automation',
    roleDescription:
      'Requests, collects, and organizes client documents like Aadhaar, PAN, and forms via WhatsApp',
    tabs: ['dashboard', 'chat', 'inbox', 'contacts', 'settings'],
    defaultIcon: '📎',
    metrics: [
      {
        label: 'Docs Requested',
        key: 'total',
        format: 'number',
        description: 'Total document requests sent',
      },
      {
        label: 'Docs Received',
        key: 'successful',
        format: 'number',
        description: 'Documents successfully collected',
      },
      {
        label: 'Requested Today',
        key: 'today',
        format: 'number',
        description: 'New requests today',
      },
      {
        label: 'Avg Collection Time',
        key: 'avgDuration',
        format: 'duration',
        description: 'Time to collect a doc',
      },
    ],
    quickActions: [
      { label: 'Request Documents', description: 'Send doc request to a client' },
      { label: 'View Pending', description: "Clients who haven't submitted" },
      { label: 'Edit Checklist', description: 'Update required document list' },
    ],
  },

  nurturebot: {
    accent: '#ec4899',
    accentBg: 'rgba(236,72,153,0.1)',
    tagline: 'Lead Nurturing Drip Sequences',
    roleDescription:
      "Runs automated drip sequences to warm up cold leads until they're ready to buy",
    tabs: ['dashboard', 'sequences', 'contacts', 'chat', 'settings'],
    defaultIcon: '🌱',
    metrics: [
      {
        label: 'In Sequence',
        key: 'total',
        format: 'number',
        description: 'Leads currently in nurture flow',
      },
      {
        label: 'Converted',
        key: 'successful',
        format: 'number',
        description: 'Leads that became customers',
      },
      {
        label: 'Added Today',
        key: 'today',
        format: 'number',
        description: 'New leads added today',
      },
      {
        label: 'Avg Conversion Time',
        key: 'avgDuration',
        format: 'duration',
        description: 'Time to convert a lead',
      },
    ],
    quickActions: [
      { label: 'Add Leads to Drip', description: 'Start nurturing new leads' },
      { label: 'Edit Sequence', description: 'Change drip messages/timing' },
      { label: 'View Conversion Funnel', description: 'See where leads drop off' },
    ],
  },

  patientpulse: {
    accent: '#06b6d4',
    accentBg: 'rgba(6,182,212,0.1)',
    tagline: 'Patient Follow-up & Reminders',
    roleDescription: 'Follows up with patients, sends prescription reminders, and reduces no-shows',
    tabs: ['dashboard', 'chat', 'inbox', 'contacts', 'sequences', 'settings'],
    defaultIcon: '🏥',
    metrics: [
      {
        label: 'Patients Followed Up',
        key: 'total',
        format: 'number',
        description: 'Total follow-up messages sent',
      },
      {
        label: 'Responded',
        key: 'successful',
        format: 'number',
        description: 'Patients who responded',
      },
      {
        label: 'Followed Up Today',
        key: 'today',
        format: 'number',
        description: 'Follow-ups sent today',
      },
      {
        label: 'Avg Response Time',
        key: 'avgDuration',
        format: 'duration',
        description: 'Time to patient reply',
      },
    ],
    quickActions: [
      { label: 'Send Prescription Reminder', description: 'Remind patient about medicines' },
      { label: 'Schedule Follow-up', description: 'Book post-treatment check' },
      { label: 'No-Show List', description: 'Patients who missed appointment' },
    ],
  },

  stocksentinel: {
    accent: '#f97316',
    accentBg: 'rgba(249,115,22,0.1)',
    tagline: 'Inventory Monitoring & Alerts',
    roleDescription:
      'Monitors stock levels and alerts you before you run out, then auto-triggers reorder',
    tabs: ['dashboard', 'chat', 'sequences', 'settings'],
    defaultIcon: '📦',
    metrics: [
      {
        label: 'Alerts Sent',
        key: 'total',
        format: 'number',
        description: 'Total stock alerts triggered',
      },
      {
        label: 'Reorders Triggered',
        key: 'successful',
        format: 'number',
        description: 'Items that were reordered',
      },
      {
        label: 'Alerts Today',
        key: 'today',
        format: 'number',
        description: 'Alerts triggered today',
      },
      {
        label: 'Avg Alert Delay',
        key: 'avgDuration',
        format: 'duration',
        description: 'Detection to alert time',
      },
    ],
    quickActions: [
      { label: 'Check Stock Levels', description: 'View current inventory' },
      { label: 'Update Thresholds', description: 'Change reorder trigger points' },
      { label: 'Low Stock Report', description: 'Items below safety stock' },
    ],
  },

  resumefilter: {
    accent: '#6366f1',
    accentBg: 'rgba(99,102,241,0.1)',
    tagline: 'AI Resume Screening',
    roleDescription:
      'Screens resumes, shortlists candidates using your criteria, and schedules interviews automatically',
    tabs: ['dashboard', 'chat', 'inbox', 'contacts', 'settings'],
    defaultIcon: '🎓',
    metrics: [
      {
        label: 'Resumes Screened',
        key: 'total',
        format: 'number',
        description: 'Total resumes processed',
      },
      {
        label: 'Shortlisted',
        key: 'successful',
        format: 'number',
        description: 'Candidates shortlisted',
      },
      {
        label: 'Screened Today',
        key: 'today',
        format: 'number',
        description: 'Resumes screened today',
      },
      {
        label: 'Avg Screening Time',
        key: 'avgDuration',
        format: 'duration',
        description: 'Time per resume',
      },
    ],
    quickActions: [
      { label: 'Upload Resumes', description: 'Bulk-screen a batch' },
      { label: 'View Shortlist', description: 'See qualified candidates' },
      { label: 'Edit Criteria', description: 'Update must-have requirements' },
    ],
  },

  socialsched: {
    accent: '#a855f7',
    accentBg: 'rgba(168,85,247,0.1)',
    tagline: 'Social Media Content & Scheduling',
    roleDescription:
      'Plans, writes, and schedules your social media content calendar automatically',
    tabs: ['dashboard', 'chat', 'sequences', 'settings'],
    defaultIcon: '📱',
    metrics: [
      {
        label: 'Posts Created',
        key: 'total',
        format: 'number',
        description: 'Total posts generated',
      },
      {
        label: 'Posts Published',
        key: 'successful',
        format: 'number',
        description: 'Posts successfully scheduled',
      },
      {
        label: 'Created Today',
        key: 'today',
        format: 'number',
        description: 'New posts created today',
      },
      {
        label: 'Avg Creation Time',
        key: 'avgDuration',
        format: 'duration',
        description: 'Time to create a post',
      },
    ],
    quickActions: [
      { label: 'Generate Post', description: 'Create content for today' },
      { label: 'View Content Calendar', description: 'See scheduled posts' },
      { label: 'Edit Brand Voice', description: 'Update tone and style' },
    ],
  },

  feecollect: {
    accent: '#14b8a6',
    accentBg: 'rgba(20,184,166,0.1)',
    tagline: 'Fee Collection & Tracking',
    roleDescription:
      'Tracks fee dues, sends payment reminders, and manages installments for schools, gyms, and coaching',
    tabs: ['dashboard', 'chat', 'sequences', 'contacts', 'settings'],
    defaultIcon: '🎒',
    metrics: [
      {
        label: 'Fee Reminders Sent',
        key: 'total',
        format: 'number',
        description: 'Total fee reminders sent',
      },
      {
        label: 'Fees Collected',
        key: 'successful',
        format: 'number',
        description: 'Payments confirmed',
      },
      { label: 'Sent Today', key: 'today', format: 'number', description: 'Reminders sent today' },
      {
        label: 'Avg Collection Time',
        key: 'avgDuration',
        format: 'duration',
        description: 'Time to collect fee',
      },
    ],
    quickActions: [
      { label: 'View Due List', description: 'Students/members with pending fees' },
      { label: 'Send Bulk Reminder', description: 'Alert all pending payers' },
      { label: 'Fee Structure', description: 'Edit fee plans & installments' },
    ],
  },

  contentengine: {
    accent: '#e879f9',
    accentBg: 'rgba(232,121,249,0.1)',
    tagline: 'AI Content Generation',
    roleDescription:
      'Generates blog posts, email newsletters, product descriptions, and social captions on autopilot',
    tabs: ['dashboard', 'chat', 'sequences', 'settings'],
    defaultIcon: '✍️',
    metrics: [
      {
        label: 'Content Pieces',
        key: 'total',
        format: 'number',
        description: 'Total content generated',
      },
      {
        label: 'Published',
        key: 'successful',
        format: 'number',
        description: 'Content pieces used/published',
      },
      {
        label: 'Generated Today',
        key: 'today',
        format: 'number',
        description: 'New content today',
      },
      {
        label: 'Avg Generation Time',
        key: 'avgDuration',
        format: 'duration',
        description: 'Time to generate a piece',
      },
    ],
    quickActions: [
      { label: 'Generate Blog Post', description: 'Write a full article' },
      { label: 'Email Newsletter', description: "Create this week's newsletter" },
      { label: 'Edit Brand Voice', description: 'Update tone and keywords' },
    ],
  },
}

export function getAgentUIIdentity(agentType: string): AgentUIIdentity {
  const key = agentType.toLowerCase().replace(/[-_\s]/g, '')
  return (
    AGENT_UI_IDENTITY[key] || {
      accent: '#e879f9',
      accentBg: 'rgba(232,121,249,0.1)',
      tagline: 'AI Business Automation',
      roleDescription: 'Automates business tasks via WhatsApp and other channels',
      tabs: ['chat', 'dashboard', 'settings', 'sequences', 'inbox', 'contacts'],
      defaultIcon: '🤖',
      metrics: [
        { label: 'Total Runs', key: 'total', format: 'number', description: 'Total executions' },
        {
          label: 'Successful',
          key: 'successful',
          format: 'number',
          description: 'Successful runs',
        },
        { label: 'Today', key: 'today', format: 'number', description: 'Runs today' },
        {
          label: 'Avg Duration',
          key: 'avgDuration',
          format: 'duration',
          description: 'Average response time',
        },
      ],
      quickActions: [],
    }
  )
}
