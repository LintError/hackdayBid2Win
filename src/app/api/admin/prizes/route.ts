import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth";
import { prizeSchema, prizeAwardSchema } from "@/lib/validators";
import { successResponse, errorResponse, validateBody, paginatedResponse, handleRouteError } from "@/lib/api-utils";

/**
 * GET /api/admin/prizes - List prizes (admin)
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const eventId = url.searchParams.get("eventId");

    let query = supabaseAdmin!.from("prizes").select(`
      *,
      prize_awards!left (
        id,
        participant_id,
        status,
        awarded_at,
        participants!inner (
          display_name
        )
      ),
      events!inner (
        name,
        slug
      )
    `, { count: "exact" });

    if (eventId) query = query.eq("event_id", eventId);

    const { count, error: countError } = await query;
    if (countError) throw countError;

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    return paginatedResponse(data || [], page, limit, count || 0);
  } catch (error) {
    return handleRouteError(error, "Failed to fetch prizes");
  }
}

/**
 * POST /api/admin/prizes - Create a new prize
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    
    const validation = await validateBody(request, prizeSchema);
    if (validation instanceof NextResponse) return validation;

    const { data, error } = await supabaseAdmin!
      .from("prizes")
      .insert(validation.data)
      .select()
      .single();

    if (error) throw error;

    return successResponse(data, 201);
  } catch (error) {
    return handleRouteError(error, "Failed to create prize");
  }
}

/**
 * PATCH /api/admin/prizes - Award a prize to a participant
 */
export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();
    
    const validation = await validateBody(request, prizeAwardSchema);
    if (validation instanceof NextResponse) return validation;

    const { prizeId, participantId, notesPrivate } = validation.data;

    // Check prize availability
    const { data: prize } = await supabaseAdmin!
      .from("prizes")
      .select("inventory_count")
      .eq("id", prizeId)
      .single();

    if (!prize) {
      return errorResponse("Prize not found", 404);
    }

    // Check existing awards
    const { count: awardedCount } = await supabaseAdmin!
      .from("prize_awards")
      .select("*", { count: "exact", head: true })
      .eq("prize_id", prizeId)
      .neq("status", "cancelled");

    if ((awardedCount || 0) >= prize.inventory_count) {
      return errorResponse("No inventory available for this prize", 400);
    }

    // Create award
    const { data: award, error } = await supabaseAdmin!
      .from("prize_awards")
      .insert({
        prize_id: prizeId,
        participant_id: participantId,
        approved_by: (await supabaseAdmin!.auth.getUser()).data.user?.id,
        status: "reserved",
        notes_private: notesPrivate,
      })
      .select()
      .single();

    if (error) throw error;

    // Update prize inventory
    await supabaseAdmin!.from("prizes")
      .update({ inventory_count: prize.inventory_count - 1 })
      .eq("id", prizeId);

    // Log audit
    await supabaseAdmin!.from("audit_logs").insert({
      action: "prize_awarded",
      entity_type: "prize_award",
      entity_id: award.id,
      after_json: award,
    });

    return successResponse(award);
  } catch (error) {
    return handleRouteError(error, "Failed to award prize");
  }
}