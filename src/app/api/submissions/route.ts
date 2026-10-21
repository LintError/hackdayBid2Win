import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth";
import { errorResponse, paginatedResponse, handleRouteError } from "@/lib/api-utils";

/**
 * GET /api/submissions - Get all submissions (admin)
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const eventId = url.searchParams.get("eventId");
    const roundId = url.searchParams.get("roundId");
    const type = url.searchParams.get("type"); // "quiz" or "bug_hunt"
    const status = url.searchParams.get("status");

    // Build query based on type
    if (type === "quiz" || !type) {
      let query = supabaseAdmin!.from("quiz_answers").select(`
        *,
        quiz_questions!inner (
          id,
          prompt,
          round_id,
          rounds!inner (
            id,
            title,
            event_id,
            events!inner (name)
          )
        ),
        participants!inner (
          display_name
        )
      `, { count: "exact" });

      if (eventId) query = query.eq("quiz_questions.rounds.events.id", eventId);
      if (roundId) query = query.eq("quiz_questions.round_id", roundId);
      if (status) query = query.eq("status", status);

      const { count, error: countError } = await query;
      if (countError) throw countError;

      const { data, error } = await query
        .order("received_at", { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (error) throw error;

      return paginatedResponse(data || [], page, limit, count || 0);
    }

    if (type === "bug_hunt") {
      let query = supabaseAdmin!.from("bug_submissions").select(`
        *,
        bug_challenges!inner (
          id,
          title,
          round_id,
          rounds!inner (
            id,
            title,
            event_id,
            events!inner (name)
          )
        ),
        participants!inner (
          display_name
        ),
        judgements (
          id,
          total_score,
          status
        )
      `, { count: "exact" });

      if (eventId) query = query.eq("bug_challenges.rounds.events.id", eventId);
      if (roundId) query = query.eq("bug_challenges.round_id", roundId);
      if (status) query = query.eq("status", status);

      const { count, error: countError } = await query;
      if (countError) throw countError;

      const { data, error } = await query
        .order("received_at", { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (error) throw error;

      return paginatedResponse(data || [], page, limit, count || 0);
    }

    return errorResponse("Invalid type parameter. Use 'quiz' or 'bug_hunt'", 400);
  } catch (error) {
    return handleRouteError(error, "Failed to fetch submissions");
  }
}