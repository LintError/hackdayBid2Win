-- Prototype schema starter. Review, split into migrations, and add RLS policies
-- before using with real participants. This file intentionally does not enable
-- permissive policies or expose correct answers to anonymous clients.

create extension if not exists pgcrypto;

create type public.app_role as enum ('admin', 'judge', 'participant');
create type public.event_status as enum ('draft', 'registration_open', 'live', 'paused', 'ended', 'finalized');
create type public.round_status as enum ('draft', 'scheduled', 'live', 'paused', 'ended', 'finalized');
create type public.round_type as enum ('quiz', 'bug_hunt');

create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  timezone text not null default 'Africa/Lagos',
  join_code_hash text not null,
  status public.event_status not null default 'draft',
  starts_at timestamptz,
  ends_at timestamptz,
  rules jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role public.app_role not null default 'participant',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete restrict,
  user_id uuid references auth.users(id) on delete set null,
  display_name text not null check (char_length(display_name) between 1 and 32),
  status text not null default 'active' check (status in ('active', 'disqualified', 'withdrawn')),
  joined_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create table public.rounds (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete restrict,
  type public.round_type not null,
  title text not null,
  status public.round_status not null default 'draft',
  sequence integer not null check (sequence >= 0),
  starts_at timestamptz,
  deadline_at timestamptz,
  paused_at timestamptz,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (event_id, sequence)
);

create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.rounds(id) on delete restrict,
  prompt text not null,
  question_type text not null default 'single_select' check (question_type = 'single_select'),
  points integer not null default 100 check (points >= 0),
  duration_seconds integer not null default 30 check (duration_seconds between 5 and 600),
  sequence integer not null check (sequence >= 0),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  unique (round_id, sequence)
);

create table public.quiz_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.quiz_questions(id) on delete restrict,
  label text not null,
  sequence integer not null check (sequence >= 0),
  is_correct boolean not null default false,
  unique (question_id, sequence)
);

create table public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.quiz_questions(id) on delete restrict,
  participant_id uuid not null references public.participants(id) on delete restrict,
  option_id uuid not null references public.quiz_options(id) on delete restrict,
  received_at timestamptz not null default now(),
  accepted boolean not null default true,
  points_awarded integer not null default 0 check (points_awarded >= 0),
  idempotency_key text not null,
  unique (question_id, participant_id),
  unique (participant_id, idempotency_key)
);

create table public.bug_challenges (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.rounds(id) on delete restrict,
  title text not null,
  prompt text not null,
  language text not null,
  starter_code text not null,
  submission_type text not null check (submission_type in ('patch', 'explanation', 'both')),
  deadline_at timestamptz,
  rubric jsonb not null default '{"correctness":50,"reasoning":20,"remediation":20,"validation":10}'::jsonb,
  judge_notes text,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.bug_submissions (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.bug_challenges(id) on delete restrict,
  participant_id uuid not null references public.participants(id) on delete restrict,
  submission_text text not null check (char_length(submission_text) <= 12000),
  explanation text not null check (char_length(explanation) <= 5000),
  received_at timestamptz not null default now(),
  status text not null default 'submitted' check (status in ('submitted', 'under_review', 'scored', 'disqualified')),
  content_hash text generated always as (encode(digest(submission_text || explanation, 'sha256'), 'hex')) stored
);

create table public.judge_assignments (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.bug_challenges(id) on delete restrict,
  judge_user_id uuid not null references public.profiles(user_id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (challenge_id, judge_user_id)
);

create table public.judgements (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.bug_submissions(id) on delete restrict,
  judge_user_id uuid not null references public.profiles(user_id) on delete restrict,
  rubric_scores jsonb not null,
  total_score integer not null check (total_score between 0 and 100),
  rationale text not null,
  status text not null default 'provisional' check (status in ('provisional', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (submission_id, judge_user_id)
);

create table public.score_ledger (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete restrict,
  participant_id uuid not null references public.participants(id) on delete restrict,
  source_type text not null,
  source_id uuid not null,
  points_delta integer not null,
  reason text not null,
  actor_id uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.prizes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete restrict,
  name text not null,
  category text not null,
  inventory_count integer not null default 1 check (inventory_count >= 0),
  rules jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.prize_awards (
  id uuid primary key default gen_random_uuid(),
  prize_id uuid not null references public.prizes(id) on delete restrict,
  participant_id uuid not null references public.participants(id) on delete restrict,
  approved_by uuid not null references public.profiles(user_id) on delete restrict,
  status text not null default 'reserved' check (status in ('reserved', 'awarded', 'handed_over', 'cancelled')),
  awarded_at timestamptz,
  handed_over_at timestamptz,
  notes_private text,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete restrict,
  actor_id uuid references public.profiles(user_id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_json jsonb,
  after_json jsonb,
  reason text,
  created_at timestamptz not null default now()
);

create index participants_event_status_idx on public.participants(event_id, status);
create index rounds_event_status_idx on public.rounds(event_id, status);
create index quiz_answers_participant_idx on public.quiz_answers(participant_id, received_at);
create index bug_submissions_challenge_time_idx on public.bug_submissions(challenge_id, received_at);
create index judgements_submission_status_idx on public.judgements(submission_id, status);
create index score_ledger_event_participant_idx on public.score_ledger(event_id, participant_id);

-- Before production:
-- 1. Enable RLS on every public table.
-- 2. Add role-specific policies and safe public views.
-- 3. Do not allow clients to read quiz_options.is_correct or bug_challenges.judge_notes.
-- 4. Move answer acceptance/scoring into a transaction/RPC or trusted server handler.
-- 5. Add audit triggers or trusted append-only insert path.
-- 6. Test every role and anonymous access path.
