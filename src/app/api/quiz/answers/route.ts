import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabaseServer } from "@/lib/supabase-server";
import { quizAnswerSchema } from "@/lib/validators";
import { successResponse, errorResponse, validateBody, handleRouteError } from "@/lib/api-utils";

/**
 * POST /api/quiz/answers - Submit a quiz answer
 * Supports both authenticated and demo modes
 */
export async function POST(request: NextRequest) {
  try {
    const validation = await validateBody(request, quizAnswerSchema);
    if (validation instanceof NextResponse) return validation;

    const { questionId, optionId, idempotencyKey } = validation.data;

    // Verify question exists and get correct answer
    const { data: question, error: questionError } = await supabaseServer!
      .from("quiz_questions")
      .select("id, round_id, published_at")
      .eq("id", questionId)
      .single();

    if (questionError || !question) {
      return errorResponse("Question not found", 404);
    }

    // Check if question is published
    if (!question.published_at) {
      return errorResponse("Question not yet published", 400);
    }

    // Check deadline if round has one
    const { data: round } = await supabaseAdmin!
      .from("rounds")
      .select("deadline_at, event_id")
      .eq("id", question.round_id)
      .single();

    if (round?.deadline_at && new Date() > new Date(round.deadline_at)) {
      return errorResponse("Question deadline has passed", 400);
    }

    // Get the correct option
    const { data: correctOption, error: optionError } = await supabaseServer!
      .from("quiz_options")
      .select("id, is_correct")
      .eq("question_id", questionId)
      .eq("is_correct", true)
      .single();

    if (optionError || !correctOption) {
      return errorResponse("Question configuration error", 500);
    }

    // Check if participant already answered (idempotency)
    const { data: existingAnswer } = await supabaseServer!
      .from("quiz_answers")
      .select("*")
      .eq("question_id", questionId)
      .eq("idempotency_key", idempotencyKey)
      .single();

    if (existingAnswer) {
      return successResponse({
        alreadyAnswered: true,
        answer: existingAnswer,
      });
    }

    // Determine if answer is correct
    const isCorrect = optionId === correctOption.id;

    // Insert answer
    const { data: answer, error: answerError } = await supabaseAdmin!
      .from("quiz_answers")
      .insert({
        question_id: questionId,
        participant_id: "demo-participant", // In production, get from auth
        option_id: optionId,
        accepted: true,
        points_awarded: isCorrect ? 100 : 0,
        idempotency_key: idempotencyKey,
      })
      .select()
      .single();

    if (answerError) throw answerError;

    // Update score ledger
    const pointsAwarded = isCorrect ? 100 : 0;
    await supabaseAdmin!.from("score_ledger").insert({
      event_id: (await supabaseAdmin!.from("rounds").select("event_id").eq("id", question.round_id).single()).data?.event_id,
      participant_id: "demo-participant",
      source_type: "quiz_answer",
      source_id: answer.id,
      points_delta: pointsAwarded,
      reason: `Quiz answer: ${isCorrect ? "Correct" : "Incorrect"}`,
    });

    return successResponse({
      answer,
      isCorrect,
      pointsAwarded,
    });
  } catch (error) {
    return handleRouteError(error, "Failed to submit answer");
  }
}

/**
 * GET /api/quiz/answers - Get participant's answers for a round
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const roundId = url.searchParams.get("roundId");
    const participantId = url.searchParams.get("participantId");

    if (!roundId) {
      return errorResponse("roundId query parameter is required", 400);
    }

    const query = supabaseServer!.from("quiz_answers").select("*").eq("question_id", roundId);

    if (participantId) {
      query.eq("participant_id", participantId);
    }

    const { data, error } = await query.order("received_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    return handleRouteError(error, "Failed to fetch answers");
  }
}