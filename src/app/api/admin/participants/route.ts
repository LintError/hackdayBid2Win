import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth";
import { successResponse, errorResponse, paginatedResponse, handleRouteError } from "@/lib/api-utils";

/**
 * GET /api/admin/participants - List all participants across events (admin)
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const eventId = url.searchParams.get("eventId");
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search");

    let query = supabaseAdmin!.from("participants").select(`
      *,
      events!inner (
        id,
        name,
        slug
      )
    `, { count: "exact" });

    if (eventId) query = query.eq("event_id", eventId);
    if (status) query = query.eq("status", status);
    if (search) query = query.ilike("display_name", `%${search}%`);

    const { count, error: countError } = await query;
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
 * PATCH /api/admin/participants - Update participant status (admin)
 */
export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();
    
    const body = await request.json();
    const { participantId, status } = body;

    if (!participantId || !status) {
      return errorResponse("participantId and status are required", 400);
    }

    const { data, error } = await supabaseAdmin!
      .from("participants")
      .update({ status })
      .eq("id", participantId)
      .select()
      .single();

    if (error) throw error;

    return successResponse(data);
  } catch (error) {
    return handleRouteError(error, "Failed to update participant");
  }
}