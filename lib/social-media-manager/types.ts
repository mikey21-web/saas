/**
 * Social Media Manager - Type Definitions
 * 
 * 6-Agent Orchestration:
 * 1. Content Creator - Generate platform-native social content
 * 2. Trend Spotter - Detect trending topics and alert users
 * 3. Scheduler - Auto-publish to multiple platforms
 * 4. Analytics - Track engagement and suggest optimizations
 * 5. Engagement - Auto-reply to comments, DMs, handle leads
 * 6. Approval - Manual review workflow
 */

// =============================================================================
// PLATFORM TYPES
// =============================================================================

export type Platform = 'instagram' | 'facebook' | 'linkedin' | 'tiktok' | 'twitter';

export type ContentType = 'post' | 'reel' | 'shorts' | 'carousel' | 'story';

export type PostStatus = 
  | 'draft' 
  | 'pending_approval' 
  | 'approved' 
  | 'published' 
  | 'failed' 
  | 'rejected'
  | 'scheduled';

export type TonePreset = 
  | 'professional' 
  | 'casual' 
  | 'conversational' 
  | 'energetic' 
  | 'educational';

export type EngagementIntent = 
  | 'POSITIVE' 
  | 'QUESTION' 
  | 'COMPLAINT' 
  | 'SPAM' 
  | 'ENGAGEMENT' 
  | 'LEAD';

export type ApprovalAction = 'APPROVE' | 'EDIT' | 'REJECT' | 'RESCHEDULE';

export type TriggerSource = 
  | 'manual_whatsapp' 
  | 'calendar' 
  | 'trend_handoff' 
  | 'campaign_brief' 
  | 'repurpose';

export type Language = 'english' | 'hindi' | 'hinglish';

// =============================================================================
// POST & CONTENT TYPES
// =============================================================================

export interface ReelScript {
  hook: string;
  body: string;
  cta: string;
}

export interface CarouselSlide {
  slide_number: number;
  headline: string;
  body: string;
  image_prompt?: string;
}

export interface Post {
  id: string;
  user_id: string;
  agent_id: string;
  platform: Platform;
  content_type: ContentType;
  caption: string;
  hashtags: string[];
  cta: string;
  media_url?: string;
  image_prompt?: string;
  reel_script?: ReelScript;
  carousel_slides?: CarouselSlide[];
  scheduled_at: Date;
  status: PostStatus;
  platform_post_id?: string;
  published_at?: Date;
  approval_sent_at?: Date;
  approved_at?: Date;
  rejected_at?: Date;
  error_message?: string;
  retry_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface PostCreateInput {
  user_id: string;
  platform: Platform;
  content_type: ContentType;
  caption: string;
  hashtags?: string[];
  cta?: string;
  media_url?: string;
  image_prompt?: string;
  reel_script?: ReelScript;
  carousel_slides?: CarouselSlide[];
  scheduled_at?: Date;
}

// =============================================================================
// NICHE KNOWLEDGE PACK
// =============================================================================

export interface ContentPillar {
  name: string;
  description: string;
  content_ratio: number; // percentage of content for this pillar
  example_topics: string[];
}

export interface AudiencePersona {
  name: string;
  age_range: string;
  interests: string[];
  pain_points: string[];
  preferred_content_types: ContentType[];
  active_times: string[];
}

export interface ContentFormat {
  type: ContentType;
  best_practices: string[];
  optimal_length: string;
  engagement_tips: string[];
}

export interface NicheKnowledgePack {
  niche_id: string;
  niche_name: string;
  content_pillars: ContentPillar[];
  hashtag_sets: Record<string, string[]>;
  trend_keywords: string[];
  audience_persona: AudiencePersona;
  tone_preset: TonePreset;
  hook_templates: string[];
  cta_library: string[];
  content_formats: Record<ContentType, ContentFormat>;
  language_preference: Language;
  posting_frequency: Record<Platform, number>; // posts per week
  best_posting_times: Record<Platform, string[]>;
}

// =============================================================================
// TREND TYPES
// =============================================================================

export interface TrendTopic {
  name: string;
  source: 'twitter' | 'google' | 'instagram';
  tweet_volume?: number;
  url?: string;
  relevance_score: number;
  content_angle?: string;
}

export interface TrendingAudio {
  audio_id: string;
  title: string;
  artist: string;
  use_count: number;
  source: 'instagram' | 'tiktok';
}

export interface Trend {
  id: string;
  scan_id: string;
  scanned_at: Date;
  niche_id: string;
  topics: TrendTopic[];
  audio: TrendingAudio[];
  high_relevance: TrendTopic[];
}

export interface TrendScan {
  scan_id: string;
  scanned_at: Date;
  twitter_topics: TrendTopic[];
  google_topics: TrendTopic[];
  instagram_audio: TrendingAudio[];
  tiktok_audio: TrendingAudio[];
  scored_trends: Record<string, TrendTopic[]>;
  high_relevance_count: number;
}

// =============================================================================
// ANALYTICS TYPES
// =============================================================================

export interface PostMetrics {
  post_id: string;
  platform: Platform;
  impressions: number;
  reach: number;
  engagement: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  engagement_rate: number;
  fetched_at: Date;
}

export interface AnalyticsInsight {
  type: 'positive' | 'improvement' | 'recommendation';
  title: string;
  description: string;
  metric?: string;
  action?: string;
}

export interface AnalyticsReport {
  id: string;
  user_id: string;
  agent_id: string;
  report_date: Date;
  period_start: Date;
  period_end: Date;
  total_posts: number;
  total_impressions: number;
  total_reach: number;
  total_engagement: number;
  average_engagement_rate: number;
  best_performing_post?: Post;
  best_posting_hour: number;
  best_posting_day: string;
  platform_breakdown: Record<Platform, PostMetrics>;
  ai_insights: AnalyticsInsight[];
  created_at: Date;
}

// =============================================================================
// ENGAGEMENT TYPES
// =============================================================================

export interface EngagementEvent {
  id: string;
  user_id: string;
  platform: Platform;
  event_type: 'comment' | 'dm' | 'mention' | 'reply';
  post_id?: string;
  sender_id: string;
  sender_username: string;
  sender_name?: string;
  content: string;
  media_url?: string;
  received_at: Date;
  processed_at?: Date;
}

export interface EngagementLog {
  id: string;
  user_id: string;
  agent_id: string;
  event: EngagementEvent;
  intent: EngagementIntent;
  confidence: number;
  action_taken: 'replied' | 'escalated' | 'ignored' | 'flagged_lead';
  reply_content?: string;
  reply_sent_at?: Date;
  escalated_at?: Date;
  escalation_reason?: string;
  is_lead: boolean;
  lead_score?: number;
  created_at: Date;
}

// =============================================================================
// APPROVAL TYPES
// =============================================================================

export interface ApprovalRequest {
  id: string;
  post_id: string;
  user_id: string;
  agent_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'edit_requested' | 'rescheduled';
  preview_message_id?: string;
  sent_at: Date;
  responded_at?: Date;
  action?: ApprovalAction;
  edit_instructions?: string;
  new_scheduled_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// =============================================================================
// USER & PLATFORM TOKENS
// =============================================================================

export interface PlatformToken {
  platform: Platform;
  access_token: string;
  refresh_token?: string;
  expires_at?: Date;
  page_id?: string; // Facebook/Instagram
  account_id?: string;
  username?: string;
}

export interface User {
  id: string;
  phone: string;
  email?: string;
  name?: string;
  niche_primary: string;
  niches_secondary?: string[];
  platforms: Platform[];
  platform_tokens: PlatformToken[];
  language_preference: Language;
  auto_reply_enabled: boolean;
  approval_required: boolean;
  is_active: boolean;
  timezone: string;
  created_at: Date;
  updated_at: Date;
}

// =============================================================================
// WORKFLOW STATE
// =============================================================================

export interface ContentCreatorInput {
  trigger_source: TriggerSource;
  user_request?: string;
  trend_brief?: TrendTopic;
  campaign_brief?: {
    goal: string;
    target_audience: string;
    key_messages: string[];
    platforms: Platform[];
    duration_days: number;
  };
  repurpose_from?: Post;
  platforms_requested: Platform[];
  content_types_requested?: ContentType[];
  schedule_preference?: 'now' | 'optimal' | 'custom';
  custom_schedule?: Date;
}

export interface ContentCreatorOutput {
  posts: Post[];
  image_prompts: string[];
  requires_approval: boolean;
}

export interface TrendSpotterInput {
  trigger_type: 'cron' | 'manual';
  specific_niches?: string[];
}

export interface TrendSpotterOutput {
  scan: TrendScan;
  alerts_sent: number;
  handoffs_triggered: number;
}

export interface SchedulerInput {
  trigger_type: 'cron' | 'manual' | 'approval_handoff';
  specific_post_ids?: string[];
}

export interface SchedulerOutput {
  published: Post[];
  failed: Post[];
  queued_for_retry: Post[];
}

export interface AnalyticsInput {
  trigger_type: 'cron' | 'manual';
  specific_user_ids?: string[];
  period_days?: number;
}

export interface AnalyticsOutput {
  reports: AnalyticsReport[];
  notifications_sent: number;
}

export interface EngagementInput {
  trigger_type: 'webhook' | 'polling';
  events: EngagementEvent[];
}

export interface EngagementOutput {
  processed: EngagementLog[];
  escalated: EngagementLog[];
  leads_detected: EngagementLog[];
}

export interface ApprovalInput {
  trigger_type: 'new_post' | 'user_response';
  post?: Post;
  user_response?: {
    request_id: string;
    action: ApprovalAction;
    edit_instructions?: string;
    new_scheduled_at?: Date;
  };
}

export interface ApprovalOutput {
  request?: ApprovalRequest;
  updated_post?: Post;
  next_action: 'schedule' | 'edit' | 'discard' | 'wait';
}

export interface WorkflowState {
  agent_id: string;
  user_id: string;
  user?: User;
  nkp?: NicheKnowledgePack;
  
  // Agent inputs
  content_creator_input?: ContentCreatorInput;
  trend_spotter_input?: TrendSpotterInput;
  scheduler_input?: SchedulerInput;
  analytics_input?: AnalyticsInput;
  engagement_input?: EngagementInput;
  approval_input?: ApprovalInput;
  
  // Agent outputs
  content_creator_output?: ContentCreatorOutput;
  trend_spotter_output?: TrendSpotterOutput;
  scheduler_output?: SchedulerOutput;
  analytics_output?: AnalyticsOutput;
  engagement_output?: EngagementOutput;
  approval_output?: ApprovalOutput;
  
  // Shared state
  posts: Post[];
  trends: Trend[];
  analytics_reports: AnalyticsReport[];
  engagement_logs: EngagementLog[];
  pending_approvals: ApprovalRequest[];
  
  // Workflow control
  current_step: string;
  entry_point: 'content_creator' | 'trend_spotter' | 'scheduler' | 'analytics' | 'engagement' | 'approval';
  next_step?: string;
  published_count: number;
  failed_count: number;
  
  // Error handling
  errors: string[];
  warnings: string[];
  
  // Metadata
  started_at: Date;
  completed_at?: Date;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface MetaGraphAPIResponse {
  id?: string;
  success?: boolean;
  error?: {
    message: string;
    type: string;
    code: number;
  };
}

export interface LinkedInAPIResponse {
  id?: string;
  activity?: string;
  error?: {
    message: string;
    status: number;
  };
}

export interface TikTokAPIResponse {
  data?: {
    publish_id: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface TwitterAPIResponse {
  data?: {
    id: string;
    text: string;
  };
  errors?: Array<{
    message: string;
    code: number;
  }>;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

export interface SMMConfig {
  // LLM settings
  groq_model: string;
  gpt_model: string;
  temperature: number;
  max_tokens: number;
  
  // Rate limits
  max_posts_per_hour: number;
  max_api_calls_per_minute: number;
  max_retries: number;
  retry_delay_minutes: number;
  
  // Scheduling
  trend_scan_interval_hours: number;
  analytics_report_hour: number; // IST
  engagement_poll_interval_minutes: number;
  
  // Thresholds
  trend_relevance_threshold: number;
  lead_score_threshold: number;
  engagement_auto_reply_enabled: boolean;
  
  // Platform limits
  instagram_caption_max: number;
  twitter_char_limit: number;
  linkedin_char_limit: number;
  tiktok_caption_max: number;
}

export const DEFAULT_SMM_CONFIG: SMMConfig = {
  groq_model: 'llama-3.1-8b-instant',
  gpt_model: 'gpt-4o',
  temperature: 0.7,
  max_tokens: 2048,
  
  max_posts_per_hour: 10,
  max_api_calls_per_minute: 30,
  max_retries: 3,
  retry_delay_minutes: 15,
  
  trend_scan_interval_hours: 4,
  analytics_report_hour: 9, // 9 AM IST
  engagement_poll_interval_minutes: 30,
  
  trend_relevance_threshold: 7,
  lead_score_threshold: 0.7,
  engagement_auto_reply_enabled: true,
  
  instagram_caption_max: 2200,
  twitter_char_limit: 280,
  linkedin_char_limit: 3000,
  tiktok_caption_max: 2200,
};
