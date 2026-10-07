import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen, Check, Eye, EyeOff, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { errorMessage } from "../services/api";

export default function AuthPage({ mode }: { mode: "login" | "register" }) {
  const { user, signIn, signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  if (user) return <Navigate to="/" replace />;
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(""); setBusy(true);
    try {
      if (mode === "register") await signUp(name, email, password); else await signIn(email, password);
      navigate("/");
    } catch (cause) { setError(errorMessage(cause)); } finally { setBusy(false); }
  }
  const login = mode === "login";
  return <div className="auth-page">
    <div className="auth-art"><div className="auth-brand"><span className="brand-mark"><BookOpen size={19} /></span>smart<span>study</span></div><div className="auth-art-content"><div className="auth-orbit orbit-one" /><div className="auth-orbit orbit-two" /><div className="auth-orbit orbit-three" /><div className="study-illustration"><div className="illustration-book"><div className="book-page page-left" /><div className="book-page page-right" /><div className="book-spine" /><div className="book-star star-a">✦</div><div className="book-star star-b">✧</div><div className="book-lines"><i /><i /><i /></div><div className="book-lines second"><i /><i /><i /></div></div><div className="float-card float-card-top"><span>✦</span> Focus mode <b>25:00</b></div><div className="float-card float-card-bottom"><span className="mini-check"><Check size={13} /></span> Daily goal <b>3 / 4 sessions</b><div className="mini-progress"><i /></div></div></div><h2>A little progress,<br />every day.</h2><p>Your next breakthrough starts with one focused session.</p></div><div className="auth-art-footer"><Sparkles size={15} /> A calmer way to reach your goals</div></div>
    <div className="auth-main"><div className="auth-form-wrap"><div className="auth-mobile-brand"><span className="brand-mark"><BookOpen size={18} /></span> smartstudy</div><div className="auth-intro"><span className="auth-kicker">{login ? "WELCOME BACK" : "YOUR STUDY JOURNEY STARTS HERE"}</span><h1>{login ? "Good to see you." : "Make space to grow."}</h1><p>{login ? "Pick up right where you left off." : "Create your free account and build a study rhythm that works for you."}</p></div><form onSubmit={submit} className="auth-form">
      {!login && <label>Your name<input autoComplete="name" placeholder="e.g. Alex Morgan" value={name} onChange={(event) => setName(event.target.value)} minLength={2} required /></label>}
      <label>Email address<input autoComplete="email" type="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
      <label>Password<div className="password-wrap"><input autoComplete={login ? "current-password" : "new-password"} type={showPassword ? "text" : "password"} placeholder={login ? "Enter your password" : "At least 8 characters"} value={password} onChange={(event) => setPassword(event.target.value)} minLength={login ? undefined : 8} required /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
      {error && <div className="form-error" role="alert">{error}</div>}
      <button className="button button-primary auth-submit" type="submit" disabled={busy}>{busy ? "One moment..." : login ? "Sign in to your space" : "Create my account"}<ArrowRight size={17} /></button>
    </form><p className="auth-switch">{login ? "New to SmartStudy?" : "Already have a study space?"} <button onClick={() => navigate(login ? "/register" : "/login")}>{login ? "Create an account" : "Sign in"}</button></p><p className="auth-terms">By continuing, you agree to use your study space responsibly. Your personal learning data stays yours.</p></div></div>
  </div>;
}
