import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight, Check, Clock3, Flame, Plus, Sparkles, Target, TrendingUp, Zap } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Link } from "react-router-dom";
import { api, errorMessage } from "../services/api";
import type { DashboardData } from "../types";
import { Card, EmptyState, Loading, ProgressBar } from "../components/ui";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [completing, setCompleting] = useState<number | null>(null);
  async function load() {
    try { setData((await api.get<DashboardData>("/dashboard")).data); setError(""); }
    catch (cause) { setError(errorMessage(cause)); }
  }
  useEffect(() => { void load(); }, []);
  async function complete(id: number) {
    setCompleting(id);
    try { await api.post(`/sessions/${id}/complete`); await load(); }
    catch (cause) { setError(errorMessage(cause)); }
    finally { setCompleting(null); }
  }
  if (!data && !error) return <Loading />;
  if (error && !data) return <div className="notice-error">{error} <button onClick={() => void load()}>Try again</button></div>;
  if (!data) return null;
  const firstName = data.user.name.split(" ")[0];
  const hours = Math.floor(data.stats.weeklyMinutes / 60);
  const mins = data.stats.weeklyMinutes % 60;
  const hourLabel = `${hours}${mins ? `.${Math.round(mins / 60 * 10)}` : ""}`;
  const scheduled = data.todaySessions.filter((session) => session.status === "scheduled");
  return <div className="dashboard">
    <div className="welcome-row"><div><div className="eyebrow date-eyebrow"><span className="eyebrow-dot" /> YOUR STUDY SPACE · {new Date().toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" }).toUpperCase()}</div><h1>Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, {firstName}<span className="wave">✳</span></h1><p className="page-description">A little focus today goes a long way. Let’s make it count.</p></div><Link className="button button-primary dashboard-cta" to="/planner"><Plus size={17} /> Plan a study session</Link></div>
    {error && <div className="notice-error">{error}</div>}
    <div className="stats-grid">
      <Card className="stat-card"><div className="stat-top"><span className="stat-icon icon-violet"><Clock3 size={18} /></span><span className="stat-trend">{data.stats.todayTargetPercent}% of goal</span></div><div className="stat-value">{Math.floor(data.stats.todayMinutes / 60)}<span>h</span> {data.stats.todayMinutes % 60}<span>m</span></div><div className="stat-label">Focused today <span>· target {Math.floor(data.user.dailyStudyTarget / 60)}h {data.user.dailyStudyTarget % 60}m</span></div><ProgressBar value={data.stats.todayTargetPercent} /></Card>
      <Card className="stat-card"><div className="stat-top"><span className="stat-icon icon-amber"><Flame size={18} /></span><span className="stat-trend">{data.user.studyStreak > 0 ? "You're on a roll" : "Start a new streak"}</span></div><div className="stat-value">{data.user.studyStreak}<span className="stat-unit">days</span></div><div className="stat-label">Study streak <span>· small steps add up</span></div><div className="stat-footnote"><span className="tiny-bars"><i /><i /><i /><i /><i /><i /><i /></span> Stay consistent this week</div></Card>
      <Card className="stat-card"><div className="stat-top"><span className="stat-icon icon-mint"><TrendingUp size={18} /></span><span className="stat-trend">{data.stats.subjectCount} active</span></div><div className="stat-value">{hourLabel}<span className="stat-unit">hrs</span></div><div className="stat-label">Study time this week <span>· across all subjects</span></div><div className="stat-footnote"><span className="stat-mini-icon"><Zap size={14} /></span> Your effort is building momentum</div></Card>
    </div>
    <div className="dashboard-columns">
      <Card className="activity-card"><div className="card-heading"><div><h2>Your activity</h2><p>A week of showing up for yourself</p></div><span className="period-chip">Last 7 days</span></div><div className="chart-legend"><span><i /> Focus time <strong>{hours}h {mins}m</strong></span><span className="chart-insight"><TrendingUp size={14} /> Keep your rhythm going</span></div><div className="activity-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data.weeklyActivity} margin={{ top: 10, right: 6, left: -24, bottom: 0 }}><defs><linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7c67ef" stopOpacity={0.17} /><stop offset="100%" stopColor="#7c67ef" stopOpacity={0.015} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#edf0f5" strokeDasharray="3 5" /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#9aa0b0", fontSize: 11 }} dy={12} /><Tooltip cursor={{ stroke: "#d9d4fb", strokeDasharray: "4 4" }} contentStyle={{ border: "1px solid #eceaf6", borderRadius: 12, boxShadow: "0 8px 24px #1e26410d", fontSize: 12 }} formatter={(value) => [`${value} min`, "Focus time"]} /><Area type="monotone" dataKey="minutes" stroke="#7864ed" strokeWidth={2.5} fill="url(#activityFill)" activeDot={{ r: 5, fill: "#7864ed", stroke: "#fff", strokeWidth: 3 }} /></AreaChart></ResponsiveContainer></div><div className="chart-days">{data.weeklyActivity.map((item) => <span key={item.date} className={item.minutes > 0 ? "day-studied" : ""}>{item.minutes ? "·" : "—"}</span>)}</div></Card>
      <Card className="today-card"><div className="card-heading"><div><h2>Today’s plan</h2><p>{scheduled.length ? `${scheduled.length} session${scheduled.length === 1 ? "" : "s"} on your agenda` : "Your day, at your pace"}</p></div><Link to="/planner" className="text-link">See all <ArrowRight size={14} /></Link></div>{data.todaySessions.length ? <div className="today-session-list">{data.todaySessions.map((session) => <div className="today-session" key={session.id}><span className="session-color" style={{ background: session.subject.color }} /><div className="session-copy"><strong>{session.title}</strong><small>{session.subject.name} · {new Date(session.scheduledAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</small></div>{session.status === "completed" ? <span className="done-badge"><Check size={13} /></span> : <button className="session-done" aria-label={`Complete ${session.title}`} title="Mark complete" disabled={completing === session.id} onClick={() => void complete(session.id)}><Check size={14} /></button>}</div>)}</div> : <EmptyState title="A clear page" text="Add a study block when you’re ready to focus." action={<Link className="small-text-link" to="/planner">Build your plan <ArrowRight size={13} /></Link>} />}<Link className="today-bottom-link" to="/focus"><span className="focus-link-icon"><Clock3 size={15} /></span>Start a quick focus session<ArrowUpRight size={15} /></Link></Card>
    </div>
    <div className="lower-grid"><Card className="subject-overview"><div className="card-heading"><div><h2>Subject progress</h2><p>One step closer to your goals</p></div><Link to="/subjects" className="text-link">All subjects <ArrowRight size={14} /></Link></div>{data.subjects.length ? <div className="subject-progress-list">{data.subjects.slice(0, 4).map((subject) => <div className="subject-progress-row" key={subject.id}><span className="subject-emoji" style={{ backgroundColor: `${subject.color}15` }}>{subject.icon}</span><span className="subject-progress-name"><strong>{subject.name}</strong><small>{subject.completedTopics ?? 0} of {subject.topicCount ?? 0} topics completed</small></span><div className="subject-progress-bar"><ProgressBar value={subject.progress ?? 0} color={subject.color} /></div><span className="subject-percent">{subject.progress ?? 0}%</span></div>)}</div> : <EmptyState title="Your subjects live here" text="Add your subjects and start tracking your learning." action={<Link to="/subjects" className="small-text-link">Add a subject <ArrowRight size={13} /></Link>} />}</Card>
      <Card className="nudge-card"><div className="nudge-decoration nudge-one" /><div className="nudge-decoration nudge-two" /><div className="nudge-icon"><Sparkles size={18} /></div><span className="nudge-label">A GENTLE NUDGE</span><h2>{data.weakTopics.length ? "Give a tricky topic a little love." : "You’re building a lovely rhythm."}</h2><p>{data.weakTopics.length ? `“${data.weakTopics[0].name}” could use a quick review. A small revisit today can make tomorrow feel easier.` : "Consistency beats intensity. Keep showing up in small, focused moments."}</p><Link to={data.weakTopics.length ? "/subjects" : "/assistant"} className="nudge-link">{data.weakTopics.length ? "Review a topic" : "Chat with your study assistant"} <ArrowRight size={14} /></Link><span className="nudge-star">✳</span></Card></div>
    <div className="dashboard-footer"><span><Target size={14} /> Progress, not perfection.</span><Link to="/insights">Your learning journey <ArrowRight size={13} /></Link></div>
  </div>;
}
