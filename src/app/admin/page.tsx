"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, ArrowUpRight, CirclePause, CirclePlay, Download, Eye, Flag, Settings2, ShieldCheck, Trophy, Users, Zap } from "lucide-react";
import { initialPrizes, initialContestants, type Prize, type Contestant } from "@/lib/demo-data";
import { isArray, isRecord, jsonEquals, readJson, writeJson } from "@/lib/safe-storage";
import { useRoundStatus, type RoundStatus } from "@/lib/round-state";

const PRIZES_KEY = "hackday-prizes";
const CONTESTANTS_KEY = "hackday-contestants";
const SUBMISSIONS_KEY = "hackday-bug-submissions";

function isPrizeArray(value: unknown): value is Prize[] {
  return (
    isArray(value) &&
    value.every(
      (entry) =>
        isRecord(entry) &&
        typeof entry.id === "number" &&
        typeof entry.name === "string" &&
        typeof entry.category === "string" &&
        typeof entry.winner === "string" &&
        typeof entry.status === "string",
    )
  );
}

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

export default function AdminPage() {
  const { status: roundStatus, setStatus: setRoundStatus } = useRoundStatus();
  const [activeTab, setActiveTab] = useState<"overview" | "prizes">("overview");
  const [prizes, setPrizes] = useState<Prize[]>(initialPrizes);
  const [contestants, setContestants] = useState<Contestant[]>(initialContestants);
  const [bugSubmissionCount, setBugSubmissionCount] = useState(0);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    // Read demo state after mount: touching localStorage during render causes
    // a server/client hydration mismatch.
    const sync = () => {
      setPrizes((previous) => {
        const next = readJson<Prize[]>(PRIZES_KEY, initialPrizes, isPrizeArray);
        return jsonEquals(previous, next) ? previous : next;
      });
      setContestants((previous) => {
        const next = readJson<Contestant[]>(
          CONTESTANTS_KEY,
          initialContestants,
          isContestantArray,
        );
        return jsonEquals(previous, next) ? previous : next;
      });
      setBugSubmissionCount(
        readJson<unknown[]>(SUBMISSIONS_KEY, [], isArray).length,
      );
    };
    sync();
    const timer = window.setInterval(sync, 2000);
    return () => window.clearInterval(timer);
  }, []);
  function changeStatus(next: RoundStatus) {
    setRoundStatus(next);
    setNotice(
      next === "Live"
        ? "Round is live. Every participant screen is unlocked and timers are running."
        : next === "Paused"
          ? "Round paused. Participant timers are frozen and answers cannot be locked."
          : next === "Ended"
            ? "Round ended. Participant screens are locked and show their final score."
            : "Round moved to the lobby. Participants are waiting for the host to start.",
    );
  }
  function updatePrize(id: number, field: "winner" | "status", value: string) {
    const next = prizes.map(p => p.id === id ? { ...p, [field]: value } as Prize : p);
    setPrizes(next); writeJson(PRIZES_KEY, next);
  }
  function exportCsv() {
    const csv = ["Prize,Category,Winner,Status", ...prizes.map(p => [p.name,p.category,p.winner,p.status].map(v => `"${String(v).replaceAll('"','""')}"`).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = "hackday-prize-register.csv"; a.click(); URL.revokeObjectURL(url);
  }
  return <div className="page-wrap admin-page">
    <div className="page-title-row"><div><div className="eyebrow"><Settings2 size={13} /> CONTROL ROOM / ADMIN</div><h1>Run the room. <span>Own the moment.</span></h1><p>Manage the event, monitor activity, and keep every result accountable.</p></div><Link href="/display" target="_blank" className="button button-secondary"><Eye size={16} /> Projector view <ArrowUpRight size={15} /></Link></div>
    {notice && <div className="notice-banner"><ShieldCheck size={17} /><span>{notice}</span><button onClick={() => setNotice("")}>Dismiss</button></div>}
    <div className="admin-status-row"><div className="event-status-card"><div className="status-card-top"><span className="live-dot" /> CURRENT EVENT STATUS</div><strong>{roundStatus}</strong><small>Hack Day 2026 · Event code HD-2026</small></div><div className="admin-mini-stat"><span><Users size={17} /> Participants</span><strong>{contestants.length + 123}</strong><small>Demo count</small></div><div className="admin-mini-stat"><span><Zap size={17} /> Active track</span><strong>{roundStatus === "Ended" ? "Complete" : "Bid to Win"}</strong><small>Round 01 of 02</small></div><div className="admin-mini-stat"><span><Trophy size={17} /> Prizes</span><strong>{prizes.length}</strong><small>{prizes.filter(p => p.status === "Available").length} available</small></div></div>
    <div className="admin-tabs"><button className={activeTab === "overview" ? "active" : ""} onClick={() => setActiveTab("overview")}>Event overview</button><button className={activeTab === "prizes" ? "active" : ""} onClick={() => setActiveTab("prizes")}>Prize tracking <span>{prizes.length}</span></button></div>
    {activeTab === "overview" ? <div className="admin-grid">
      <section className="card-surface admin-control-card"><div className="card-heading"><div><div className="eyebrow">ROUND MANAGEMENT</div><h2>Competition controls</h2></div><span className="demo-badge">DEMO MODE</span></div><p>Control the current round. The status below is obeyed live by every participant screen in this browser.</p><div className="round-control"><div className="round-control-icon"><Zap size={20} /></div><div className="round-control-name"><strong>Bid to Win</strong><small>Timed quiz · 3 demo questions</small></div><span className={`round-status ${roundStatus.toLowerCase()}`}>{roundStatus}</span></div><div className="control-buttons"><button onClick={() => changeStatus("Live")} disabled={roundStatus === "Live"}><CirclePlay size={17} /> Start / Resume</button><button onClick={() => changeStatus("Paused")} disabled={roundStatus !== "Live"}><CirclePause size={17} /> Pause round</button><button onClick={() => { if (confirm("End this demo round?")) changeStatus("Ended"); }} disabled={roundStatus === "Ended"}><Flag size={17} /> End round</button></div><div className="admin-tip"><ShieldCheck size={16} /><span>Production safeguard: every state transition should validate permissions, current state, and server time, then write an audit log.</span></div></section>
      <section className="card-surface activity-card"><div className="card-heading"><div><div className="eyebrow">EVENT PULSE</div><h2>Activity snapshot</h2></div><Activity size={20} /></div><div className="activity-metric"><div><span>Quiz answers accepted</span><strong>342</strong></div><div className="metric-bar"><span style={{ width: "76%" }} /></div></div><div className="activity-metric"><div><span>Bug Hunt submissions</span><strong>{bugSubmissionCount}</strong></div><div className="metric-bar mint-bar"><span style={{ width: "48%" }} /></div></div><div className="activity-metric"><div><span>Judging progress</span><strong>68%</strong></div><div className="metric-bar violet-bar"><span style={{ width: "68%" }} /></div></div><Link href="/leaderboard" className="activity-link">Open live leaderboard <ArrowUpRight size={15} /></Link></section>
      <section className="card-surface admin-table-card"><div className="card-heading"><div><div className="eyebrow">PARTICIPANT MONITOR</div><h2>Leaderboard snapshot</h2></div><Link href="/leaderboard" className="small-text-link">View all ↗</Link></div><div className="mini-table"><div className="mini-table-head"><span>PARTICIPANT</span><span>QUIZ SCORE</span><span>BUG SCORE</span></div>{[...contestants].sort((a,b) => b.quizScore-a.quizScore).slice(0,4).map((p,i) => <div className="mini-table-row" key={p.id}><span><b>{String(i+1).padStart(2,"0")}</b><strong>{p.name}</strong></span><span>{p.quizScore}</span><span>{p.bugScore}</span></div>)}</div></section>
      <section className="card-surface quick-actions-card"><div className="eyebrow">QUICK ACTIONS</div><h2>Keep things moving.</h2><Link href="/quiz"><span className="quick-action-icon purple"><Zap size={17} /></span><span><strong>Preview quiz</strong><small>Check question flow</small></span><ArrowUpRight size={16} /></Link><Link href="/bug-hunt"><span className="quick-action-icon mint"><Flag size={17} /></span><span><strong>Preview Bug Hunt</strong><small>Review challenge view</small></span><ArrowUpRight size={16} /></Link><Link href="/display" target="_blank"><span className="quick-action-icon amber"><Eye size={17} /></span><span><strong>Projector display</strong><small>Open read-only screen</small></span><ArrowUpRight size={16} /></Link></section>
    </div> : <section className="card-surface prize-manager"><div className="card-heading"><div><div className="eyebrow">PRIZE INVENTORY</div><h2>Five prizes. Clear outcomes.</h2></div><button className="button button-secondary" onClick={exportCsv}><Download size={15} /> Export CSV</button></div><p>Track allocation and handover. Winner names and statuses are stored in this browser for prototype purposes.</p><div className="prize-table"><div className="prize-table-head"><span>PRIZE</span><span>CATEGORY</span><span>WINNER</span><span>STATUS</span></div>{prizes.map(p => <div className="prize-table-row" key={p.id}><div className="prize-name"><span className="prize-icon"><Trophy size={17} /></span><strong>{p.name}</strong></div><span>{p.category}</span><input aria-label={`${p.name} winner`} value={p.winner} onChange={e => updatePrize(p.id, "winner", e.target.value)} placeholder="Assign winner" /><select aria-label={`${p.name} status`} value={p.status} onChange={e => updatePrize(p.id, "status", e.target.value)}><option>Available</option><option>Reserved</option><option>Handed over</option></select></div>)}</div><div className="admin-tip"><ShieldCheck size={16} /><span>Production safeguard: validate eligibility, inventory, duplicate-award policy, and admin permission on the server before recording an award.</span></div></section>}
  </div>;
}
