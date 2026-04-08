/**
 * Analytics Agent
 * 
 * Tracks engagement and suggests optimizations:
 * - Fetches metrics from Meta API
 * - Calculates engagement rates
 * - Generates AI-powered insights
 * - Sends daily/weekly reports via WhatsApp
 */

import {
  WorkflowState,
  Post,
  PostMetrics,
  AnalyticsReport,
  AnalyticsInsight,
  AnalyticsOutput,
  Platform,
  User,
} from '../types';
import {
  generateId,
  calculateEngagementRate,
  findBestPostingTime,
  buildAnalyticsInsightsPrompt,
  buildAnalyticsReportMessage,
} from '../utils';
import {
  supabaseGetActiveUsers,
  supabaseGetRecentPosts,
  supabaseSaveAnalyticsReport,
  metaGetInsights,
  groqChatJSON,
  whatsappSendMessage,
} from '../integrations';

// =============================================================================
// ANALYTICS AGENT
// =============================================================================

/**
 * Fetch metrics for a single post
 */
async function fetchPostMetrics(
  post: Post,
  accessToken: string
): Promise<PostMetrics | null> {
  if (!post.platform_post_id) {
    return null;
  }
  
  // Currently only Meta API supported
  if (post.platform === 'instagram' || post.platform === 'facebook') {
    return metaGetInsights(accessToken, post.platform_post_id);
  }
  
  // Return placeholder for other platforms
  return {
    post_id: post.id,
    platform: post.platform,
    impressions: 0,
    reach: 0,
    engagement: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    saves: 0,
    clicks: 0,
    engagement_rate: 0,
    fetched_at: new Date(),
  };
}

/**
 * Aggregate metrics across all posts
 */
function aggregateMetrics(
  posts: Post[],
  metrics: PostMetrics[]
): {
  totalPosts: number;
  totalImpressions: number;
  totalReach: number;
  totalEngagement: number;
  avgEngagementRate: number;
  platformBreakdown: Record<Platform, { posts: number; engagement_rate: number }>;
} {
  const platformBreakdown: Record<Platform, { posts: number; total_engagement: number; total_impressions: number }> = {
    instagram: { posts: 0, total_engagement: 0, total_impressions: 0 },
    facebook: { posts: 0, total_engagement: 0, total_impressions: 0 },
    linkedin: { posts: 0, total_engagement: 0, total_impressions: 0 },
    tiktok: { posts: 0, total_engagement: 0, total_impressions: 0 },
    twitter: { posts: 0, total_engagement: 0, total_impressions: 0 },
  };
  
  let totalImpressions = 0;
  let totalReach = 0;
  let totalEngagement = 0;
  
  for (const metric of metrics) {
    totalImpressions += metric.impressions;
    totalReach += metric.reach;
    totalEngagement += metric.engagement + metric.likes + metric.comments + metric.shares;
    
    const platform = metric.platform;
    if (platformBreakdown[platform]) {
      platformBreakdown[platform].posts++;
      platformBreakdown[platform].total_engagement += metric.engagement;
      platformBreakdown[platform].total_impressions += metric.impressions;
    }
  }
  
  const avgEngagementRate = totalImpressions > 0 
    ? (totalEngagement / totalImpressions) * 100 
    : 0;
  
  // Calculate engagement rate per platform
  const platformResult: Record<Platform, { posts: number; engagement_rate: number }> = {} as Record<Platform, { posts: number; engagement_rate: number }>;
  for (const [platform, data] of Object.entries(platformBreakdown)) {
    platformResult[platform as Platform] = {
      posts: data.posts,
      engagement_rate: data.total_impressions > 0 
        ? (data.total_engagement / data.total_impressions) * 100 
        : 0,
    };
  }
  
  return {
    totalPosts: posts.length,
    totalImpressions,
    totalReach,
    totalEngagement,
    avgEngagementRate,
    platformBreakdown: platformResult,
  };
}

/**
 * Find the best performing post
 */
function findBestPost(posts: Post[], metrics: PostMetrics[]): Post | undefined {
  if (posts.length === 0) return undefined;
  
  const metricsMap = new Map(metrics.map(m => [m.post_id, m]));
  
  let bestPost = posts[0];
  let bestEngagement = 0;
  
  for (const post of posts) {
    const postMetrics = metricsMap.get(post.id);
    if (postMetrics) {
      const engagement = postMetrics.engagement + postMetrics.likes + postMetrics.comments;
      if (engagement > bestEngagement) {
        bestEngagement = engagement;
        bestPost = post;
      }
    }
  }
  
  return bestPost;
}

/**
 * Generate AI insights based on metrics
 */
async function generateInsights(
  metrics: {
    total_posts: number;
    total_impressions: number;
    avg_engagement_rate: number;
    best_post: Post;
    platform_breakdown: Record<Platform, { posts: number; engagement_rate: number }>;
  }
): Promise<AnalyticsInsight[]> {
  const prompt = buildAnalyticsInsightsPrompt(metrics);
  
  const insights = await groqChatJSON<AnalyticsInsight[]>(prompt, {
    temperature: 0.5,
  });
  
  return insights || [];
}

/**
 * Generate report for a single user
 */
async function generateUserReport(
  user: User,
  periodDays: number
): Promise<AnalyticsReport | null> {
  // 1. Load recent posts
  const posts = await supabaseGetRecentPosts(user.id, periodDays);
  
  if (posts.length === 0) {
    return null;
  }
  
  // 2. Get access token (use first available)
  const token = user.platform_tokens?.find(t => 
    t.platform === 'instagram' || t.platform === 'facebook'
  );
  
  // 3. Fetch metrics for each post
  const metrics: PostMetrics[] = [];
  for (const post of posts) {
    if (token?.access_token) {
      const postMetrics = await fetchPostMetrics(post, token.access_token);
      if (postMetrics) {
        metrics.push(postMetrics);
      }
    }
  }
  
  // 4. Aggregate metrics
  const aggregated = aggregateMetrics(posts, metrics);
  
  // 5. Find best post
  const bestPost = findBestPost(posts, metrics);
  
  // 6. Find best posting time
  const postsWithEngagement = posts.map(p => ({
    published_at: p.published_at || new Date(),
    engagement_rate: metrics.find(m => m.post_id === p.id)?.engagement_rate || 0,
  }));
  const { hour: bestHour, day: bestDay } = findBestPostingTime(postsWithEngagement);
  
  // 7. Generate AI insights
  let aiInsights: AnalyticsInsight[] = [];
  if (bestPost) {
    aiInsights = await generateInsights({
      total_posts: aggregated.totalPosts,
      total_impressions: aggregated.totalImpressions,
      avg_engagement_rate: aggregated.avgEngagementRate,
      best_post: bestPost,
      platform_breakdown: aggregated.platformBreakdown,
    });
  }
  
  // 8. Build report
  const now = new Date();
  const periodStart = new Date(now);
  periodStart.setDate(periodStart.getDate() - periodDays);
  
  const report: AnalyticsReport = {
    id: generateId('report'),
    user_id: user.id,
    agent_id: 'analytics_agent',
    report_date: now,
    period_start: periodStart,
    period_end: now,
    total_posts: aggregated.totalPosts,
    total_impressions: aggregated.totalImpressions,
    total_reach: aggregated.totalReach,
    total_engagement: aggregated.totalEngagement,
    average_engagement_rate: aggregated.avgEngagementRate,
    best_performing_post: bestPost,
    best_posting_hour: bestHour,
    best_posting_day: bestDay,
    platform_breakdown: aggregated.platformBreakdown as unknown as Record<Platform, PostMetrics>,
    ai_insights: aiInsights,
    created_at: now,
  };
  
  return report;
}

/**
 * Main Analytics Agent function
 */
export async function analyticsAgent(
  state: WorkflowState
): Promise<Partial<WorkflowState>> {
  const input = state.analytics_input;
  
  if (!input) {
    return {
      errors: [...state.errors, 'Analytics: No input provided'],
      current_step: 'analytics_error',
    };
  }
  
  try {
    const periodDays = input.period_days || 7;
    
    // 1. Load users to process
    let users: User[];
    
    if (input.specific_user_ids && input.specific_user_ids.length > 0) {
      // Manual request for specific users
      const allUsers = await supabaseGetActiveUsers();
      users = allUsers.filter(u => input.specific_user_ids!.includes(u.id));
    } else {
      // Daily cron: all active users
      users = await supabaseGetActiveUsers();
    }
    
    if (users.length === 0) {
      return {
        analytics_output: {
          reports: [],
          notifications_sent: 0,
        },
        current_step: 'analytics_complete',
        warnings: [...state.warnings, 'Analytics: No users to process'],
      };
    }
    
    // 2. Generate reports for each user
    const reports: AnalyticsReport[] = [];
    let notificationsSent = 0;
    const errors: string[] = [];
    
    for (const user of users) {
      try {
        const report = await generateUserReport(user, periodDays);
        
        if (report) {
          // Save report
          await supabaseSaveAnalyticsReport(report);
          reports.push(report);
          
          // Send WhatsApp notification
          const message = buildAnalyticsReportMessage(
            report.total_posts,
            report.total_impressions,
            report.average_engagement_rate,
            report.best_posting_hour,
            report.ai_insights
          );
          
          const sent = await whatsappSendMessage(user.phone, message);
          if (sent) {
            notificationsSent++;
          }
        }
      } catch (error) {
        errors.push(`Error processing user ${user.id}: ${error}`);
      }
    }
    
    // 3. Build output
    const output: AnalyticsOutput = {
      reports,
      notifications_sent: notificationsSent,
    };
    
    return {
      analytics_reports: [...state.analytics_reports, ...reports],
      analytics_output: output,
      errors: [...state.errors, ...errors],
      current_step: 'analytics_complete',
    };
  } catch (error) {
    return {
      errors: [...state.errors, `Analytics error: ${error}`],
      current_step: 'analytics_error',
    };
  }
}
