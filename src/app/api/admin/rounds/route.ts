import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth";
import { roundCreateSchema } from "@/lib/validators";
import { successResponse, errorResponse, validateBody, paginatedResponse, handleRouteError } from "@/lib/api-utils";

/**
 * GET /api/admin/rounds - List rounds with filters
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const eventId = url.searchParams.get("eventId");
    const status = url.searchParams.get("status");
    const type = url.searchParams.get("type");

    let query = supabaseAdmin!.from("rounds").select(`
      *,
      events!inner (
        id,
        name,
        slug
      )
    `, { count: "exact" });

    if (eventId) query = query.eq("event_id", eventId);
    if (status) query = query.eq("status", status);
    if (type) query = query.eq("type", type);

    const { count, error: countError } = await query;
    if (countError) throw countError;

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    return paginatedResponse(data || [], page, limit, count || 0);
  } catch (error) {
    return handleRouteError(error, "Failed to fetch rounds");
  }
}

/**
 * POST /api/admin/rounds - Create a new round
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    
    const validation = await validateBody(request, roundCreateSchema);
    if (validation instanceof NextResponse) return validation;

    const { data, error } = await supabaseAdmin!
      .from("rounds")
      .insert(validation.data)
      .select()
      .single();

    if (error) throw error;

    return successResponse(data, 201);
  } catch (error) {
    return handleRouteError(error, "Failed to create round");
  }
}

/**
 * PATCH /api/admin/rounds - Update round status (bulk)
 */
export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();
    
    const body = await request.json();
    const { roundIds, status } = body;

    if (!roundIds || !Array.isArray(roundIds) || roundIds.length === 0) {
      return errorResponse("roundIds array is required", 400);
    }
    if (!status) {
      return errorResponse("status is required", 400);
    }

    const { data, error } = await supabaseAdmin!
      .from("rounds")
      .update({ status, updated_at: new Date().toISOString() })
      .in("id", roundIds)
      .select();

    if (error) throw error;

    // Log audit for each round
    await Promise.all(roundIds.map(id => 
      supabaseAdmin!.from("audit_logs").insert({
        action: "round_status_updated",
        entity_type: "round",
        entity_id: id,
        after_json: { status },
      })
    ));

    return successResponse(data);
  } catch (error) {
    return handleRouteError(error, "Failed to update rounds");
  }
}