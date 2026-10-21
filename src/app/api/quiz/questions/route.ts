import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth";
import { quizQuestionSchema } from "@/lib/validators";
import { successResponse, errorResponse, validateBody, paginatedResponse, handleRouteError } from "@/lib/api-utils";

/**
 * GET /api/quiz/questions?roundId=xxx - Get questions for a round
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const roundId = url.searchParams.get("roundId");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "50");

    if (!roundId) {
      return errorResponse("roundId query parameter is required", 400);
    }

    const { count, error: countError } = await supabaseAdmin!
      .from("quiz_questions")
      .select("*", { count: "exact", head: true })
      .eq("round_id", roundId);

    if (countError) throw countError;

    const { data, error } = await supabaseAdmin!
      .from("quiz_questions")
      .select("*")
      .eq("round_id", roundId)
      .order("sequence", { ascending: true })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    // For admin, include correct answers; for participants, exclude them
    const isAdmin = request.headers.get("x-admin-access") === "true";
    const questions = data?.map(q => {
      if (!isAdmin) {
        const { correct_option_id, ...rest } = q;
        return rest;
      }
      return q;
    });

    return paginatedResponse(questions || [], page, limit, count || 0);
  } catch (error) {
    return handleRouteError(error, "Failed to fetch questions");
  }
}

/**
 * POST /api/quiz/questions - Create a new quiz question (admin)
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    
    const validation = await validateBody(request, quizQuestionSchema);
    if (validation instanceof NextResponse) return validation;

    const { data, error } = await supabaseAdmin!
      .from("quiz_questions")
      .insert(validation.data)
      .select()
      .single();

    if (error) throw error;

    return successResponse(data, 201);
  } catch (error) {
    return handleRouteError(error, "Failed to create question");
  }
}