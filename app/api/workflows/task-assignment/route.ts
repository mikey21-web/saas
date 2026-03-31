import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { taskAssignmentOrchestrator } from "@/lib/workflows/task-assignment-orchestrator";

export const runtime = "nodejs";

interface RequestBody {
  agentId: string;
  meetingNotes: string;
  teamMembers: string[];
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as RequestBody;
    const { agentId, meetingNotes, teamMembers } = body;

    if (!agentId || !meetingNotes || !teamMembers?.length) {
      return NextResponse.json(
        { error: "Missing required fields: agentId, meetingNotes, teamMembers" },
        { status: 400 }
      );
    }

    // Execute the 5-agent workflow
    const result = await taskAssignmentOrchestrator.execute({
      userId,
      agentId,
      meetingNotes,
      teamMembers,
    });

    // Return workflow result
    return NextResponse.json({
      success: result.errors.length === 0,
      executionId: result.executionId,
      output: {
        tasksExtracted: result.parserOutput?.tasks || [],
        taskAssignments: result.routerOutput?.assignments || [],
        notificationsSent: result.notifierOutput?.notifications || [],
        taskIdsCreated: result.trackerOutput?.taskIds || [],
        report: result.reporterOutput?.report || "",
      },
      errors: result.errors,
    });
  } catch (error) {
    console.error("Workflow execution error:", error);
    return NextResponse.json(
      { error: `Workflow failed: ${String(error)}` },
      { status: 500 }
    );
  }
}
