/**
 * Trend Spotter Agent
 * 
 * Detects trending topics and alerts users:
 * - Scans Twitter/X, Google Trends, Instagram audio
 * - Scores trend relevance per niche using AI
 * - Triggers Content Creator with trend briefs
 * - Notifies users via WhatsApp
 */

import {
  WorkflowState,
  TrendSpotterInput,
  TrendSpotterOutput,
  TrendScan,
  TrendTopic,
  TrendingAudio,
  NicheKnowledgePack,
  User,
  DEFAULT_SMM_CONFIG,
} from '../types';
import {
  generateScanId,
  buildTrendScoringPrompt,
} from '../utils';
import {
  groqChatJSON,
  fetchGoogleTrends,
  fetchInstagramTrendingAudio,
  fetchNitterTrends,
  fetchRedditTrends,
  supabaseGetActiveUsers,
  supabaseGetNKP,
  supabaseSaveTrendScan,
  whatsappSendMessage,
} from '../integrations';
import { buildTrendAlertMessage } from '../utils';

// =============================================================================
// TREND SPOTTER AGENT
// =============================================================================

interface ScoredTrend {
  trend: string;
  relevance_score: number;
  content_angle: string;
}

/**
 * Fetch all trend sources in parallel
 */
async function fetchAllTrends(): Promise<{
  nitter: TrendTopic[];
  reddit: TrendTopic[];
  google: TrendTopic[];
  instagramAudio: TrendingAudio[];
}> {
  const [nitter, reddit, google, instagramAudio] = await Promise.all([
    fetchNitterTrends(),
    fetchRedditTrends(),
    fetchGoogleTrends(),
    fetchInstagramTrendingAudio(),
  ]);
  return { nitter, reddit, google, instagramAudio };
}

/**
 * Get unique niches from active users
 */
function getUniqueNiches(users: User[]): Set<string> {
  const niches = new Set<string>();
  for (const user of users) {
    if (user.niche_primary) {
      niches.add(user.niche_primary);
    }
    if (user.niches_secondary) {
      for (const niche of user.niches_secondary) {
        niches.add(niche);
      }
    }
  }
  return niches;
}

/**
 * Load NKPs for all niches
 */
async function loadNKPsForNiches(niches: string[]): Promise<Map<string, NicheKnowledgePack>> {
  const nkpMap = new Map<string, NicheKnowledgePack>();
  
  for (const nicheId of niches) {
    const nkp = await supabaseGetNKP(nicheId);
    if (nkp) {
      nkpMap.set(nicheId, nkp);
    }
  }
  
  return nkpMap;
}

/**
 * Score trend relevance using AI
 */
async function scoreTrendRelevance(
  trends: { twitter: TrendTopic[]; google: TrendTopic[]; audio: TrendingAudio[] },
  niches: string[],
  nicheKeywords: Record<string, string[]>
): Promise<Record<string, ScoredTrend[]>> {
  const prompt = buildTrendScoringPrompt(trends, niches, nicheKeywords);
  
  const scored = await groqChatJSON<Record<string, ScoredTrend[]>>(prompt, {
    temperature: 0.3,
  });
  
  return scored || {};
}

/**
 * Find users matching a specific niche
 */
function findUsersForNiche(users: User[], niche: string): User[] {
  return users.filter(
    u => u.niche_primary === niche || u.niches_secondary?.includes(niche)
  );
}

/**
 * Main Trend Spotter Agent function
 */
export async function trendSpotterAgent(
  state: WorkflowState
): Promise<Partial<WorkflowState>> {
  const input = state.trend_spotter_input;
  
  if (!input) {
    return {
      errors: [...state.errors, 'Trend Spotter: No input provided'],
      current_step: 'trend_spotter_error',
    };
  }
  
  try {
    // 1. Load active users
    const users = await supabaseGetActiveUsers(
      input.specific_niches?.[0] // Filter by first niche if specified
    );
    
    if (users.length === 0) {
      return {
        warnings: [...state.warnings, 'Trend Spotter: No active users found'],
        current_step: 'trend_spotter_complete',
        trend_spotter_output: {
          scan: {
            scan_id: generateScanId(),
            scanned_at: new Date(),
            twitter_topics: [],
            google_topics: [],
            instagram_audio: [],
            tiktok_audio: [],
            scored_trends: {},
            high_relevance_count: 0,
          },
          alerts_sent: 0,
          handoffs_triggered: 0,
        },
      };
    }
    
    // 2. Get unique niches to scan
    const niches = input.specific_niches 
      ? new Set(input.specific_niches)
      : getUniqueNiches(users);
    const nicheArray = Array.from(niches);
    
    // 3. Load NKPs for trend keywords
    const nkpMap = await loadNKPsForNiches(nicheArray);
    
    // Build niche keywords map
    const nicheKeywords: Record<string, string[]> = {};
    const nkpEntries = Array.from(nkpMap.entries());
    for (const [nicheId, nkp] of nkpEntries) {
      nicheKeywords[nicheId] = nkp.trend_keywords || [];
    }
    
    // 4. Fetch trends from all sources
    const rawTrends = await fetchAllTrends();

    // 5. Score trend relevance per niche
    const scoredTrends = await scoreTrendRelevance(
      {
        nitter: rawTrends.nitter,
        reddit: rawTrends.reddit,
        google: rawTrends.google,
        audio: rawTrends.instagramAudio,
      },
      nicheArray,
      nicheKeywords
    );
    
    // 6. Identify high-relevance trends
    const highRelevanceTrends: Array<{ niche: string; trend: ScoredTrend }> = [];
    
    for (const [niche, trends] of Object.entries(scoredTrends)) {
      for (const trend of trends) {
        if (trend.relevance_score >= DEFAULT_SMM_CONFIG.trend_relevance_threshold) {
          highRelevanceTrends.push({ niche, trend });
        }
      }
    }
    
    // 7. Build scan record
    // Convert scored trends to TrendTopic format
    const scoredTrendsConverted: Record<string, TrendTopic[]> = {};
    for (const [niche, trends] of Object.entries(scoredTrends)) {
      scoredTrendsConverted[niche] = trends.map(t => ({
        name: t.trend,
        source: t.source || 'nitter',
        relevance_score: t.relevance_score,
        content_angle: t.content_angle,
      }));
    }

    const scan: TrendScan = {
      scan_id: generateScanId(),
      scanned_at: new Date(),
      nitter_topics: rawTrends.nitter,
      reddit_topics: rawTrends.reddit,
      google_topics: rawTrends.google,
      instagram_audio: rawTrends.instagramAudio,
      tiktok_audio: [], // TikTok trending not implemented
      scored_trends: scoredTrendsConverted,
      high_relevance_count: highRelevanceTrends.length,
    };
    
    // 8. Save scan to database
    await supabaseSaveTrendScan(scan);
    
    // 9. Send alerts and trigger content creation for high-relevance trends
    let alertsSent = 0;
    let handoffsTriggered = 0;
    
    for (const { niche, trend } of highRelevanceTrends) {
      // Find users for this niche
      const nicheUsers = findUsersForNiche(users, niche);
      
      for (const user of nicheUsers) {
        // Send WhatsApp alert
        const alertMessage = buildTrendAlertMessage(
          {
            name: trend.trend,
            source: 'twitter',
            relevance_score: trend.relevance_score,
            content_angle: trend.content_angle,
          },
          niche
        );
        
        const sent = await whatsappSendMessage(user.phone, alertMessage);
        if (sent) {
          alertsSent++;
        }
        
        // Note: In a real implementation, we'd trigger the content creator
        // via webhook or message queue. Here we track the intent.
        handoffsTriggered++;
      }
    }
    
    // 10. Build output
    const output: TrendSpotterOutput = {
      scan,
      alerts_sent: alertsSent,
      handoffs_triggered: handoffsTriggered,
    };
    
    return {
      trends: [
        ...state.trends,
        {
          id: scan.scan_id,
          scan_id: scan.scan_id,
          scanned_at: scan.scanned_at,
          niche_id: nicheArray[0] || 'all',
          topics: [
            ...(scan.nitter_topics || []),
            ...(scan.reddit_topics || []),
            ...(scan.google_topics || []),
          ],
          audio: scan.instagram_audio,
          high_relevance: highRelevanceTrends.map(h => ({
            name: h.trend.trend,
            source: h.trend.source || 'nitter',
            relevance_score: h.trend.relevance_score,
            content_angle: h.trend.content_angle,
          })),
        },
      ],
      trend_spotter_output: output,
      current_step: 'trend_spotter_complete',
      next_step: highRelevanceTrends.length > 0 ? 'content_creator' : undefined,
    };
  } catch (error) {
    return {
      errors: [...state.errors, `Trend Spotter error: ${error}`],
      current_step: 'trend_spotter_error',
    };
  }
}
