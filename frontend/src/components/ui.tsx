import type { ButtonHTMLAttributes, ReactNode } from "react";
import { LoaderCircle, Sparkles } from "lucide-react";

export function Button({ children, variant = "primary", className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  return <button className={`button button-${variant} ${className}`} {...props}>{children}</button>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>;
}

export function PageTitle({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="page-heading"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p className="page-description">{description}</p>}</div>{action}</div>;
}

export function Loading({ label = "Loading your study space" }: { label?: string }) {
  return <div className="loading"><LoaderCircle className="spin" size={21} />{label}</div>;
}

export function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return <div className="empty-state"><span className="empty-icon"><Sparkles size={19} /></span><strong>{title}</strong><p>{text}</p>{action}</div>;
}

export function ProgressBar({ value, color = "var(--brand)" }: { value: number; color?: string }) {
  return <div className="progress-track"><div className="progress-fill" style={{ width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color }} /></div>;
}

export function Dialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="dialog"><div className="dialog-head"><h2>{title}</h2><button className="icon-button" aria-label="Close dialog" onClick={onClose}>×</button></div>{children}</section></div>;
}
