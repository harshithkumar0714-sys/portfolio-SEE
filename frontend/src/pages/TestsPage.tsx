import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, BadgeCheck, Clock3, Plus, RotateCcw, Trophy } from "lucide-react";
import { api, errorMessage } from "../services/api";
import type { Subject } from "../types";
import { Button, Card, Dialog, EmptyState, Loading, PageTitle } from "../components/ui";

interface Test { id: number; title: string; description?: string; durationMinutes: number; subject: { name: string; color: string }; _count: { questions: number }; attempts: { score: number; totalPoints: number; completedAt: string }[] }
interface Question { id: number; prompt: string; options: string[]; points: number }
interface TestDetail { id: number; title: string; durationMinutes: number; subject: { name: string }; questions: Question[] }
interface Result { score: number; totalPoints: number; percentage: number; questions: { id: number; correctAnswer: number; explanation?: string }[] }
type DraftQuestion = { prompt: string; options: string[]; answerIndex: number; explanation: string; points: number };
const blankQuestion = (): DraftQuestion => ({ prompt: "", options: ["", "", "", ""], answerIndex: 0, explanation: "", points: 1 });

export default function TestsPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<TestDetail | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState({ subjectId: "", title: "", description: "", durationMinutes: 20, questions: [blankQuestion()] });
  async function load() {
    try {
      const [t, s] = await Promise.all([api.get<{ tests: Test[] }>("/tests"), api.get<{ subjects: Subject[] }>("/subjects")]);
      setTests(t.data.tests); setSubjects(s.data.subjects); setError("");
    } catch (cause) { setError(errorMessage(cause)); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  async function begin(testId: number) {
    setResult(null); setAnswers({});
    try { setSelected((await api.get<{ test: TestDetail }>(`/tests/${testId}`)).data.test); }
    catch (cause) { setError(errorMessage(cause)); }
  }
  async function submitAnswers(event: FormEvent) {
    event.preventDefault(); if (!selected) return;
    setBusy(true);
    try {
      const response = await api.post<Result>(`/tests/${selected.id}/attempts`, { answers });
      setResult(response.data); await load();
    } catch (cause) { setError(errorMessage(cause)); }
    finally { setBusy(false); }
  }
  async function createTest(event: FormEvent) {
    event.preventDefault(); setBusy(true);
    try {
      await api.post("/tests", { ...draft, subjectId: Number(draft.subjectId), questions: draft.questions.map(({ options, ...question }) => ({ ...question, options: options.filter(Boolean) })) });
      setCreateOpen(false); setDraft({ subjectId: subjects[0] ? String(subjects[0].id) : "", title: "", description: "", durationMinutes: 20, questions: [blankQuestion()] }); await load();
    } catch (cause) { setError(errorMessage(cause)); }
    finally { setBusy(false); }
  }
  if (loading) return <Loading label="Gathering your mock tests" />;
  if (selected) return <div><button className="back-link" onClick={() => { setSelected(null); setResult(null); }}><ArrowLeft size={15} /> All mock tests</button><PageTitle eyebrow={selected.subject.name.toUpperCase()} title={selected.title} description={`${selected.questions.length} questions · ${selected.durationMinutes} minutes`} />
    {error && <div className="notice-error">{error}</div>}
    {result ? <Card className="test-result-card"><div className="result-trophy"><Trophy size={25} /></div><span className="section-kicker">TEST COMPLETE</span><h2>{result.percentage >= 80 ? "Wonderful work." : result.percentage >= 50 ? "Good effort. Keep going." : "A useful first attempt."}</h2><p className="result-score">{result.score}<span> / {result.totalPoints}</span></p><div className="result-percent">{result.percentage}%</div><p>Your results are saved in your progress. Every attempt teaches you something.</p><div className="result-review">{result.questions.map((question, index) => <div className="result-review-row" key={question.id}><strong>Question {index + 1}</strong><span>Your answer: {answers[String(question.id)] === question.correctAnswer ? "Correct" : "Review this one"}</span>{question.explanation && <p>{question.explanation}</p>}</div>)}</div><div className="result-actions"><Button variant="secondary" onClick={() => begin(selected.id)}><RotateCcw size={15} /> Try again</Button><Button onClick={() => { setSelected(null); setResult(null); }}>Done <ArrowRight size={15} /></Button></div></Card> : <form className="test-taking-form" onSubmit={submitAnswers}>{selected.questions.map((question, index) => <Card className="question-card" key={question.id}><div className="question-label"><span>QUESTION {String(index + 1).padStart(2, "0")}</span><span>{question.points} pt{question.points > 1 ? "s" : ""}</span></div><h2>{question.prompt}</h2><div className="answer-options">{question.options.map((option, optionIndex) => <label className={`answer-option ${answers[String(question.id)] === optionIndex ? "answer-selected" : ""}`} key={optionIndex}><input type="radio" name={`question-${question.id}`} checked={answers[String(question.id)] === optionIndex} onChange={() => setAnswers({ ...answers, [String(question.id)]: optionIndex })} /><span className="answer-letter">{String.fromCharCode(65 + optionIndex)}</span>{option}</label>)}</div></Card>)}<div className="test-submit-bar"><span>{Object.keys(answers).length} of {selected.questions.length} answered</span><Button type="submit" disabled={busy || Object.keys(answers).length !== selected.questions.length}>{busy ? "Scoring..." : "Submit answers"} <ArrowRight size={15} /></Button></div></form>}
  </div>;
  return <div><PageTitle eyebrow="PRACTICE WITHOUT THE PRESSURE" title="Mock tests" description="Check in with what you know, then learn from what you don’t." action={subjects.length > 0 && <Button onClick={() => { setDraft({ ...draft, subjectId: String(subjects[0].id) }); setCreateOpen(true); }}><Plus size={15} /> Create a test</Button>} />
    {error && <div className="notice-error">{error}<button onClick={() => setError("")}>Dismiss</button></div>}
    {!tests.length ? <Card><EmptyState title="A safe place to practice" text="Create a mock test with your own questions to check your understanding." action={subjects.length ? <Button onClick={() => setCreateOpen(true)}><Plus size={15} /> Create your first test</Button> : <p>Add a subject first, then you can create a test.</p>} /></Card> : <div className="test-grid">{tests.map((test) => <Card className="test-card" key={test.id}><span className="test-subject-pill" style={{ color: test.subject.color, background: `${test.subject.color}13` }}><i style={{ background: test.subject.color }} />{test.subject.name}</span><h2>{test.title}</h2><p>{test.description || "A little practice, at your own pace."}</p><div className="test-meta"><span><BadgeCheck size={14} /> {test._count.questions} questions</span><span><Clock3 size={14} /> {test.durationMinutes} min</span></div>{test.attempts[0] && <div className="last-attempt">Last score <strong>{test.attempts[0].score} / {test.attempts[0].totalPoints}</strong></div>}<Button className="full-button" onClick={() => void begin(test.id)}>{test.attempts.length ? "Try again" : "Start practice"} <ArrowRight size={14} /></Button></Card>)}</div>}
    {createOpen && <Dialog title="Create a mock test" onClose={() => setCreateOpen(false)}><form className="modal-form test-create-form" onSubmit={createTest}><label>Test title<input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="e.g. Chapter 3 quick check" required /></label><label>Subject<select required value={draft.subjectId} onChange={(e) => setDraft({ ...draft, subjectId: e.target.value })}><option value="">Choose a subject</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.icon} {subject.name}</option>)}</select></label><label>Time limit (minutes)<input type="number" min={1} max={600} value={draft.durationMinutes} onChange={(e) => setDraft({ ...draft, durationMinutes: Number(e.target.value) })} /></label>{draft.questions.map((question, qIndex) => <fieldset className="draft-question" key={qIndex}><legend>Question {qIndex + 1}</legend><label>Question prompt<textarea rows={2} required value={question.prompt} onChange={(e) => setDraft({ ...draft, questions: draft.questions.map((q, i) => i === qIndex ? { ...q, prompt: e.target.value } : q) })} /></label><div className="draft-options">{question.options.map((option, oIndex) => <label className="draft-option" key={oIndex}><input aria-label={`Mark option ${oIndex + 1} correct`} type="radio" checked={question.answerIndex === oIndex} onChange={() => setDraft({ ...draft, questions: draft.questions.map((q, i) => i === qIndex ? { ...q, answerIndex: oIndex } : q) })} /><input value={option} placeholder={`Option ${oIndex + 1}${oIndex < 2 ? " (required)" : ""}`} required={oIndex < 2} onChange={(e) => setDraft({ ...draft, questions: draft.questions.map((q, i) => i === qIndex ? { ...q, options: q.options.map((value, j) => j === oIndex ? e.target.value : value) } : q) })} /></label>)}</div><span className="field-hint">Select the radio button beside the correct answer.</span><label>Explanation <span className="optional">(optional)</span><input value={question.explanation} onChange={(e) => setDraft({ ...draft, questions: draft.questions.map((q, i) => i === qIndex ? { ...q, explanation: e.target.value } : q) })} /></label>{draft.questions.length > 1 && <button className="small-text-link delete-question" type="button" onClick={() => setDraft({ ...draft, questions: draft.questions.filter((_, i) => i !== qIndex) })}>Remove question</button>}</fieldset>)}{draft.questions.length < 20 && <button type="button" className="add-question-button" onClick={() => setDraft({ ...draft, questions: [...draft.questions, blankQuestion()] })}><Plus size={14} /> Add another question</button>}<Button type="submit" disabled={busy || !draft.subjectId}>{busy ? "Saving test..." : "Create mock test"}</Button></form></Dialog>}
  </div>;
}
