/**
 * Per-Agent Onboarding Configuration
 *
 * Defines what questions each agent asks during setup,
 * what credentials they need, and what features their dashboard shows.
 */

export interface OnboardingQuestion {
  id: string
  question: string
  placeholder?: string
  type: 'text' | 'textarea' | 'select' | 'url' | 'phone' | 'number'
  options?: string[]
  required: boolean
  description?: string
}

export interface AgentOnboardingConfig {
  steps: {
    id: string
    title: string
    description: string
    questions: OnboardingQuestion[]
  }[]
  credentials: {
    required: Array<{
      field:
        | 'whatsapp_number'
        | 'website_url'
        | 'openai_api_key'
        | 'groq_api_key'
        | 'gstin'
        | 'razorpay_key'
        | 'google_sheets'
        | 'exotel_number'
        | 'resend_domain'
        | 'use_diyaa_ai_powered'
        | 'upi_id'
      label: string
      description: string
    }>
    optional: Array<{
      field: string
      label: string
      description: string
    }>
  }
  features: {
    chat: boolean
    dashboard: boolean
    inbox: boolean
    contacts: boolean
    sequences: boolean
    documents: boolean
    invoices: boolean
    calendar: boolean
  }
}

/**
 * Onboarding configuration for each agent type
 */
export const AGENT_ONBOARDING: Record<string, AgentOnboardingConfig> = {
  // ============================================
  // WHATSAPP ASSISTANT (CustomerSupport)
  // ============================================
  customersupport: {
    steps: [
      {
        id: 'business-info',
        title: 'Business Information',
        description: 'Tell us about your business',
        questions: [
          {
            id: 'business_name',
            question: 'What is your business name?',
            placeholder: 'e.g., Sharma Medical Store',
            required: true,
            type: 'text',
          },
          {
            id: 'industry',
            question: 'What industry are you in?',
            placeholder: 'e.g., Healthcare, Retail, Consulting',
            required: true,
            type: 'text',
          },
          {
            id: 'products_services',
            question: 'What products or services do you offer?',
            placeholder: 'List your main offerings',
            required: true,
            type: 'textarea',
          },
        ],
      },
      {
        id: 'faq',
        title: 'Common Questions',
        description: 'What questions do customers usually ask?',
        questions: [
          {
            id: 'common_questions',
            question: 'List 5-10 common questions customers ask',
            placeholder:
              '1. What are your working hours?\n2. Do you delivery?\n3. What are your prices?',
            required: true,
            type: 'textarea',
          },
          {
            id: 'answers',
            question: 'Write answers to these questions',
            placeholder: 'Write clear, concise answers the AI will use',
            required: true,
            type: 'textarea',
          },
        ],
      },
      {
        id: 'hours',
        title: 'Working Hours',
        description: 'When should the agent be active?',
        questions: [
          {
            id: 'active_hours',
            question: 'What are your business hours?',
            placeholder: '9:00 AM - 9:00 PM',
            required: true,
            type: 'text',
          },
          {
            id: 'timezone',
            question: 'What is your timezone?',
            options: ['IST (UTC+5:30)', 'EST (UTC-5)', 'PST (UTC-8)', 'GMT (UTC+0)'],
            required: true,
            type: 'select',
          },
          {
            id: 'response_time',
            question: 'How quickly should the agent respond?',
            options: ['Instant', 'Within 5 minutes', 'Within 1 hour'],
            required: true,
            type: 'select',
          },
        ],
      },
    ],
    credentials: {
      required: [
        {
          field: 'whatsapp_number',
          label: 'WhatsApp Business Number',
          description: 'Your WhatsApp Business phone number with country code',
        },
        {
          field: 'use_diyaa_ai_powered',
          label: 'AI Model',
          description: 'Use diyaa.ai powered or bring your own API key',
        },
      ],
      optional: [
        { field: 'website_url', label: 'Website URL', description: 'For knowledge base context' },
      ],
    },
    features: {
      chat: true,
      dashboard: true,
      inbox: true,
      contacts: true,
      sequences: false,
      documents: false,
      invoices: false,
      calendar: false,
    },
  },

  // ============================================
  // INVOICE BOT (InvoiceBot)
  // ============================================
  invoicebot: {
    steps: [
      {
        id: 'company-info',
        title: 'Company Details',
        description: 'Your business information for invoices',
        questions: [
          {
            id: 'company_name',
            question: 'What is your company name?',
            placeholder: 'e.g., Sharma Enterprises',
            required: true,
            type: 'text',
          },
          {
            id: 'company_address',
            question: 'What is your business address?',
            placeholder: 'Full address for invoice',
            required: true,
            type: 'textarea',
          },
          {
            id: 'gstin',
            question: 'What is your GSTIN?',
            placeholder: 'e.g., 07AABCU9603R1ZM',
            required: true,
            type: 'text',
            description: '15-character GST registration number',
          },
          {
            id: 'pan',
            question: 'What is your PAN?',
            placeholder: 'e.g., AABCU9603R',
            required: false,
            type: 'text',
          },
        ],
      },
      {
        id: 'banking',
        title: 'Banking Details',
        description: 'Where should payments be sent?',
        questions: [
          {
            id: 'bank_name',
            question: 'Bank name',
            placeholder: 'e.g., HDFC Bank',
            required: true,
            type: 'text',
          },
          {
            id: 'account_number',
            question: 'Account number',
            placeholder: 'Your business account number',
            required: true,
            type: 'text',
          },
          {
            id: 'ifsc',
            question: 'IFSC Code',
            placeholder: 'e.g., HDFC0001234',
            required: true,
            type: 'text',
          },
          {
            id: 'upi_id',
            question: 'UPI ID (optional)',
            placeholder: 'e.g., sharma@upi',
            required: false,
            type: 'text',
          },
        ],
      },
      {
        id: 'invoice-settings',
        title: 'Invoice Settings',
        description: 'How should invoices be generated?',
        questions: [
          {
            id: 'default_gst_rate',
            question: 'Default GST rate?',
            options: ['0%', '5%', '12%', '18%', '28%'],
            required: true,
            type: 'select',
          },
          {
            id: 'payment_terms',
            question: 'Payment terms (days)?',
            placeholder: 'e.g., 30',
            required: true,
            type: 'number',
          },
          {
            id: 'invoice_prefix',
            question: 'Invoice number prefix?',
            placeholder: 'INV',
            required: false,
            type: 'text',
          },
        ],
      },
    ],
    credentials: {
      required: [
        { field: 'razorpay_key', label: 'Razorpay Key', description: 'For creating payment links' },
        { field: 'gstin', label: 'GSTIN', description: 'For GST-compliant invoices' },
      ],
      optional: [
        {
          field: 'whatsapp_number',
          label: 'WhatsApp Number',
          description: 'To send invoices via WhatsApp',
        },
        {
          field: 'google_sheets',
          label: 'Google Sheets',
          description: 'Log all invoices to a sheet',
        },
      ],
    },
    features: {
      chat: true,
      dashboard: true,
      inbox: false,
      contacts: true,
      sequences: false,
      documents: true,
      invoices: true,
      calendar: false,
    },
  },

  // ============================================
  // LEAD CATCHER (LeadCatcher)
  // ============================================
  leadcatcher: {
    steps: [
      {
        id: 'products',
        title: 'What You Sell',
        description: 'Define your products or services',
        questions: [
          {
            id: 'products',
            question: 'What products or services do you sell?',
            placeholder: 'List your offerings',
            required: true,
            type: 'textarea',
          },
          {
            id: 'pricing',
            question: 'What are your price ranges?',
            placeholder: 'e.g., Basic ₹999, Pro ₹2499',
            required: true,
            type: 'textarea',
          },
        ],
      },
      {
        id: 'qualification',
        title: 'Lead Qualification',
        description: 'How should leads be qualified?',
        questions: [
          {
            id: 'qualification_questions',
            question: 'What questions to qualify leads?',
            placeholder:
              '1. What is your budget?\n2. When do you need it?\n3. What is your requirement?',
            required: true,
            type: 'textarea',
          },
          {
            id: 'qualification_criteria',
            question: 'What makes a lead "hot"?',
            placeholder: 'e.g., Budget > ₹10,000, Need within 1 month',
            required: true,
            type: 'textarea',
          },
        ],
      },
      {
        id: 'followup',
        title: 'Follow-up Settings',
        description: 'How to follow up with leads',
        questions: [
          {
            id: 'followup_sequence',
            question: 'Follow-up sequence?',
            placeholder: 'Day 1: Welcome, Day 3: Check in, Day 7: Offer',
            required: true,
            type: 'textarea',
          },
          {
            id: 'hot_lead_action',
            question: 'What happens when a lead is "hot"?',
            options: ['Notify via WhatsApp', 'Notify via Email', 'Add to CRM', 'Schedule callback'],
            required: true,
            type: 'select',
          },
        ],
      },
    ],
    credentials: {
      required: [
        {
          field: 'whatsapp_number',
          label: 'WhatsApp Business Number',
          description: 'To capture and respond to leads',
        },
      ],
      optional: [
        {
          field: 'website_url',
          label: 'Website URL',
          description: 'Capture leads from website chat',
        },
      ],
    },
    features: {
      chat: true,
      dashboard: true,
      inbox: true,
      contacts: true,
      sequences: true,
      documents: false,
      invoices: false,
      calendar: false,
    },
  },

  // ============================================
  // APPOINTMENT BOT (AppointBot)
  // ============================================
  appointbot: {
    steps: [
      {
        id: 'services',
        title: 'Your Services',
        description: 'What appointments do you book?',
        questions: [
          {
            id: 'services',
            question: 'What services do you offer?',
            placeholder: 'e.g., Haircut ₹500, Spa ₹1500, Consultation ₹1000',
            required: true,
            type: 'textarea',
          },
          {
            id: 'duration',
            question: 'How long does each service take?',
            placeholder: 'e.g., Haircut: 30min, Spa: 60min',
            required: true,
            type: 'textarea',
          },
        ],
      },
      {
        id: 'availability',
        title: 'Availability',
        description: 'When can customers book?',
        questions: [
          {
            id: 'working_days',
            question: 'Which days are you open?',
            options: ['Mon-Sat', 'Mon-Sun', 'Tue-Sun', 'Custom'],
            required: true,
            type: 'select',
          },
          {
            id: 'working_hours',
            question: 'What are your working hours?',
            placeholder: 'e.g., 9:00 AM - 7:00 PM',
            required: true,
            type: 'text',
          },
          {
            id: 'slot_duration',
            question: 'How long is each slot?',
            options: ['15 minutes', '30 minutes', '45 minutes', '60 minutes'],
            required: true,
            type: 'select',
          },
        ],
      },
      {
        id: 'notifications',
        title: 'Reminders',
        description: 'When to send appointment reminders?',
        questions: [
          {
            id: 'reminder_timing',
            question: 'When to send reminders?',
            options: ['24 hours before', '2 hours before', 'Both'],
            required: true,
            type: 'select',
          },
          {
            id: 'confirmation',
            question: 'Require confirmation?',
            options: ['Yes, require reply', 'No, just notify'],
            required: true,
            type: 'select',
          },
        ],
      },
    ],
    credentials: {
      required: [
        {
          field: 'whatsapp_number',
          label: 'WhatsApp Business Number',
          description: 'For booking notifications',
        },
      ],
      optional: [],
    },
    features: {
      chat: true,
      dashboard: true,
      inbox: true,
      contacts: true,
      sequences: true,
      documents: false,
      invoices: false,
      calendar: true,
    },
  },

  // ============================================
  // PAYMENT CHASER (PayChaser)
  // ============================================
  paymentreminder: {
    steps: [
      {
        id: 'billing',
        title: 'Billing Information',
        description: 'How do you bill clients?',
        questions: [
          { id: 'business_name', question: 'Your business name?', required: true, type: 'text' },
          {
            id: 'default_due_days',
            question: 'Default payment terms (days)?',
            placeholder: '30',
            required: true,
            type: 'number',
          },
        ],
      },
      {
        id: 'reminder-sequence',
        title: 'Reminder Sequence',
        description: 'How to chase payments',
        questions: [
          {
            id: 'reminder_1',
            question: 'First reminder (days after due)?',
            placeholder: '1',
            required: true,
            type: 'number',
          },
          {
            id: 'reminder_2',
            question: 'Second reminder (days after due)?',
            placeholder: '7',
            required: true,
            type: 'number',
          },
          {
            id: 'reminder_3',
            question: 'Final reminder (days after due)?',
            placeholder: '14',
            required: true,
            type: 'number',
          },
          {
            id: 'escalation',
            question: 'What happens after final reminder?',
            options: ['Escalate to inbox', 'Send legal notice template', 'Mark as bad debt'],
            required: true,
            type: 'select',
          },
        ],
      },
    ],
    credentials: {
      required: [
        {
          field: 'whatsapp_number',
          label: 'WhatsApp Number',
          description: 'To send payment reminders',
        },
        { field: 'upi_id', label: 'UPI ID', description: 'Send payment links via UPI' },
      ],
      optional: [
        {
          field: 'razorpay_key',
          label: 'Razorpay',
          description: 'Generate payment links automatically',
        },
      ],
    },
    features: {
      chat: true,
      dashboard: true,
      inbox: true,
      contacts: true,
      sequences: true,
      documents: false,
      invoices: false,
      calendar: false,
    },
  },

  // ============================================
  // TASK MASTER (Multi-Agent Workflow)
  // ============================================
  teamexecutor: {
    steps: [
      {
        id: 'team',
        title: 'Team Information',
        description: 'About your team',
        questions: [
          { id: 'team_name', question: 'Team name?', required: true, type: 'text' },
          {
            id: 'team_members',
            question: 'List team members and their roles?',
            placeholder: 'Name: Role\nJohn: Developer\nSarah: Designer',
            required: true,
            type: 'textarea',
          },
        ],
      },
      {
        id: 'tasks',
        title: 'Task Workflow',
        description: 'How do you assign tasks?',
        questions: [
          {
            id: 'task_source',
            question: 'Where do tasks come from?',
            placeholder: 'e.g., Monday meetings, Asana, Email',
            required: true,
            type: 'text',
          },
          {
            id: 'notification_channel',
            question: 'How to notify team?',
            options: ['WhatsApp', 'Email', 'Both'],
            required: true,
            type: 'select',
          },
        ],
      },
      {
        id: 'reporting',
        title: 'Reporting',
        description: 'What reports do you need?',
        questions: [
          {
            id: 'report_timing',
            question: 'When to send reports?',
            options: ['Daily evening', 'Weekly Monday', 'Both'],
            required: true,
            type: 'select',
          },
          {
            id: 'report_format',
            question: 'What should the report include?',
            placeholder: 'Completed tasks, pending, blockers',
            required: true,
            type: 'textarea',
          },
        ],
      },
    ],
    credentials: {
      required: [
        {
          field: 'whatsapp_number',
          label: 'WhatsApp Number',
          description: 'To notify team members',
        },
      ],
      optional: [
        { field: 'google_sheets', label: 'Google Sheets', description: 'Log all tasks to a sheet' },
      ],
    },
    features: {
      chat: true,
      dashboard: true,
      inbox: true,
      contacts: false,
      sequences: false,
      documents: false,
      invoices: false,
      calendar: false,
    },
  },

  // ============================================
  // GST MATE
  // ============================================
  'gst-mate': {
    steps: [
      {
        id: 'company',
        title: 'Company Details',
        description: 'Your GST registration',
        questions: [
          {
            id: 'company_name',
            question: 'Company name (as per GST)',
            required: true,
            type: 'text',
          },
          { id: 'gstin', question: 'GSTIN', required: true, type: 'text' },
          { id: 'state', question: 'State of registration', required: true, type: 'text' },
        ],
      },
      {
        id: 'filing',
        title: 'Filing Preferences',
        description: 'GST filing settings',
        questions: [
          {
            id: 'gst_type',
            question: 'GST Type?',
            options: ['Regular', 'Composite', 'E-commerce'],
            required: true,
            type: 'select',
          },
          {
            id: 'frequency',
            question: 'Filing frequency?',
            options: ['Monthly', 'Quarterly'],
            required: true,
            type: 'select',
          },
        ],
      },
    ],
    credentials: {
      required: [{ field: 'gstin', label: 'GSTIN', description: 'For GSTR filing' }],
      optional: [],
    },
    features: {
      chat: true,
      dashboard: true,
      inbox: false,
      contacts: false,
      sequences: false,
      documents: true,
      invoices: true,
      calendar: false,
    },
  },

  // ============================================
  // REVIEW GUARD
  // ============================================
  feedbackanalyzer: {
    steps: [
      {
        id: 'platforms',
        title: 'Review Platforms',
        description: 'Where do you get reviews?',
        questions: [
          {
            id: 'platforms',
            question: 'Which platforms do you get reviews on?',
            placeholder: 'Google, Zomato, Justdial, TripAdvisor',
            required: true,
            type: 'textarea',
          },
          {
            id: 'links',
            question: 'Links to your business pages?',
            required: true,
            type: 'textarea',
          },
        ],
      },
      {
        id: 'responses',
        title: 'Response Templates',
        description: 'How to respond to reviews',
        questions: [
          {
            id: 'positive_template',
            question: 'Template for positive reviews?',
            required: true,
            type: 'textarea',
          },
          {
            id: 'negative_template',
            question: 'Template for negative reviews?',
            required: true,
            type: 'textarea',
          },
          {
            id: 'escalation',
            question: 'When to escalate to human?',
            placeholder: 'e.g., 1-2 star reviews',
            required: true,
            type: 'text',
          },
        ],
      },
    ],
    credentials: {
      required: [],
      optional: [
        { field: 'website_url', label: 'Website URL', description: 'Find reviews on your site' },
      ],
    },
    features: {
      chat: false,
      dashboard: true,
      inbox: true,
      contacts: false,
      sequences: false,
      documents: false,
      invoices: false,
      calendar: false,
    },
  },

  // ============================================
  // WHATSAPP BLAST
  // ============================================
  whatsblast: {
    steps: [
      {
        id: 'audience',
        title: 'Audience',
        description: 'Who will you message?',
        questions: [
          {
            id: 'audience_size',
            question: 'Approximate audience size?',
            required: true,
            type: 'number',
          },
          {
            id: 'audience_source',
            question: 'Where is this list from?',
            placeholder: 'Own database, Purchased, Website opt-ins',
            required: true,
            type: 'text',
          },
        ],
      },
      {
        id: 'compliance',
        title: 'Compliance',
        description: 'DLT registration',
        questions: [
          {
            id: 'dlt_registered',
            question: 'Is your number DLT registered?',
            options: ['Yes', 'No, need help'],
            required: true,
            type: 'select',
          },
          {
            id: 'consent',
            question: 'Do you have consent for messaging?',
            options: ['Yes, all have opted in', 'Some have opted in', 'Need to send opt-in'],
            required: true,
            type: 'select',
          },
        ],
      },
    ],
    credentials: {
      required: [
        {
          field: 'whatsapp_number',
          label: 'WhatsApp Business Number',
          description: 'For broadcasting messages',
        },
      ],
      optional: [],
    },
    features: {
      chat: false,
      dashboard: true,
      inbox: false,
      contacts: true,
      sequences: true,
      documents: false,
      invoices: false,
      calendar: false,
    },
  },

  // ============================================
  // DOC HARVEST
  // ============================================
  docharvest: {
    steps: [
      {
        id: 'documents',
        title: 'Required Documents',
        description: 'What documents do you collect?',
        questions: [
          {
            id: 'document_list',
            question: 'What documents do you need?',
            placeholder: 'Aadhaar, PAN, Address Proof, Photo',
            required: true,
            type: 'textarea',
          },
          {
            id: 'formats',
            question: 'Accepted formats?',
            options: ['PDF', 'Image (JPG/PNG)', 'Both'],
            required: true,
            type: 'select',
          },
        ],
      },
      {
        id: 'collection',
        title: 'Collection Process',
        description: 'How to collect documents',
        questions: [
          {
            id: 'request_template',
            question: 'Request message template?',
            required: true,
            type: 'textarea',
          },
          {
            id: 'followup',
            question: 'Follow-up for pending documents?',
            required: true,
            type: 'text',
          },
        ],
      },
    ],
    credentials: {
      required: [
        {
          field: 'whatsapp_number',
          label: 'WhatsApp Number',
          description: 'To request and receive documents',
        },
      ],
      optional: [
        { field: 'google_sheets', label: 'Google Sheets', description: 'Log document status' },
      ],
    },
    features: {
      chat: true,
      dashboard: true,
      inbox: true,
      contacts: true,
      sequences: true,
      documents: true,
      invoices: false,
      calendar: false,
    },
  },

  // ============================================
  // CONTENT ENGINE
  // ============================================
  contentengine: {
    steps: [
      {
        id: 'niche',
        title: 'Your Niche',
        description: 'What content do you need?',
        questions: [
          { id: 'industry', question: 'Industry/niche?', required: true, type: 'text' },
          {
            id: 'content_types',
            question: 'What content types?',
            options: ['Blog posts', 'Social media', 'Both'],
            required: true,
            type: 'select',
          },
          {
            id: 'tone',
            question: 'Tone of voice?',
            options: ['Professional', 'Casual', 'Friendly', 'Technical'],
            required: true,
            type: 'select',
          },
        ],
      },
      {
        id: 'frequency',
        title: 'Publishing',
        description: 'How often to publish?',
        questions: [
          {
            id: 'frequency',
            question: 'How often?',
            options: ['Daily', '3x/week', 'Weekly', 'Bi-weekly'],
            required: true,
            type: 'select',
          },
          {
            id: 'platforms',
            question: 'Which platforms?',
            placeholder: 'Instagram, LinkedIn, Twitter, Website',
            required: true,
            type: 'textarea',
          },
        ],
      },
    ],
    credentials: {
      required: [],
      optional: [
        { field: 'website_url', label: 'Website URL', description: 'For content context' },
      ],
    },
    features: {
      chat: true,
      dashboard: true,
      inbox: false,
      contacts: false,
      sequences: true,
      documents: false,
      invoices: false,
      calendar: false,
    },
  },

  // ============================================
  // DEFAULT FALLBACK
  // ============================================
  default: {
    steps: [
      {
        id: 'basics',
        title: 'Basic Info',
        description: 'About your business',
        questions: [
          {
            id: 'business_name',
            question: 'What is your business name?',
            required: true,
            type: 'text',
          },
          { id: 'industry', question: 'What industry?', required: true, type: 'text' },
          {
            id: 'description',
            question: 'Tell us about your business',
            required: false,
            type: 'textarea',
          },
        ],
      },
    ],
    credentials: {
      required: [],
      optional: [
        {
          field: 'whatsapp_number',
          label: 'WhatsApp Number',
          description: 'For messaging capabilities',
        },
        { field: 'website_url', label: 'Website URL', description: 'For knowledge base' },
      ],
    },
    features: {
      chat: true,
      dashboard: true,
      inbox: false,
      contacts: false,
      sequences: false,
      documents: false,
      invoices: false,
      calendar: false,
    },
  },
}

/**
 * Get onboarding config for an agent type
 */
export function getAgentOnboarding(agentType: string): AgentOnboardingConfig {
  return AGENT_ONBOARDING[agentType] || AGENT_ONBOARDING['default']
}

/**
 * Get all agent types that have onboarding
 */
export function getAgentTypesWithOnboarding(): string[] {
  return Object.keys(AGENT_ONBOARDING).filter((k) => k !== 'default')
}
