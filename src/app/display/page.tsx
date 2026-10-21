"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Activity, Maximize2, Trophy } from "lucide-react";
import { Leaderboard } from "@/components/leaderboard";
import { useRoundStatus } from "@/lib/round-state";

const ROUND_LABEL: Record<string, string> = {
  Live: "LIVE STANDINGS",
  Paused: "ROUND PAUSED",
  Ended: "ROUND ENDED",
  Lobby: "IN LOBBY",
};

export default function DisplayPage() {
  const [clock, setClock] = useState("");
  const { status } = useRoundStatus();
  useEffect(() => { const update = () => { try { setClock(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })); } catch { setClock("--:--"); } }; update(); const t = window.setInterval(update, 15000); return () => window.clearInterval(t); }, []);
  async function fullscreen() { try { await document.documentElement.requestFullscreen(); } catch {} }
  return <div className="projector-page">
    <header className="projector-header"><Link href="/" className="projector-brand"><span className="brand-mark"><Activity size={20} /></span> HACKDAY<span className="brand-dot">.</span></Link><div className={`projector-live is-${status.toLowerCase()}`}><span className="live-dot" /> {ROUND_LABEL[status] ?? "LIVE STANDINGS"}</div><div className="projector-clock">{clock}</div></header>
    <div className="projector-title"><div className="eyebrow">HACK DAY 2026 / COMPETITION CONTROL ROOM</div><h1>THE LEADERBOARD<span>.</span></h1><p>Think fast. Ship smart. Make your mark.</p>{status !== "Live" && <div className={`projector-status is-${status.toLowerCase()}`}><span className="live-dot" /> {status === "Paused" ? "The host paused the round" : status === "Ended" ? "The round has ended" : "Waiting for the host to start the round"}</div>}</div>
    <div className="projector-content"><div className="projector-callout"><div className="projector-trophy"><Trophy size={28} /></div><div><strong>Five Arduino boards up for grabs.</strong><small>Quiz Champion · Best Fix · Best Explanation · Runner-up · Community Hero</small></div><button onClick={fullscreen}><Maximize2 size={16} /> Fullscreen</button></div><Leaderboard projector /></div>
    <footer className="projector-footer"><span>HACKDAY COMPETITION OS</span><span><span className="live-dot" /> DEMO ENVIRONMENT</span><span>HD-2026</span></footer>
  </div>;
}
