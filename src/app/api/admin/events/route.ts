import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth";
import { eventCreateSchema } from "@/lib/validators";
import { successResponse, validateBody, paginatedResponse, handleRouteError } from "@/lib/api-utils";

/**
 * GET /api/admin/events - List all events with stats (admin)
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const status = url.searchParams.get("status");

    let query = supabaseAdmin!.from("events").select("*", { count: "exact" });

    if (status) {
      query = query.eq("status", status);
    }

    const { count, error: countError } = await query;
    if (countError) throw countError;

    let dataQuery = supabaseAdmin!.from("events").select("*");
    if (status) dataQuery = dataQuery.eq("status", status);
    
    const { data, error } = await dataQuery
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    // Add participant counts for each event
    const eventsWithStats = await Promise.all(
      (data || []).map(async (event) => {
        const { count } = await supabaseAdmin!
          .from("participants")
          .select("*", { count: "exact", head: true })
          .eq("event_id", event.id);
        
        return { ...event, participantCount: count || 0 };
      }),
    );

    return paginatedResponse(eventsWithStats, page, limit, count || 0);
  } catch (error) {
    return handleRouteError(error, "Failed to fetch events");
  }
}

/**
 * POST /api/admin/events - Create a new event
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    
    const validation = await validateBody(request, eventCreateSchema);
    if (validation instanceof NextResponse) return validation;

    const { data, error } = await supabaseAdmin!
      .from("events")
      .insert(validation.data)
      .select()
      .single();

    if (error) throw error;

    // Log audit
    await supabaseAdmin!.from("audit_logs").insert({
      action: "event_created",
      entity_type: "event",
      entity_id: data.id,
      after_json: data,
    });

    return successResponse(data, 201);
  } catch (error) {
    return handleRouteError(error, "Failed to create event");
  }
}