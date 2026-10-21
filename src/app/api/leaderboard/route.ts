import { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { successResponse, errorResponse, handleRouteError } from "@/lib/api-utils";

/**
 * GET /api/leaderboard - Get leaderboard for an event
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const eventId = url.searchParams.get("eventId");
    const roundId = url.searchParams.get("roundId");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "50");

    if (!eventId) {
      return errorResponse("eventId query parameter is required", 400);
    }

    // Get participants with scores from score_ledger
    let query = supabaseServer!.from("score_ledger")
      .select(`
        participant_id,
        points_delta,
        source_type,
        participants!inner (
          id,
          display_name,
          event_id
        )
      `)
      .eq("participants.event_id", eventId);

    if (roundId) {
      // Filter by round if specified
      query = query.eq("source_type", "quiz_answer");
      // Note: Would need to join through round to filter by round
    }

    const { data: scoreData, error } = await query
      .order("points_delta", { ascending: false })
      .limit(100);

    if (error) throw error;

    // Aggregate scores by participant
    const scores = new Map<string, { 
      participantId: string;
      displayName: string;
      totalScore: number;
      quizScore: number;
      bugScore: number;
    }>();

    scoreData?.forEach(row => {
      // Use type assertion with unknown to bypass Supabase's type inference issues
      const participant = (row.participants as unknown) as { id: string; display_name: string; event_id: string } | null;
      if (!participant) return;
      const existing = scores.get(participant.id) || {
        participantId: participant.id,
        displayName: participant.display_name,
        totalScore: 0,
        quizScore: 0,
        bugScore: 0,
      };
      
      existing.totalScore += row.points_delta;
      if (row.source_type === "quiz_answer") {
        existing.quizScore += row.points_delta;
      } else if (row.source_type === "judgement" || row.source_type === "bug_submission") {
        existing.bugScore += row.points_delta;
      }
      
      scores.set(participant.id, existing);
    });

    // Convert to sorted array
    const leaderboard = Array.from(scores.values())
      .sort((a, b) => b.totalScore - a.totalScore)
      .map((entry, index) => ({
        rank: index + 1,
        ...entry,
      }))
      .slice((page - 1) * limit, page * limit);

    return successResponse({
      leaderboard,
      total: scores.size,
    });
  } catch (error) {
    return handleRouteError(error, "Failed to fetch leaderboard");
  }
}

/**
 * POST /api/leaderboard/event/:eventId - Get real-time leaderboard via Supabase Realtime
 * This endpoint provides the query for the frontend to subscribe to real-time updates
 */
export async function POST(request: Request) {
  try {
    const { eventId } = await request.json();
    
    if (!eventId) {
      return errorResponse("eventId is required", 400);
    }

    // Return the Supabase realtime subscription query
    return successResponse({
      subscription: {
        table: "score_ledger",
        filter: `event_id=eq.${eventId}`,
        select: `
          participant_id,
          points_delta,
          source_type,
          created_at
        `,
        event: "INSERT",
      },
    });
  } catch (error) {
    return handleRouteError(error, "Failed to create subscription query");
  }
}