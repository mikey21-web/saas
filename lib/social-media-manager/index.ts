/**
 * Social Media Manager - Public API
 * 
 * 6-Agent Multi-Agent Orchestration for Social Media Automation:
 * 1. Content Creator - Generate platform-native social content
 * 2. Trend Spotter - Detect trending topics and alert users
 * 3. Scheduler - Auto-publish to multiple platforms
 * 4. Analytics - Track engagement and suggest optimizations
 * 5. Engagement - Auto-reply to comments, DMs, handle leads
 * 6. Approval - Manual review workflow
 */

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type {
  // Platform types
  Platform,
  ContentType,
  PostStatus,
  TonePreset,
  EngagementIntent,
  ApprovalAction,
  TriggerSource,
  Language,
  
  // Content types
  ReelScript,
  CarouselSlide,
  Post,
  PostCreateInput,
  
  // NKP types
  ContentPillar,
  AudiencePersona,
  ContentFormat,
  NicheKnowledgePack,
  
  // Trend types
  TrendTopic,
  TrendingAudio,
  Trend,
  TrendScan,
  
  // Analytics types
  PostMetrics,
  AnalyticsInsight,
  AnalyticsReport,
  
  // Engagement types
  EngagementEvent,
  EngagementLog,
  
  // Approval types
  ApprovalRequest,
  
  // User types
  PlatformToken,
  User,
  
  // Workflow types
  ContentCreatorInput,
  ContentCreatorOutput,
  TrendSpotterInput,
  TrendSpotterOutput,
  SchedulerInput,
  SchedulerOutput,
  AnalyticsInput,
  AnalyticsOutput,
  EngagementInput,
  EngagementOutput,
  ApprovalInput,
  ApprovalOutput,
  WorkflowState,
  
  // API response types
  MetaGraphAPIResponse,
  LinkedInAPIResponse,
  TikTokAPIResponse,
  TwitterAPIResponse,
  
  // Config
  SMMConfig,
} from './types';

export { DEFAULT_SMM_CONFIG } from './types';

// =============================================================================
// UTILITY EXPORTS
// =============================================================================

export {
  // ID generation
  generateId,
  generatePostId,
  generateScanId,
  
  // Content formatting
  formatCaption,
  getPlatformCharLimit,
  formatHashtags,
  
  // Prompt builders
  buildPlatformPrompt,
  buildReelPrompt,
  buildCarouselPrompt,
  buildTrendScoringPrompt,
  buildEngagementClassificationPrompt,
  buildAutoReplyPrompt,
  buildAnalyticsInsightsPrompt,
  
  // Analytics utilities
  calculateEngagementRate,
  findBestPostingTime,
  
  // Approval utilities
  buildApprovalPreview,
  formatScheduleTime,
  parseApprovalResponse,
  
  // Message builders
  buildTrendAlertMessage,
  buildAnalyticsReportMessage,
  buildPublishConfirmationMessage,
  buildLeadAlertMessage,
  
  // Validation
  validatePost,
  validateScheduleTime,
} from './utils';

// =============================================================================
// INTEGRATION EXPORTS
// =============================================================================

export {
  // Supabase
  getSupabaseClient,
  supabaseGetUser,
  supabaseGetActiveUsers,
  supabaseGetNKP,
  supabaseCreatePost,
  supabaseUpdatePost,
  supabaseGetPendingPosts,
  supabaseGetRecentPosts,
  supabaseSaveTrendScan,
  supabaseSaveAnalyticsReport,
  supabaseSaveEngagementLog,
  supabaseSaveApprovalRequest,
  supabaseUpdateApprovalRequest,
  
  // LLM APIs
  groqChat,
  groqChatJSON,
  openaiChat,
  openaiChatJSON,
  smartLLMChat,
  smartLLMChatJSON,
  
  // Platform APIs
  metaPublishInstagramPost,
  metaPublishFacebookPost,
  metaGetInsights,
  metaReplyToComment,
  linkedinPublishPost,
  tiktokPublishVideo,
  twitterPublishTweet,
  twitterGetTrends,
  
  // WhatsApp
  whatsappSendMessage,
  whatsappSendTemplate,
  
  // Trend fetching
  fetchGoogleTrends,
  fetchInstagramTrendingAudio,
} from './integrations';

// =============================================================================
// AGENT EXPORTS
// =============================================================================

export { contentCreatorAgent } from './agents/content-creator-agent';
export { trendSpotterAgent } from './agents/trend-spotter-agent';
export { schedulerAgent } from './agents/scheduler-agent';
export { analyticsAgent } from './agents/analytics-agent';
export { engagementAgent } from './agents/engagement-agent';
export { approvalAgent } from './agents/approval-agent';

// =============================================================================
// WORKFLOW EXPORTS
// =============================================================================

export {
  // Workflow runners
  runContentCreatorWorkflow,
  runTrendSpotterWorkflow,
  runSchedulerWorkflow,
  runAnalyticsWorkflow,
  runEngagementWorkflow,
  runApprovalWorkflow,
  resumeWorkflow,
  
  // Advanced: workflow builder
  buildSMMWorkflow,
} from './social-media-manager';
