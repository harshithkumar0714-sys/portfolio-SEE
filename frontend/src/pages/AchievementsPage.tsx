import { useEffect, useState } from "react";
import { Award, Flame, LockKeyhole, Sparkles, Trophy, Zap } from "lucide-react";
import { api, errorMessage } from "../services/api";
import { Card, Loading, PageTitle } from "../components/ui";

interface AwardItem { earnedAt: string | null; achievement: { code: string; name: string; description: string; icon: string; xpReward: number } }
export default function AchievementsPage() {
  const [earned, setEarned] = useState<AwardItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => { void api.get<{ achievements: AwardItem[] }>("/achievements").then(({ data }) => setEarned(data.achievements)).catch((cause) => setError(errorMessage(cause))).finally(() => setLoading(false)); }, []);
  if (loading) return <Loading label="Finding your milestones" />;
  return <div><PageTitle eyebrow="CELEBRATE THE LITTLE WINS" title="Achievements" description="Every milestone is a reminder that you’re showing up for yourself." />{error && <div className="notice-error">{error}</div>}<Card className="achievement-summary"><div className="achievement-summary-icon"><Trophy size={21} /></div><div><span className="section-kicker">YOUR MILESTONES</span><h2>{earned.filter((item) => item.earnedAt).length} of {earned.length} achievements earned</h2><p>There’s no rush. Keep learning in your own way.</p></div><Sparkles className="achievement-sparkle" size={23} /></Card><div className="achievement-grid">{earned.map(({ achievement: item, earnedAt }, index) => { const isEarned = earnedAt !== null; return <Card key={item.code} className={`achievement-card ${isEarned ? "achievement-earned" : "achievement-locked"}`}><div className="achievement-top"><span className={`achievement-icon achievement-icon-${index % 3}`}>{item.icon}</span>{isEarned ? <span className="earned-pill"><Award size={12} /> Earned</span> : <span className="locked-pill"><LockKeyhole size={12} /> In progress</span>}</div><h2>{item.name}</h2><p>{item.description}</p><span className="achievement-xp"><Zap size={13} /> {item.xpReward} XP</span>{earnedAt && <small className="achievement-date">Earned {new Date(earnedAt).toLocaleDateString()}</small>}</Card>; })}</div><div className="achievement-footer"><Flame size={15} /> Your next milestone might be closer than you think.</div></div>;
}
