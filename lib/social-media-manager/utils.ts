/**
 * Social Media Manager - Utility Functions
 */

import {
  Post,
  Platform,
  ContentType,
  PostStatus,
  TrendTopic,
  TrendingAudio,
  EngagementIntent,
  Language,
  NicheKnowledgePack,
  CarouselSlide,
  ReelScript,
  AnalyticsInsight,
  DEFAULT_SMM_CONFIG,
} from './types';

// =============================================================================
// ID GENERATION
// =============================================================================

export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return prefix ? `${prefix}_${timestamp}_${randomPart}` : `${timestamp}_${randomPart}`;
}

export function generatePostId(): string {
  return generateId('post');
}

export function generateScanId(): string {
  return generateId('scan');
}

// =============================================================================
// CONTENT FORMATTING
// =============================================================================

export function formatCaption(
  caption: string,
  hashtags: string[],
  cta: string,
  platform: Platform
): string {
  const maxLength = getPlatformCharLimit(platform);
  
  let formatted = caption.trim();
  
  // Add CTA if provided
  if (cta && cta.trim()) {
    formatted += `\n\n${cta}`;
  }
  
  // Add hashtags
  if (hashtags.length > 0) {
    const hashtagStr = hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ');
    
    // Platform-specific hashtag placement
    if (platform === 'instagram' || platform === 'tiktok') {
      // Instagram/TikTok: hashtags at the end, sometimes in comment
      formatted += `\n\n${hashtagStr}`;
    } else if (platform === 'linkedin') {
      // LinkedIn: fewer hashtags, at the end
      const topHashtags = hashtags.slice(0, 5).map(h => h.startsWith('#') ? h : `#${h}`).join(' ');
      formatted += `\n\n${topHashtags}`;
    } else if (platform === 'twitter') {
      // Twitter: integrate hashtags naturally, limit due to char count
      const topHashtags = hashtags.slice(0, 3).map(h => h.startsWith('#') ? h : `#${h}`).join(' ');
      formatted += ` ${topHashtags}`;
    } else {
      formatted += `\n\n${hashtagStr}`;
    }
  }
  
  // Truncate if too long
  if (formatted.length > maxLength) {
    formatted = formatted.substring(0, maxLength - 3) + '...';
  }
  
  return formatted;
}

export function getPlatformCharLimit(platform: Platform): number {
  switch (platform) {
    case 'twitter':
      return DEFAULT_SMM_CONFIG.twitter_char_limit;
    case 'instagram':
      return DEFAULT_SMM_CONFIG.instagram_caption_max;
    case 'linkedin':
      return DEFAULT_SMM_CONFIG.linkedin_char_limit;
    case 'tiktok':
      return DEFAULT_SMM_CONFIG.tiktok_caption_max;
    case 'facebook':
      return 63206; // Facebook's limit
    default:
      return 2000;
  }
}

export function formatHashtags(hashtags: string[]): string[] {
  return hashtags.map(h => {
    const cleaned = h.trim().replace(/^#+/, '');
    return cleaned.toLowerCase().replace(/\s+/g, '');
  }).filter(h => h.length > 0);
}

// =============================================================================
// PLATFORM-SPECIFIC CONTENT
// =============================================================================

export function buildPlatformPrompt(
  platform: Platform,
  contentType: ContentType,
  nkp: NicheKnowledgePack,
  userRequest: string,
  language: Language
): string {
  const formatInfo = nkp.content_formats[contentType];
  const tone = nkp.tone_preset;
  const audience = nkp.audience_persona;
  
  const languageInstructions = getLanguageInstructions(language);
  
  return `You are a social media content creator for ${nkp.niche_name}.

PLATFORM: ${platform.toUpperCase()}
CONTENT TYPE: ${contentType}
TONE: ${tone}

AUDIENCE PERSONA:
- Name: ${audience.name}
- Age: ${audience.age_range}
- Interests: ${audience.interests.join(', ')}
- Pain points: ${audience.pain_points.join(', ')}

CONTENT PILLARS:
${nkp.content_pillars.map(p => `- ${p.name}: ${p.description}`).join('\n')}

HOOK TEMPLATES:
${nkp.hook_templates.slice(0, 5).map(h => `- "${h}"`).join('\n')}

CTA LIBRARY:
${nkp.cta_library.slice(0, 5).map(c => `- "${c}"`).join('\n')}

${formatInfo ? `BEST PRACTICES FOR ${contentType.toUpperCase()}:
${formatInfo.best_practices.join('\n- ')}
Optimal length: ${formatInfo.optimal_length}` : ''}

${languageInstructions}

USER REQUEST: ${userRequest}

Generate a ${contentType} for ${platform} that:
1. Matches the brand tone (${tone})
2. Uses an engaging hook from the templates or creates a similar one
3. Includes a clear CTA
4. Provides relevant hashtags (${platform === 'twitter' ? '3-5' : '10-20'} hashtags)
5. Is optimized for ${platform}'s algorithm and audience behavior

Return JSON with: caption, hashtags (array), cta, image_prompt (if applicable)`;
}

function getLanguageInstructions(language: Language): string {
  switch (language) {
    case 'hindi':
      return 'LANGUAGE: Write the content in Hindi (Devanagari script). Keep hashtags in English.';
    case 'hinglish':
      return 'LANGUAGE: Write in Hinglish (Hindi written in Roman script, mixed with English). Keep a conversational tone.';
    case 'english':
    default:
      return 'LANGUAGE: Write in English.';
  }
}

// =============================================================================
// REEL/VIDEO CONTENT
// =============================================================================

export function buildReelPrompt(
  platform: Platform,
  nkp: NicheKnowledgePack,
  userRequest: string,
  trendingAudio?: TrendingAudio
): string {
  return `Create a viral ${platform === 'tiktok' ? 'TikTok' : 'Instagram Reel'} script.

NICHE: ${nkp.niche_name}
TONE: ${nkp.tone_preset}
${trendingAudio ? `TRENDING AUDIO: "${trendingAudio.title}" by ${trendingAudio.artist} (${trendingAudio.use_count} uses)` : ''}

USER REQUEST: ${userRequest}

Create a script with:
1. HOOK (0-3 seconds): Grab attention immediately
2. BODY (4-25 seconds): Deliver value/entertainment
3. CTA (26-30 seconds): Clear call to action

Format:
{
  "hook": "Opening line/action",
  "body": "Main content with scene directions",
  "cta": "Closing call to action",
  "caption": "Caption for the post",
  "hashtags": ["array", "of", "hashtags"]
}`;
}

export function buildCarouselPrompt(
  platform: Platform,
  nkp: NicheKnowledgePack,
  userRequest: string,
  slideCount: number = 10
): string {
  return `Create a ${slideCount}-slide carousel for ${platform}.

NICHE: ${nkp.niche_name}
TONE: ${nkp.tone_preset}

USER REQUEST: ${userRequest}

Create slides with:
1. SLIDE 1: Eye-catching hook/title
2. SLIDES 2-${slideCount - 1}: Value-packed content (one key point per slide)
3. SLIDE ${slideCount}: CTA + summary

Format:
{
  "slides": [
    { "slide_number": 1, "headline": "...", "body": "...", "image_prompt": "..." },
    ...
  ],
  "caption": "Caption for the post",
  "hashtags": ["array", "of", "hashtags"]
}`;
}

// =============================================================================
// TREND ANALYSIS
// =============================================================================

export function scoreTrendRelevance(
  trend: string,
  nicheKeywords: string[],
  audienceInterests: string[]
): number {
  const trendLower = trend.toLowerCase();
  let score = 0;
  
  // Check keyword matches
  for (const keyword of nicheKeywords) {
    if (trendLower.includes(keyword.toLowerCase())) {
      score += 3;
    }
  }
  
  // Check audience interest matches
  for (const interest of audienceInterests) {
    if (trendLower.includes(interest.toLowerCase())) {
      score += 2;
    }
  }
  
  // Cap at 10
  return Math.min(score, 10);
}

export function buildTrendScoringPrompt(
  trends: { twitter: TrendTopic[]; google: TrendTopic[]; audio: TrendingAudio[] },
  niches: string[],
  nicheKeywords: Record<string, string[]>
): string {
  return `You are a social media trend analyst for Indian SMBs.

TRENDING TOPICS (Twitter/X):
${trends.twitter.map(t => `- ${t.name} (${t.tweet_volume || 'N/A'} tweets)`).join('\n')}

TRENDING ON GOOGLE:
${trends.google.map(t => `- ${t.name}`).join('\n')}

TRENDING AUDIO (Reels):
${trends.audio.map(a => `- "${a.title}" by ${a.artist} (${a.use_count} uses)`).join('\n')}

NICHES WE SERVE: ${niches.join(', ')}

NICHE KEYWORDS:
${Object.entries(nicheKeywords).map(([niche, keywords]) => `${niche}: ${keywords.join(', ')}`).join('\n')}

For each niche, identify 1-3 trending topics/audio that could be leveraged for content creation.

Return JSON:
{
  "[niche]": [
    {
      "trend": "trend name",
      "relevance_score": 1-10,
      "content_angle": "how to use this trend for content"
    }
  ]
}`;
}

// =============================================================================
// ENGAGEMENT CLASSIFICATION
// =============================================================================

export function buildEngagementClassificationPrompt(
  content: string,
  context: { post_caption?: string; sender_name?: string }
): string {
  return `Classify the intent of this social media engagement.

${context.post_caption ? `ORIGINAL POST: "${context.post_caption}"` : ''}
${context.sender_name ? `FROM: ${context.sender_name}` : ''}
MESSAGE: "${content}"

Classify as one of:
- POSITIVE: Praise, compliments, positive feedback
- QUESTION: Asking for information, clarification
- COMPLAINT: Negative feedback, issues, problems
- SPAM: Promotional, irrelevant, bot-like
- ENGAGEMENT: Simple engagement (emoji, "nice!", etc.)
- LEAD: Purchase intent, pricing questions, serious inquiry

Return JSON:
{
  "intent": "INTENT_TYPE",
  "confidence": 0.0-1.0,
  "is_lead": true/false,
  "lead_score": 0.0-1.0 (if is_lead),
  "suggested_reply": "appropriate reply if not SPAM"
}`;
}

export function buildAutoReplyPrompt(
  intent: EngagementIntent,
  content: string,
  brandTone: string,
  context: { post_caption?: string; niche?: string }
): string {
  return `Generate a ${brandTone} reply to this ${intent.toLowerCase()} engagement.

${context.post_caption ? `ORIGINAL POST: "${context.post_caption}"` : ''}
${context.niche ? `BRAND NICHE: ${context.niche}` : ''}
THEIR MESSAGE: "${content}"
INTENT: ${intent}

Guidelines:
- Keep it short and genuine (1-2 sentences max)
- Match the brand tone: ${brandTone}
- ${intent === 'QUESTION' ? 'Answer helpfully' : ''}
- ${intent === 'POSITIVE' ? 'Thank them genuinely' : ''}
- ${intent === 'ENGAGEMENT' ? 'Simple acknowledgment with emoji' : ''}
- Do NOT sound like a bot
- Do NOT over-promote

Return just the reply text, no JSON.`;
}

// =============================================================================
// ANALYTICS
// =============================================================================

export function calculateEngagementRate(
  likes: number,
  comments: number,
  shares: number,
  saves: number,
  impressions: number
): number {
  if (impressions === 0) return 0;
  const totalEngagement = likes + comments + shares + saves;
  return (totalEngagement / impressions) * 100;
}

export function findBestPostingTime(
  posts: Array<{ published_at: Date; engagement_rate: number }>
): { hour: number; day: string } {
  const hourEngagement: Record<number, number[]> = {};
  const dayEngagement: Record<string, number[]> = {};
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  for (const post of posts) {
    if (!post.published_at) continue;
    const date = new Date(post.published_at);
    const hour = date.getHours();
    const day = days[date.getDay()];
    
    if (!hourEngagement[hour]) hourEngagement[hour] = [];
    if (!dayEngagement[day]) dayEngagement[day] = [];
    
    hourEngagement[hour].push(post.engagement_rate);
    dayEngagement[day].push(post.engagement_rate);
  }
  
  // Find best hour
  let bestHour = 9;
  let bestHourAvg = 0;
  for (const [hour, rates] of Object.entries(hourEngagement)) {
    const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
    if (avg > bestHourAvg) {
      bestHourAvg = avg;
      bestHour = parseInt(hour);
    }
  }
  
  // Find best day
  let bestDay = 'Wednesday';
  let bestDayAvg = 0;
  for (const [day, rates] of Object.entries(dayEngagement)) {
    const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
    if (avg > bestDayAvg) {
      bestDayAvg = avg;
      bestDay = day;
    }
  }
  
  return { hour: bestHour, day: bestDay };
}

export function buildAnalyticsInsightsPrompt(
  metrics: {
    total_posts: number;
    total_impressions: number;
    avg_engagement_rate: number;
    best_post: Post;
    platform_breakdown: Record<Platform, { posts: number; engagement_rate: number }>;
  }
): string {
  return `Analyze these social media metrics and provide 3 actionable insights.

METRICS (Last 7 Days):
- Total Posts: ${metrics.total_posts}
- Total Impressions: ${metrics.total_impressions.toLocaleString()}
- Average Engagement Rate: ${metrics.avg_engagement_rate.toFixed(2)}%

BEST PERFORMING POST:
- Platform: ${metrics.best_post.platform}
- Type: ${metrics.best_post.content_type}
- Caption preview: "${metrics.best_post.caption.substring(0, 100)}..."

PLATFORM BREAKDOWN:
${Object.entries(metrics.platform_breakdown).map(([p, m]) => 
  `- ${p}: ${m.posts} posts, ${m.engagement_rate.toFixed(2)}% avg engagement`
).join('\n')}

Generate 3 actionable insights as JSON:
[
  {
    "type": "positive|improvement|recommendation",
    "title": "Short title",
    "description": "Detailed insight",
    "action": "Specific action to take"
  }
]`;
}

// =============================================================================
// APPROVAL WORKFLOW
// =============================================================================

export function buildApprovalPreview(post: Post): string {
  const preview = `📱 *${post.platform.toUpperCase()} ${post.content_type.toUpperCase()}*

📝 *Caption:*
${post.caption}

#️⃣ *Hashtags:*
${post.hashtags.slice(0, 10).map(h => `#${h}`).join(' ')}

📅 *Scheduled:*
${formatScheduleTime(post.scheduled_at)}

${post.image_prompt ? `🎨 *Image Prompt:*\n${post.image_prompt}` : ''}
${post.reel_script ? `🎬 *Reel Script:*\nHook: ${post.reel_script.hook}\nCTA: ${post.reel_script.cta}` : ''}

Reply with:
✅ APPROVE - Post as scheduled
✏️ EDIT - Request changes
❌ REJECT - Discard post
🕐 RESCHEDULE - Change time`;

  return preview;
}

export function formatScheduleTime(date: Date): string {
  const d = new Date(date);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  };
  return d.toLocaleString('en-IN', options) + ' IST';
}

export function parseApprovalResponse(response: string): {
  action: string;
  editInstructions?: string;
  newTime?: string;
} {
  const upper = response.toUpperCase().trim();
  
  if (upper.startsWith('APPROVE') || upper === '✅' || upper === 'YES' || upper === 'OK') {
    return { action: 'APPROVE' };
  }
  
  if (upper.startsWith('REJECT') || upper === '❌' || upper === 'NO') {
    return { action: 'REJECT' };
  }
  
  if (upper.startsWith('RESCHEDULE') || upper === '🕐') {
    // Try to extract time from response
    const timeMatch = response.match(/(\d{1,2}[:\.]?\d{0,2}\s*(am|pm)?|\d{1,2}\s*(am|pm))/i);
    return { action: 'RESCHEDULE', newTime: timeMatch ? timeMatch[0] : undefined };
  }
  
  if (upper.startsWith('EDIT') || upper === '✏️') {
    // Extract edit instructions (everything after EDIT)
    const instructions = response.replace(/^edit\s*/i, '').trim();
    return { action: 'EDIT', editInstructions: instructions || undefined };
  }
  
  // Default: treat as edit instructions
  return { action: 'EDIT', editInstructions: response };
}

// =============================================================================
// WHATSAPP MESSAGE BUILDERS
// =============================================================================

export function buildTrendAlertMessage(
  trend: TrendTopic,
  niche: string
): string {
  return `🔥 *Trend Alert!*

📈 *${trend.name}*

Relevance for ${niche}: ${trend.relevance_score}/10

💡 *Content Angle:*
${trend.content_angle || 'Multiple angles possible for this trend'}

Reply 'CREATE' to generate content for this trend!`;
}

export function buildAnalyticsReportMessage(
  totalPosts: number,
  totalImpressions: number,
  avgEngagementRate: number,
  bestHour: number,
  insights: AnalyticsInsight[]
): string {
  return `📊 *Weekly Analytics Report*

📱 Posts Published: ${totalPosts}
👀 Total Impressions: ${totalImpressions.toLocaleString()}
💬 Avg Engagement: ${avgEngagementRate.toFixed(2)}%
⏰ Best Posting Time: ${bestHour}:00

🧠 *AI Insights:*
${insights.slice(0, 3).map((i, idx) => `${idx + 1}. ${i.title}`).join('\n')}

Reply 'DETAILS' for full report`;
}

export function buildPublishConfirmationMessage(
  post: Post,
  platformPostId: string
): string {
  return `✅ *Post Published!*

📱 Platform: ${post.platform}
🆔 Post ID: ${platformPostId}
⏰ Published: ${formatScheduleTime(new Date())}

${post.platform === 'instagram' ? '📸 View on Instagram' : ''}
${post.platform === 'linkedin' ? '💼 View on LinkedIn' : ''}
${post.platform === 'twitter' ? '🐦 View on Twitter/X' : ''}`;
}

export function buildLeadAlertMessage(
  senderName: string,
  content: string,
  platform: Platform,
  leadScore: number
): string {
  return `🎯 *Lead Detected!*

👤 From: ${senderName}
📱 Platform: ${platform}
📊 Lead Score: ${(leadScore * 100).toFixed(0)}%

💬 Message:
"${content.substring(0, 200)}${content.length > 200 ? '...' : ''}"

This looks like a potential customer. Follow up soon!`;
}

// =============================================================================
// VALIDATION
// =============================================================================

export function validatePost(post: Partial<Post>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!post.user_id) errors.push('user_id is required');
  if (!post.platform) errors.push('platform is required');
  if (!post.content_type) errors.push('content_type is required');
  if (!post.caption || post.caption.trim().length === 0) errors.push('caption is required');
  
  if (post.platform && post.caption) {
    const limit = getPlatformCharLimit(post.platform);
    if (post.caption.length > limit) {
      errors.push(`caption exceeds ${post.platform} limit of ${limit} characters`);
    }
  }
  
  if (post.hashtags && post.hashtags.length > 30) {
    errors.push('too many hashtags (max 30)');
  }
  
  return { valid: errors.length === 0, errors };
}

export function validateScheduleTime(scheduledAt: Date): { valid: boolean; error?: string } {
  const now = new Date();
  const scheduled = new Date(scheduledAt);
  
  if (scheduled < now) {
    return { valid: false, error: 'scheduled time is in the past' };
  }
  
  // Can't schedule more than 90 days ahead
  const maxDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  if (scheduled > maxDate) {
    return { valid: false, error: 'cannot schedule more than 90 days ahead' };
  }
  
  return { valid: true };
}
