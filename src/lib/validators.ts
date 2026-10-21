import { z } from "zod";

/**
 * Validation schemas for API routes
 */

// Participant join schema
export const participantJoinSchema = z.object({
  eventSlug: z.string().min(1),
  joinCode: z.string().min(1),
  displayName: z.string().min(1).max(32),
});

// Quiz answer schema
export const quizAnswerSchema = z.object({
  questionId: z.string().uuid(),
  optionId: z.string().uuid(),
  idempotencyKey: z.string().min(1).max(64),
});

// Bug Hunt submission schema
export const bugSubmissionSchema = z.object({
  challengeId: z.string().uuid(),
  submissionText: z.string().max(12000),
  explanation: z.string().max(5000),
});

// Judge assignment schema
export const judgeAssignmentSchema = z.object({
  challengeId: z.string().uuid(),
  judgeUserId: z.string().uuid(),
});

// Judgement schema
export const judgementSchema = z.object({
  submissionId: z.string().uuid(),
  rubricScores: z.record(z.string(), z.number().min(0).max(100)),
  totalScore: z.number().min(0).max(100),
  rationale: z.string().min(1).max(5000),
});

// Event creation schema
export const eventCreateSchema = z.object({
  slug: z.string().min(1).max(64).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(128),
  timezone: z.string().default(() => "Africa/Lagos"),
  joinCode: z.string().min(4).max(32),
  rules: z.record(z.string(), z.unknown()).default(() => ({})),
  settings: z.record(z.string(), z.unknown()).default(() => ({})),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
});

// Round creation schema
export const roundCreateSchema = z.object({
  eventId: z.string().uuid(),
  type: z.enum(["quiz", "bug_hunt"]),
  title: z.string().min(1).max(128),
  sequence: z.number().int().min(0),
  startsAt: z.string().datetime().optional(),
  deadlineAt: z.string().datetime().optional(),
  settings: z.record(z.string(), z.unknown()).default(() => ({})),
});

// Quiz question schema
export const quizQuestionSchema = z.object({
  roundId: z.string().uuid(),
  prompt: z.string().min(1).max(500),
  questionType: z.enum(["single_select"]).default("single_select"),
  points: z.number().int().min(0).default(100),
  durationSeconds: z.number().int().min(5).max(600).default(30),
  sequence: z.number().int().min(0),
});

// Bug challenge schema
export const bugChallengeSchema = z.object({
  roundId: z.string().uuid(),
  title: z.string().min(1).max(128),
  prompt: z.string().min(1).max(5000),
  language: z.string().min(1).max(64),
  starterCode: z.string().max(12000),
  submissionType: z.enum(["patch", "explanation", "both"]),
  deadlineAt: z.string().datetime().optional(),
  rubric: z.record(z.string(), z.number().min(0).max(100)).default(() => ({
    correctness: 50,
    reasoning: 20,
    remediation: 20,
    validation: 10,
  })),
  judgeNotes: z.string().max(5000).optional(),
});

// Prize schema
export const prizeSchema = z.object({
  eventId: z.string().uuid(),
  name: z.string().min(1).max(128),
  category: z.string().min(1).max(64),
  inventoryCount: z.number().int().min(1).default(() => 1),
  rules: z.record(z.string(), z.unknown()).default(() => ({})),
});

// Prize award schema
export const prizeAwardSchema = z.object({
  prizeId: z.string().uuid(),
  participantId: z.string().uuid(),
  notesPrivate: z.string().max(2000).optional(),
});

// IDempotency key schema (for deduplication)
export const idempotencyKeySchema = z.string().min(1).max(64);

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(() => 1),
  limit: z.coerce.number().int().min(1).max(100).default(() => 20),
});

// Type exports
export type ParticipantJoinInput = z.infer<typeof participantJoinSchema>;
export type QuizAnswerInput = z.infer<typeof quizAnswerSchema>;
export type BugSubmissionInput = z.infer<typeof bugSubmissionSchema>;
export type JudgeAssignmentInput = z.infer<typeof judgeAssignmentSchema>;
export type JudgementInput = z.infer<typeof judgementSchema>;
export type EventCreateInput = z.infer<typeof eventCreateSchema>;
export type RoundCreateInput = z.infer<typeof roundCreateSchema>;
export type QuizQuestionInput = z.infer<typeof quizQuestionSchema>;
export type BugChallengeInput = z.infer<typeof bugChallengeSchema>;
export type PrizeInput = z.infer<typeof prizeSchema>;
export type PrizeAwardInput = z.infer<typeof prizeAwardSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;