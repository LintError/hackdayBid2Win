// Detailed probe — prints error codes/messages only, never secrets.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
const get = (k) => (env.match(new RegExp(`^${k}=(.*)$`, "m")) || [])[1]?.trim();

const url = get("NEXT_PUBLIC_SUPABASE_URL");
const anonKey = get("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const serviceKey = get("SUPABASE_SERVICE_ROLE_KEY");
console.log("parsed lengths -> url:", url?.length, "anon:", anonKey?.length, "service:", serviceKey?.length);

const svc = createClient(url, serviceKey, { auth: { persistSession: false } });

const r = await svc.from("events").select("*").limit(2);
console.log("events select ->", r.error ? `${r.error.code} ${r.error.message} | details: ${r.error.details}` : `ok rows=${r.data.length}`);

const r2 = await svc.from("events").select("*", { count: "exact", head: true });
console.log("events head+count ->", r2.error ? `${r2.error.code} ${r2.error.message}` : `ok count=${r2.count}`);

const { error: rpcErr } = await svc.rpc("exec_sql", { query: "select 1" });
console.log("rpc exec_sql probe ->", rpcErr ? `${rpcErr.code} ${rpcErr.message?.slice(0, 100)}` : "callable");
