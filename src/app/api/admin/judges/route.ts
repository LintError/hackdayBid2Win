import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth";
import { successResponse, errorResponse, paginatedResponse, handleRouteError } from "@/lib/api-utils";

/**
 * GET /api/admin/judges - List all judges (admin)
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");

    const { count, error: countError } = await supabaseAdmin!
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "judge");

    if (countError) throw countError;

    const { data, error } = await supabaseAdmin!
      .from("profiles")
      .select(`
        *,
        judge_assignments!left (
          challenge_id,
          bug_challenges!inner (
            title,
            round_id
          )
        )
      `)
      .eq("role", "judge")
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    return paginatedResponse(data || [], page, limit, count || 0);
  } catch (error) {
    return handleRouteError(error, "Failed to fetch judges");
  }
}

/**
 * POST /api/admin/judges - Add a user as a judge (admin)
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return errorResponse("userId is required", 400);
    }

    // Check if user exists
    const { data: userData, error: userError } = await supabaseAdmin!.auth.admin.getUserById(userId);
    if (userError || !userData?.user) {
      return errorResponse("User not found", 404);
    }
    const user = userData.user;

    // Update profile to judge role
    const { data, error } = await supabaseAdmin!
      .from("profiles")
      .upsert({
        user_id: userId,
        display_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Judge",
        role: "judge",
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    // Log audit
    await supabaseAdmin!.from("audit_logs").insert({
      action: "judge_added",
      entity_type: "profile",
      entity_id: userId,
      after_json: data,
    });

    return successResponse(data, 201);
  } catch (error) {
    return handleRouteError(error, "Failed to add judge");
  }
}

/**
 * PATCH /api/admin/judges - Update judge status (admin)
 */
export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();
    
    const body = await request.json();
    const { userId, isActive } = body;

    if (!userId || typeof isActive !== "boolean") {
      return errorResponse("userId and isActive are required", 400);
    }

    const { data, error } = await supabaseAdmin!
      .from("profiles")
      .update({ is_active: isActive })
      .eq("user_id", userId)
      .eq("role", "judge")
      .select()
      .single();

    if (error) throw error;
    if (!data) return errorResponse("Judge not found", 404);

    return successResponse(data);
  } catch (error) {
    return handleRouteError(error, "Failed to update judge");
  }
}