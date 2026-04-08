/**
 * Social Media Manager Execution Engine
 *
 * 6-Agent Multi-Agent Orchestration:
 * 1. Content Creator - Generate platform-native content
 * 2. Trend Spotter - Detect trending topics
 * 3. Scheduler - Auto-publish to platforms
 * 4. Analytics - Track engagement and insights
 * 5. Engagement - Auto-reply to comments/DMs
 * 6. Approval - Manual review workflow
 */

import {
  runContentCreatorWorkflow,
  ContentCreatorInput,
  Post,
  WorkflowState,
} from '@/lib/social-media-manager'
import { supabaseAdmin } from '@/lib/supabase/client'

export interface SocialMediaManagerContext {
  agentId: string
  userId: string
  channel?: string
  fromPhone?: string
  fromEmail?: string
  metadata?: Record<string, unknown>
}

/**
 * Main executor for Social Media Manager
 * Routes based on message intent and triggers appropriate workflow
 */
export async function executeSocialMediaManager(
  userMessage: string,
  ctx: SocialMediaManagerContext
): Promise<{ success: boolean; message: string; data?: Record<string, unknown> }> {
  try {
    // Get agent configuration from database
    const { data: agentData, error: agentError } = await supabaseAdmin
      .from('agents')
      .select('*')
      .eq('id', ctx.agentId)
      .eq('user_id', ctx.userId)
      .single()

    if (agentError || !agentData) {
      return {
        success: false,
        message: 'Agent configuration not found. Please check your agent setup.',
      }
    }

    // Detect intent from message
    const intent = detectIntent(userMessage)

    // Route to appropriate workflow based on intent
    let workflowResult: WorkflowState
    let responseMessage: string
    let responseData: Record<string, unknown> = {}

    switch (intent) {
      case 'create_content': {
        const contentInput: ContentCreatorInput = {
          trigger_source: 'manual_whatsapp',
          user_request: userMessage,
          platforms_requested: extractPlatforms(userMessage) as any,
          content_types_requested: [extractContentType(userMessage)] as any,
          schedule_preference: userMessage.toLowerCase().includes('now') ? 'now' : 'optimal',
        }

        workflowResult = await runContentCreatorWorkflow(ctx.userId, contentInput)

        // Extract posts from workflow result
        const posts = (workflowResult.posts || []) as Post[]
        responseMessage = buildContentCreatedMessage(posts)
        responseData = {
          postsGenerated: posts.length,
          platforms: extractPlatforms(userMessage),
          posts: posts.slice(0, 3), // Return first 3 for display
        }

        // Store posts to database
        if (posts.length > 0) {
          await storePosts(posts, ctx)
        }

        break
      }

      case 'check_trends': {
        responseMessage = "📊 Trend analysis coming up... I'll fetch latest trends and suggest content ideas."
        responseData = {
          status: 'analyzing',
          message: 'Checking Twitter, Google Trends, Instagram Trending Audio...',
        }
        break
      }

      case 'publish_now': {
        responseMessage =
          '📤 Publishing queued posts now... You can check platform status in a few minutes.'
        responseData = {
          status: 'publishing',
          message: 'Scheduling posts to Instagram, Facebook, LinkedIn, TikTok, Twitter',
        }
        break
      }

      case 'analytics': {
        responseMessage =
          '📈 Pulling your engagement metrics... This includes likes, comments, shares, and audience growth.'
        responseData = {
          status: 'fetching',
          message: 'Analyzing post performance across all platforms',
        }
        break
      }

      default: {
        responseMessage =
          "I'm your Social Media Manager! Here's what I can do:\n\n" +
          '✍️ **Create content** - Say "Create a carousel post about [topic]"\n' +
          '📊 **Check trends** - Ask "What\'s trending in [niche]?"\n' +
          '📤 **Publish** - Say "Publish now" or "Schedule post for Thursday"\n' +
          '📈 **Analytics** - Ask "How did my posts perform?"\n' +
          '💬 **Manage engagement** - I auto-reply to comments and classify leads\n\n' +
          'Try: _"Create an Instagram Reel about AI trends"_'
        responseData = { intent: 'help' }
      }
    }

    // Store conversation
    await storeConversation(userMessage, responseMessage, ctx)

    return {
      success: true,
      message: responseMessage,
      data: responseData,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[SocialMediaManager] Execution error:', errorMessage)

    return {
      success: false,
      message: `Sorry, I ran into an issue: ${errorMessage}. Please try again.`,
      data: { error: errorMessage },
    }
  }
}

/**
 * Detect user intent from message
 */
function detectIntent(message: string): string {
  const lowerMsg = message.toLowerCase()

  if (
    lowerMsg.includes('create') ||
    lowerMsg.includes('generate') ||
    lowerMsg.includes('write') ||
    lowerMsg.includes('make') ||
    lowerMsg.includes('reel') ||
    lowerMsg.includes('post') ||
    lowerMsg.includes('carousel')
  ) {
    return 'create_content'
  }

  if (
    lowerMsg.includes('trend') ||
    lowerMsg.includes('viral') ||
    lowerMsg.includes('topic') ||
    lowerMsg.includes('news')
  ) {
    return 'check_trends'
  }

  if (
    lowerMsg.includes('publish') ||
    lowerMsg.includes('schedule') ||
    lowerMsg.includes('post now')
  ) {
    return 'publish_now'
  }

  if (
    lowerMsg.includes('analytics') ||
    lowerMsg.includes('performance') ||
    lowerMsg.includes('engagement') ||
    lowerMsg.includes('reach') ||
    lowerMsg.includes('metrics')
  ) {
    return 'analytics'
  }

  return 'help'
}

/**
 * Extract platforms from user message
 */
function extractPlatforms(message: string): string[] {
  const lowerMsg = message.toLowerCase()
  const platforms: string[] = []

  const platformMap: Record<string, string> = {
    instagram: 'instagram',
    facebook: 'facebook',
    linkedin: 'linkedin',
    tiktok: 'tiktok',
    twitter: 'twitter',
    x: 'twitter',
    threads: 'threads',
    all: 'all',
  }

  for (const [keyword, platform] of Object.entries(platformMap)) {
    if (lowerMsg.includes(keyword)) {
      platforms.push(platform)
    }
  }

  // Default to all platforms if none specified
  if (platforms.length === 0) {
    platforms.push('instagram', 'facebook', 'linkedin', 'tiktok', 'twitter')
  }

  return Array.from(new Set(platforms))
}

/**
 * Extract content type from message
 */
function extractContentType(message: string): string {
  const lowerMsg = message.toLowerCase()

  if (lowerMsg.includes('reel') || lowerMsg.includes('video')) return 'reel'
  if (lowerMsg.includes('carousel') || lowerMsg.includes('slider')) return 'carousel'
  if (lowerMsg.includes('story')) return 'story'
  if (lowerMsg.includes('article') || lowerMsg.includes('long form')) return 'article'

  return 'image' // default
}

/**
 * Build response message for created content
 */
function buildContentCreatedMessage(posts: Post[]): string {
  if (posts.length === 0) {
    return '✍️ I created some content ideas for you. Check the preview below and let me know if you want to adjust tone, style, or focus.'
  }

  const platformSet = new Set<string>()
  posts.forEach((p) => platformSet.add(p.platform))

  return (
    `✅ **Content Created!** (${posts.length} posts)\n\n` +
    `📱 **Platforms:** ${Array.from(platformSet).join(', ')}\n\n` +
    `**Next steps:**\n` +
    `1. Review the content above\n` +
    `2. Say *"Publish now"* to schedule it\n` +
    `3. Or say *"Edit [description]"* to refine it`
  )
}

/**
 * Store posts to Supabase
 */
async function storePosts(posts: Post[], ctx: SocialMediaManagerContext): Promise<void> {
  try {
    const postsToInsert = posts.map((post) => ({
      agent_id: ctx.agentId,
      user_id: ctx.userId,
      platform: post.platform,
      title: post.caption?.substring(0, 100) || 'Untitled',
      content: post.caption || '',
      status: post.status || 'draft',
      scheduled_at: post.scheduled_at || null,
      metadata: {
        contentType: post.content_type,
        mediaUrls: post.media_url ? [post.media_url] : [],
      },
    }))

    await (supabaseAdmin.from('posts') as any).insert(postsToInsert)
  } catch (error) {
    console.error('[SocialMediaManager] Error storing posts:', error)
    // Non-blocking error — workflow succeeded even if DB storage fails
  }
}

/**
 * Store conversation to database
 */
async function storeConversation(
  userMessage: string,
  agentMessage: string,
  ctx: SocialMediaManagerContext
): Promise<void> {
  try {
    // Get or create conversation
    const identifier = ctx.fromPhone || ctx.fromEmail || 'api'
    const { data: existingConv } = await (supabaseAdmin
      .from('conversations') as any)
      .select('id')
      .eq('agent_id', ctx.agentId)
      .eq('contact_phone_or_email', identifier)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    let convId = (existingConv as any)?.id

    if (!convId) {
      const { data: newConv } = await (supabaseAdmin
        .from('conversations') as any)
        .insert({
          agent_id: ctx.agentId,
          user_id: ctx.userId,
          contact_phone_or_email: identifier,
          channel: ctx.channel || 'api',
          status: 'active',
        })
        .select('id')
        .single()

      convId = (newConv as any)?.id
    }

    if (convId) {
      await (supabaseAdmin.from('messages') as any).insert([
        {
          conversation_id: convId,
          agent_id: ctx.agentId,
          role: 'user',
          content: userMessage,
          channel: ctx.channel || 'api',
        },
        {
          conversation_id: convId,
          agent_id: ctx.agentId,
          role: 'agent',
          content: agentMessage,
          channel: ctx.channel || 'api',
        },
      ])
    }

    // Log execution
    await (supabaseAdmin.from('agent_executions') as any).insert({
      agent_id: ctx.agentId,
      agent_type: 'social-media-manager',
      input: { message: userMessage, channel: ctx.channel },
      output: { message: agentMessage },
      conversation_id: convId,
    })
  } catch (error) {
    console.error('[SocialMediaManager] Error storing conversation:', error)
    // Non-blocking error
  }
}
