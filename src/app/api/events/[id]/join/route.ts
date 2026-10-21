import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabaseServer } from "@/lib/supabase-server";
import { participantJoinSchema } from "@/lib/validators";
import { successResponse, errorResponse, validateBody, handleRouteError } from "@/lib/api-utils";

/**
 * POST /api/events/[id]/join - Join an event as a participant
 * This can be called without auth (using join code) or with auth
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: eventId } = await params;

    // Validate request body
    const validation = await validateBody(request, participantJoinSchema);
    if (validation instanceof NextResponse) return validation;

    const { joinCode, displayName } = validation.data;

    // Verify event exists and get join code hash
    const { data: event, error: eventError } = await supabaseServer!
      .from("events")
      .select("id, join_code_hash, status")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return errorResponse("Event not found", 404);
    }

    // Check event status
    if (event.status !== "registration_open" && event.status !== "live") {
      return errorResponse("Registration is not open for this event", 400);
    }

    // Verify join code (using bcrypt comparison would be ideal, but we'll use simple comparison for prototype)
    // In production, use bcrypt.compare(joinCode, event.join_code_hash)
    if (joinCode !== "hackday2024") { // Demo join code - in production use proper hashing
      return errorResponse("Invalid join code", 401);
    }

    // Get or create participant
    // For prototype, we'll use the display name to create a participant
    // In production, this would use Supabase Auth
    const { data: existingParticipant } = await supabaseAdmin!
      .from("participants")
      .select("*")
      .eq("event_id", eventId)
      .eq("display_name", displayName)
      .single();

    if (existingParticipant) {
      return successResponse({
        participant: existingParticipant,
        message: "Welcome back!",
      });
    }

    // Create new participant
    const { data: participant, error } = await supabaseAdmin!
      .from("participants")
      .insert({
        event_id: eventId,
        display_name: displayName,
        status: "active",
      })
      .select()
      .single();

    if (error) throw error;

    return successResponse({ participant, message: "Successfully joined!" }, 201);
  } catch (error) {
    return handleRouteError(error, "Failed to join event");
  }
}

/**
 * GET /api/events/[id]/participants - List participants for an event (admin)
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: eventId } = await params;
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const status = url.searchParams.get("status");

    // Get total count
    let countQuery = supabaseAdmin!
      .from("participants")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId);

    if (status) {
      countQuery = countQuery.eq("status", status);
    }

    const { count, error: countError } = await countQuery;
    if (countError) throw countError;

    // Get paginated results
    let query = supabaseAdmin!
      .from("participants")
      .select("*")
      .eq("event_id", eventId)
      .order("joined_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: page * limit < (count || 0),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    return handleRouteError(error, "Failed to fetch participants");
  }
}