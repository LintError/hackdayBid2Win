import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabaseServer } from "@/lib/supabase-server";
import { requireJudge } from "@/lib/auth";
import { judgementSchema } from "@/lib/validators";
import { successResponse, errorResponse, validateBody, paginatedResponse, handleRouteError } from "@/lib/api-utils";

/**
 * POST /api/judgements - Submit a judgement for a submission (judge)
 */
export async function POST(request: NextRequest) {
  try {
    await requireJudge();
    
    const validation = await validateBody(request, judgementSchema);
    if (validation instanceof NextResponse) return validation;

    const { submissionId, rubricScores, totalScore, rationale } = validation.data;

    // Verify judge is assigned to this challenge
    const { data: submission } = await supabaseAdmin!
      .from("bug_submissions")
      .select("challenge_id")
      .eq("id", submissionId)
      .single();

    if (!submission) {
      return errorResponse("Submission not found", 404);
    }

    const { data: assignment } = await supabaseAdmin!
      .from("judge_assignments")
      .select("judge_user_id")
      .eq("challenge_id", submission.challenge_id)
      .eq("judge_user_id", (await supabaseServer!.auth.getUser()).data.user?.id)
      .single();

    if (!assignment) {
      return errorResponse("You are not assigned to judge this challenge", 403);
    }

    // Check if already judged
    const { data: existing } = await supabaseAdmin!
      .from("judgements")
      .select("id")
      .eq("submission_id", submissionId)
      .eq("judge_user_id", assignment.judge_user_id)
      .single();

    if (existing) {
      return errorResponse("You have already judged this submission", 409);
    }

    // Create judgement
    const { data: judgement, error } = await supabaseAdmin!
      .from("judgements")
      .insert({
        submission_id: submissionId,
        judge_user_id: assignment.judge_user_id,
        rubric_scores: rubricScores,
        total_score: totalScore,
        rationale,
        status: "provisional",
      })
      .select()
      .single();

    if (error) throw error;

    // Update submission status
    await supabaseAdmin!
      .from("bug_submissions")
      .update({ status: "under_review" })
      .eq("id", submissionId);

    // Add to score ledger
    const { data: round } = await supabaseAdmin!
      .from("bug_challenges")
      .select("round_id")
      .eq("id", (await supabaseAdmin!.from("bug_submissions").select("challenge_id").eq("id", submissionId).single()).data?.challenge_id)
      .single();

    const { data: roundData } = await supabaseAdmin!
      .from("rounds")
      .select("event_id")
      .eq("id", round?.round_id)
      .single();

    await supabaseAdmin!.from("score_ledger").insert({
      event_id: roundData?.event_id,
      participant_id: (await supabaseAdmin!.from("bug_submissions").select("participant_id").eq("id", submissionId).single()).data?.participant_id,
      source_type: "judgement",
      source_id: judgement.id,
      points_delta: totalScore,
      reason: `Judge evaluation: ${rationale}`,
      actor_id: assignment.judge_user_id,
    });

    return successResponse(judgement, 201);
  } catch (error) {
    return handleRouteError(error, "Failed to submit judgement");
  }
}

/**
 * GET /api/judgements - Get judgements for a submission
 */
export async function GET(request: NextRequest) {
  try {
    await requireJudge();
    
    const url = new URL(request.url);
    const submissionId = url.searchParams.get("submissionId");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");

    let query = supabaseAdmin!.from("judgements").select("*");

    if (submissionId) {
      query = query.eq("submission_id", submissionId);
    }

    const { count, error: countError } = await supabaseAdmin!
      .from("judgements")
      .select("*", { count: "exact", head: true })
      .eq("submission_id", submissionId || "");

    if (countError) throw countError;

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    return paginatedResponse(data || [], page, limit, count || 0);
  } catch (error) {
    return handleRouteError(error, "Failed to fetch judgements");
  }
}