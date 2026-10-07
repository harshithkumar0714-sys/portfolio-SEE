import { useEffect, useState, type FormEvent } from "react";
import { Check, Clock3, Target, UserRound } from "lucide-react";
import { api, errorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Button, Card, Loading, PageTitle } from "../components/ui";

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({ name: "", dailyStudyTarget: 120, preferredStudyStart: "17:00", preferredStudyEnd: "21:00" });
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { if (user) setForm({ name: user.name, dailyStudyTarget: user.dailyStudyTarget, preferredStudyStart: user.preferredStudyStart ?? "17:00", preferredStudyEnd: user.preferredStudyEnd ?? "21:00" }); }, [user]);
  if (!user) return <Loading />;
  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setSuccess(false); setError("");
    try { await api.patch("/profile", form); await refreshUser(); setSuccess(true); }
    catch (cause) { setError(errorMessage(cause)); }
    finally { setBusy(false); }
  }
  return <div><PageTitle eyebrow="MAKE THIS SPACE YOURS" title="Your settings" description="A few gentle preferences to make SmartStudy feel more like you." /><Card className="settings-card"><div className="settings-section-heading"><span className="settings-icon"><UserRound size={17} /></span><div><h2>Your profile</h2><p>Personal details for your study space</p></div></div><form className="settings-form" onSubmit={save}><label>Your name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required minLength={2} maxLength={120} /></label><label>Email address<input value={user.email ?? ""} disabled /><span className="field-hint">Email address can’t be changed here.</span></label><div className="settings-divider" /><div className="settings-section-heading settings-sub-heading"><span className="settings-icon settings-icon-green"><Target size={17} /></span><div><h2>Your daily study goal</h2><p>A goal that feels encouraging, not overwhelming</p></div></div><label>Focus time per day<div className="target-input-wrap"><input type="number" min={15} max={720} step={15} value={form.dailyStudyTarget} onChange={(e) => setForm({ ...form, dailyStudyTarget: Number(e.target.value) })} /><span>minutes</span></div></label><div className="settings-divider" /><div className="settings-section-heading settings-sub-heading"><span className="settings-icon settings-icon-blue"><Clock3 size={17} /></span><div><h2>Your preferred study window</h2><p>Help your study plan fit your day</p></div></div><div className="form-pair settings-times"><label>Start time<input type="time" value={form.preferredStudyStart} onChange={(e) => setForm({ ...form, preferredStudyStart: e.target.value })} /></label><label>End time<input type="time" value={form.preferredStudyEnd} onChange={(e) => setForm({ ...form, preferredStudyEnd: e.target.value })} /></label></div>{error && <div className="form-error">{error}</div>}{success && <p className="settings-success"><Check size={15} /> Your preferences are saved.</p>}<Button disabled={busy}>{busy ? "Saving preferences..." : "Save preferences"}</Button></form></Card></div>;
}
