import { useEffect, useState, type FormEvent } from "react";
import { BookOpen, CalendarDays, ChevronDown, ChevronUp, CirclePlus, Clock3, Plus, Trash2 } from "lucide-react";
import { api, errorMessage } from "../services/api";
import type { Subject, Topic } from "../types";
import { Button, Card, Dialog, EmptyState, Loading, PageTitle, ProgressBar } from "../components/ui";

const colors = ["#7460e8", "#25a98a", "#f19652", "#e86682", "#4f96dc", "#a36dc3"];
export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [subjectDialog, setSubjectDialog] = useState(false);
  const [topicSubject, setTopicSubject] = useState<Subject | null>(null);
  const [expanded, setExpanded] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [subjectForm, setSubjectForm] = useState({ name: "", description: "", color: colors[0], icon: "📘", examDate: "" });
  const [topicForm, setTopicForm] = useState({ name: "", estimatedMinutes: 45, difficulty: 3, importance: 3 });
  async function load() {
    try { setSubjects((await api.get<{ subjects: Subject[] }>("/subjects")).data.subjects); setError(""); }
    catch (cause) { setError(errorMessage(cause)); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  async function addSubject(event: FormEvent) {
    event.preventDefault(); setBusy(true);
    try {
      await api.post("/subjects", { ...subjectForm, examDate: subjectForm.examDate || null });
      setSubjectDialog(false); setSubjectForm({ name: "", description: "", color: colors[0], icon: "📘", examDate: "" }); await load();
    } catch (cause) { setError(errorMessage(cause)); } finally { setBusy(false); }
  }
  async function addTopic(event: FormEvent) {
    event.preventDefault(); if (!topicSubject) return; setBusy(true);
    try { await api.post("/topics", { ...topicForm, subjectId: topicSubject.id }); setTopicSubject(null); setTopicForm({ name: "", estimatedMinutes: 45, difficulty: 3, importance: 3 }); await load(); }
    catch (cause) { setError(errorMessage(cause)); } finally { setBusy(false); }
  }
  async function updateTopic(topic: Topic, values: Partial<Topic>) {
    try { await api.patch(`/topics/${topic.id}`, values); await load(); }
    catch (cause) { setError(errorMessage(cause)); }
  }
  async function deleteSubject(subject: Subject) {
    if (!window.confirm(`Delete ${subject.name} and all its topics and sessions?`)) return;
    try { await api.delete(`/subjects/${subject.id}`); await load(); }
    catch (cause) { setError(errorMessage(cause)); }
  }
  if (loading) return <Loading label="Loading your subjects" />;
  return <div><PageTitle eyebrow="YOUR LEARNING, ORGANIZED" title="My subjects" description="Give every subject a little structure. Progress adds up." action={<Button onClick={() => setSubjectDialog(true)}><Plus size={16} /> Add subject</Button>} />
    {error && <div className="notice-error">{error}<button onClick={() => void load()}>Retry</button></div>}
    {!subjects.length ? <Card><EmptyState title="Your study space starts here" text="Add your first subject, then break it into topics you can work through." action={<Button onClick={() => setSubjectDialog(true)}><Plus size={15} /> Add your first subject</Button>} /></Card> :
      <div className="subject-page-grid">{subjects.map((subject) => <Card className="subject-card" key={subject.id}><div className="subject-card-header"><span className="subject-large-icon" style={{ background: `${subject.color}16` }}>{subject.icon}</span><button className="icon-button subject-delete" aria-label={`Delete ${subject.name}`} title="Delete subject" onClick={() => void deleteSubject(subject)}><Trash2 size={15} /></button></div><h2>{subject.name}</h2><p className="subject-description">{subject.description || "A little progress goes a long way."}</p><div className="subject-meta"><span><BookOpen size={14} /> {subject.topics?.length ?? 0} topics</span>{subject.examDate && <span><CalendarDays size={14} /> Exam {new Date(subject.examDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>}</div><div className="subject-progress-meta"><span>Overall understanding</span><strong>{subject.progress ?? 0}%</strong></div><ProgressBar value={subject.progress ?? 0} color={subject.color} /><div className="subject-card-actions"><button className="subject-expand" onClick={() => setExpanded((ids) => ids.includes(subject.id) ? ids.filter((id) => id !== subject.id) : [...ids, subject.id])}>{expanded.includes(subject.id) ? <ChevronUp size={15} /> : <ChevronDown size={15} />}{expanded.includes(subject.id) ? "Hide topics" : "View topics"}</button><button className="subject-add-topic" onClick={() => setTopicSubject(subject)}><CirclePlus size={15} /> Add topic</button></div>{expanded.includes(subject.id) && <div className="topic-list">{subject.topics?.length ? subject.topics.map((topic) => <div className="topic-row" key={topic.id}><span className={`topic-status-dot topic-${topic.status}`} /><span className="topic-copy"><strong>{topic.name}</strong><small><Clock3 size={11} /> {topic.estimatedMinutes} min · importance {topic.importance}/5</small></span><label className="topic-confidence"><input aria-label={`Understanding percentage for ${topic.name}`} type="number" min={0} max={100} defaultValue={topic.understandingPercentage} onBlur={(event) => { const value = Number(event.target.value); if (value !== topic.understandingPercentage && value >= 0 && value <= 100) void updateTopic(topic, { understandingPercentage: value }); }} /><span>%</span></label><select aria-label={`Status for ${topic.name}`} value={topic.status} onChange={(event) => void updateTopic(topic, { status: event.target.value as Topic["status"], understandingPercentage: event.target.value === "completed" ? 100 : topic.understandingPercentage })}><option value="not_started">Not started</option><option value="in_progress">In progress</option><option value="completed">Completed</option></select><button className="icon-button topic-delete" aria-label={`Delete ${topic.name}`} onClick={async () => { try { await api.delete(`/topics/${topic.id}`); await load(); } catch (cause) { setError(errorMessage(cause)); } }}><Trash2 size={13} /></button></div>) : <p className="no-topics">No topics yet. Add one to start tracking.</p>}</div>}</Card>)}</div>}
    {subjectDialog && <Dialog title="Add a subject" onClose={() => setSubjectDialog(false)}><form className="modal-form" onSubmit={addSubject}><label>Subject name<input autoFocus value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} placeholder="e.g. Biology" required maxLength={120} /></label><label>A little context <span className="optional">(optional)</span><textarea rows={2} value={subjectForm.description} onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })} placeholder="What are you working toward?" /></label><div className="form-pair"><label>Exam date <span className="optional">(optional)</span><input type="date" value={subjectForm.examDate} onChange={(e) => setSubjectForm({ ...subjectForm, examDate: e.target.value })} /></label><label>Icon <select value={subjectForm.icon} onChange={(e) => setSubjectForm({ ...subjectForm, icon: e.target.value })}>{["📘","🧬","📐","🌍","💻","🧪","📖","🎨","🧠","⚡"].map((icon) => <option key={icon}>{icon}</option>)}</select></label></div><label>Subject color<div className="color-picker">{colors.map((color) => <button type="button" key={color} aria-label={`Use ${color}`} className={subjectForm.color === color ? "selected" : ""} style={{ backgroundColor: color }} onClick={() => setSubjectForm({ ...subjectForm, color })} />)}</div></label><Button type="submit" disabled={busy}>{busy ? "Saving..." : "Add subject"}</Button></form></Dialog>}
    {topicSubject && <Dialog title={`Add topic to ${topicSubject.name}`} onClose={() => setTopicSubject(null)}><form className="modal-form" onSubmit={addTopic}><label>Topic name<input autoFocus value={topicForm.name} onChange={(e) => setTopicForm({ ...topicForm, name: e.target.value })} placeholder="e.g. Cell division" required /></label><div className="form-pair"><label>Estimated time (minutes)<input type="number" min={5} max={1440} value={topicForm.estimatedMinutes} onChange={(e) => setTopicForm({ ...topicForm, estimatedMinutes: Number(e.target.value) })} /></label><label>Importance<select value={topicForm.importance} onChange={(e) => setTopicForm({ ...topicForm, importance: Number(e.target.value) })}>{[1,2,3,4,5].map((value) => <option value={value} key={value}>{value} / 5</option>)}</select></label></div><Button type="submit" disabled={busy}>{busy ? "Saving..." : "Add topic"}</Button></form></Dialog>}
  </div>;
}
