import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabaseServer } from "@/lib/supabase-server";
import { bugSubmissionSchema } from "@/lib/validators";
import { successResponse, errorResponse, validateBody, paginatedResponse, handleRouteError } from "@/lib/api-utils";

/**
 * POST /api/bug-hunt/submissions - Submit a bug hunt solution
 */
export async function POST(request: NextRequest) {
  try {
    const validation = await validateBody(request, bugSubmissionSchema);
    if (validation instanceof NextResponse) return validation;

    const { challengeId } = validation.data;

    // Verify challenge exists and is published
    const { data: challenge, error: challengeError } = await supabaseServer!
      .from("bug_challenges")
      .select("id, round_id, deadline_at, submission_type")
      .eq("id", challengeId)
      .single();

    if (challengeError || !challenge) {
      return errorResponse("Challenge not found", 404);
    }

    // Check deadline
    if (challenge.deadline_at && new Date() > new Date(challenge.deadline_at)) {
      return errorResponse("Submission deadline has passed", 400);
    }

    // Create submission
    const { data: submission, error } = await supabaseAdmin!
      .from("bug_submissions")
      .insert({
        challenge_id: challengeId,
        participant_id: "demo-participant", // In production, get from auth
        submission_text: validation.data.submissionText,
        explanation: validation.data.explanation,
      })
      .select()
      .single();

    if (error) throw error;

    // Assign judges if not already assigned
    const { data: existingAssignments } = await supabaseAdmin!
      .from("judge_assignments")
      .select("judge_user_id")
      .eq("challenge_id", challengeId);

    if (!existingAssignments || existingAssignments.length === 0) {
      // Auto-assign available judges (in production, use a proper assignment algorithm)
      const { data: judges } = await supabaseAdmin!
        .from("profiles")
        .select("user_id")
        .eq("role", "judge")
        .limit(3);

      if (judges && judges.length > 0) {
        const assignments = judges.map(j => ({
          challenge_id: challengeId,
          judge_user_id: j.user_id,
        }));
        await supabaseAdmin!.from("judge_assignments").insert(assignments);
      }
    }

    return successResponse({ submission }, 201);
  } catch (error) {
    return handleRouteError(error, "Failed to submit solution");
  }
}

/**
 * GET /api/bug-hunt/submissions - Get submissions for a challenge
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const challengeId = url.searchParams.get("challengeId");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const status = url.searchParams.get("status");

    if (!challengeId) {
      return errorResponse("challengeId query parameter is required", 400);
    }

    let query = supabaseAdmin!
      .from("bug_submissions")
      .select(`
        *,
        judgements(*)
      `)
      .eq("challenge_id", challengeId);

    if (status) {
      query = query.eq("status", status);
    }

    const { count, error: countError } = await supabaseAdmin!
      .from("bug_submissions")
      .select("*", { count: "exact", head: true })
      .eq("challenge_id", challengeId);

    if (countError) throw countError;

    query = query
      .order("received_at", { ascending: true })
      .range((page - 1) * limit, page * limit - 1);

    const { data, error } = await query;
    if (error) throw error;

    return paginatedResponse(data || [], page, limit, count || 0);
  } catch (error) {
    return handleRouteError(error, "Failed to fetch submissions");
  }
}