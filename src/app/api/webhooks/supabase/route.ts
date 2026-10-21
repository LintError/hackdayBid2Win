import { NextRequest, NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api-utils";

/** A row payload delivered by the Supabase webhook. */
type WebhookRecord = Record<string, unknown>;

/** Shape of the webhook body. */
interface SupabaseWebhookBody {
  type?: string;
  table?: string;
  record?: WebhookRecord;
  schema?: string;
}

/**
 * GET /api/webhooks/supabase - Verify webhook endpoint
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const challenge = url.searchParams.get("hub.challenge");

  if (challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ status: "ok" });
}

/**
 * POST /api/webhooks/supabase - Handle Supabase real-time webhooks
 * This endpoint receives database change events from Supabase
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SupabaseWebhookBody;
    const { type, table, record, schema } = body;

    // Log webhook for debugging
    console.log("Supabase webhook received:", { type, table, schema });

    const row = record ?? {};

    // Handle different table events
    switch (table) {
      case "quiz_answers":
        await handleQuizAnswer(row, type);
        break;
      case "bug_submissions":
        await handleBugSubmission(row, type);
        break;
      case "judgements":
        await handleJudgement(row, type);
        break;
      case "score_ledger":
        await handleScoreLedger(row, type);
        break;
      case "participants":
        await handleParticipant(row, type);
        break;
      case "rounds":
        await handleRound(row, type);
        break;
      case "events":
        await handleEvent(row, type);
        break;
      default:
        console.log(`Unhandled table: ${table}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return handleRouteError(error, "Webhook processing failed");
  }
}

async function handleQuizAnswer(record: WebhookRecord, type?: string) {
  if (type === "INSERT") {
    // Update participant score in real-time
    // This would typically trigger a Supabase realtime broadcast
    console.log("New quiz answer:", record);
  }
}

async function handleBugSubmission(record: WebhookRecord, type?: string) {
  if (type === "INSERT") {
    console.log("New bug submission:", record);
  } else if (type === "UPDATE") {
    console.log("Bug submission updated:", record);
  }
}

async function handleJudgement(record: WebhookRecord, type?: string) {
  if (type === "INSERT") {
    console.log("New judgement:", record);
  }
}

async function handleScoreLedger(record: WebhookRecord, type?: string) {
  if (type === "INSERT") {
    console.log("Score updated:", record);
  }
}

async function handleParticipant(record: WebhookRecord, type?: string) {
  if (type === "INSERT") {
    console.log("New participant joined:", record);
  }
}

async function handleRound(record: WebhookRecord, type?: string) {
  if (type === "UPDATE") {
    console.log("Round status changed:", record);
  }
}

async function handleEvent(record: WebhookRecord, type?: string) {
  if (type === "UPDATE") {
    console.log("Event status changed:", record);
  }
}
