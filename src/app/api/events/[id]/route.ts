import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth";
import { eventCreateSchema } from "@/lib/validators";
import { successResponse, errorResponse, validateBody, handleRouteError } from "@/lib/api-utils";
import { RouteParamsSingleId } from "@/app/api/types";

/**
 * GET /api/events/[id] - Get a specific event (admin only)
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;

    const { data, error } = await supabaseAdmin!
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!data) return errorResponse("Event not found", 404);

    return successResponse(data);
  } catch (error) {
    return handleRouteError(error, "Failed to fetch event");
  }
}

/**
 * PATCH /api/events/[id] - Update an event (admin only)
 */
export async function PATCH(request: NextRequest, { params }: RouteParamsSingleId) {
  try {
    await requireAdmin();
    const { id } = await params;

    const validation = await validateBody(request, eventCreateSchema.partial());
    if (validation instanceof NextResponse) return validation;

    const { data, error } = await supabaseAdmin!
      .from("events")
      .update({ ...validation.data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return errorResponse("Event not found", 404);

    // Log audit
    await supabaseAdmin!.from("audit_logs").insert({
      action: "event_updated",
      entity_type: "event",
      entity_id: id,
      after_json: data,
    });

    return successResponse(data);
  } catch (error) {
    return handleRouteError(error, "Failed to update event");
  }
}

/**
 * DELETE /api/events/[id] - Delete an event (admin only)
 */
export async function DELETE(request: NextRequest, { params }: RouteParamsSingleId) {
  try {
    await requireAdmin();
    const { id } = await params;

    const { error } = await supabaseAdmin!.from("events").delete().eq("id", id);
    if (error) throw error;

    // Log audit
    await supabaseAdmin!.from("audit_logs").insert({
      action: "event_deleted",
      entity_type: "event",
      entity_id: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error, "Failed to delete event");
  }
}