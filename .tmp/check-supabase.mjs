// One-off connectivity check — prints statuses only, never secrets.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
const get = (k) => (env.match(new RegExp(`^${k}=(.*)$`, "m")) || [])[1]?.trim();

const url = get("NEXT_PUBLIC_SUPABASE_URL");
const anon = get("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const service = get("SUPABASE_SERVICE_ROLE_KEY");

console.log("url present:", Boolean(url), "| anon present:", Boolean(anon), "| service present:", Boolean(service));

const admin = createClient(url, service, { auth: { persistSession: false } });

// 1) anon key can reach the API at all
try {
  const { error } = await admin.from("events").select("id").limit(1);
  if (!error) console.log("events table: EXISTS");
  else console.log("events table query ->", error.code || "", error.message);
} catch (e) {
  console.log("events threw:", e.constructor.name, e.message?.slice(0, 120));
}

// 2) which of our tables exist
const tables = ["events", "profiles", "participants", "rounds", "quiz_questions", "quiz_options", "quiz_answers", "bug_challenges", "bug_submissions", "prizes", "prize_awards", "audit_logs", "score_ledger", "judgements"];
for (const t of tables) {
  try {
    const { error } = await admin.from(t).select("*", { count: "exact", head: true });
    console.log(`${t}: ${error ? (error.code === "42P01" ? "missing" : `error ${error.code}`) : "exists"}`);
  } catch (e) {
    console.log(`${t}: threw ${e.constructor.name}`);
  }
}

// 3) auth status
try {
  const { data, error } = await admin.auth.getSession();
  console.log("auth client: ok", error ? error.message.slice(0, 80) : "");
} catch (e) {
  console.log("auth threw:", e.constructor.name, e.message?.slice(0, 120));
}
