import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "@/lib/supabase/client";
import { sendWhatsAppNotification, sendEmailNotification, logNotificationActivity } from "@/lib/channels/notifications";

/**
 * Task Assignment Workflow Orchestrator
 *
 * 5-Agent Pipeline:
 * 1. Parser Agent → Extracts tasks from meeting notes
 * 2. Router Agent → Assigns tasks to team members
 * 3. Notifier Agent → Sends WhatsApp/email notifications
 * 4. Tracker Agent → Monitors completion status
 * 5. Reporter Agent → Generates evening summary report
 */

interface WorkflowInput {
  userId: string;
  agentId: string;
  meetingNotes: string;
  teamMembers: string[]; // list of team member names/emails
}

interface ParserOutput {
  tasks: Array<{
    title: string;
    description: string;
    priority: "low" | "normal" | "high" | "urgent";
  }>;
  extractionConfidence: number;
}

interface RouterOutput {
  assignments: Array<{
    taskTitle: string;
    assignedTo: string;
    reason: string;
  }>;
}

interface NotifierOutput {
  notifications: Array<{
    recipient: string;
    channel: "whatsapp" | "email" | "sms";
    status: "sent" | "failed";
  }>;
}

interface TrackerOutput {
  taskIds: string[];
  trackingStarted: boolean;
}

interface ReporterOutput {
  report: string;
  taskSummary: {
    total: number;
    assigned: number;
    dueDates: string[];
  };
}

interface WorkflowState {
  input: WorkflowInput;
  parserOutput?: ParserOutput;
  routerOutput?: RouterOutput;
  notifierOutput?: NotifierOutput;
  trackerOutput?: TrackerOutput;
  reporterOutput?: ReporterOutput;
  executionId?: string;
  errors: string[];
}

class TaskAssignmentOrchestrator {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic();
  }

  /**
   * Agent 1: Parser Agent
   * Reads meeting notes and extracts structured tasks
   */
  async parserAgent(state: WorkflowState): Promise<WorkflowState> {
    try {
      const systemPrompt = `You are a task extraction expert. Given meeting notes, extract all actionable tasks with clarity and structure.

Output JSON with this format:
{
  "tasks": [
    {
      "title": "Task name",
      "description": "What needs to be done",
      "priority": "high|normal|low|urgent"
    }
  ],
  "extractionConfidence": 0.95
}`;

      const message = await this.client.messages.create({
        model: "claude-opus-4-6",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: `Extract tasks from these meeting notes:\n\n${state.input.meetingNotes}`,
          },
        ],
        system: systemPrompt,
      });

      const responseText =
        message.content[0].type === "text" ? message.content[0].text : "";
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error("Failed to parse parser agent response");
      }

      state.parserOutput = JSON.parse(jsonMatch[0]) as ParserOutput;
      console.log("✓ Parser Agent: Extracted", state.parserOutput.tasks.length, "tasks");

      return state;
    } catch (error) {
      state.errors.push(`Parser Agent Error: ${String(error)}`);
      return state;
    }
  }

  /**
   * Agent 2: Router Agent
   * Assigns tasks to appropriate team members
   */
  async routerAgent(state: WorkflowState): Promise<WorkflowState> {
    if (!state.parserOutput?.tasks.length) {
      state.errors.push("Router: No tasks to route");
      return state;
    }

    try {
      const tasksJson = JSON.stringify(state.parserOutput.tasks);
      const teamJson = JSON.stringify(state.input.teamMembers);

      const systemPrompt = `You are a task assignment expert. Match extracted tasks to team members based on their names and capabilities.

Output JSON with this format:
{
  "assignments": [
    {
      "taskTitle": "Task name",
      "assignedTo": "Team member name",
      "reason": "Why this person is best fit"
    }
  ]
}`;

      const message = await this.client.messages.create({
        model: "claude-opus-4-6",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: `Assign these tasks:\n${tasksJson}\n\nTo these team members:\n${teamJson}`,
          },
        ],
        system: systemPrompt,
      });

      const responseText =
        message.content[0].type === "text" ? message.content[0].text : "";
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error("Failed to parse router agent response");
      }

      state.routerOutput = JSON.parse(jsonMatch[0]) as RouterOutput;
      console.log("✓ Router Agent: Assigned", state.routerOutput.assignments.length, "tasks");

      return state;
    } catch (error) {
      state.errors.push(`Router Agent Error: ${String(error)}`);
      return state;
    }
  }

  /**
   * Agent 3: Notifier Agent
   * Sends notifications to assigned team members
   */
  async notifierAgent(state: WorkflowState): Promise<WorkflowState> {
    if (!state.routerOutput?.assignments.length) {
      state.errors.push("Notifier: No assignments to notify");
      return state;
    }

    try {
      const sentNotifications = [];

      // Send WhatsApp notifications to each team member
      for (const assignment of state.routerOutput.assignments) {
        const message = `📋 New Task Assignment\n\n${assignment.taskTitle}\n\nAssigned by: Task Assignment Workflow\nReason: ${assignment.reason}`;

        const result = await sendWhatsAppNotification({
          userId: state.input.userId,
          agentId: state.input.agentId,
          recipient: assignment.assignedTo,
          channel: "whatsapp",
          message,
          title: `Task: ${assignment.taskTitle}`,
          type: "task_assignment",
        });

        if (result.success) {
          sentNotifications.push({
            recipient: assignment.assignedTo,
            channel: "whatsapp" as const,
            status: "sent" as const,
          });
        } else {
          sentNotifications.push({
            recipient: assignment.assignedTo,
            channel: "whatsapp" as const,
            status: "failed" as const,
          });
          state.errors.push(`Failed to notify ${assignment.assignedTo}: ${result.message}`);
        }
      }

      state.notifierOutput = {
        notifications: sentNotifications,
      };

      // Log activity
      await logNotificationActivity(
        state.input.userId,
        state.input.agentId,
        "notification_sent",
        {
          count: sentNotifications.length,
          channel: "whatsapp",
          timestamp: new Date().toISOString(),
        }
      );

      console.log("✓ Notifier Agent: Sent", sentNotifications.length, "notifications");

      return state;
    } catch (error) {
      state.errors.push(`Notifier Agent Error: ${String(error)}`);
      return state;
    }
  }

  /**
   * Agent 4: Tracker Agent
   * Creates database records and sets up monitoring
   */
  async trackerAgent(state: WorkflowState): Promise<WorkflowState> {
    if (!state.routerOutput?.assignments.length) {
      state.errors.push("Tracker: No assignments to track");
      return state;
    }

    try {
      const taskIds: string[] = [];

      // Create task records in Supabase
      for (const assignment of state.routerOutput.assignments) {
        const taskData = {
          user_id: state.input.userId,
          workflow_id: state.input.agentId,
          title: assignment.taskTitle,
          assigned_to: assignment.assignedTo,
          assigned_by: "Task Assignment Workflow",
          status: "pending",
          priority: "normal",
          created_at: new Date().toISOString(),
        };

        const { data, error } = await (supabaseAdmin
          .from("tasks")
          .insert(taskData)
          .select("id")) as any;

        if (error) {
          console.error("Failed to create task:", error);
        } else if (data && data.length > 0) {
          taskIds.push(data[0].id);
        }
      }

      state.trackerOutput = {
        taskIds,
        trackingStarted: true,
      };

      console.log("✓ Tracker Agent: Created", taskIds.length, "tasks");

      return state;
    } catch (error) {
      state.errors.push(`Tracker Agent Error: ${String(error)}`);
      return state;
    }
  }

  /**
   * Agent 5: Reporter Agent
   * Generates summary report
   */
  async reporterAgent(state: WorkflowState): Promise<WorkflowState> {
    try {
      const systemPrompt = `You are a professional report generator. Create a concise daily task report summary.

Output JSON with this format:
{
  "report": "Summary text",
  "taskSummary": {
    "total": 5,
    "assigned": 5,
    "dueDates": ["2025-01-15", "2025-01-16"]
  }
}`;

      const assignmentCount = state.routerOutput?.assignments.length || 0;

      const message = await this.client.messages.create({
        model: "claude-opus-4-6",
        max_tokens: 512,
        messages: [
          {
            role: "user",
            content: `Generate a report for ${assignmentCount} tasks assigned in today's workflow. Keep it brief and actionable.`,
          },
        ],
        system: systemPrompt,
      });

      const responseText =
        message.content[0].type === "text" ? message.content[0].text : "";
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error("Failed to parse reporter agent response");
      }

      state.reporterOutput = JSON.parse(jsonMatch[0]) as ReporterOutput;
      console.log("✓ Reporter Agent: Generated report");

      return state;
    } catch (error) {
      state.errors.push(`Reporter Agent Error: ${String(error)}`);
      return state;
    }
  }

  /**
   * Main orchestration loop
   */
  async execute(input: WorkflowInput): Promise<WorkflowState> {
    let state: WorkflowState = {
      input,
      errors: [],
    };

    // Create workflow execution record
    const { data: executionData } = await (supabaseAdmin
      .from("workflow_executions")
      .insert({
        user_id: input.userId,
        agent_id: input.agentId,
        workflow_type: "task_assignment",
        trigger_type: "manual",
        input_data: JSON.stringify(input),
        status: "running",
        started_at: new Date().toISOString(),
      })
      .select("id")) as any;

    if (executionData && executionData.length > 0) {
      state.executionId = executionData[0].id;
    }

    const startTime = Date.now();

    // Execute 5-agent pipeline sequentially
    state = await this.parserAgent(state);
    state = await this.routerAgent(state);
    state = await this.notifierAgent(state);
    state = await this.trackerAgent(state);
    state = await this.reporterAgent(state);

    const duration = Date.now() - startTime;

    // Update execution record with final status
    if (state.executionId) {
      await (supabaseAdmin
        .from("workflow_executions")
        .update({
          status: state.errors.length === 0 ? "completed" : "failed",
          error_message:
            state.errors.length > 0 ? state.errors.join("; ") : null,
          parser_state: state.parserOutput ? "completed" : "failed",
          parser_output: state.parserOutput ? JSON.stringify(state.parserOutput) : null,
          router_state: state.routerOutput ? "completed" : "failed",
          router_output: state.routerOutput ? JSON.stringify(state.routerOutput) : null,
          notifier_state: state.notifierOutput ? "completed" : "failed",
          notifier_output: state.notifierOutput ? JSON.stringify(state.notifierOutput) : null,
          tracker_state: state.trackerOutput ? "completed" : "failed",
          tracker_output: state.trackerOutput ? JSON.stringify(state.trackerOutput) : null,
          reporter_state: state.reporterOutput ? "completed" : "failed",
          reporter_output: state.reporterOutput ? JSON.stringify(state.reporterOutput) : null,
          total_duration_ms: duration,
          completed_at: new Date().toISOString(),
        })
        .eq("id", state.executionId)) as any;
    }

    console.log(`✓ Workflow completed in ${duration}ms`);

    return state;
  }
}

export const taskAssignmentOrchestrator = new TaskAssignmentOrchestrator();
