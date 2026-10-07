import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, Check, Clock3, Plus, Trash2 } from "lucide-react";
import { api, errorMessage } from "../services/api";
import type { StudySession, Subject } from "../types";
import { Button, Card, Dialog, EmptyState, Loading, PageTitle } from "../components/ui";

function dateKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
export default function PlannerPage() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [week, setWeek] = useState(() => { const today = new Date(); const start = new Date(today); start.setDate(today.getDate() - ((today.getDay() + 6) % 7)); start.setHours(0, 0, 0, 0); return start; });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ subjectId: "", topicId: "", title: "", date: dateKey(new Date()), time: "17:00", durationMinutes: 45 });
  const end = new Date(week); end.setDate(end.getDate() + 7);
  async function load() {
    setLoading(true);
    try {
      const [s, subs] = await Promise.all([api.get<{ sessions: StudySession[] }>("/sessions", { params: { from: week.toISOString(), to: end.toISOString() } }), api.get<{ subjects: Subject[] }>("/subjects")]);
      setSessions(s.data.sessions); setSubjects(subs.data.subjects); setError("");
    } catch (cause) { setError(errorMessage(cause)); } finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, [week]);
  const days = Array.from({ length: 7 }, (_, i) => { const day = new Date(week); day.setDate(day.getDate() + i); return day; });
  function showCreate(day?: Date) {
    const date = day ? dateKey(day) : dateKey(new Date());
    setForm({ subjectId: subjects[0] ? String(subjects[0].id) : "", topicId: "", title: "", date, time: "17:00", durationMinutes: 45 }); setDialog(true);
  }
  async function create(event: FormEvent) {
    event.preventDefault(); if (!form.subjectId) { setError("Create a subject before scheduling a study block."); return; }
    setBusy(true);
    try {
      await api.post("/sessions", { subjectId: Number(form.subjectId), topicId: form.topicId ? Number(form.topicId) : null, title: form.title, scheduledAt: new Date(`${form.date}T${form.time}`).toISOString(), durationMinutes: form.durationMinutes });
      setDialog(false); await load();
    } catch (cause) { setError(errorMessage(cause)); } finally { setBusy(false); }
  }
  async function complete(session: StudySession) {
    try { await api.post(`/sessions/${session.id}/complete`); await load(); } catch (cause) { setError(errorMessage(cause)); }
  }
  async function remove(session: StudySession) {
    if (!window.confirm(`Remove "${session.title}" from your planner?`)) return;
    try { await api.delete(`/sessions/${session.id}`); await load(); } catch (cause) { setError(errorMessage(cause)); }
  }
  if (loading && !sessions.length) return <Loading label="Laying out your week" />;
  return <div><PageTitle eyebrow="MAKE SPACE FOR WHAT MATTERS" title="Study planner" description="A thoughtful plan leaves room to breathe." action={<Button onClick={() => showCreate()}><Plus size={16} /> Add a session</Button>} />
    {error && <div className="notice-error">{error}<button onClick={() => setError("")}>Dismiss</button></div>}
    <Card className="planner-card"><div className="planner-toolbar"><div className="week-label"><span className="calendar-icon"><CalendarDays size={17} /></span><strong>{week.toLocaleDateString("en", { month: "long", day: "numeric" })} – {new Date(end.getTime() - 1).toLocaleDateString("en", { month: "long", day: "numeric", year: "numeric" })}</strong></div><div className="week-actions"><button className="button button-secondary today-button" onClick={() => { const today = new Date(); const start = new Date(today); start.setDate(today.getDate() - ((today.getDay() + 6) % 7)); start.setHours(0,0,0,0); setWeek(start); }}>Today</button><button className="icon-button" aria-label="Previous week" onClick={() => setWeek((date) => { const d = new Date(date); d.setDate(d.getDate() - 7); return d; })}><ArrowLeft size={17} /></button><button className="icon-button" aria-label="Next week" onClick={() => setWeek((date) => { const d = new Date(date); d.setDate(d.getDate() + 7); return d; })}><ArrowRight size={17} /></button></div></div><div className="week-grid">{days.map((day) => { const daySessions = sessions.filter((session) => dateKey(new Date(session.scheduledAt)) === dateKey(day)); const isToday = dateKey(day) === dateKey(new Date()); return <div className={`week-day ${isToday ? "week-day-today" : ""}`} key={dateKey(day)}><div className="week-day-label"><span>{day.toLocaleDateString("en", { weekday: "short" })}</span><strong>{day.getDate()}</strong></div><button className="day-add" onClick={() => showCreate(day)} aria-label={`Add a session on ${day.toDateString()}`}><Plus size={14} /></button><div className="day-sessions">{daySessions.map((session) => <article key={session.id} className={`planner-session ${session.status === "completed" ? "planner-session-done" : ""}`} style={{ borderLeftColor: session.subject.color }}><strong>{session.title}</strong><span>{new Date(session.scheduledAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span><small>{session.subject.name} · {session.durationMinutes}m</small><div className="planner-session-actions">{session.status === "scheduled" && <button onClick={() => void complete(session)} title="Mark complete" aria-label="Mark complete"><Check size={13} /></button>}<button onClick={() => void remove(session)} title="Delete session" aria-label="Delete session"><Trash2 size={13} /></button></div></article>)}</div></div>; })}</div>{!sessions.length && <div className="planner-empty"><EmptyState title="A week with room to grow" text="Add a study session to give your goals a little time on the calendar." action={<Button variant="secondary" onClick={() => showCreate()}><Plus size={14} /> Plan a session</Button>} /></div>}</Card>
    <div className="planner-tip"><span className="planner-tip-icon"><Clock3 size={17} /></span><div><strong>A gentle reminder</strong><p>Small, focused sessions tend to stick better than marathon study days. Leave space for breaks.</p></div></div>
    {dialog && <Dialog title="Plan a study session" onClose={() => setDialog(false)}><form className="modal-form" onSubmit={create}><label>What will you work on?<input autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Review chapter 4" required maxLength={180} /></label><div className="form-pair"><label>Subject<select required value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value, topicId: "" })}><option value="">Choose subject</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.icon} {subject.name}</option>)}</select></label><label>Topic <span className="optional">(optional)</span><select value={form.topicId} onChange={(e) => setForm({ ...form, topicId: e.target.value })}><option value="">No specific topic</option>{subjects.find((s) => String(s.id) === form.subjectId)?.topics?.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}</select></label></div><div className="form-pair"><label>Date<input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></label><label>Start time<input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required /></label></div><label>Session length<select value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}>{[25, 45, 60, 90, 120].map((min) => <option value={min} key={min}>{min} minutes</option>)}</select></label><Button type="submit" disabled={busy || !subjects.length}>{busy ? "Saving..." : "Add to my planner"}</Button>{!subjects.length && <p className="field-hint">Add a subject first to create study sessions.</p>}</form></Dialog>}
  </div>;
}
