/**
 * Content Creator Agent
 * 
 * Generates platform-native social content based on:
 * - Manual WhatsApp requests
 * - Calendar triggers
 * - Trend handoffs from Trend Spotter
 * - Campaign briefs
 * - Content repurposing
 */

import { Annotation } from '@langchain/langgraph';
import {
  WorkflowState,
  Post,
  ContentCreatorInput,
  ContentCreatorOutput,
  Platform,
  ContentType,
  NicheKnowledgePack,
  TrendTopic,
  DEFAULT_SMM_CONFIG,
} from '../types';
import {
  generatePostId,
  formatCaption,
  formatHashtags,
  buildPlatformPrompt,
  buildReelPrompt,
  buildCarouselPrompt,
  validatePost,
} from '../utils';
import {
  groqChatJSON,
  openaiChatJSON,
  smartLLMChatJSON,
  supabaseCreatePost,
  supabaseGetNKP,
  supabaseGetUser,
} from '../integrations';

// =============================================================================
// CONTENT CREATOR AGENT
// =============================================================================

interface GeneratedContent {
  caption: string;
  hashtags: string[];
  cta: string;
  image_prompt?: string;
  reel_script?: { hook: string; body: string; cta: string };
  carousel_slides?: Array<{ slide_number: number; headline: string; body: string }>;
}

/**
 * Determines LLM complexity based on request type
 */
function determineComplexity(input: ContentCreatorInput): 'simple' | 'complex' {
  // Use GPT-4o for:
  // - Campaign briefs (multi-post, strategic)
  // - Content repurposing
  // - Multi-platform requests (3+ platforms)
  // - Complex content types (carousels)
  
  if (input.campaign_brief) return 'complex';
  if (input.repurpose_from) return 'complex';
  if (input.platforms_requested.length >= 3) return 'complex';
  if (input.content_types_requested?.includes('carousel')) return 'complex';
  
  return 'simple';
}

/**
 * Generate content for a single platform
 */
async function generateContentForPlatform(
  platform: Platform,
  contentType: ContentType,
  nkp: NicheKnowledgePack,
  userRequest: string,
  complexity: 'simple' | 'complex',
  trendBrief?: TrendTopic
): Promise<GeneratedContent | null> {
  let prompt: string;
  
  // Build platform-specific prompt
  if (contentType === 'reel' || contentType === 'shorts') {
    prompt = buildReelPrompt(
      platform,
      nkp,
      userRequest,
      trendBrief ? { 
        audio_id: '', 
        title: trendBrief.name, 
        artist: 'Trending', 
        use_count: 0, 
        source: platform === 'tiktok' ? 'tiktok' : 'instagram' 
      } : undefined
    );
  } else if (contentType === 'carousel') {
    prompt = buildCarouselPrompt(platform, nkp, userRequest);
  } else {
    prompt = buildPlatformPrompt(
      platform,
      contentType,
      nkp,
      userRequest,
      nkp.language_preference
    );
  }
  
  // Add trend context if available
  if (trendBrief) {
    prompt += `\n\nTRENDING TOPIC TO LEVERAGE: "${trendBrief.name}"
Content Angle: ${trendBrief.content_angle || 'Find a creative way to tie this trend to the brand'}
Relevance: ${trendBrief.relevance_score}/10`;
  }
  
  // Call LLM
  const content = await smartLLMChatJSON<GeneratedContent>(prompt, complexity);
  return content;
}

/**
 * Main Content Creator Agent function
 */
export async function contentCreatorAgent(
  state: WorkflowState
): Promise<Partial<WorkflowState>> {
  const input = state.content_creator_input;
  
  if (!input) {
    return {
      errors: [...state.errors, 'Content Creator: No input provided'],
      current_step: 'content_creator_error',
    };
  }
  
  // Load user if not already loaded
  let user = state.user;
  if (!user) {
    user = await supabaseGetUser(state.user_id) || undefined;
    if (!user) {
      return {
        errors: [...state.errors, 'Content Creator: User not found'],
        current_step: 'content_creator_error',
      };
    }
  }
  
  // Load NKP if not already loaded
  let nkp = state.nkp;
  if (!nkp) {
    nkp = await supabaseGetNKP(user.niche_primary) || undefined;
    if (!nkp) {
      return {
        errors: [...state.errors, 'Content Creator: NKP not found for niche'],
        current_step: 'content_creator_error',
      };
    }
  }
  
  // Determine complexity for LLM routing
  const complexity = determineComplexity(input);
  
  // Build user request string
  let userRequest = input.user_request || '';
  if (input.campaign_brief) {
    userRequest = `Campaign: ${input.campaign_brief.goal}\nTarget: ${input.campaign_brief.target_audience}\nKey Messages: ${input.campaign_brief.key_messages.join(', ')}`;
  }
  if (input.repurpose_from) {
    userRequest = `Repurpose this content for new platforms: "${input.repurpose_from.caption}"`;
  }
  
  // Generate content for each platform
  const posts: Post[] = [];
  const imagePrompts: string[] = [];
  const errors: string[] = [];
  
  for (const platform of input.platforms_requested) {
    // Determine content type for this platform
    const contentTypes = input.content_types_requested || [getDefaultContentType(platform)];
    
    for (const contentType of contentTypes) {
      try {
        const content = await generateContentForPlatform(
          platform,
          contentType,
          nkp,
          userRequest,
          complexity,
          input.trend_brief
        );
        
        if (!content) {
          errors.push(`Failed to generate content for ${platform} ${contentType}`);
          continue;
        }
        
        // Calculate scheduled time
        const scheduledAt = calculateScheduledTime(
          input.schedule_preference || 'optimal',
          input.custom_schedule,
          nkp.best_posting_times[platform]
        );
        
        // Create post object
        const post: Post = {
          id: generatePostId(),
          user_id: state.user_id,
          agent_id: state.agent_id,
          platform,
          content_type: contentType,
          caption: content.caption,
          hashtags: formatHashtags(content.hashtags),
          cta: content.cta,
          image_prompt: content.image_prompt,
          reel_script: content.reel_script,
          carousel_slides: content.carousel_slides,
          scheduled_at: scheduledAt,
          status: user.approval_required ? 'pending_approval' : 'approved',
          retry_count: 0,
          created_at: new Date(),
          updated_at: new Date(),
        };
        
        // Validate post
        const validation = validatePost(post);
        if (!validation.valid) {
          errors.push(`Validation failed for ${platform}: ${validation.errors.join(', ')}`);
          continue;
        }
        
        // Save to database
        const savedPost = await supabaseCreatePost(post);
        if (savedPost) {
          posts.push(savedPost);
          if (content.image_prompt) {
            imagePrompts.push(content.image_prompt);
          }
        } else {
          errors.push(`Failed to save post for ${platform}`);
        }
      } catch (error) {
        errors.push(`Error generating ${platform} content: ${error}`);
      }
    }
  }
  
  // Build output
  const output: ContentCreatorOutput = {
    posts,
    image_prompts: imagePrompts,
    requires_approval: user.approval_required,
  };
  
  return {
    user,
    nkp,
    posts: [...state.posts, ...posts],
    content_creator_output: output,
    errors: [...state.errors, ...errors],
    warnings: errors.length > 0 ? [...state.warnings, `${errors.length} content generation errors`] : state.warnings,
    current_step: 'content_creator_complete',
    next_step: user.approval_required ? 'approval' : 'scheduler',
  };
}

/**
 * Get default content type for a platform
 */
function getDefaultContentType(platform: Platform): ContentType {
  switch (platform) {
    case 'tiktok':
      return 'shorts';
    case 'instagram':
      return 'post';
    default:
      return 'post';
  }
}

/**
 * Calculate scheduled time based on preference
 */
function calculateScheduledTime(
  preference: 'now' | 'optimal' | 'custom',
  customTime?: Date,
  bestTimes?: string[]
): Date {
  if (preference === 'now') {
    return new Date();
  }
  
  if (preference === 'custom' && customTime) {
    return new Date(customTime);
  }
  
  // Optimal: Use best posting time from NKP
  if (bestTimes && bestTimes.length > 0) {
    const now = new Date();
    const [hour] = bestTimes[0].split(':').map(Number);
    
    const scheduled = new Date(now);
    scheduled.setHours(hour, 0, 0, 0);
    
    // If best time already passed today, schedule for tomorrow
    if (scheduled <= now) {
      scheduled.setDate(scheduled.getDate() + 1);
    }
    
    return scheduled;
  }
  
  // Default: 1 hour from now
  const scheduled = new Date();
  scheduled.setHours(scheduled.getHours() + 1);
  return scheduled;
}
