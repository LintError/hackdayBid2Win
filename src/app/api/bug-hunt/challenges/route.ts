import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabaseServer } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth";
import { bugChallengeSchema } from "@/lib/validators";
import { successResponse, errorResponse, validateBody, paginatedResponse, handleRouteError } from "@/lib/api-utils";

/**
 * GET /api/bug-hunt/challenges?roundId=xxx - Get challenges for a round
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const roundId = url.searchParams.get("roundId");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");

    if (!roundId) {
      return errorResponse("roundId query parameter is required", 400);
    }

    const { count, error: countError } = await supabaseServer!
      .from("bug_challenges")
      .select("*", { count: "exact", head: true })
      .eq("round_id", roundId);

    if (countError) throw countError;

    const { data, error } = await supabaseServer!
      .from("bug_challenges")
      .select("*")
      .eq("round_id", roundId)
      .order("created_at", { ascending: true })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    // For non-admins, exclude judge_notes
    const isAdmin = request.headers.get("x-admin-access") === "true";
    const challenges = data?.map(c => {
      if (!isAdmin) {
        const { judge_notes, ...rest } = c;
        return rest;
      }
      return c;
    });

    return paginatedResponse(challenges || [], page, limit, count || 0);
  } catch (error) {
    return handleRouteError(error, "Failed to fetch challenges");
  }
}

/**
 * POST /api/bug-hunt/challenges - Create a new bug challenge (admin)
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    
    const validation = await validateBody(request, bugChallengeSchema);
    if (validation instanceof NextResponse) return validation;

    const { data, error } = await supabaseAdmin!
      .from("bug_challenges")
      .insert(validation.data)
      .select()
      .single();

    if (error) throw error;

    return successResponse(data, 201);
  } catch (error) {
    return handleRouteError(error, "Failed to create challenge");
  }
}