import { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { successResponse, handleRouteError } from "@/lib/api-utils";
import { RouteParamsSingleId } from "@/app/api/types";

/**
 * GET /api/events/[id]/leaderboard - Get leaderboard for an event
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: eventId } = await params;

    // Get all participants for this event
    const { data: participants, error: participantsError } = await supabaseServer!
      .from("participants")
      .select("id, display_name")
      .eq("event_id", eventId)
      .eq("status", "active");

    if (participantsError) throw participantsError;

    if (!participants || participants.length === 0) {
      return successResponse({ leaderboard: [], total: 0 });
    }

    const participantIds = participants.map(p => p.id);

    // Get score ledger entries for these participants
    const { data: scores, error: scoresError } = await supabaseServer!
      .from("score_ledger")
      .select("participant_id, points_delta, source_type")
      .in("participant_id", participantIds)
      .eq("event_id", eventId);

    if (scoresError) throw scoresError;

    // Aggregate scores by participant
    const scoreMap = new Map<string, { 
      totalScore: number; 
      quizScore: number; 
      bugScore: number;
      displayName: string;
    }>();

    participantIds.forEach(id => {
      const participant = participants.find(p => p.id === id);
      if (participant) {
        scoreMap.set(id, {
          totalScore: 0,
          quizScore: 0,
          bugScore: 0,
          displayName: participant.display_name,
        });
      }
    });

    scores?.forEach(row => {
      const entry = scoreMap.get(row.participant_id);
      if (entry) {
        entry.totalScore += row.points_delta;
        if (row.source_type === "quiz_answer") {
          entry.quizScore += row.points_delta;
        } else if (row.source_type === "judgement" || row.source_type === "bug_submission") {
          entry.bugScore += row.points_delta;
        }
      }
    });

    // Convert to leaderboard array
    const leaderboard = Array.from(scoreMap.entries())
      .map(([participantId, scores]) => ({
        participantId,
        displayName: scores.displayName,
        totalScore: scores.totalScore,
        quizScore: scores.quizScore,
        bugScore: scores.bugScore,
      }))
      .sort((a, b) => b.totalScore - a.totalScore)
      .map((entry, index) => ({
        rank: index + 1,
        ...entry,
      }));

    return successResponse({
      leaderboard,
      total: leaderboard.length,
      eventId,
    });
  } catch (error) {
    return handleRouteError(error, "Failed to fetch leaderboard");
  }
}

/**
 * POST /api/events/[id]/leaderboard/realtime - Get realtime subscription query
 */
export async function POST(request: NextRequest, { params }: RouteParamsSingleId) {
  try {
    const { id: eventId } = await params;

    // Return Supabase Realtime subscription configuration
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
    return handleRouteError(error, "Failed to create subscription");
  }
}