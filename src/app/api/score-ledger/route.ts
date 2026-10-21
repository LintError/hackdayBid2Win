import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth";
import { successResponse, errorResponse, paginatedResponse, handleRouteError } from "@/lib/api-utils";

/**
 * GET /api/score-ledger - Get score ledger entries
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const eventId = url.searchParams.get("eventId");
    const participantId = url.searchParams.get("participantId");
    const sourceType = url.searchParams.get("sourceType");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "50");

    let query = supabaseAdmin!.from("score_ledger").select(`
      *,
      participants!inner (
        display_name,
        event_id
      ),
      profiles!actor_id (
        display_name,
        email
      )
    `, { count: "exact" });

    if (eventId) query = query.eq("participants.event_id", eventId);
    if (participantId) query = query.eq("participant_id", participantId);
    if (sourceType) query = query.eq("source_type", sourceType);

    const { count, error: countError } = await query;
    if (countError) throw countError;

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    return paginatedResponse(data || [], page, limit, count || 0);
  } catch (error) {
    return handleRouteError(error, "Failed to fetch score ledger");
  }
}

/**
 * POST /api/score-ledger - Manual score adjustment (admin)
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    
    const body = await request.json();
    const { eventId, participantId, pointsDelta, reason, sourceType, sourceId } = body;

    if (!eventId || !participantId || pointsDelta === undefined || !reason) {
      return errorResponse("eventId, participantId, pointsDelta, and reason are required", 400);
    }

    const { data, error } = await supabaseAdmin!.from("score_ledger").insert({
      event_id: eventId,
      participant_id: participantId,
      points_delta: pointsDelta,
      reason,
      source_type: sourceType || "manual_adjustment",
      source_id: sourceId,
      actor_id: (await supabaseAdmin!.auth.getUser()).data.user?.id,
    }).select().single();

    if (error) throw error;

    return successResponse(data, 201);
  } catch (error) {
    return handleRouteError(error, "Failed to add score entry");
  }
}