"use client";

import { useEffect, useState } from "react";
import { initialContestants, type Contestant } from "@/lib/demo-data";
import { isArray, isRecord, readJson } from "@/lib/safe-storage";
import { Crown, Medal, Trophy } from "lucide-react";

const CONTESTANTS_KEY = "hackday-contestants";

function isContestantArray(value: unknown): value is Contestant[] {
  return (
    isArray(value) &&
    value.every(
      (entry) =>
        isRecord(entry) &&
        typeof entry.id === "string" &&
        typeof entry.name === "string" &&
        typeof entry.quizScore === "number" &&
        typeof entry.bugScore === "number" &&
        typeof entry.avatar === "string",
    )
  );
}

function loadContestants(): Contestant[] {
  return readJson<Contestant[]>(
    CONTESTANTS_KEY,
    initialContestants,
    isContestantArray,
  );
}

export function Leaderboard({ projector = false }: { projector?: boolean }) {
  const [contestants, setContestants] = useState<Contestant[]>(initialContestants);
  const [mode, setMode] = useState<"quiz" | "bug" | "overall">("quiz");
  useEffect(() => {
    const sync = () => {
      const next = loadContestants();
      // Only replace state when the stored data actually changed, so the poll
      // does not re-render the board every tick.
      setContestants((previous) =>
        JSON.stringify(previous) === JSON.stringify(next) ? previous : next,
      );
    };
    sync();
    const onStorage = () => sync();
    window.addEventListener("storage", onStorage);
    const timer = window.setInterval(sync, 1500);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.clearInterval(timer);
    };
  }, []);
  const score = (c: Contestant) =>
    mode === "bug"
      ? c.bugScore
      : mode === "overall"
        ? c.quizScore + c.bugScore
        : c.quizScore;
  const sorted = [...contestants].sort((a, b) => {
    const delta = score(b) - score(a);
    // Deterministic tie-break so equal scores do not swap places between renders.
    if (delta !== 0) return delta;
    return a.name.localeCompare(b.name);
  });
  return (
    <div className={`leaderboard ${projector ? "projector-board" : ""}`}>
      {!projector && <div className="segmented"><button className={mode === "quiz" ? "selected" : ""} onClick={() => setMode("quiz")}>Quiz</button><button className={mode === "bug" ? "selected" : ""} onClick={() => setMode("bug")}>Bug Hunt</button><button className={mode === "overall" ? "selected" : ""} onClick={() => setMode("overall")}>Overall</button></div>}
      <div className="leaderboard-head"><span>RANK / PARTICIPANT</span><span>SCORE</span></div>
      {sorted.map((person, i) => (
        <div className={`leader-row ${i === 0 ? "leader-first" : ""}`} key={person.id}>
          <div className="rank-number">{i === 0 ? <Crown size={19} /> : i === 1 ? <Medal size={18} /> : i === 2 ? <Trophy size={17} /> : <span>{String(i + 1).padStart(2, "0")}</span>}</div>
          <div className="person-avatar">{person.avatar}</div>
          <div className="person-info"><strong>{person.name}</strong><small>{i === 0 ? "Leading the pack" : "Competition participant"}</small></div>
          <div className="person-score">{score(person)}<small>PTS</small></div>
        </div>
      ))}
      <div className="leaderboard-foot"><span><span className="live-dot" /> LIVE STANDINGS</span><span>Updates automatically in demo mode</span></div>
    </div>
  );
}
