import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth";
import { paginatedResponse, handleRouteError } from "@/lib/api-utils";

/**
 * GET /api/audit - Get audit logs (admin)
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const eventId = url.searchParams.get("eventId");
    const actorId = url.searchParams.get("actorId");
    const action = url.searchParams.get("action");
    const entityType = url.searchParams.get("entityType");
    const fromDate = url.searchParams.get("fromDate");
    const toDate = url.searchParams.get("toDate");

    let query = supabaseAdmin!.from("audit_logs").select("*");

    if (eventId) query = query.eq("event_id", eventId);
    if (actorId) query = query.eq("actor_id", actorId);
    if (action) query = query.eq("action", action);
    if (entityType) query = query.eq("entity_type", entityType);
    if (fromDate) query = query.gte("created_at", fromDate);
    if (toDate) query = query.lte("created_at", toDate);

    // Get total count with filters
    const countQuery = supabaseAdmin!.from("audit_logs").select("*", { count: "exact", head: true });
    if (eventId) countQuery.eq("event_id", eventId);
    if (actorId) countQuery.eq("actor_id", actorId);
    if (action) countQuery.eq("action", action);
    if (entityType) countQuery.eq("entity_type", entityType);
    if (fromDate) countQuery.gte("created_at", fromDate);
    if (toDate) countQuery.lte("created_at", toDate);

    const { count: totalCount, error: countError } = await countQuery;
    if (countError) throw countError;

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    return paginatedResponse(data || [], page, limit, totalCount || 0);
  } catch (error) {
    return handleRouteError(error, "Failed to fetch audit logs");
  }
}