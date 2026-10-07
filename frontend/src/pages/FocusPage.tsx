import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, Coffee, Pause, Play, RotateCcw, Settings2, SkipForward, Volume2, VolumeX } from "lucide-react";
import { Link } from "react-router-dom";
import { api, errorMessage } from "../services/api";
import type { Subject } from "../types";
import { Button, Card, Dialog, Loading, PageTitle } from "../components/ui";

type TimerMode = "focus" | "short" | "long";
const durations: Record<TimerMode, number> = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };
const labels: Record<TimerMode, string> = { focus: "Focus time", short: "Short break", long: "Long break" };
function notifyDone(mode: TimerMode, sound: boolean) {
  if ("Notification" in window && Notification.permission === "granted") new Notification(mode === "focus" ? "Focus session complete" : "Break complete", { body: mode === "focus" ? "Well done. Take a little breather." : "Ready when you are." });
  if (sound) {
    try { const context = new AudioContext(); const osc = context.createOscillator(); const gain = context.createGain(); osc.connect(gain); gain.connect(context.destination); osc.frequency.value = 660; gain.gain.value = 0.1; osc.start(); osc.stop(context.currentTime + 0.2); } catch { /* Browser audio may be unavailable. */ }
  }
}
export default function FocusPage() {
  const [mode, setMode] = useState<TimerMode>("focus");
  const [seconds, setSeconds] = useState(durations.focus);
  const [running, setRunning] = useState(false);
  const [sound, setSound] = useState(false);
  const [sessionsDone, setSessionsDone] = useState(0);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState("");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [settings, setSettings] = useState(false);
  const [custom, setCustom] = useState({ focus: 25, short: 5, long: 15 });
  const completedRef = useRef(false);
  useEffect(() => { void api.get<{ subjects: Subject[] }>("/subjects").then(({ data }) => { setSubjects(data.subjects); if (data.subjects[0]) setSubjectId(String(data.subjects[0].id)); }).catch((cause) => setError(errorMessage(cause))); }, []);
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setSeconds((remaining) => {
      if (remaining <= 1) { window.clearInterval(timer); setRunning(false); completedRef.current = true; notifyDone(mode, sound); if (mode === "focus") setSessionsDone((count) => count + 1); return 0; }
      return remaining - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [running, mode, sound]);
  useEffect(() => {
    if (!completedRef.current || mode !== "focus" || !sessionId) return;
    completedRef.current = false;
    void api.post(`/sessions/${sessionId}/complete`, { actualMinutes: custom.focus }).then(() => setSessionId(null)).catch((cause) => setError(errorMessage(cause)));
  }, [seconds, mode, sessionId, custom.focus]);
  function switchMode(next: TimerMode) { setRunning(false); setMode(next); setSeconds(custom[next] * 60); completedRef.current = false; }
  function toggleRun() {
    if (seconds === 0) setSeconds(custom[mode] * 60);
    if (!running && "Notification" in window && Notification.permission === "default") void Notification.requestPermission();
    setRunning(!running);
  }
  async function startFocus() {
    setError("");
    if (!subjectId) { setError("Add a subject before starting a tracked focus session."); return; }
    try {
      const { data } = await api.post<{ session: { id: number } }>("/sessions", { subjectId: Number(subjectId), title: "Pomodoro focus session", scheduledAt: new Date().toISOString(), durationMinutes: custom.focus });
      setSessionId(data.session.id); switchMode("focus"); setRunning(true);
    } catch (cause) { setError(errorMessage(cause)); }
  }
  const progress = 1 - seconds / (custom[mode] * 60);
  const circumference = 2 * Math.PI * 118;
  const remaining = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  if (!subjects.length && !error) return <Loading label="Preparing your focus room" />;
  return <div><PageTitle eyebrow="A LITTLE SPACE TO CONCENTRATE" title="Focus room" description="One thing at a time. You’re exactly where you need to be." /><div className="focus-layout">
    <Card className="focus-card"><div className="focus-mode-switch">{(["focus", "short", "long"] as TimerMode[]).map((item) => <button key={item} className={mode === item ? `mode-selected mode-${item}` : ""} onClick={() => switchMode(item)}>{item === "focus" ? <span className="mode-dot" /> : <Coffee size={14} />}{labels[item]}</button>)}</div><div className={`timer-ring timer-${mode}`}><svg viewBox="0 0 260 260"><circle className="timer-track" cx="130" cy="130" r="118" /><circle className="timer-progress" cx="130" cy="130" r="118" strokeDasharray={circumference} strokeDashoffset={circumference * progress} /></svg><div className="timer-face"><span className="timer-caption">{running ? "STAY WITH IT" : seconds === 0 ? "SESSION COMPLETE" : "YOUR TIME"}</span><strong>{remaining}</strong><span className="timer-mode-label">{labels[mode]}</span></div><span className="timer-orbit orbit-left">✦</span><span className="timer-orbit orbit-right">✳</span></div><div className="timer-controls"><button className={`button ${running ? "button-secondary" : "button-primary"} timer-main-button`} onClick={toggleRun}>{running ? <><Pause size={17} /> Pause</> : <><Play size={17} fill="currentColor" /> {seconds === 0 ? "Start again" : "Start timer"}</>}</button><button className="timer-reset icon-button" aria-label="Reset timer" onClick={() => { setRunning(false); setSeconds(custom[mode] * 60); }}><RotateCcw size={17} /></button></div><div className="focus-bottom"><span><span className={`focus-live-dot ${running ? "is-running" : ""}`} />{running ? "You’re in a focus session" : "Ready when you are"}</span><div><button className="icon-button" aria-label={sound ? "Mute alert" : "Enable sound alert"} onClick={() => setSound(!sound)}>{sound ? <Volume2 size={16} /> : <VolumeX size={16} />}</button><button className="icon-button" aria-label="Timer settings" onClick={() => setSettings(true)}><Settings2 size={16} /></button></div></div></Card>
    <div className="focus-side"><Card className="focus-subject-card"><span className="section-kicker">SET AN INTENTION</span><h2>What are you focusing on?</h2><p>A tiny bit of clarity can help your mind settle in.</p><label className="focus-select-label">SUBJECT<select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.icon} {subject.name}</option>)}</select></label>{error && <div className="form-error">{error}</div>}<Button className="full-button" disabled={running || mode !== "focus" || !subjects.length} onClick={() => void startFocus()}>{sessionId ? <><Check size={16} /> Tracked session started</> : <>Begin a tracked session <Play size={15} /></>}</Button><p className="focus-session-note">Finishing the timer logs your focus time, builds your streak and earns XP.</p></Card>
      <Card className="focus-count-card"><div className="focus-count-head"><div className="pomodoro-icon"><Check size={15} /></div><span className="section-kicker">TODAY’S FOCUS</span></div><div className="focus-count-number">{sessionsDone}<span> session{sessionsDone === 1 ? "" : "s"}</span></div><div className="pomodoro-circles">{Array.from({ length: 4 }, (_, i) => <span key={i} className={i < sessionsDone ? "pomodoro-done" : ""}>{i < sessionsDone ? <Check size={13} /> : "·"}</span>)}</div><p>{sessionsDone ? "You showed up for yourself today. That matters." : "Complete one focus block. Then see how you feel."}</p></Card>
      <Link to="/planner" className="focus-back-link"><ArrowLeft size={14} /> Back to your study planner <SkipForward size={13} /></Link>
    </div></div>{settings && <Dialog title="Timer settings" onClose={() => setSettings(false)}><form className="modal-form" onSubmit={(event) => { event.preventDefault(); if (running) return; setSeconds(custom[mode] * 60); setSettings(false); }}><label>Focus session (minutes)<input type="number" min={1} max={120} value={custom.focus} onChange={(e) => setCustom({ ...custom, focus: Number(e.target.value) })} /></label><label>Short break (minutes)<input type="number" min={1} max={60} value={custom.short} onChange={(e) => setCustom({ ...custom, short: Number(e.target.value) })} /></label><label>Long break (minutes)<input type="number" min={1} max={60} value={custom.long} onChange={(e) => setCustom({ ...custom, long: Number(e.target.value) })} /></label><Button disabled={running}>Save timer settings</Button></form></Dialog>}</div>;
}
