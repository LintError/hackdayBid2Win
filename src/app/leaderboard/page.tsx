import Link from "next/link";
import { ArrowUpRight, Radio, Trophy } from "lucide-react";
import { Leaderboard } from "@/components/leaderboard";

export default function LeaderboardPage() {
  return <div className="page-wrap narrow-page">
    <div className="page-title-row"><div><div className="eyebrow"><Radio size={13} /> THE LIVE BOARD</div><h1>Every point <span>counts.</span></h1><p>Standings from the demo dataset. Real event rankings require the Supabase backend.</p></div><Link href="/display" target="_blank" className="button button-primary">Open projector <ArrowUpRight size={16} /></Link></div>
    <div className="leaderboard-summary"><div><Trophy size={20} /><span><strong>Competition standings</strong><small>Quiz, Bug Hunt, and combined score</small></span></div><span className="status-chip"><span className="live-dot" /> DEMO LIVE</span></div>
    <Leaderboard />
    <div className="info-banner"><strong>Fair scoring matters.</strong><p>Production rankings should be calculated server-side from accepted answers and approved judge scores. Never trust a score sent by a browser.</p></div>
  </div>;
}
