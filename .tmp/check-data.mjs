// One-off data/RLS probe — prints counts only, never secrets.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
const get = (k) => (env.match(new RegExp(`^${k}=(.*)$`, "m")) || [])[1]?.trim();

const url = get("NEXT_PUBLIC_SUPABASE_URL");
const anonKey = get("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const serviceKey = get("SUPABASE_SERVICE_ROLE_KEY");

const svc = createClient(url, serviceKey, { auth: { persistSession: false } });
const anon = createClient(url, anonKey, { auth: { persistSession: false } });

const tables = ["events", "participants", "rounds", "quiz_questions", "quiz_options", "quiz_answers", "bug_challenges", "bug_submissions", "prizes", "prize_awards", "audit_logs", "score_ledger", "judgements", "profiles"];

console.log("== service-role counts ==");
for (const t of tables) {
  const { count, error } = await svc.from(t).select("*", { count: "exact", head: true });
  console.log(`${t}: ${error ? `ERR ${error.code}` : count}`);
}

console.log("== anon (RLS) reads ==");
for (const t of ["events", "participants", "prizes", "rounds"]) {
  const { data, error } = await anon.from(t).select("*").limit(3);
  console.log(`${t}: ${error ? `DENIED ${error.code}` : `allowed, rows=${data?.length}`}`);
}

console.log("== sample events ==");
const { data: events } = await svc.from("events").select("id, slug, name, status, join_code_hash").limit(5);
console.log(JSON.stringify(events?.map((e) => ({ ...e, join_code_hash: e.join_code_hash ? "<hash present>" : "<empty>" })), null, 1));
