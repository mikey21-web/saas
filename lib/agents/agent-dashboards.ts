/**
 * Per-Agent Dashboard Components
 *
 * Defines which dashboard sections each agent type shows
 */

export interface DashboardMetric {
  key: string
  label: string
  format: 'number' | 'currency' | 'percent' | 'duration' | 'trend'
  description: string
}

export interface DashboardSection {
  id: string
  title: string
  component: 'stats' | 'chart' | 'table' | 'list' | 'form' | 'timeline'
  metrics?: DashboardMetric[]
  dataSource?: string
  charts?: Array<{
    id: string
    type: 'line' | 'bar' | 'pie' | 'area'
    title: string
    dataKey: string
  }>
  actions?: {
    label: string
    endpoint?: string
  }[]
}

export interface AgentDashboardConfig {
  sections: DashboardSection[]
  quickActions: Array<{
    label: string
    description: string
    icon: string
    action: string
  }>
  charts: Array<{
    id: string
    type: 'line' | 'bar' | 'pie' | 'area'
    title: string
    dataKey: string
  }>
}

/**
 * Dashboard configuration for each agent type
 */
export const AGENT_DASHBOARDS: Record<string, AgentDashboardConfig> = {
  // ============================================
  // CUSTOMER SUPPORT (WhatsApp Assistant)
  // ============================================
  customersupport: {
    sections: [
      {
        id: 'overview',
        title: 'Overview',
        component: 'stats',
        metrics: [
          {
            key: 'total_queries',
            label: 'Total Queries',
            format: 'number',
            description: 'All support queries received',
          },
          {
            key: 'resolved',
            label: 'Resolved',
            format: 'number',
            description: 'Queries fully resolved',
          },
          {
            key: 'pending',
            label: 'Pending',
            format: 'number',
            description: 'Waiting for response',
          },
          {
            key: 'avg_response_time',
            label: 'Avg Response',
            format: 'duration',
            description: 'Average time to first response',
          },
        ],
      },
      {
        id: 'sentiment',
        title: 'Customer Sentiment',
        component: 'chart',
        charts: [
          {
            id: 'sentiment-pie',
            type: 'pie',
            title: 'Sentiment Distribution',
            dataKey: 'sentiment',
          },
        ],
      },
      {
        id: 'topics',
        title: 'Top Topics',
        component: 'table',
        dataSource: 'topic_stats',
      },
      {
        id: 'recent',
        title: 'Recent Conversations',
        component: 'timeline',
        dataSource: 'recent_conversations',
      },
    ],
    quickActions: [
      {
        label: 'View Open Tickets',
        description: 'Unresolved queries needing attention',
        icon: '🎫',
        action: 'open_tickets',
      },
      {
        label: 'Update FAQs',
        description: 'Add or edit common questions',
        icon: '📝',
        action: 'edit_faqs',
      },
      {
        label: 'Escalation Rules',
        description: 'Configure when to alert humans',
        icon: '⚠️',
        action: 'escalation_settings',
      },
    ],
    charts: [
      { id: 'queries-over-time', type: 'line', title: 'Queries Over Time', dataKey: 'queries' },
      { id: 'resolution-rate', type: 'bar', title: 'Resolution Rate', dataKey: 'resolution' },
    ],
  },

  // ============================================
  // INVOICE BOT
  // ============================================
  invoicebot: {
    sections: [
      {
        id: 'overview',
        title: 'Invoice Overview',
        component: 'stats',
        metrics: [
          {
            key: 'total_invoices',
            label: 'Total Invoices',
            format: 'number',
            description: 'All invoices created',
          },
          {
            key: 'total_amount',
            label: 'Total Amount',
            format: 'currency',
            description: 'Sum of all invoices',
          },
          { key: 'paid', label: 'Paid', format: 'number', description: 'Invoices marked as paid' },
          { key: 'pending', label: 'Pending', format: 'number', description: 'Awaiting payment' },
          { key: 'overdue', label: 'Overdue', format: 'number', description: 'Past due date' },
        ],
      },
      {
        id: 'revenue',
        title: 'Revenue',
        component: 'chart',
        charts: [
          { id: 'revenue-trend', type: 'area', title: 'Revenue Trend', dataKey: 'revenue' },
          { id: 'payment-status', type: 'pie', title: 'Payment Status', dataKey: 'status' },
        ],
      },
      {
        id: 'gst',
        title: 'GST Summary',
        component: 'stats',
        metrics: [
          {
            key: 'cgst_collected',
            label: 'CGST Collected',
            format: 'currency',
            description: 'Central GST collected',
          },
          {
            key: 'sgst_collected',
            label: 'SGST Collected',
            format: 'currency',
            description: 'State GST collected',
          },
          {
            key: 'igst_collected',
            label: 'IGST Collected',
            format: 'currency',
            description: 'Integrated GST collected',
          },
        ],
      },
      {
        id: 'recent-invoices',
        title: 'Recent Invoices',
        component: 'table',
        dataSource: 'recent_invoices',
      },
    ],
    quickActions: [
      {
        label: 'Create Invoice',
        description: 'Generate a new GST invoice',
        icon: '📄',
        action: 'create_invoice',
      },
      {
        label: 'Chase Overdue',
        description: 'Send reminders to unpaid clients',
        icon: '💰',
        action: 'chase_overdue',
      },
      {
        label: 'GST Report',
        description: 'View monthly GST summary',
        icon: '📊',
        action: 'gst_report',
      },
      { label: 'Export', description: 'Download invoice reports', icon: '📥', action: 'export' },
    ],
    charts: [
      { id: 'monthly-revenue', type: 'bar', title: 'Monthly Revenue', dataKey: 'monthly' },
      { id: 'invoice-by-client', type: 'pie', title: 'By Client', dataKey: 'client' },
    ],
  },

  // ============================================
  // LEAD CATCHER
  // ============================================
  leadcatcher: {
    sections: [
      {
        id: 'overview',
        title: 'Lead Overview',
        component: 'stats',
        metrics: [
          {
            key: 'total_leads',
            label: 'Total Leads',
            format: 'number',
            description: 'All leads captured',
          },
          {
            key: 'qualified',
            label: 'Qualified',
            format: 'number',
            description: 'Leads that passed qualification',
          },
          {
            key: 'converted',
            label: 'Converted',
            format: 'number',
            description: 'Leads that became customers',
          },
          {
            key: 'conversion_rate',
            label: 'Conversion Rate',
            format: 'percent',
            description: 'Qualified to customer %',
          },
        ],
      },
      {
        id: 'pipeline',
        title: 'Lead Pipeline',
        component: 'chart',
        charts: [
          { id: 'pipeline-stages', type: 'bar', title: 'Pipeline by Stage', dataKey: 'stage' },
        ],
      },
      {
        id: 'sources',
        title: 'Lead Sources',
        component: 'chart',
        charts: [{ id: 'source-pie', type: 'pie', title: 'Sources', dataKey: 'source' }],
      },
      {
        id: 'hot-leads',
        title: 'Hot Leads',
        component: 'list',
        dataSource: 'hot_leads',
      },
    ],
    quickActions: [
      {
        label: 'View Pipeline',
        description: 'See all leads by stage',
        icon: '📊',
        action: 'view_pipeline',
      },
      {
        label: 'Send Broadcast',
        description: 'Re-engage cold leads',
        icon: '📣',
        action: 'send_broadcast',
      },
      {
        label: 'Qualification Rules',
        description: 'Edit what qualifies a lead',
        icon: '✏️',
        action: 'edit_qualification',
      },
      { label: 'Export Leads', description: 'Download lead list', icon: '📥', action: 'export' },
    ],
    charts: [
      { id: 'leads-over-time', type: 'line', title: 'Leads Over Time', dataKey: 'leads' },
      { id: 'qualification-funnel', type: 'bar', title: 'Qualification Funnel', dataKey: 'funnel' },
    ],
  },

  // ============================================
  // APPOINTMENT BOT
  // ============================================
  appointbot: {
    sections: [
      {
        id: 'overview',
        title: 'Booking Overview',
        component: 'stats',
        metrics: [
          {
            key: 'total_bookings',
            label: 'Total Bookings',
            format: 'number',
            description: 'All appointments booked',
          },
          {
            key: 'confirmed',
            label: 'Confirmed',
            format: 'number',
            description: 'Confirmed appointments',
          },
          {
            key: 'cancelled',
            label: 'Cancelled',
            format: 'number',
            description: 'Cancelled by customers',
          },
          {
            key: 'no_shows',
            label: 'No Shows',
            format: 'number',
            description: 'Missed appointments',
          },
          {
            key: 'no_show_rate',
            label: 'No-Show Rate',
            format: 'percent',
            description: '% of no-shows',
          },
        ],
      },
      {
        id: 'calendar',
        title: 'Calendar',
        component: 'timeline',
        dataSource: 'upcoming_bookings',
      },
      {
        id: 'services',
        title: 'Popular Services',
        component: 'chart',
        charts: [{ id: 'service-pie', type: 'pie', title: 'By Service', dataKey: 'service' }],
      },
      {
        id: 'revenue',
        title: 'Revenue from Bookings',
        component: 'stats',
        metrics: [
          {
            key: 'monthly_revenue',
            label: 'This Month',
            format: 'currency',
            description: 'Revenue this month',
          },
          {
            key: 'avg_booking_value',
            label: 'Avg Booking',
            format: 'currency',
            description: 'Average booking value',
          },
        ],
      },
    ],
    quickActions: [
      {
        label: 'View Calendar',
        description: 'See all appointments',
        icon: '📅',
        action: 'view_calendar',
      },
      {
        label: 'Send Reminders',
        description: 'Trigger reminder batch',
        icon: '⏰',
        action: 'send_reminders',
      },
      {
        label: 'Block Dates',
        description: 'Mark dates unavailable',
        icon: '🚫',
        action: 'block_dates',
      },
      { label: 'Add Service', description: 'Add new service', icon: '➕', action: 'add_service' },
    ],
    charts: [
      { id: 'bookings-over-time', type: 'line', title: 'Bookings Over Time', dataKey: 'bookings' },
      { id: 'daily-pattern', type: 'bar', title: 'Bookings by Day', dataKey: 'day' },
    ],
  },

  // ============================================
  // PAYMENT CHASER
  // ============================================
  paymentreminder: {
    sections: [
      {
        id: 'overview',
        title: 'Recovery Overview',
        component: 'stats',
        metrics: [
          {
            key: 'total_outstanding',
            label: 'Outstanding',
            format: 'currency',
            description: 'Total amount owed',
          },
          {
            key: 'recovered',
            label: 'Recovered',
            format: 'currency',
            description: 'Amount recovered this period',
          },
          {
            key: 'recovery_rate',
            label: 'Recovery Rate',
            format: 'percent',
            description: '% of outstanding recovered',
          },
          {
            key: 'reminders_sent',
            label: 'Reminders Sent',
            format: 'number',
            description: 'Total reminders sent',
          },
        ],
      },
      {
        id: 'aging',
        title: 'Aging Report',
        component: 'table',
        dataSource: 'aging_report',
      },
      {
        id: 'recovery',
        title: 'Recovery Trend',
        component: 'chart',
        charts: [
          { id: 'recovery-trend', type: 'area', title: 'Recovery Over Time', dataKey: 'recovery' },
        ],
      },
    ],
    quickActions: [
      {
        label: 'Add Debtor',
        description: 'Add new overdue payment',
        icon: '➕',
        action: 'add_debtor',
      },
      { label: 'Escalate', description: 'Send firm final notice', icon: '⚠️', action: 'escalate' },
      {
        label: 'View Report',
        description: 'Recovery statistics',
        icon: '📊',
        action: 'view_report',
      },
    ],
    charts: [{ id: 'outstanding-aging', type: 'bar', title: 'Aging Breakdown', dataKey: 'aging' }],
  },

  // ============================================
  // TASK MASTER
  // ============================================
  teamexecutor: {
    sections: [
      {
        id: 'overview',
        title: 'Task Overview',
        component: 'stats',
        metrics: [
          {
            key: 'total_tasks',
            label: 'Total Tasks',
            format: 'number',
            description: 'All tasks created',
          },
          { key: 'completed', label: 'Completed', format: 'number', description: 'Tasks done' },
          {
            key: 'in_progress',
            label: 'In Progress',
            format: 'number',
            description: 'Currently working on',
          },
          { key: 'overdue', label: 'Overdue', format: 'number', description: 'Past deadline' },
        ],
      },
      {
        id: 'team',
        title: 'Team Workload',
        component: 'chart',
        charts: [
          { id: 'team-load', type: 'bar', title: 'Tasks by Team Member', dataKey: 'member' },
        ],
      },
      {
        id: 'daily',
        title: "Today's Tasks",
        component: 'list',
        dataSource: 'today_tasks',
      },
    ],
    quickActions: [
      { label: 'Add Task', description: 'Create a new task', icon: '➕', action: 'add_task' },
      {
        label: 'Parse Meeting',
        description: 'Extract tasks from notes',
        icon: '📝',
        action: 'parse_meeting',
      },
      {
        label: 'Daily Report',
        description: "View today's summary",
        icon: '📊',
        action: 'daily_report',
      },
    ],
    charts: [
      { id: 'completion-trend', type: 'line', title: 'Completion Trend', dataKey: 'completion' },
    ],
  },

  // ============================================
  // REVIEW GUARD
  // ============================================
  feedbackanalyzer: {
    sections: [
      {
        id: 'overview',
        title: 'Reviews Overview',
        component: 'stats',
        metrics: [
          {
            key: 'total_reviews',
            label: 'Total Reviews',
            format: 'number',
            description: 'All reviews monitored',
          },
          {
            key: 'avg_rating',
            label: 'Avg Rating',
            format: 'number',
            description: 'Average star rating',
          },
          {
            key: 'responded',
            label: 'Responded',
            format: 'number',
            description: 'Reviews responded to',
          },
          {
            key: 'pending',
            label: 'Pending Response',
            format: 'number',
            description: 'Need attention',
          },
        ],
      },
      {
        id: 'sentiment',
        title: 'Sentiment',
        component: 'chart',
        charts: [
          { id: 'rating-dist', type: 'pie', title: 'Rating Distribution', dataKey: 'rating' },
        ],
      },
      {
        id: 'platforms',
        title: 'By Platform',
        component: 'table',
        dataSource: 'platform_stats',
      },
      {
        id: 'recent',
        title: 'Recent Reviews',
        component: 'timeline',
        dataSource: 'recent_reviews',
      },
    ],
    quickActions: [
      {
        label: 'Negative Reviews',
        description: 'Reviews needing urgent attention',
        icon: '⚠️',
        action: 'negative',
      },
      {
        label: 'Response Templates',
        description: 'Edit auto-response templates',
        icon: '✏️',
        action: 'templates',
      },
      {
        label: 'Request Reviews',
        description: 'Ask happy customers to review',
        icon: '⭐',
        action: 'request',
      },
    ],
    charts: [{ id: 'rating-trend', type: 'line', title: 'Rating Over Time', dataKey: 'rating' }],
  },

  // ============================================
  // DOC HARVEST
  // ============================================
  docharvest: {
    sections: [
      {
        id: 'overview',
        title: 'Documents Overview',
        component: 'stats',
        metrics: [
          {
            key: 'requested',
            label: 'Requested',
            format: 'number',
            description: 'Documents requested',
          },
          {
            key: 'received',
            label: 'Received',
            format: 'number',
            description: 'Documents collected',
          },
          {
            key: 'pending',
            label: 'Pending',
            format: 'number',
            description: 'Awaiting submission',
          },
          {
            key: 'completion_rate',
            label: 'Completion',
            format: 'percent',
            description: '% of docs received',
          },
        ],
      },
      {
        id: 'by-type',
        title: 'By Document Type',
        component: 'chart',
        charts: [{ id: 'doc-type-pie', type: 'pie', title: 'By Type', dataKey: 'type' }],
      },
      {
        id: 'pending',
        title: 'Pending Submissions',
        component: 'list',
        dataSource: 'pending_docs',
      },
    ],
    quickActions: [
      {
        label: 'Request Docs',
        description: 'Send document request',
        icon: '📤',
        action: 'request_docs',
      },
      {
        label: 'View Pending',
        description: "Clients who haven't submitted",
        icon: '⏳',
        action: 'view_pending',
      },
      {
        label: 'Edit Checklist',
        description: 'Update required documents',
        icon: '✏️',
        action: 'edit_checklist',
      },
    ],
    charts: [
      {
        id: 'collection-trend',
        type: 'line',
        title: 'Collection Over Time',
        dataKey: 'collection',
      },
    ],
  },

  // ============================================
  // CONTENT ENGINE
  // ============================================
  contentengine: {
    sections: [
      {
        id: 'overview',
        title: 'Content Overview',
        component: 'stats',
        metrics: [
          {
            key: 'total_posts',
            label: 'Total Posts',
            format: 'number',
            description: 'Content created',
          },
          {
            key: 'published',
            label: 'Published',
            format: 'number',
            description: 'Posts published',
          },
          {
            key: 'scheduled',
            label: 'Scheduled',
            format: 'number',
            description: 'Awaiting publish',
          },
        ],
      },
      {
        id: 'performance',
        title: 'Performance',
        component: 'chart',
        charts: [
          { id: 'engagement', type: 'line', title: 'Engagement Over Time', dataKey: 'engagement' },
        ],
      },
      {
        id: 'calendar',
        title: 'Content Calendar',
        component: 'timeline',
        dataSource: 'scheduled_content',
      },
    ],
    quickActions: [
      {
        label: 'Create Content',
        description: 'Generate new content',
        icon: '✨',
        action: 'create',
      },
      { label: 'Schedule Post', description: 'Schedule for later', icon: '📅', action: 'schedule' },
      { label: 'View Calendar', description: 'Content schedule', icon: '📆', action: 'calendar' },
    ],
    charts: [{ id: 'content-by-platform', type: 'bar', title: 'By Platform', dataKey: 'platform' }],
  },

  // ============================================
  // DEFAULT FALLBACK
  // ============================================
  default: {
    sections: [
      {
        id: 'overview',
        title: 'Overview',
        component: 'stats',
        metrics: [
          { key: 'total', label: 'Total', format: 'number', description: 'Total activities' },
          { key: 'today', label: 'Today', format: 'number', description: 'Activities today' },
        ],
      },
      {
        id: 'recent',
        title: 'Recent Activity',
        component: 'timeline',
        dataSource: 'recent',
      },
    ],
    quickActions: [],
    charts: [],
  },

  // ============================================
  // AI CMO
  // ============================================
  'ai-cmo': {
    sections: [
      {
        id: 'overview',
        title: 'Brand Intelligence',
        component: 'stats',
        metrics: [
          { key: 'sites_analyzed', label: 'Sites Analyzed', format: 'number', description: 'Websites scraped and analyzed' },
          { key: 'content_pieces', label: 'Content Created', format: 'number', description: 'Total pieces generated' },
          { key: 'runs_today', label: 'Today', format: 'number', description: 'Runs today' },
          { key: 'success_rate', label: 'Success Rate', format: 'percent', description: 'Successful analyses' },
        ],
        dataSource: 'agent_executions',
      },
    ],
    quickActions: [
      { label: 'Analyze my brand', description: 'Scrape website & extract brand identity', icon: '🔍', action: 'Analyze my website and extract my complete brand profile including tone, voice, and content pillars' },
      { label: 'Write a LinkedIn post', description: 'Content in your exact brand voice', icon: '💼', action: 'Write a LinkedIn post in my brand voice based on my website' },
      { label: 'Write a Twitter thread', description: 'Thread that sounds like you', icon: '🐦', action: 'Write a 5-tweet Twitter thread in my brand voice' },
      { label: 'Build content strategy', description: 'Full 1-month content plan', icon: '📅', action: 'Build a complete 1-month content marketing strategy based on my website and brand' },
      { label: 'Analyze competitor', description: 'Scrape a competitor site', icon: '🕵️', action: 'Analyze this competitor website and compare their brand positioning to mine: ' },
      { label: 'Content calendar', description: 'Plan posts for this week', icon: '🗓️', action: 'Create a content calendar for this week based on my brand pillars' },
    ],
    charts: [],
  },

  // ============================================
  // SOCIAL MEDIA MANAGER
  // ============================================
  'social-media-manager': {
    sections: [
      {
        id: 'overview',
        title: 'Overview',
        component: 'stats',
        metrics: [
          { key: 'posts_created', label: 'Posts Created', format: 'number', description: 'Total posts generated this month' },
          { key: 'platforms', label: 'Platforms Active', format: 'number', description: 'LinkedIn, Twitter/X, etc.' },
          { key: 'runs_today', label: 'Runs Today', format: 'number', description: 'Agent executions today' },
          { key: 'success_rate', label: 'Success Rate', format: 'percent', description: 'Successful runs vs total' },
        ],
        dataSource: 'agent_executions',
      },
    ],
    quickActions: [
      { label: 'Generate this week\'s posts', description: 'Create 5 posts for LinkedIn and Twitter/X', icon: '✍️', action: 'Generate 5 posts for this week based on my content pillars' },
      { label: 'Write a LinkedIn post', description: 'Generate a single LinkedIn post now', icon: '💼', action: 'Write a LinkedIn post about our latest landing page case study' },
      { label: 'Write a Twitter/X thread', description: 'Generate a Twitter thread', icon: '🐦', action: 'Write a 5-tweet thread about conversion psychology tips' },
      { label: 'Plan content calendar', description: 'Plan posts for next 2 weeks', icon: '📅', action: 'Plan a 2-week content calendar for LinkedIn and Twitter/X' },
      { label: 'Analyze best content type', description: 'Which pillar performs best', icon: '📊', action: 'Analyze which content pillar drives the most engagement for landing page businesses' },
      { label: 'Generate quick win post', description: 'A quick tip post for today', icon: '⚡', action: 'Write a quick win tip post about improving landing page conversion rates' },
    ],
    charts: [
      { id: 'posts_over_time', type: 'bar', title: 'Posts Generated', dataKey: 'posts_created' },
    ],
  },

  // ============================================
  // COMPETITOR INTEL
  // ============================================
  'competitor-intel': {
    sections: [
      {
        id: 'overview',
        title: 'Intelligence Overview',
        component: 'stats',
        metrics: [
          { key: 'scans_run', label: 'Scans Run', format: 'number', description: 'Competitor scans completed' },
          { key: 'alerts_sent', label: 'Alerts Sent', format: 'number', description: 'Intelligence alerts triggered' },
          { key: 'runs_today', label: 'Today', format: 'number', description: 'Scans run today' },
          { key: 'success_rate', label: 'Success Rate', format: 'percent', description: 'Successful scans' },
        ],
        dataSource: 'agent_executions',
      },
    ],
    quickActions: [
      { label: 'Scan competitors now', description: 'Run an immediate competitor scan', icon: '🔍', action: 'Run a competitor scan and report any pricing or feature changes' },
      { label: 'Latest intelligence report', description: 'Get the most recent report', icon: '📋', action: 'Give me the latest competitor intelligence report' },
      { label: 'Check pricing changes', description: 'Any competitor price updates', icon: '💰', action: 'Have any competitors changed their pricing recently?' },
    ],
    charts: [],
  },

  // ============================================
  // SALES INTELLIGENCE
  // ============================================
  'sales-intelligence': {
    sections: [
      {
        id: 'overview',
        title: 'Pipeline Overview',
        component: 'stats',
        metrics: [
          { key: 'analyses_run', label: 'Analyses Run', format: 'number', description: 'Deal analyses completed' },
          { key: 'at_risk', label: 'At Risk Deals', format: 'number', description: 'Deals flagged as at risk' },
          { key: 'runs_today', label: 'Today', format: 'number', description: 'Analyses run today' },
          { key: 'success_rate', label: 'Success Rate', format: 'percent', description: 'Successful analyses' },
        ],
        dataSource: 'agent_executions',
      },
    ],
    quickActions: [
      { label: 'Analyze pipeline', description: 'Get current pipeline health', icon: '📊', action: 'Analyze my current sales pipeline and flag any at-risk deals' },
      { label: 'Revenue forecast', description: '90-day revenue prediction', icon: '📈', action: 'Generate a 90-day revenue forecast based on current pipeline' },
      { label: 'Deal risk report', description: 'Which deals need attention', icon: '⚠️', action: 'Which deals are at risk of going cold and what should I do?' },
    ],
    charts: [],
  },

  // ============================================
  // CONTENT MARKETING
  // ============================================
  'content-marketing': {
    sections: [
      {
        id: 'overview',
        title: 'Content Overview',
        component: 'stats',
        metrics: [
          { key: 'pieces_created', label: 'Content Created', format: 'number', description: 'Total content pieces generated' },
          { key: 'runs_today', label: 'Today', format: 'number', description: 'Content runs today' },
          { key: 'success_rate', label: 'Success Rate', format: 'percent', description: 'Successful generations' },
          { key: 'avg_duration', label: 'Avg Time', format: 'duration', description: 'Avg time to generate content' },
        ],
        dataSource: 'agent_executions',
      },
    ],
    quickActions: [
      { label: 'Write a blog post', description: 'Generate SEO-optimized blog content', icon: '✍️', action: 'Write a 1000-word SEO blog post about landing page conversion optimization' },
      { label: 'Create email newsletter', description: 'Draft this week\'s email', icon: '📧', action: 'Write an email newsletter for this week about conversion rate optimization tips' },
      { label: 'Research trending topics', description: 'Find what to write about', icon: '🔍', action: 'Research trending topics in landing page optimization and conversion for this week' },
    ],
    charts: [],
  },

  // ============================================
  // E-COMMERCE OPS
  // ============================================
  ecommerce: {
    sections: [
      {
        id: 'overview',
        title: 'Operations Overview',
        component: 'stats',
        metrics: [
          { key: 'orders_processed', label: 'Orders Processed', format: 'number', description: 'Total orders handled' },
          { key: 'runs_today', label: 'Today', format: 'number', description: 'Operations run today' },
          { key: 'success_rate', label: 'Success Rate', format: 'percent', description: 'Successful operations' },
          { key: 'avg_duration', label: 'Avg Time', format: 'duration', description: 'Avg processing time' },
        ],
        dataSource: 'agent_executions',
      },
    ],
    quickActions: [
      { label: 'Check inventory status', description: 'See low stock alerts', icon: '📦', action: 'Check inventory status and list any items below reorder threshold' },
      { label: 'Today\'s orders summary', description: 'Get today\'s order count and revenue', icon: '🛒', action: 'Give me a summary of today\'s orders, revenue, and any issues' },
      { label: 'Process pending returns', description: 'Handle open return requests', icon: '↩️', action: 'Show me any pending return requests that need to be processed' },
    ],
    charts: [],
  },
}

/**
 * Get dashboard config for an agent type
 */
export function getAgentDashboard(agentType: string): AgentDashboardConfig {
  return AGENT_DASHBOARDS[agentType] || AGENT_DASHBOARDS['default']
}

/**
 * Get all agent types that have custom dashboards
 */
export function getAgentTypesWithDashboards(): string[] {
  return Object.keys(AGENT_DASHBOARDS).filter((k) => k !== 'default')
}
