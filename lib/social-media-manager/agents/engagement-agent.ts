/**
 * Engagement Agent
 * 
 * Auto-replies to comments, DMs, and handles leads:
 * - Classifies intent (positive, question, complaint, spam, lead)
 * - Routes by intent to appropriate handler
 * - Escalates complaints and leads to user
 * - Logs all engagement for analysis
 */

import {
  WorkflowState,
  EngagementEvent,
  EngagementLog,
  EngagementIntent,
  EngagementInput,
  EngagementOutput,
  User,
  DEFAULT_SMM_CONFIG,
} from '../types';
import {
  generateId,
  buildEngagementClassificationPrompt,
  buildAutoReplyPrompt,
  buildLeadAlertMessage,
} from '../utils';
import {
  groqChat,
  groqChatJSON,
  metaReplyToComment,
  supabaseGetUser,
  supabaseSaveEngagementLog,
  whatsappSendMessage,
} from '../integrations';

// =============================================================================
// ENGAGEMENT AGENT
// =============================================================================

interface ClassificationResult {
  intent: EngagementIntent;
  confidence: number;
  is_lead: boolean;
  lead_score: number;
  suggested_reply?: string;
}

/**
 * Classify the intent of an engagement event
 */
async function classifyEngagement(
  event: EngagementEvent,
  postCaption?: string
): Promise<ClassificationResult> {
  const prompt = buildEngagementClassificationPrompt(event.content, {
    post_caption: postCaption,
    sender_name: event.sender_name,
  });
  
  const result = await groqChatJSON<ClassificationResult>(prompt, {
    temperature: 0.2,
  });
  
  return result || {
    intent: 'ENGAGEMENT',
    confidence: 0.5,
    is_lead: false,
    lead_score: 0,
  };
}

/**
 * Generate auto-reply based on intent
 */
async function generateReply(
  intent: EngagementIntent,
  event: EngagementEvent,
  brandTone: string,
  niche?: string,
  postCaption?: string
): Promise<string | null> {
  // No reply for spam
  if (intent === 'SPAM') {
    return null;
  }
  
  // Simple replies for engagement
  if (intent === 'ENGAGEMENT') {
    const simpleReplies = ['❤️', '🙌', '💯', '🔥', 'Thanks!'];
    return simpleReplies[Math.floor(Math.random() * simpleReplies.length)];
  }
  
  // Simple replies for positive
  if (intent === 'POSITIVE') {
    const positiveReplies = [
      'Thank you so much! 🙏',
      'Really appreciate your support! 💪',
      'Means a lot to us! ❤️',
      'Thanks for the love! 🙌',
    ];
    return positiveReplies[Math.floor(Math.random() * positiveReplies.length)];
  }
  
  // AI-generated reply for questions
  if (intent === 'QUESTION') {
    const prompt = buildAutoReplyPrompt(
      intent,
      event.content,
      brandTone,
      { post_caption: postCaption, niche }
    );
    return groqChat(prompt, { temperature: 0.5 });
  }
  
  // Complaints and leads handled separately (escalation)
  return null;
}

/**
 * Post reply to the platform
 */
async function postReply(
  event: EngagementEvent,
  reply: string,
  accessToken: string
): Promise<boolean> {
  if (event.event_type === 'comment' && event.platform === 'instagram') {
    // Reply to Instagram comment
    // Note: event.id should be the comment ID for replies
    const response = await metaReplyToComment(accessToken, event.id, reply);
    return !response.error;
  }
  
  // For DMs and other platforms, implementation would vary
  // Currently only Instagram comments are supported
  return false;
}

/**
 * Handle a single engagement event
 */
async function handleEngagement(
  event: EngagementEvent,
  user: User
): Promise<EngagementLog> {
  const log: EngagementLog = {
    id: generateId('eng_log'),
    user_id: user.id,
    agent_id: 'engagement_agent',
    event,
    intent: 'ENGAGEMENT',
    confidence: 0,
    action_taken: 'ignored',
    is_lead: false,
    created_at: new Date(),
  };
  
  // Get post caption for context (if available)
  let postCaption: string | undefined;
  // In real implementation, would fetch from database using event.post_id
  
  // 1. Classify intent
  const classification = await classifyEngagement(event, postCaption);
  log.intent = classification.intent;
  log.confidence = classification.confidence;
  log.is_lead = classification.is_lead;
  log.lead_score = classification.lead_score;
  
  // 2. Handle based on intent
  const brandTone = 'conversational'; // Would come from user's NKP
  const niche = user.niche_primary;
  
  if (classification.intent === 'COMPLAINT') {
    // Escalate complaint to user
    const escalationMessage = `⚠️ *Complaint Received*

Platform: ${event.platform}
From: ${event.sender_name || event.sender_username}
Message: "${event.content.substring(0, 200)}${event.content.length > 200 ? '...' : ''}"

Please respond manually or reply 'HANDLE' for AI-assisted response.`;
    
    const sent = await whatsappSendMessage(user.phone, escalationMessage);
    if (sent) {
      log.action_taken = 'escalated';
      log.escalated_at = new Date();
      log.escalation_reason = 'Negative feedback detected';
    }
  } else if (classification.intent === 'LEAD' || classification.is_lead) {
    // Flag lead and notify user
    log.is_lead = true;
    log.lead_score = classification.lead_score;
    
    const leadAlert = buildLeadAlertMessage(
      event.sender_name || event.sender_username,
      event.content,
      event.platform,
      classification.lead_score
    );
    
    const sent = await whatsappSendMessage(user.phone, leadAlert);
    if (sent) {
      log.action_taken = 'flagged_lead';
      log.escalated_at = new Date();
    }
  } else if (classification.intent === 'SPAM') {
    // Log and ignore spam
    log.action_taken = 'ignored';
  } else if (user.auto_reply_enabled) {
    // Generate and post auto-reply
    const reply = await generateReply(
      classification.intent,
      event,
      brandTone,
      niche,
      postCaption
    );
    
    if (reply) {
      log.reply_content = reply;
      
      // Get access token for platform
      const token = user.platform_tokens?.find(t => t.platform === event.platform);
      
      if (token?.access_token) {
        const posted = await postReply(event, reply, token.access_token);
        if (posted) {
          log.action_taken = 'replied';
          log.reply_sent_at = new Date();
        }
      }
    }
  }
  
  return log;
}

/**
 * Main Engagement Agent function
 */
export async function engagementAgent(
  state: WorkflowState
): Promise<Partial<WorkflowState>> {
  const input = state.engagement_input;
  
  if (!input) {
    return {
      errors: [...state.errors, 'Engagement: No input provided'],
      current_step: 'engagement_error',
    };
  }
  
  if (input.events.length === 0) {
    return {
      engagement_output: {
        processed: [],
        escalated: [],
        leads_detected: [],
      },
      current_step: 'engagement_complete',
    };
  }
  
  try {
    const processed: EngagementLog[] = [];
    const escalated: EngagementLog[] = [];
    const leadsDetected: EngagementLog[] = [];
    const errors: string[] = [];
    
    // Group events by user for efficient processing
    const eventsByUser = new Map<string, EngagementEvent[]>();
    for (const event of input.events) {
      const userEvents = eventsByUser.get(event.user_id) || [];
      userEvents.push(event);
      eventsByUser.set(event.user_id, userEvents);
    }
    
    // Process each user's events
    const userEntries = Array.from(eventsByUser.entries());
    for (const [userId, events] of userEntries) {
      // Load user
      const user = await supabaseGetUser(userId);
      if (!user) {
        errors.push(`User not found: ${userId}`);
        continue;
      }
      
      // Process each event
      for (const event of events) {
        try {
          const log = await handleEngagement(event, user);
          
          // Save log
          await supabaseSaveEngagementLog(log);
          processed.push(log);
          
          // Categorize
          if (log.action_taken === 'escalated') {
            escalated.push(log);
          }
          if (log.is_lead) {
            leadsDetected.push(log);
          }
        } catch (error) {
          errors.push(`Error processing event ${event.id}: ${error}`);
        }
      }
    }
    
    // Build output
    const output: EngagementOutput = {
      processed,
      escalated,
      leads_detected: leadsDetected,
    };
    
    return {
      engagement_logs: [...state.engagement_logs, ...processed],
      engagement_output: output,
      errors: [...state.errors, ...errors],
      current_step: 'engagement_complete',
    };
  } catch (error) {
    return {
      errors: [...state.errors, `Engagement error: ${error}`],
      current_step: 'engagement_error',
    };
  }
}
