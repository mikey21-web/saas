/**
 * Agent Skills System
 *
 * Add-on capabilities that can be attached to any agent.
 * Each skill enhances the agent's capabilities.
 */

export interface AgentSkill {
  id: string
  name: string
  icon: string
  description: string
  monthlyPrice: number // in INR
  category: 'communication' | 'integration' | 'automation' | 'analytics'
  features: string[]
  requiredCredentials?: string[]
}

export const AGENT_SKILLS: AgentSkill[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    icon: '💬',
    description: 'Enable WhatsApp messaging for your agent to communicate with customers',
    monthlyPrice: 499,
    category: 'communication',
    features: [
      'Send and receive WhatsApp messages',
      'Automated message templates',
      'Media sharing (images, documents)',
      'Status notifications',
      'Group messaging',
    ],
    requiredCredentials: ['whatsapp_number'],
  },
  {
    id: 'voice',
    name: 'Voice & Phone',
    icon: '📞',
    description: 'Give your agent a phone number for voice calls and SMS',
    monthlyPrice: 999,
    category: 'communication',
    features: [
      'Dedicated phone number',
      'Voice call handling',
      'SMS sending and receiving',
      'Call recording',
      'Voicemail support',
      'IVR menu',
    ],
    requiredCredentials: [],
  },
  {
    id: 'email',
    name: 'Email Suite',
    icon: '✉️',
    description: 'Professional email capabilities with your domain',
    monthlyPrice: 399,
    category: 'communication',
    features: [
      'Custom email address',
      'Email send/receive',
      'Email templates',
      'Attachment handling',
      'Email scheduling',
      'DMARC/DKIM setup',
    ],
    requiredCredentials: [],
  },
  {
    id: 'sms',
    name: 'SMS Alerts',
    icon: '💌',
    description: 'Bulk SMS notifications and alerts',
    monthlyPrice: 299,
    category: 'communication',
    features: [
      'Bulk SMS sending',
      'Template messages',
      'Scheduled SMS',
      'Delivery reports',
      'OTP verification',
    ],
  },
  {
    id: 'payments',
    name: 'Payment Collection',
    icon: '💳',
    description: 'Accept payments via UPI, cards, and bank transfers',
    monthlyPrice: 699,
    category: 'integration',
    features: [
      'UPI payment links',
      'Card payments',
      'Invoice generation',
      'Payment tracking',
      'Automatic reminders',
      'Refund processing',
    ],
  },
  {
    id: 'calendar',
    name: 'Calendar & Scheduling',
    icon: '📅',
    description: 'Manage appointments and schedules',
    monthlyPrice: 299,
    category: 'automation',
    features: [
      'Booking calendar',
      'Appointment scheduling',
      'Automatic reminders',
      'Timezone handling',
      'Calendar sync',
      'Buffer time设置',
    ],
  },
  {
    id: 'crm',
    name: 'CRM Integration',
    icon: '🏢',
    description: 'Connect with popular CRM systems',
    monthlyPrice: 599,
    category: 'integration',
    features: [
      'Contact sync',
      'Deal pipeline',
      'Lead tracking',
      'Activity logging',
      'Custom fields',
      'Pipeline views',
    ],
  },
  {
    id: 'zapier',
    name: 'Zapier Connect',
    icon: '⚡',
    description: 'Connect with 5000+ apps via Zapier',
    monthlyPrice: 399,
    category: 'integration',
    features: [
      '5000+ app integrations',
      'Automated workflows',
      'Triggers & actions',
      'Multi-step zaps',
      'Webhook support',
    ],
  },
  {
    id: 'chatbot',
    name: 'Website Chatbot',
    icon: '🤖',
    description: 'Embed a chatbot on your website',
    monthlyPrice: 499,
    category: 'automation',
    features: [
      'Website widget',
      'Custom branding',
      'Quick replies',
      'File uploads',
      'Chat history',
      'Proactive engagement',
    ],
  },
  {
    id: 'analytics',
    name: 'Advanced Analytics',
    icon: '📊',
    description: 'Detailed analytics and reporting',
    monthlyPrice: 399,
    category: 'analytics',
    features: [
      'Usage dashboard',
      'Conversation analytics',
      'Response time metrics',
      'Custom reports',
      'Export data',
      'Team performance',
    ],
  },
  {
    id: 'multi-language',
    name: 'Multi-Language',
    icon: '🌍',
    description: 'Support multiple languages',
    monthlyPrice: 299,
    category: 'communication',
    features: [
      'Hindi support',
      'English support',
      'Auto-translation',
      'Language detection',
      'Custom phrases',
      'Regional slang',
    ],
  },
  {
    id: 'whatsapp-api',
    name: 'WhatsApp API',
    icon: '📱',
    description: 'Official WhatsApp Business API with verified badge',
    monthlyPrice: 999,
    category: 'communication',
    features: [
      'Verified business badge',
      'Template messages',
      'Broadcast lists',
      'Quick replies',
      'Product catalog',
      'Priority support',
    ],
    requiredCredentials: ['whatsapp_business_id'],
  },
  {
    id: 'ai-voice',
    name: 'AI Voice Agent',
    icon: '🎤',
    description: 'AI-powered voice that talks naturally',
    monthlyPrice: 1499,
    category: 'communication',
    features: [
      'Natural voice synthesis',
      'Voice cloning',
      'Multiple voice options',
      'Real-time transcription',
      'Call summarization',
      'Sentiment analysis',
    ],
  },
  {
    id: 'custom-domain',
    name: 'Custom Domain',
    icon: '🌐',
    description: 'Use your own domain for all communications',
    monthlyPrice: 199,
    category: 'integration',
    features: [
      'Custom email domain',
      'Branded links',
      'Custom chatbot URL',
      'SSL certificate',
      'DNS management',
    ],
  },
  {
    id: 'team',
    name: 'Team Collaboration',
    icon: '👥',
    description: 'Add team members to manage the agent',
    monthlyPrice: 499,
    category: 'automation',
    features: [
      'Multiple users',
      'Role-based access',
      'Activity logs',
      'Internal notes',
      'Escalation rules',
      'Team inbox',
    ],
  },
]

export const SKILL_CATEGORIES = [
  { id: 'all', name: 'All Skills', icon: '✨' },
  { id: 'communication', name: 'Communication', icon: '💬' },
  { id: 'integration', name: 'Integrations', icon: '🔗' },
  { id: 'automation', name: 'Automation', icon: '🤖' },
  { id: 'analytics', name: 'Analytics', icon: '📈' },
]

export function getSkillById(id: string): AgentSkill | undefined {
  return AGENT_SKILLS.find((skill) => skill.id === id)
}

export function getSkillsByCategory(category: string): AgentSkill[] {
  if (category === 'all') return AGENT_SKILLS
  return AGENT_SKILLS.filter((skill) => skill.category === category)
}

export function calculateTotalSkillPrice(skillIds: string[]): number {
  return skillIds.reduce((total, id) => {
    const skill = getSkillById(id)
    return total + (skill?.monthlyPrice || 0)
  }, 0)
}
