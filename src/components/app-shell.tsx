"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Bug, Gauge, LayoutDashboard, Trophy, Zap } from "lucide-react";

const links = [
  { href: "/", label: "Overview", icon: Gauge },
  { href: "/quiz", label: "Live quiz", icon: Zap },
  { href: "/bug-hunt", label: "Bug Hunt", icon: Bug },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/admin", label: "Organizer", icon: LayoutDashboard }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDisplay = pathname === "/display";
  return (
    <div className={isDisplay ? "display-shell" : "app-shell"}>
      {!isDisplay && (
        <aside className="sidebar">
          <Link className="brand" href="/">
            <span className="brand-mark"><Activity size={20} /></span>
            <span>hackday<span className="brand-dot">.</span><small>COMPETITION OS</small></span>
          </Link>
          <div className="event-pill"><span className="live-dot" /> EVENT SPACE <b>HD-2026</b></div>
          <nav className="nav-list" aria-label="Main navigation">
            <p className="nav-label">WORKSPACE</p>
            {links.map(({ href, label, icon: Icon }) => {
              const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return <Link key={href} href={href} className={`nav-link ${active ? "active" : ""}`}><Icon size={17} /><span>{label}</span>{href === "/leaderboard" && <span className="nav-live">LIVE</span>}</Link>;
            })}
          </nav>
          <div className="sidebar-bottom">
            <div className="help-card"><span className="help-icon">✦</span><strong>Ready for launch?</strong><p>Test every round before opening the doors.</p><Link href="/admin">Open controls <span>↗</span></Link></div>
            <div className="profile"><div className="profile-avatar">HA</div><div><strong>Hack Day Admin</strong><small>Organizer workspace</small></div><span className="profile-menu">•••</span></div>
          </div>
        </aside>
      )}
      <div className="main-column">
        {!isDisplay && <header className="topbar"><div className="breadcrumbs"><span>Workspace</span><span className="crumb-slash">/</span><strong>{links.find(l => l.href !== "/" && pathname.startsWith(l.href))?.label ?? (pathname === "/join" ? "Join event" : "Overview")}</strong></div><div className="top-actions"><span className="top-status"><span className="live-dot" /> Demo environment</span><Link className="display-link" href="/display" target="_blank">Projector view ↗</Link></div></header>}
        <main>{children}</main>
        {!isDisplay && <footer className="footer"><span>HACKDAY COMPETITION OS</span><span>Prototype v0.1 <span className="footer-dot">•</span> Built for event day</span></footer>}
      </div>
    </div>
  );
}
