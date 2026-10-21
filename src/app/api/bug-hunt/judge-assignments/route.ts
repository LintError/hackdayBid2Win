import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin, requireJudge } from "@/lib/auth";
import { judgeAssignmentSchema } from "@/lib/validators";
import { successResponse, errorResponse, validateBody, handleRouteError } from "@/lib/api-utils";

/**
 * POST /api/bug-hunt/judge-assignments - Assign judges to challenges (admin)
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    
    const validation = await validateBody(request, judgeAssignmentSchema);
    if (validation instanceof NextResponse) return validation;

    const { data, error } = await supabaseAdmin!
      .from("judge_assignments")
      .insert(validation.data)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") { // Unique violation
        return errorResponse("Judge already assigned to this challenge", 409);
      }
      throw error;
    }

    return successResponse(data, 201);
  } catch (error) {
    return handleRouteError(error, "Failed to assign judge");
  }
}

/**
 * GET /api/bug-hunt/judge-assignments - Get judge assignments
 */
export async function GET(request: NextRequest) {
  try {
    await requireJudge();
    
    const url = new URL(request.url);
    const challengeId = url.searchParams.get("challengeId");
    const judgeUserId = url.searchParams.get("judgeUserId");

    let query = supabaseAdmin!.from("judge_assignments").select("*");

    if (challengeId) query = query.eq("challenge_id", challengeId);
    if (judgeUserId) query = query.eq("judge_user_id", judgeUserId);

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;

    return successResponse(data || []);
  } catch (error) {
    return handleRouteError(error, "Failed to fetch assignments");
  }
}