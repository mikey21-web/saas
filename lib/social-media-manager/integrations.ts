/**
 * Fetch trending topics from Nitter (Twitter alternative)
 */
export async function fetchNitterTrends(): Promise<TrendTopic[]> {
  try {
    const response = await fetch('https://nitter.net/search/trending');
    const text = await response.text();
    // Simple regex to extract hashtags/topics from HTML
    const regex = /<a href="\/search\?q=([^&]+)&amp;f=tweets"/g;
    const items: TrendTopic[] = [];
    let match;
    let count = 0;
    while ((match = regex.exec(text)) !== null && count < 20) {
      items.push({
        name: decodeURIComponent(match[1]),
        source: 'nitter',
        relevance_score: 0,
      });
      count++;
    }
    return items;
  } catch (error) {
    console.error('Error fetching Nitter trends:', error);
    return [];
  }
}

/**
 * Fetch trending topics from Reddit
 */
export async function fetchRedditTrends(): Promise<TrendTopic[]> {
  try {
    const response = await fetch('https://www.reddit.com/r/popular.json?limit=20');
    const data = await response.json();
    if (!data.data || !Array.isArray(data.data.children)) return [];
    return data.data.children.map((item: any) => ({
      name: item.data.title,
      source: 'reddit',
      relevance_score: 0,
    }));
  } catch (error) {
    console.error('Error fetching Reddit trends:', error);
    return [];
  }
}

/**
 * @deprecated Twitter API is deprecated. Use fetchNitterTrends instead.
 */
// export async function twitterGetTrends(...) { ... }
/**
 * Update Niche Knowledge Pack (NKP) in Supabase
 */
export async function supabaseUpdateNKP(nicheId: string, updates: Partial<NicheKnowledgePack>): Promise<NicheKnowledgePack | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('niche_knowledge_packs')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('niche_id', nicheId)
    .select()
    .single();
  if (error) {
    console.error('Error updating NKP:', error);
    return null;
  }
  return data as NicheKnowledgePack;
}
/**
 * Social Media Manager - API Integrations
 *
 * Clients for:
 * - Groq (fast LLM)
 * - OpenAI GPT-4o (complex content)
 * - Replicate (Flux image generation)
 * - Meta Graph API (Instagram, Facebook)
 * - LinkedIn API
 * - TikTok API
 * - Twitter/X API
 * - WhatsApp Business API
 * - Supabase
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Post,
  Platform,
  User,
  NicheKnowledgePack,
  TrendScan,
  TrendTopic,
  TrendingAudio,
  PostMetrics,
  AnalyticsReport,
  EngagementEvent,
  EngagementLog,
  ApprovalRequest,
  MetaGraphAPIResponse,
  LinkedInAPIResponse,
  TikTokAPIResponse,
  TwitterAPIResponse,
  DEFAULT_SMM_CONFIG,
} from './types';

// =============================================================================
// ENVIRONMENT CONFIGURATION
// =============================================================================

interface EnvConfig {
  // Supabase
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  
  // LLM APIs
  GROQ_API_KEY: string;
  OPENAI_API_KEY: string;
  
  // Meta (Facebook/Instagram)
  META_ACCESS_TOKEN: string;
  WHATSAPP_PHONE_ID: string;
  
  // LinkedIn
  LINKEDIN_ACCESS_TOKEN: string;
  
  // TikTok
  TIKTOK_ACCESS_TOKEN: string;
  
  // Twitter/X
  TWITTER_BEARER_TOKEN: string;
  TWITTER_API_KEY: string;
  TWITTER_API_SECRET: string;
  TWITTER_ACCESS_TOKEN: string;
  TWITTER_ACCESS_SECRET: string;
}

function getEnvConfig(): EnvConfig {
  return {
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    GROQ_API_KEY: process.env.GROQ_API_KEY || '',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    META_ACCESS_TOKEN: process.env.META_ACCESS_TOKEN || '',
    WHATSAPP_PHONE_ID: process.env.WHATSAPP_PHONE_ID || '',
    LINKEDIN_ACCESS_TOKEN: process.env.LINKEDIN_ACCESS_TOKEN || '',
    TIKTOK_ACCESS_TOKEN: process.env.TIKTOK_ACCESS_TOKEN || '',
    TWITTER_BEARER_TOKEN: process.env.TWITTER_BEARER_TOKEN || '',
    TWITTER_API_KEY: process.env.TWITTER_API_KEY || '',
    TWITTER_API_SECRET: process.env.TWITTER_API_SECRET || '',
    TWITTER_ACCESS_TOKEN: process.env.TWITTER_ACCESS_TOKEN || '',
    TWITTER_ACCESS_SECRET: process.env.TWITTER_ACCESS_SECRET || '',
  };
}

// =============================================================================
// SUPABASE CLIENT
// =============================================================================

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    const config = getEnvConfig();
    supabaseClient = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);
  }
  return supabaseClient;
}

// =============================================================================
// SUPABASE OPERATIONS
// =============================================================================

export async function supabaseGetUser(userId: string): Promise<User | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }
  return data as User;
}

export async function supabaseGetActiveUsers(nicheFilter?: string): Promise<User[]> {
  const supabase = getSupabaseClient();
  let query = supabase.from('users').select('*').eq('is_active', true);
  
  if (nicheFilter) {
    query = query.eq('niche_primary', nicheFilter);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching active users:', error);
    return [];
  }
  return data as User[];
}

export async function supabaseGetNKP(nicheId: string): Promise<NicheKnowledgePack | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('niche_knowledge_packs')
    .select('*')
    .eq('niche_id', nicheId)
    .single();
  
  if (error) {
    console.error('Error fetching NKP:', error);
    return null;
  }
  return data as NicheKnowledgePack;
}

export async function supabaseCreatePost(post: Partial<Post>): Promise<Post | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('content_posts')
    .insert({
      ...post,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating post:', error);
    return null;
  }
  return data as Post;
}

export async function supabaseUpdatePost(postId: string, updates: Partial<Post>): Promise<Post | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('content_posts')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', postId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating post:', error);
    return null;
  }
  return data as Post;
}

export async function supabaseGetPendingPosts(): Promise<Post[]> {
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();
  
  const { data, error } = await supabase
    .from('content_posts')
    .select('*')
    .eq('status', 'approved')
    .lte('scheduled_at', now)
    .order('scheduled_at', { ascending: true });
  
  if (error) {
    console.error('Error fetching pending posts:', error);
    return [];
  }
  return data as Post[];
}

export async function supabaseGetRecentPosts(userId: string, days: number = 7): Promise<Post[]> {
  const supabase = getSupabaseClient();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const { data, error } = await supabase
    .from('content_posts')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'published')
    .gte('published_at', startDate.toISOString())
    .order('published_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching recent posts:', error);
    return [];
  }
  return data as Post[];
}

export async function supabaseSaveTrendScan(scan: TrendScan): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('trend_scans').insert({
    scan_id: scan.scan_id,
    scanned_at: scan.scanned_at,
    raw_trends: JSON.stringify({
      twitter: scan.twitter_topics,
      google: scan.google_topics,
      instagram_audio: scan.instagram_audio,
      tiktok_audio: scan.tiktok_audio,
    }),
    scored_trends: JSON.stringify(scan.scored_trends),
    high_relevance_count: scan.high_relevance_count,
  });
  
  if (error) {
    console.error('Error saving trend scan:', error);
  }
}

export async function supabaseSaveAnalyticsReport(report: AnalyticsReport): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('analytics_reports').insert({
    ...report,
    ai_insights: JSON.stringify(report.ai_insights),
    platform_breakdown: JSON.stringify(report.platform_breakdown),
  });
  
  if (error) {
    console.error('Error saving analytics report:', error);
  }
}

export async function supabaseSaveEngagementLog(log: EngagementLog): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('engagement_logs').insert({
    ...log,
    event: JSON.stringify(log.event),
  });
  
  if (error) {
    console.error('Error saving engagement log:', error);
  }
}

export async function supabaseSaveApprovalRequest(request: ApprovalRequest): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('approval_requests').insert(request);
  
  if (error) {
    console.error('Error saving approval request:', error);
  }
}

export async function supabaseUpdateApprovalRequest(
  requestId: string,
  updates: Partial<ApprovalRequest>
): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('approval_requests')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', requestId);
  
  if (error) {
    console.error('Error updating approval request:', error);
  }
}

// =============================================================================
// GROQ API (Fast LLM)
// =============================================================================

export async function groqChat(
  prompt: string,
  options: { temperature?: number; maxTokens?: number } = {}
): Promise<string> {
  const config = getEnvConfig();
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: DEFAULT_SMM_CONFIG.groq_model,
      messages: [{ role: 'user', content: prompt }],
      temperature: options.temperature ?? DEFAULT_SMM_CONFIG.temperature,
      max_tokens: options.maxTokens ?? DEFAULT_SMM_CONFIG.max_tokens,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${error}`);
  }
  
  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

export async function groqChatJSON<T>(
  prompt: string,
  options: { temperature?: number; maxTokens?: number } = {}
): Promise<T | null> {
  const response = await groqChat(prompt, options);
  
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as T;
    }
    return null;
  } catch (error) {
    console.error('Error parsing Groq JSON response:', error);
    return null;
  }
}

// =============================================================================
// OPENAI API (GPT-4o for complex content)
// =============================================================================

export async function openaiChat(
  prompt: string,
  options: { temperature?: number; maxTokens?: number } = {}
): Promise<string> {
  const config = getEnvConfig();
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: DEFAULT_SMM_CONFIG.gpt_model,
      messages: [{ role: 'user', content: prompt }],
      temperature: options.temperature ?? DEFAULT_SMM_CONFIG.temperature,
      max_tokens: options.maxTokens ?? DEFAULT_SMM_CONFIG.max_tokens,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }
  
  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

export async function openaiChatJSON<T>(
  prompt: string,
  options: { temperature?: number; maxTokens?: number } = {}
): Promise<T | null> {
  const response = await openaiChat(prompt, options);
  
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as T;
    }
    return null;
  } catch (error) {
    console.error('Error parsing OpenAI JSON response:', error);
    return null;
  }
}

// =============================================================================
// META GRAPH API (Instagram & Facebook)
// =============================================================================

export async function metaPublishInstagramPost(
  userAccessToken: string,
  igAccountId: string,
  imageUrl: string,
  caption: string
): Promise<MetaGraphAPIResponse> {
  // Step 1: Create media container
  const containerResponse = await fetch(
    `https://graph.facebook.com/v18.0/${igAccountId}/media`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: imageUrl,
        caption: caption,
        access_token: userAccessToken,
      }),
    }
  );
  
  const containerData = await containerResponse.json();
  if (containerData.error) {
    return { error: containerData.error };
  }
  
  const containerId = containerData.id;
  
  // Step 2: Publish the container
  const publishResponse = await fetch(
    `https://graph.facebook.com/v18.0/${igAccountId}/media_publish`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: containerId,
        access_token: userAccessToken,
      }),
    }
  );
  
  return publishResponse.json();
}

export async function metaPublishFacebookPost(
  pageAccessToken: string,
  pageId: string,
  message: string,
  link?: string,
  imageUrl?: string
): Promise<MetaGraphAPIResponse> {
  const endpoint = imageUrl
    ? `https://graph.facebook.com/v18.0/${pageId}/photos`
    : `https://graph.facebook.com/v18.0/${pageId}/feed`;
  
  const body: Record<string, string> = {
    access_token: pageAccessToken,
  };
  
  if (imageUrl) {
    body.url = imageUrl;
    body.caption = message;
  } else {
    body.message = message;
    if (link) body.link = link;
  }
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  
  return response.json();
}

export async function metaGetInsights(
  accessToken: string,
  mediaId: string,
  metrics: string[] = ['impressions', 'reach', 'engagement', 'saved']
): Promise<PostMetrics | null> {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${mediaId}/insights?metric=${metrics.join(',')}&access_token=${accessToken}`
  );
  
  const data = await response.json();
  if (data.error) {
    console.error('Error fetching insights:', data.error);
    return null;
  }
  
  const metricsMap: Record<string, number> = {};
  for (const item of data.data || []) {
    metricsMap[item.name] = item.values[0]?.value || 0;
  }
  
  return {
    post_id: mediaId,
    platform: 'instagram',
    impressions: metricsMap.impressions || 0,
    reach: metricsMap.reach || 0,
    engagement: metricsMap.engagement || 0,
    likes: metricsMap.likes || 0,
    comments: metricsMap.comments || 0,
    shares: metricsMap.shares || 0,
    saves: metricsMap.saved || 0,
    clicks: metricsMap.clicks || 0,
    engagement_rate: 0,
    fetched_at: new Date(),
  };
}

export async function metaReplyToComment(
  accessToken: string,
  commentId: string,
  message: string
): Promise<MetaGraphAPIResponse> {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${commentId}/replies`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        access_token: accessToken,
      }),
    }
  );
  
  return response.json();
}

// =============================================================================
// LINKEDIN API
// =============================================================================

export async function linkedinPublishPost(
  accessToken: string,
  authorUrn: string, // urn:li:person:xxx or urn:li:organization:xxx
  text: string,
  imageUrl?: string
): Promise<LinkedInAPIResponse> {
  const shareContent: Record<string, unknown> = {
    author: authorUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text },
        shareMediaCategory: imageUrl ? 'IMAGE' : 'NONE',
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  };
  
  if (imageUrl) {
    // For images, need to upload first then reference
    // Simplified: using URL reference
    (shareContent.specificContent as Record<string, unknown>)['com.linkedin.ugc.ShareContent'] = {
      ...((shareContent.specificContent as Record<string, unknown>)['com.linkedin.ugc.ShareContent'] as Record<string, unknown>),
      media: [
        {
          status: 'READY',
          originalUrl: imageUrl,
        },
      ],
    };
  }
  
  const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(shareContent),
  });
  
  return response.json();
}

// =============================================================================
// TIKTOK API
// =============================================================================

export async function tiktokPublishVideo(
  accessToken: string,
  videoUrl: string,
  caption: string
): Promise<TikTokAPIResponse> {
  // TikTok requires video upload flow
  // Simplified: using direct post endpoint
  const response = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      post_info: {
        title: caption.substring(0, 150),
        privacy_level: 'PUBLIC_TO_EVERYONE',
      },
      source_info: {
        source: 'PULL_FROM_URL',
        video_url: videoUrl,
      },
    }),
  });
  
  return response.json();
}

// =============================================================================
// TWITTER/X API
// =============================================================================

export async function twitterPublishTweet(
  accessToken: string,
  text: string,
  mediaId?: string
): Promise<TwitterAPIResponse> {
  const body: Record<string, unknown> = { text };
  if (mediaId) {
    body.media = { media_ids: [mediaId] };
  }
  
  const response = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  
  return response.json();
}

export async function twitterGetTrends(woeid: number = 23424848): Promise<TrendTopic[]> {
  const config = getEnvConfig();
  const response = await fetch(
    `https://api.twitter.com/1.1/trends/place.json?id=${woeid}`,
    {
      headers: {
        'Authorization': `Bearer ${config.TWITTER_BEARER_TOKEN}`,
      },
    }
  );
  
  const data = await response.json();
  if (!Array.isArray(data) || !data[0]?.trends) {
    return [];
  }
  
  return data[0].trends.slice(0, 20).map((t: Record<string, unknown>) => ({
    name: t.name as string,
    source: 'twitter' as const,
    tweet_volume: t.tweet_volume as number | undefined,
    url: t.url as string,
    relevance_score: 0,
  }));
}

// =============================================================================
// WHATSAPP BUSINESS API
// =============================================================================

export async function whatsappSendMessage(
  phoneNumber: string,
  message: string
): Promise<boolean> {
  const config = getEnvConfig();
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${config.WHATSAPP_PHONE_ID}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.META_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phoneNumber.replace(/\D/g, ''),
        type: 'text',
        text: { body: message },
      }),
    }
  );
  
  const data = await response.json();
  return !data.error;
}

export async function whatsappSendTemplate(
  phoneNumber: string,
  templateName: string,
  parameters: string[]
): Promise<boolean> {
  const config = getEnvConfig();
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${config.WHATSAPP_PHONE_ID}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.META_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phoneNumber.replace(/\D/g, ''),
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'en' },
          components: [
            {
              type: 'body',
              parameters: parameters.map(p => ({ type: 'text', text: p })),
            },
          ],
        },
      }),
    }
  );
  
  const data = await response.json();
  return !data.error;
}

// =============================================================================
// TREND FETCHING
// =============================================================================

export async function fetchGoogleTrends(): Promise<TrendTopic[]> {
  try {
    const response = await fetch(
      'https://trends.google.com/trends/trendingsearches/daily/rss?geo=IN'
    );
    const text = await response.text();
    
    // Parse RSS XML (simplified)
    const items: TrendTopic[] = [];
    const regex = /<title>([^<]+)<\/title>/g;
    let match: RegExpExecArray | null;
    let count = 0;
    while ((match = regex.exec(text)) !== null) {
      if (count > 0 && count <= 20) { // Skip first title (feed title)
        items.push({
          name: match[1],
          source: 'google',
          relevance_score: 0,
        });
      }
      count++;
    }
    
    return items;
  } catch (error) {
    console.error('Error fetching Google Trends:', error);
    return [];
  }
}

export async function fetchInstagramTrendingAudio(): Promise<TrendingAudio[]> {
  // Instagram trending audio requires authenticated session
  // This would typically use a scraping service or partner API
  // Returning empty for now - implement with actual service
  return [];
}

// =============================================================================
// UTILITY: SMART LLM ROUTING
// =============================================================================

export async function smartLLMChat(
  prompt: string,
  complexity: 'simple' | 'complex' = 'simple'
): Promise<string> {
  if (complexity === 'complex') {
    return openaiChat(prompt);
  }
  return groqChat(prompt);
}

export async function smartLLMChatJSON<T>(
  prompt: string,
  complexity: 'simple' | 'complex' = 'simple'
): Promise<T | null> {
  if (complexity === 'complex') {
    return openaiChatJSON<T>(prompt);
  }
  return groqChatJSON<T>(prompt);
}

// =============================================================================
// REPLICATE - IMAGE GENERATION WITH FLUX
// =============================================================================

export async function replicateGenerateImage(
  prompt: string,
  options?: {
    width?: number;
    height?: number;
    steps?: number;
    guidance?: number;
  }
): Promise<string | null> {
  const apiKey = process.env.REPLICATE_API_TOKEN;
  if (!apiKey) {
    console.error('REPLICATE_API_TOKEN not set');
    return null;
  }

  try {
    // Create prediction
    const createRes = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        Authorization: `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'fed7149b2fe858fc7aec6cb67e17c5d8935ff4a7', // Flux dev
        input: {
          prompt,
          width: options?.width || 1024,
          height: options?.height || 1024,
          num_outputs: 1,
          num_inference_steps: options?.steps || 28,
          guidance_scale: options?.guidance || 3.5,
        },
      }),
    });

    if (!createRes.ok) {
      const error = await createRes.text();
      console.error('Replicate create prediction error:', error);
      return null;
    }

    const prediction = (await createRes.json()) as any;
    const predictionId = prediction.id;

    // Poll for completion (max 5 minutes)
    let attempts = 0;
    const maxAttempts = 60;

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      attempts++;

      const statusRes = await fetch(
        `https://api.replicate.com/v1/predictions/${predictionId}`,
        {
          headers: { Authorization: `Token ${apiKey}` },
        }
      );

      if (!statusRes.ok) continue;

      const status = (await statusRes.json()) as any;

      if (status.status === 'succeeded') {
        const output = status.output as string[];
        if (output && output.length > 0) {
          return output[0];
        }
      } else if (status.status === 'failed') {
        console.error('Replicate prediction failed:', status.error);
        return null;
      }
    }

    console.error('Replicate prediction timeout');
    return null;
  } catch (error) {
    console.error('Replicate image generation error:', error);
    return null;
  }
}

export function optimizeImagePrompt(
  originalPrompt: string,
  platform: 'instagram' | 'tiktok' | 'linkedin' | 'twitter' | 'facebook'
): string {
  const platformSpecs: Record<string, string> = {
    instagram:
      'Instagram feed post, high quality, vibrant colors, professional, 1024x1024',
    tiktok: 'TikTok thumbnail, eye-catching, bold colors, 1080x1920 vertical',
    linkedin:
      'LinkedIn professional post, corporate, clean design, business-appropriate, 1200x628',
    twitter: 'Twitter post image, attention-grabbing, readable on mobile, 1200x675',
    facebook: 'Facebook post image, engaging, shareable, 1200x628',
  };

  return `${originalPrompt}. ${platformSpecs[platform] || platformSpecs.instagram}. Professional, high quality, trending style.`;
}
