/**
 * Workflow Deployer — Orchestrates agent deployment
 *
 * When user deploys an agent:
 * 1. Save encrypted credentials
 * 2. Choose execution mode (LangGraph or n8n)
 * 3. Set up webhooks for incoming messages
 * 4. Activate the agent
 * 5. Return deployment status
 */

import { saveAgentCredentials } from '@/lib/supabase/credentials'
import type { AgentCredentials } from '@/lib/credentials/vault'

export interface DeploymentConfig {
  agentId: string
  userId: string
  agentName: string
  businessName: string
  industry: string
  websiteUrl?: string
  credentials: Partial<AgentCredentials>
  templateType: 'customer-support' | 'task-assignment' | 'appointment-booking' | 'lead-generator'
  executionMode: 'langgraph' | 'n8n' // LangGraph for simple, n8n for complex workflows
}

export interface DeploymentResult {
  success: boolean
  agentId: string
  webhookUrl?: string
  executionMode: string
  status: 'active' | 'pending' | 'error'
  message: string
  error?: string
  estimatedCost?: {
    setupCost: number // One-time setup
    monthlyCost: number // Recurring
    currency: string
  }
}

// ─── Deployment Orchestrator ────────────────────────────────────────────────

/**
 * Main deployment function
 * Coordinates credential storage, workflow setup, and activation
 */
export async function deployAgent(config: DeploymentConfig): Promise<DeploymentResult> {
  const startTime = Date.now()

  try {
    console.log(`[DEPLOY] Starting agent deployment: ${config.agentId}`)

    // Step 1: Validate credentials
    console.log(`[DEPLOY] Validating credentials...`)
    if (!config.credentials) {
      return {
        success: false,
        agentId: config.agentId,
        executionMode: 'langgraph',
        status: 'error',
        message: 'No credentials provided',
        error: 'Credentials are required for deployment',
      }
    }

    // Step 2: Save encrypted credentials to vault
    console.log(`[DEPLOY] Saving encrypted credentials...`)
    const credResult = await saveAgentCredentials(config.userId, config.agentId, config.credentials)

    if (!credResult.success) {
      return {
        success: false,
        agentId: config.agentId,
        executionMode: 'langgraph',
        status: 'error',
        message: 'Failed to save credentials',
        error: credResult.error,
      }
    }

    // Step 3: Deploy workflow based on execution mode
    let webhookUrl = ''
    let executionDetails = ''

    if (config.executionMode === 'langgraph') {
      console.log(`[DEPLOY] Setting up LangGraph execution...`)
      const langraphResult = await deployLangGraphAgent(config)
      if (!langraphResult.success) {
        return langraphResult
      }
      webhookUrl = langraphResult.webhookUrl || ''
      executionDetails = langraphResult.executionMode
    } else if (config.executionMode === 'n8n') {
      console.log(`[DEPLOY] Setting up n8n workflow...`)
      const n8nResult = await deployN8nWorkflow(config)
      if (!n8nResult.success) {
        return n8nResult
      }
      webhookUrl = n8nResult.webhookUrl || ''
      executionDetails = n8nResult.executionMode
    }

    // Step 4: Update agent status to "active"
    console.log(`[DEPLOY] Activating agent...`)
    const { supabase } = await import('@/lib/supabase/client')
    const { error: updateError } = await (supabase.from('agents') as any)
      .update({
        status: 'active',
        deployed_at: new Date().toISOString(),
        webhook_url: webhookUrl,
      })
      .eq('id', config.agentId)
      .eq('user_id', config.userId)

    if (updateError) {
      console.error('Failed to activate agent:', updateError)
      return {
        success: false,
        agentId: config.agentId,
        executionMode: 'langgraph',
        status: 'error',
        message: 'Failed to activate agent',
        error: updateError.message,
      }
    }

    // Step 5: Log deployment activity
    const { supabaseAdmin } = await import('@/lib/supabase/client')
    await (supabaseAdmin.from('activity_logs') as any).insert({
      user_id: config.userId,
      agent_id: config.agentId,
      action: 'agent_deployed_with_credentials',
      details: {
        templateType: config.templateType,
        executionMode: config.executionMode,
        webhookUrl,
        deploymentTimeMs: Date.now() - startTime,
      },
    })

    const durationSec = (Date.now() - startTime) / 1000
    console.log(`[DEPLOY] ✅ Deployment complete in ${durationSec.toFixed(2)}s`)

    return {
      success: true,
      agentId: config.agentId,
      webhookUrl,
      executionMode: executionDetails,
      status: 'active',
      message: `Agent deployed successfully using ${config.executionMode}`,
      estimatedCost: calculateDeploymentCost(config),
    }
  } catch (err) {
    console.error('[DEPLOY] Deployment failed:', err)
    return {
      success: false,
      agentId: config.agentId,
      executionMode: 'langgraph',
      status: 'error',
      message: 'Deployment failed',
      error: String(err),
    }
  }
}

// ─── Deployment Strategies ───────────────────────────────────────────────────

/**
 * Deploy using LangGraph (preferred for MVP)
 * Uses our existing executor with credentials
 */
async function deployLangGraphAgent(config: DeploymentConfig): Promise<DeploymentResult> {
  try {
    // LangGraph is already running in our Next.js app
    // We just need to:
    // 1. Inject credentials into the agent context
    // 2. Return the webhook URL (already generated in credentials step)

    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/whatsapp/${config.agentId}`

    console.log(`[LANGGRAPH] Agent ready at: ${webhookUrl}`)

    return {
      success: true,
      agentId: config.agentId,
      webhookUrl,
      executionMode: 'LangGraph (Real-time)',
      status: 'active',
      message: 'LangGraph agent deployed',
    }
  } catch (err) {
    return {
      success: false,
      agentId: config.agentId,
      executionMode: 'langgraph',
      status: 'error',
      message: 'Failed to deploy LangGraph agent',
      error: String(err),
    }
  }
}

/**
 * Deploy using n8n (for complex workflows)
 * Creates workflow from template and injects credentials
 */
async function deployN8nWorkflow(config: DeploymentConfig): Promise<DeploymentResult> {
  try {
    const n8nApiUrl = process.env.N8N_INSTANCE_URL || 'https://n8n.diyaa.ai'
    const n8nApiKey = process.env.N8N_API_KEY

    if (!n8nApiKey) {
      return {
        success: false,
        agentId: config.agentId,
        executionMode: 'n8n',
        status: 'error',
        message: 'n8n not configured',
        error: 'N8N_API_KEY not set',
      }
    }

    // Get template workflow (this would be stored in n8n or our DB)
    const templateId = getTemplateId(config.templateType)
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/whatsapp/${config.agentId}`

    // Create workflow from template
    const createRes = await fetch(`${n8nApiUrl}/api/v1/workflows`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': n8nApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `${config.agentName} - ${config.agentId}`,
        nodes: buildWorkflowNodes(config, templateId),
        connections: buildWorkflowConnections(config, templateId),
        active: true,
        tags: ['diyaa-deployed', config.templateType],
      }),
    })

    if (!createRes.ok) {
      throw new Error(`Failed to create n8n workflow: ${createRes.statusText}`)
    }

    const workflow = (await createRes.json()) as { id: string; name: string }
    console.log(`[N8N] Workflow created: ${workflow.id}`)

    // Activate workflow
    const activateRes = await fetch(`${n8nApiUrl}/api/v1/workflows/${workflow.id}`, {
      method: 'PATCH',
      headers: {
        'X-N8N-API-KEY': n8nApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ active: true }),
    })

    if (!activateRes.ok) {
      throw new Error(`Failed to activate workflow: ${activateRes.statusText}`)
    }

    return {
      success: true,
      agentId: config.agentId,
      webhookUrl,
      executionMode: `n8n (Workflow ${workflow.id})`,
      status: 'active',
      message: 'n8n workflow deployed',
    }
  } catch (err) {
    return {
      success: false,
      agentId: config.agentId,
      executionMode: 'n8n',
      status: 'error',
      message: 'Failed to deploy n8n workflow',
      error: String(err),
    }
  }
}

// ─── Helper Functions ────────────────────────────────────────────────────────

function getTemplateId(type: string): string {
  const templates: Record<string, string> = {
    'customer-support': 'tpl_customer_support_v1',
    'task-assignment': 'tpl_task_assignment_v1',
    'appointment-booking': 'tpl_appointment_v1',
    'lead-generator': 'tpl_lead_gen_v1',
  }
  return templates[type] || 'tpl_default'
}

function buildWorkflowNodes(_config: DeploymentConfig, _templateId: string) {
  // This would build the actual n8n node structure
  // For now, return a placeholder
  return []
}

function buildWorkflowConnections(_config: DeploymentConfig, _templateId: string) {
  // This would build connections between nodes
  // For now, return a placeholder
  return {}
}

function calculateDeploymentCost(config: DeploymentConfig): {
  setupCost: number
  monthlyCost: number
  currency: string
} {
  let monthlyCost = 0

  if (config.credentials.openai_api_key || config.credentials.groq_api_key) {
    // Cost of API calls - user pays directly to OpenAI/Groq
    // We charge based on usage
    monthlyCost += 0 // Free - user's key, user's cost
  }

  if (config.credentials.whatsapp_number) {
    // Exotel WhatsApp number cost
    monthlyCost += 499 // ₹499/month per number
  }

  if (config.credentials.use_diyaa_ai_powered) {
    // diyaa.ai powered add-on
    monthlyCost += 499 // ₹499/month for our hosted AI
  }

  return {
    setupCost: 0,
    monthlyCost,
    currency: 'INR',
  }
}
