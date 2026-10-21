import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth";
import { roundCreateSchema } from "@/lib/validators";
import { successResponse, errorResponse, validateBody, handleRouteError } from "@/lib/api-utils";
import { RouteParamsDoubleId } from "@/app/api/types";

/**
 * GET /api/events/[id]/rounds/[roundId] - Get a specific round
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; roundId: string }> }) {
  try {
    await requireAdmin();
    const { id: eventId, roundId } = await params;

    const { data, error } = await supabaseAdmin!
      .from("rounds")
      .select("*")
      .eq("id", roundId)
      .eq("event_id", eventId)
      .single();

    if (error) throw error;
    if (!data) return errorResponse("Round not found", 404);

    return successResponse(data);
  } catch (error) {
    return handleRouteError(error, "Failed to fetch round");
  }
}

/**
 * PATCH /api/events/[id]/rounds/[roundId] - Update a round
 */
export async function PATCH(request: NextRequest, { params }: RouteParamsDoubleId) {
  try {
    await requireAdmin();
    const { id: eventId, roundId } = await params;

    const validation = await validateBody(request, roundCreateSchema.partial());
    if (validation instanceof NextResponse) return validation;

    const { data, error } = await supabaseAdmin!
      .from("rounds")
      .update({ ...validation.data, updated_at: new Date().toISOString() })
      .eq("id", roundId)
      .eq("event_id", eventId)
      .select()
      .single();

    if (error) throw error;
    if (!data) return errorResponse("Round not found", 404);

    // Log audit
    await supabaseAdmin!.from("audit_logs").insert({
      action: "round_updated",
      entity_type: "round",
      entity_id: roundId,
      after_json: data,
    });

    return successResponse(data);
  } catch (error) {
    return handleRouteError(error, "Failed to update round");
  }
}

/**
 * POST /api/events/[id]/rounds/[roundId]/start - Start a round
 */
export async function POST(request: NextRequest, { params }: RouteParamsDoubleId) {
  try {
    await requireAdmin();
    const { id: eventId, roundId } = await params;

    const body = await request.json();
    const action = body.action; // "start", "pause", "end", "finalize"

    if (!["start", "pause", "end", "finalize"].includes(action)) {
      return errorResponse("Invalid action. Use: start, pause, end, or finalize", 400);
    }

    const statusMap: Record<string, string> = {
      start: "live",
      pause: "paused",
      end: "ended",
      finalize: "finalized",
    };

    const updateData: Record<string, string> = { 
      status: statusMap[action], 
      updated_at: new Date().toISOString() 
    };

    if (action === "start") {
      updateData.starts_at = new Date().toISOString();
    } else if (action === "pause") {
      updateData.paused_at = new Date().toISOString();
    } else if (action === "end" || action === "finalize") {
      updateData.deadline_at = new Date().toISOString();
    }

    const { data, error } = await supabaseAdmin!
      .from("rounds")
      .update(updateData)
      .eq("id", roundId)
      .eq("event_id", eventId)
      .select()
      .single();

    if (error) throw error;
    if (!data) return errorResponse("Round not found", 404);

    // Log audit
    await supabaseAdmin!.from("audit_logs").insert({
      action: `round_${action}`,
      entity_type: "round",
      entity_id: roundId,
      after_json: data,
    });

    // If starting a quiz round, publish questions
    if (action === "start" && data.type === "quiz") {
      await supabaseAdmin!
        .from("quiz_questions")
        .update({ published_at: new Date().toISOString() })
        .eq("round_id", roundId);
    }

    // If starting a bug hunt round, publish challenges
    if (action === "start" && data.type === "bug_hunt") {
      await supabaseAdmin!
        .from("bug_challenges")
        .update({ published_at: new Date().toISOString() })
        .eq("round_id", roundId);
    }

    return successResponse(data);
  } catch (error) {
    return handleRouteError(error, "Failed to update round status");
  }
}

/**
 * DELETE /api/events/[id]/rounds/[roundId] - Delete a round
 */
export async function DELETE(request: NextRequest, { params }: RouteParamsDoubleId) {
  try {
    await requireAdmin();
    const { id: eventId, roundId } = await params;

    const { error } = await supabaseAdmin!
      .from("rounds")
      .delete()
      .eq("id", roundId)
      .eq("event_id", eventId);

    if (error) throw error;

    // Log audit
    await supabaseAdmin!.from("audit_logs").insert({
      action: "round_deleted",
      entity_type: "round",
      entity_id: roundId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error, "Failed to delete round");
  }
}