import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth";
import { successResponse, errorResponse, paginatedResponse, handleRouteError } from "@/lib/api-utils";
import { RouteParamsSingleId } from "@/app/api/types";

/**
 * GET /api/events/[id]/participants - List participants for an event
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: eventId } = await params;
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search");

    let query = supabaseAdmin!.from("participants").select("*");

    if (status) query = query.eq("status", status);
    if (search) query = query.ilike("display_name", `%${search}%`);

    query = query.eq("event_id", eventId);

    const { count, error: countError } = await supabaseAdmin!
      .from("participants")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId);

    if (countError) throw countError;

    const { data, error } = await query
      .order("joined_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    return paginatedResponse(data || [], page, limit, count || 0);
  } catch (error) {
    return handleRouteError(error, "Failed to fetch participants");
  }
}

/**
 * PATCH /api/events/[id]/participants - Update participant status (admin)
 */
export async function PATCH(request: NextRequest, { params }: RouteParamsSingleId) {
  try {
    await requireAdmin();
    const { id: eventId } = await params;
    
    const body = await request.json();
    const { participantId, status } = body;

    if (!participantId || !status) {
      return errorResponse("participantId and status are required", 400);
    }

    // Verify participant belongs to this event
    const { data: participant, error: participantError } = await supabaseAdmin!
      .from("participants")
      .select("id")
      .eq("id", participantId)
      .eq("event_id", eventId)
      .single();

    if (participantError || !participant) {
      return errorResponse("Participant not found in this event", 404);
    }

    const { data, error } = await supabaseAdmin!
      .from("participants")
      .update({ status })
      .eq("id", participantId)
      .select()
      .single();

    if (error) throw error;

    // Log audit
    await supabaseAdmin!.from("audit_logs").insert({
      action: "participant_status_updated",
      entity_type: "participant",
      entity_id: participantId,
      after_json: { status },
    });

    return successResponse(data);
  } catch (error) {
    return handleRouteError(error, "Failed to update participant");
  }
}

/**
 * DELETE /api/events/[id]/participants - Remove a participant (admin)
 */
export async function DELETE(request: NextRequest, { params }: RouteParamsSingleId) {
  try {
    await requireAdmin();
    const { id: eventId } = await params;
    
    const url = new URL(request.url);
    const participantId = url.searchParams.get("participantId");

    if (!participantId) {
      return errorResponse("participantId query parameter is required", 400);
    }

    // Verify participant belongs to this event
    const { data: participant, error: participantError } = await supabaseAdmin!
      .from("participants")
      .select("id")
      .eq("id", participantId)
      .eq("event_id", eventId)
      .single();

    if (participantError || !participant) {
      return errorResponse("Participant not found in this event", 404);
    }

    // Soft delete by setting status to withdrawn
    const { error } = await supabaseAdmin!
      .from("participants")
      .update({ status: "withdrawn" })
      .eq("id", participantId);

    if (error) throw error;

    // Log audit
    await supabaseAdmin!.from("audit_logs").insert({
      action: "participant_removed",
      entity_type: "participant",
      entity_id: participantId,
      after_json: { status: "withdrawn" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error, "Failed to remove participant");
  }
}