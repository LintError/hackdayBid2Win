"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { writeJson } from "@/lib/safe-storage";

const PARTICIPANT_KEY = "hackday-participant";

export default function JoinPage() {
  const [name, setName] = useState("");
  const [code, setCode] = useState("HD-2026");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("Enter a display name to continue.");
    if (code.trim().toUpperCase() !== "HD-2026") return setError("That event code isn't valid. Try HD-2026 for this prototype.");
    if (!accepted) return setError("Please accept the competition rules before joining.");
    const stored = writeJson(PARTICIPANT_KEY, { name: name.trim(), joinedAt: new Date().toISOString() });
    if (!stored) return setError("This browser is blocking local storage, so the demo cannot remember you. Enable site data and try again.");
    setError("");
    router.push("/quiz");
  }
  return <div className="join-page">
    <Link href="/" className="back-link"><ArrowLeft size={15} /> Back to overview</Link>
    <div className="join-layout">
      <div className="join-intro"><div className="eyebrow"><span className="live-dot" /> REGISTRATION OPEN</div><h1>Your next<br /><span>challenge starts here.</span></h1><p>Join the room, sharpen your focus, and see how far your skills can take you.</p><div className="join-perks"><div><CheckCircle2 size={17} /><span>Two competition tracks</span></div><div><CheckCircle2 size={17} /><span>Live standings</span></div><div><CheckCircle2 size={17} /><span>Five prizes to win</span></div></div></div>
      <form className="join-form card-surface" onSubmit={submit}>
        <div className="form-icon"><Users size={22} /></div><div className="eyebrow">PARTICIPANT ACCESS</div><h2>Join the competition</h2><p className="form-subtitle">It takes less than a minute to get in.</p>
        <label htmlFor="display-name">Display name</label><input id="display-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ada N." maxLength={32} autoComplete="nickname" />
        <label htmlFor="event-code">Event code</label><input id="event-code" value={code} onChange={e => setCode(e.target.value)} placeholder="Enter your event code" />
        <label className="checkbox-label"><input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} /><span>I agree to the competition rules and fair-play policy.</span></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button button-primary button-full" type="submit">Enter event <ArrowRight size={17} /></button>
        <div className="form-security"><ShieldCheck size={15} /> Demo mode · No email or password required</div>
      </form>
    </div>
  </div>;
}
