import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth";
import { successResponse, handleRouteError } from "@/lib/api-utils";

/**
 * GET /api/admin/stats - Get dashboard statistics (admin)
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    
    const url = new URL(request.url);
    const eventId = url.searchParams.get("eventId");

    // Base queries
    let eventsQuery = supabaseAdmin!.from("events").select("*", { count: "exact", head: true });
    let participantsQuery = supabaseAdmin!.from("participants").select("*", { count: "exact", head: true });
    let roundsQuery = supabaseAdmin!.from("rounds").select("*", { count: "exact", head: true });
    let quizAnswersQuery = supabaseAdmin!.from("quiz_answers").select("*", { count: "exact", head: true });
    let bugSubmissionsQuery = supabaseAdmin!.from("bug_submissions").select("*", { count: "exact", head: true });
    const judgementsQuery = supabaseAdmin!.from("judgements").select("*", { count: "exact", head: true });
    let prizesQuery = supabaseAdmin!.from("prizes").select("*", { count: "exact", head: true });
    let prizeAwardsQuery = supabaseAdmin!.from("prize_awards").select("*", { count: "exact", head: true });

    if (eventId) {
      eventsQuery = eventsQuery.eq("id", eventId);
      participantsQuery = participantsQuery.eq("event_id", eventId);
      roundsQuery = roundsQuery.eq("event_id", eventId);
      quizAnswersQuery = quizAnswersQuery.eq("round_id", (await supabaseAdmin!.from("rounds").select("id").eq("event_id", eventId)).data?.[0]?.id || "");
      bugSubmissionsQuery = bugSubmissionsQuery.eq("challenge_id", (await supabaseAdmin!.from("bug_challenges").select("id").eq("round_id", (await supabaseAdmin!.from("rounds").select("id").eq("event_id", eventId)).data?.[0]?.id || "")).data?.[0]?.id || "");
      prizesQuery = prizesQuery.eq("event_id", eventId);
      prizeAwardsQuery = prizeAwardsQuery.eq("prize_id", (await supabaseAdmin!.from("prizes").select("id").eq("event_id", eventId)).data?.[0]?.id || "");
    }

    const [
      { count: totalEvents },
      { count: totalParticipants },
      { count: totalRounds },
      { count: totalQuizAnswers },
      { count: totalBugSubmissions },
      { count: totalJudgements },
      { count: totalPrizes },
      { count: totalPrizeAwards },
    ] = await Promise.all([
      eventsQuery,
      participantsQuery,
      roundsQuery,
      quizAnswersQuery,
      bugSubmissionsQuery,
      judgementsQuery,
      prizesQuery,
      prizeAwardsQuery,
    ]);

    // Get recent activity
    const { data: recentActivity } = await supabaseAdmin!
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    // Get participant growth (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: newParticipants } = await supabaseAdmin!
      .from("participants")
      .select("*", { count: "exact", head: true })
      .gte("joined_at", weekAgo)
      .eq("event_id", eventId || "");

    return successResponse({
      overview: {
        totalEvents: totalEvents || 0,
        totalParticipants: totalParticipants || 0,
        totalRounds: totalRounds || 0,
        totalQuizAnswers: totalQuizAnswers || 0,
        totalBugSubmissions: totalBugSubmissions || 0,
        totalJudgements: totalJudgements || 0,
        totalPrizes: totalPrizes || 0,
        totalPrizeAwards: totalPrizeAwards || 0,
      },
      recentActivity: recentActivity || [],
      growth: {
        newParticipantsLast7Days: newParticipants || 0,
      },
    });
  } catch (error) {
    return handleRouteError(error, "Failed to fetch stats");
  }
}