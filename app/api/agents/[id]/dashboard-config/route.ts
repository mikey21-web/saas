import { NextRequest, NextResponse } from 'next/server'
import { getAgentConfig } from '@/lib/agents/agent-config'

export const runtime = 'nodejs'

/**
 * Get dynamic dashboard config for an agent type
 *
 * GET /api/agents/[id]/dashboard-config?agentType=customersupport
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await params
    const searchParams = request.nextUrl.searchParams
    const agentType = searchParams.get('agentType') || 'customersupport'

    const config = getAgentConfig(agentType)

    return NextResponse.json({
      onboarding: {
        steps: config.onboarding.steps.map((s) => ({
          id: s.id,
          title: s.title,
          description: s.description,
          questions: s.questions.map((q) => ({
            id: q.id,
            question: q.question,
            type: q.type,
            required: q.required,
            options: q.options,
          })),
        })),
        credentials: config.onboarding.credentials,
        features: config.onboarding.features,
      },
      dashboard: {
        sections: config.dashboard.sections.map((s) => ({
          id: s.id,
          title: s.title,
          component: s.component,
          metrics: s.metrics,
          dataSource: s.dataSource,
        })),
        quickActions: config.dashboard.quickActions,
      },
      ui: {
        accent: config.ui.accent,
        accentBg: config.ui.accentBg,
        tagline: config.ui.tagline,
        roleDescription: config.ui.roleDescription,
        tabs: config.ui.tabs,
        defaultIcon: config.ui.defaultIcon,
        metrics: config.ui.metrics,
        quickActions: config.ui.quickActions,
      },
      capabilities: {
        hasWhatsApp: config.hasWhatsApp,
        hasInvoices: config.hasInvoices,
        hasCalendar: config.hasCalendar,
        hasDocuments: config.hasDocuments,
        hasContacts: config.hasContacts,
        hasSequences: config.hasSequences,
      },
    })
  } catch (error) {
    console.error('Dashboard config error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
