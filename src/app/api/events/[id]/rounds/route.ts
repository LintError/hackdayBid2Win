import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth";
import { roundCreateSchema } from "@/lib/validators";
import { successResponse, errorResponse, validateBody, paginatedResponse, handleRouteError } from "@/lib/api-utils";

/**
 * GET /api/events/[id]/rounds - List rounds for an event
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id: eventId } = await params;
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");

    // Get total count
    const { count, error: countError } = await supabaseAdmin!
      .from("rounds")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId);

    if (countError) throw countError;

    // Get paginated results
    const { data, error } = await supabaseAdmin!
      .from("rounds")
      .select("*")
      .eq("event_id", eventId)
      .order("sequence", { ascending: true })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    return paginatedResponse(data || [], page, limit, count || 0);
  } catch (error) {
    return handleRouteError(error, "Failed to fetch rounds");
  }
}

/**
 * POST /api/events/[id]/rounds - Create a new round for an event
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id: eventId } = await params;

    const validation = await validateBody(request, roundCreateSchema);
    if (validation instanceof NextResponse) return validation;

    // Verify event exists
    const { data: event, error: eventError } = await supabaseAdmin!
      .from("events")
      .select("id")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return errorResponse("Event not found", 404);
    }

    const { data, error } = await supabaseAdmin!
      .from("rounds")
      .insert({ ...validation.data, event_id: eventId })
      .select()
      .single();

    if (error) throw error;

    // Log audit
    await supabaseAdmin!.from("audit_logs").insert({
      action: "round_created",
      entity_type: "round",
      entity_id: data.id,
      after_json: data,
    });

    return successResponse(data, 201);
  } catch (error) {
    return handleRouteError(error, "Failed to create round");
  }
}