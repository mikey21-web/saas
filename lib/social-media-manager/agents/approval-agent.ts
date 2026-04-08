/**
 * Approval Agent
 * 
 * Manual review workflow for posts:
 * - Sends approval preview via WhatsApp
 * - Handles user responses (approve/edit/reject/reschedule)
 * - Routes to appropriate next action
 */

import {
  WorkflowState,
  Post,
  ApprovalRequest,
  ApprovalInput,
  ApprovalOutput,
  ApprovalAction,
  DEFAULT_SMM_CONFIG,
} from '../types';
import {
  generateId,
  buildApprovalPreview,
  parseApprovalResponse,
  formatScheduleTime,
} from '../utils';
import {
  supabaseGetUser,
  supabaseUpdatePost,
  supabaseSaveApprovalRequest,
  supabaseUpdateApprovalRequest,
  whatsappSendMessage,
} from '../integrations';

// =============================================================================
// APPROVAL AGENT
// =============================================================================

/**
 * Send approval request for a new post
 */
async function sendApprovalRequest(
  post: Post,
  userPhone: string
): Promise<ApprovalRequest | null> {
  // Build preview message
  const preview = buildApprovalPreview(post);
  
  // Send via WhatsApp
  const sent = await whatsappSendMessage(userPhone, preview);
  
  if (!sent) {
    return null;
  }
  
  // Create approval request record
  const request: ApprovalRequest = {
    id: generateId('approval'),
    post_id: post.id,
    user_id: post.user_id,
    agent_id: 'approval_agent',
    status: 'pending',
    sent_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  };
  
  // Save to database
  await supabaseSaveApprovalRequest(request);
  
  // Update post status
  await supabaseUpdatePost(post.id, {
    status: 'pending_approval',
    approval_sent_at: new Date(),
  });
  
  return request;
}

/**
 * Handle approve action
 */
async function handleApprove(
  request: ApprovalRequest,
  post: Post,
  userPhone: string
): Promise<{ request: ApprovalRequest; post: Post; next_action: 'schedule' }> {
  // Update post status
  const updatedPost = await supabaseUpdatePost(post.id, {
    status: 'approved',
    approved_at: new Date(),
  });
  
  // Update approval request
  await supabaseUpdateApprovalRequest(request.id, {
    status: 'approved',
    responded_at: new Date(),
    action: 'APPROVE',
  });
  
  // Send confirmation
  await whatsappSendMessage(
    userPhone,
    `✅ *Post Approved!*

Your content has been queued for publishing as scheduled.
📅 ${formatScheduleTime(post.scheduled_at)}

You'll be notified when it goes live.`
  );
  
  return {
    request: { ...request, status: 'approved', action: 'APPROVE' },
    post: updatedPost || post,
    next_action: 'schedule',
  };
}

/**
 * Handle edit action
 */
async function handleEdit(
  request: ApprovalRequest,
  post: Post,
  userPhone: string,
  editInstructions?: string
): Promise<{ request: ApprovalRequest; post: Post; next_action: 'edit' }> {
  // Update approval request
  await supabaseUpdateApprovalRequest(request.id, {
    status: 'edit_requested',
    responded_at: new Date(),
    action: 'EDIT',
    edit_instructions: editInstructions,
  });
  
  // Send confirmation
  await whatsappSendMessage(
    userPhone,
    `✏️ *Edit Request Received*

${editInstructions ? `Your instructions: "${editInstructions}"` : 'Please specify what changes you\'d like.'}

I'll regenerate the content and send it back for approval.`
  );
  
  return {
    request: { ...request, status: 'edit_requested', action: 'EDIT', edit_instructions: editInstructions },
    post,
    next_action: 'edit',
  };
}

/**
 * Handle reject action
 */
async function handleReject(
  request: ApprovalRequest,
  post: Post,
  userPhone: string
): Promise<{ request: ApprovalRequest; post: Post; next_action: 'discard' }> {
  // Update post status
  const updatedPost = await supabaseUpdatePost(post.id, {
    status: 'rejected',
    rejected_at: new Date(),
  });
  
  // Update approval request
  await supabaseUpdateApprovalRequest(request.id, {
    status: 'rejected',
    responded_at: new Date(),
    action: 'REJECT',
  });
  
  // Send confirmation
  await whatsappSendMessage(
    userPhone,
    `❌ *Post Rejected*

The content has been discarded. Let me know when you'd like to create new content!`
  );
  
  return {
    request: { ...request, status: 'rejected', action: 'REJECT' },
    post: updatedPost || post,
    next_action: 'discard',
  };
}

/**
 * Handle reschedule action
 */
async function handleReschedule(
  request: ApprovalRequest,
  post: Post,
  userPhone: string,
  newTime?: Date
): Promise<{ request: ApprovalRequest; post: Post; next_action: 'wait' }> {
  if (newTime) {
    // Update post with new time
    await supabaseUpdatePost(post.id, {
      scheduled_at: newTime,
    });
    
    // Update approval request
    await supabaseUpdateApprovalRequest(request.id, {
      status: 'rescheduled',
      responded_at: new Date(),
      action: 'RESCHEDULE',
      new_scheduled_at: newTime,
    });
    
    // Send confirmation
    await whatsappSendMessage(
      userPhone,
      `⏰ *Post Rescheduled*

New time: ${formatScheduleTime(newTime)}

The post is still pending approval. Reply APPROVE when ready.`
    );
  } else {
    // Ask for new time
    await whatsappSendMessage(
      userPhone,
      `⏰ *Reschedule Post*

When would you like to publish?

Reply with:
• 'NOW' — Post immediately
• 'TOMORROW 10AM' — Schedule for tomorrow
• 'FRIDAY 6PM' — Specific day and time`
    );
  }
  
  return {
    request: { ...request, action: 'RESCHEDULE', new_scheduled_at: newTime },
    post,
    next_action: 'wait',
  };
}

/**
 * Process user response to approval request
 */
async function processUserResponse(
  request: ApprovalRequest,
  post: Post,
  response: { action: ApprovalAction; edit_instructions?: string; new_scheduled_at?: Date },
  userPhone: string
): Promise<ApprovalOutput> {
  switch (response.action) {
    case 'APPROVE':
      return handleApprove(request, post, userPhone);
    
    case 'EDIT':
      return handleEdit(request, post, userPhone, response.edit_instructions);
    
    case 'REJECT':
      return handleReject(request, post, userPhone);
    
    case 'RESCHEDULE':
      return handleReschedule(request, post, userPhone, response.new_scheduled_at);
    
    default:
      return {
        request,
        updated_post: post,
        next_action: 'wait',
      };
  }
}

/**
 * Main Approval Agent function
 */
export async function approvalAgent(
  state: WorkflowState
): Promise<Partial<WorkflowState>> {
  const input = state.approval_input;
  
  if (!input) {
    return {
      errors: [...state.errors, 'Approval: No input provided'],
      current_step: 'approval_error',
    };
  }
  
  try {
    // Load user
    const user = state.user || await supabaseGetUser(state.user_id) || undefined;
    if (!user) {
      return {
        errors: [...state.errors, 'Approval: User not found'],
        current_step: 'approval_error',
      };
    }
    
    if (input.trigger_type === 'new_post' && input.post) {
      // New post needs approval
      const request = await sendApprovalRequest(input.post, user.phone);
      
      if (!request) {
        return {
          errors: [...state.errors, 'Approval: Failed to send approval request'],
          current_step: 'approval_error',
        };
      }
      
      return {
        pending_approvals: [...state.pending_approvals, request],
        approval_output: {
          request,
          next_action: 'wait',
        },
        current_step: 'approval_pending',
      };
    } else if (input.trigger_type === 'user_response' && input.user_response) {
      // User responded to approval request
      const { request_id, action, edit_instructions, new_scheduled_at } = input.user_response;
      
      // Find the approval request
      const request = state.pending_approvals.find(r => r.id === request_id);
      if (!request) {
        return {
          errors: [...state.errors, `Approval: Request not found: ${request_id}`],
          current_step: 'approval_error',
        };
      }
      
      // Find the post
      const post = state.posts.find(p => p.id === request.post_id);
      if (!post) {
        return {
          errors: [...state.errors, `Approval: Post not found: ${request.post_id}`],
          current_step: 'approval_error',
        };
      }
      
      // Process response
      const result = await processUserResponse(
        request,
        post,
        { action, edit_instructions, new_scheduled_at },
        user.phone
      );
      
      // Update pending approvals
      const updatedPending = state.pending_approvals.filter(r => r.id !== request_id);
      if (result.next_action === 'wait') {
        updatedPending.push(result.request!);
      }
      
      // Determine next step
      let nextStep: string | undefined;
      if (result.next_action === 'schedule') {
        nextStep = 'scheduler';
      } else if (result.next_action === 'edit') {
        nextStep = 'content_creator';
      }
      
      return {
        pending_approvals: updatedPending,
        approval_output: result,
        current_step: 'approval_complete',
        next_step: nextStep,
      };
    }
    
    return {
      warnings: [...state.warnings, 'Approval: Invalid trigger type'],
      current_step: 'approval_complete',
    };
  } catch (error) {
    return {
      errors: [...state.errors, `Approval error: ${error}`],
      current_step: 'approval_error',
    };
  }
}
