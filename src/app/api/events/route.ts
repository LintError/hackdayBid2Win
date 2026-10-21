import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth";
import { eventCreateSchema } from "@/lib/validators";
import { successResponse, validateBody, handleRouteError } from "@/lib/api-utils";

/**
 * GET /api/events - List all events (admin only)
 */
export async function GET() {
  try {
    await requireAdmin();
    
    const { data, error } = await supabaseAdmin!
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    
    return successResponse(data);
  } catch (error) {
    return handleRouteError(error, "Failed to fetch events");
  }
}

/**
 * POST /api/events - Create a new event (admin only)
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