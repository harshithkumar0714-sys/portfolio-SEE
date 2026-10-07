import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { BookOpen, CalendarDays, ChartNoAxesCombined, CircleHelp, Clock3, Flame, LayoutDashboard, LogOut, Menu, NotebookPen, Shield, Sparkles, Trophy, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/subjects", label: "My subjects", icon: BookOpen },
  { to: "/planner", label: "Study planner", icon: CalendarDays },
  { to: "/focus", label: "Focus room", icon: Clock3 },
  { to: "/tests", label: "Mock tests", icon: NotebookPen },
  { to: "/insights", label: "Progress insights", icon: ChartNoAxesCombined },
  { to: "/assistant", label: "Study assistant", icon: Sparkles },
  { to: "/achievements", label: "Achievements", icon: Trophy },
];

export default function AppLayout() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const current = links.find((link) => location.pathname === link.to || (link.to !== "/" && location.pathname.startsWith(link.to)));
  function exit() { signOut(); navigate("/login"); }
  return <div className="app-shell">
    <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
      <div className="brand"><span className="brand-mark"><BookOpen size={19} /></span><span>smart<span className="brand-light">study</span><small>YOUR PERSONAL STUDY SPACE</small></span><button className="mobile-close icon-button" onClick={() => setOpen(false)} aria-label="Close menu"><X size={19} /></button></div>
      <div className="sidebar-caption">STUDY SPACE</div>
      <nav className="nav-list">{links.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link ${isActive ? "nav-active" : ""}`} onClick={() => setOpen(false)}><Icon size={18} strokeWidth={1.8} /><span>{label}</span>{label === "Focus room" && <span className="nav-dot" />}</NavLink>)}</nav>
      {user?.role === "admin" && <><div className="sidebar-caption admin-caption">ADMINISTRATION</div><NavLink className={({ isActive }) => `nav-link ${isActive ? "nav-active" : ""}`} to="/admin"><Shield size={18} /><span>Admin console</span></NavLink></>}
      <div className="sidebar-bottom"><div className="streak-card"><div className="streak-flame"><Flame size={18} fill="currentColor" /></div><div><strong>{user?.studyStreak ?? 0} day streak</strong><span>Keep your momentum</span></div><span className="streak-spark">✳</span></div><div className="user-card"><span className="avatar">{user?.name?.slice(0, 1).toUpperCase() ?? "S"}</span><span className="user-info"><strong>{user?.name}</strong><small>Level {user?.level ?? 1} learner</small></span><button className="icon-button logout" aria-label="Sign out" title="Sign out" onClick={exit}><LogOut size={17} /></button></div></div>
    </aside>
    {open && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setOpen(false)} />}
    <main className="main-shell"><header className="topbar"><button className="mobile-menu icon-button" aria-label="Open menu" onClick={() => setOpen(true)}><Menu size={21} /></button><div className="crumb"><span>Study space</span><span className="crumb-separator">/</span><strong>{current?.label ?? "Overview"}</strong></div><div className="topbar-right"><span className="today-pill">{new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric" }).format(new Date())}</span><button className="help-button" onClick={() => navigate("/assistant")}><CircleHelp size={16} /> Need a hand?</button><button className="top-avatar" onClick={() => navigate("/settings")} title="Settings">{user?.name?.slice(0, 1).toUpperCase()}</button></div></header><div className="page-content"><Outlet /></div></main>
  </div>;
}
