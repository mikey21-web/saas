/**
 * Scheduler Agent
 * 
 * Auto-publishes approved posts to multiple platforms:
 * - Meta Graph API (Instagram, Facebook)
 * - LinkedIn API
 * - TikTok API
 * - Twitter/X API
 * - Handles retries on failure
 */

import {
  WorkflowState,
  Post,
  SchedulerInput,
  SchedulerOutput,
  Platform,
  PlatformToken,
  DEFAULT_SMM_CONFIG,
} from '../types';
import {
  buildPublishConfirmationMessage,
} from '../utils';
import {
  supabaseGetPendingPosts,
  supabaseUpdatePost,
  supabaseGetUser,
  metaPublishInstagramPost,
  metaPublishFacebookPost,
  linkedinPublishPost,
  tiktokPublishVideo,
  twitterPublishTweet,
  whatsappSendMessage,
} from '../integrations';

// =============================================================================
// SCHEDULER AGENT
// =============================================================================

interface PublishResult {
  success: boolean;
  platformPostId?: string;
  error?: string;
}

/**
 * Get platform token for a user
 */
function getPlatformToken(
  tokens: PlatformToken[],
  platform: Platform
): PlatformToken | undefined {
  return tokens.find(t => t.platform === platform);
}

/**
 * Publish to Instagram
 */
async function publishToInstagram(
  post: Post,
  token: PlatformToken
): Promise<PublishResult> {
  if (!token.access_token || !token.account_id) {
    return { success: false, error: 'Missing Instagram credentials' };
  }
  
  if (!post.media_url) {
    return { success: false, error: 'Instagram post requires media_url' };
  }
  
  try {
    const response = await metaPublishInstagramPost(
      token.access_token,
      token.account_id,
      post.media_url,
      `${post.caption}\n\n${post.hashtags.map(h => `#${h}`).join(' ')}`
    );
    
    if (response.error) {
      return { success: false, error: response.error.message };
    }
    
    return { success: true, platformPostId: response.id };
  } catch (error) {
    return { success: false, error: `Instagram API error: ${error}` };
  }
}

/**
 * Publish to Facebook
 */
async function publishToFacebook(
  post: Post,
  token: PlatformToken
): Promise<PublishResult> {
  if (!token.access_token || !token.page_id) {
    return { success: false, error: 'Missing Facebook credentials' };
  }
  
  try {
    const response = await metaPublishFacebookPost(
      token.access_token,
      token.page_id,
      `${post.caption}\n\n${post.hashtags.slice(0, 10).map(h => `#${h}`).join(' ')}`,
      undefined,
      post.media_url
    );
    
    if (response.error) {
      return { success: false, error: response.error.message };
    }
    
    return { success: true, platformPostId: response.id };
  } catch (error) {
    return { success: false, error: `Facebook API error: ${error}` };
  }
}

/**
 * Publish to LinkedIn
 */
async function publishToLinkedIn(
  post: Post,
  token: PlatformToken
): Promise<PublishResult> {
  if (!token.access_token || !token.account_id) {
    return { success: false, error: 'Missing LinkedIn credentials' };
  }
  
  try {
    const response = await linkedinPublishPost(
      token.access_token,
      token.account_id, // URN format: urn:li:person:xxx
      `${post.caption}\n\n${post.hashtags.slice(0, 5).map(h => `#${h}`).join(' ')}`,
      post.media_url
    );
    
    if (response.error) {
      return { success: false, error: response.error.message };
    }
    
    return { success: true, platformPostId: response.id || response.activity };
  } catch (error) {
    return { success: false, error: `LinkedIn API error: ${error}` };
  }
}

/**
 * Publish to TikTok
 */
async function publishToTikTok(
  post: Post,
  token: PlatformToken
): Promise<PublishResult> {
  if (!token.access_token) {
    return { success: false, error: 'Missing TikTok credentials' };
  }
  
  if (!post.media_url && post.content_type !== 'shorts') {
    return { success: false, error: 'TikTok requires video URL' };
  }
  
  try {
    const response = await tiktokPublishVideo(
      token.access_token,
      post.media_url || '',
      post.caption.substring(0, 150) // TikTok caption limit
    );
    
    if (response.error) {
      return { success: false, error: response.error.message };
    }
    
    return { success: true, platformPostId: response.data?.publish_id };
  } catch (error) {
    return { success: false, error: `TikTok API error: ${error}` };
  }
}

/**
 * Publish to Twitter/X
 */
async function publishToTwitter(
  post: Post,
  token: PlatformToken
): Promise<PublishResult> {
  if (!token.access_token) {
    return { success: false, error: 'Missing Twitter credentials' };
  }
  
  try {
    // Twitter has strict character limit
    let tweetText = post.caption;
    const hashtags = post.hashtags.slice(0, 3).map(h => `#${h}`).join(' ');
    
    // Calculate available space for caption
    const maxLength = DEFAULT_SMM_CONFIG.twitter_char_limit - hashtags.length - 1;
    if (tweetText.length > maxLength) {
      tweetText = tweetText.substring(0, maxLength - 3) + '...';
    }
    
    const fullTweet = `${tweetText} ${hashtags}`;
    
    const response = await twitterPublishTweet(
      token.access_token,
      fullTweet
    );
    
    if (response.errors && response.errors.length > 0) {
      return { success: false, error: response.errors[0].message };
    }
    
    return { success: true, platformPostId: response.data?.id };
  } catch (error) {
    return { success: false, error: `Twitter API error: ${error}` };
  }
}

/**
 * Publish post to the appropriate platform
 */
async function publishPost(
  post: Post,
  tokens: PlatformToken[]
): Promise<PublishResult> {
  const token = getPlatformToken(tokens, post.platform);
  
  if (!token) {
    return { success: false, error: `No token found for ${post.platform}` };
  }
  
  switch (post.platform) {
    case 'instagram':
      return publishToInstagram(post, token);
    case 'facebook':
      return publishToFacebook(post, token);
    case 'linkedin':
      return publishToLinkedIn(post, token);
    case 'tiktok':
      return publishToTikTok(post, token);
    case 'twitter':
      return publishToTwitter(post, token);
    default:
      return { success: false, error: `Unsupported platform: ${post.platform}` };
  }
}

/**
 * Main Scheduler Agent function
 */
export async function schedulerAgent(
  state: WorkflowState
): Promise<Partial<WorkflowState>> {
  const input = state.scheduler_input;
  
  if (!input) {
    return {
      errors: [...state.errors, 'Scheduler: No input provided'],
      current_step: 'scheduler_error',
    };
  }
  
  try {
    // 1. Load pending posts
    let postsToPublish: Post[];
    
    if (input.specific_post_ids && input.specific_post_ids.length > 0) {
      // Filter to specific posts (from approval handoff)
      postsToPublish = state.posts.filter(p => 
        input.specific_post_ids!.includes(p.id) && p.status === 'approved'
      );
    } else {
      // Load all pending posts from database
      postsToPublish = await supabaseGetPendingPosts();
    }
    
    if (postsToPublish.length === 0) {
      return {
        scheduler_output: {
          published: [],
          failed: [],
          queued_for_retry: [],
        },
        current_step: 'scheduler_complete',
        warnings: [...state.warnings, 'Scheduler: No posts to publish'],
      };
    }
    
    // 2. Process each post
    const published: Post[] = [];
    const failed: Post[] = [];
    const queuedForRetry: Post[] = [];
    const errors: string[] = [];
    
    // Group posts by user to load tokens efficiently
    const postsByUser = new Map<string, Post[]>();
    for (const post of postsToPublish) {
      const userPosts = postsByUser.get(post.user_id) || [];
      userPosts.push(post);
      postsByUser.set(post.user_id, userPosts);
    }
    
    // Process each user's posts
    const userEntries = Array.from(postsByUser.entries());
    for (const [userId, userPosts] of userEntries) {
      // Load user and tokens
      const user = await supabaseGetUser(userId);
      if (!user) {
        errors.push(`User not found: ${userId}`);
        failed.push(...userPosts);
        continue;
      }
      
      const tokens = user.platform_tokens || [];
      
      // Publish each post
      for (const post of userPosts) {
        const result = await publishPost(post, tokens);
        
        if (result.success) {
          // Update post status to published
          const updatedPost = await supabaseUpdatePost(post.id, {
            status: 'published',
            platform_post_id: result.platformPostId,
            published_at: new Date(),
          });
          
          if (updatedPost) {
            published.push(updatedPost);
            
            // Send WhatsApp confirmation
            const confirmMessage = buildPublishConfirmationMessage(
              updatedPost,
              result.platformPostId || ''
            );
            await whatsappSendMessage(user.phone, confirmMessage);
          }
        } else {
          // Handle failure
          const newRetryCount = post.retry_count + 1;
          
          if (newRetryCount < DEFAULT_SMM_CONFIG.max_retries) {
            // Queue for retry
            await supabaseUpdatePost(post.id, {
              retry_count: newRetryCount,
              error_message: result.error,
            });
            queuedForRetry.push({ ...post, retry_count: newRetryCount });
          } else {
            // Max retries reached, mark as failed
            const failedPost = await supabaseUpdatePost(post.id, {
              status: 'failed',
              error_message: result.error,
              retry_count: newRetryCount,
            });
            
            if (failedPost) {
              failed.push(failedPost);
              errors.push(`Post ${post.id} failed after ${newRetryCount} retries: ${result.error}`);
            }
          }
        }
      }
    }
    
    // 3. Build output
    const output: SchedulerOutput = {
      published,
      failed,
      queued_for_retry: queuedForRetry,
    };
    
    return {
      scheduler_output: output,
      published_count: state.published_count + published.length,
      failed_count: state.failed_count + failed.length,
      errors: [...state.errors, ...errors],
      current_step: 'scheduler_complete',
      next_step: published.length > 0 ? 'analytics' : undefined,
    };
  } catch (error) {
    return {
      errors: [...state.errors, `Scheduler error: ${error}`],
      current_step: 'scheduler_error',
    };
  }
}
