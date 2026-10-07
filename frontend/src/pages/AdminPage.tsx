import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, BookOpen, CircleUserRound, Search, Shield, Users } from "lucide-react";
import { api, errorMessage } from "../services/api";
import { Button, Card, Loading, PageTitle } from "../components/ui";

interface AdminUser { id: number; name: string; email: string; role: "student" | "admin"; xp: number; level: number; studyStreak: number; createdAt: string; _count: { subjects: number; studySessions: number } }
interface Overview { stats: { users: number; students: number; admins: number; sessions: number; subjects: number; attempts: number }; recentUsers: AdminUser[] }
export default function AdminPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  async function load(query = "") {
    try {
      const [stats, people] = await Promise.all([api.get<Overview>("/admin/overview"), api.get<{ users: AdminUser[] }>("/admin/users", { params: { search: query } })]);
      setOverview(stats.data); setUsers(people.data.users); setError("");
    } catch (cause) { setError(errorMessage(cause)); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    const handle = window.setTimeout(() => void load(search), 250);
    return () => window.clearTimeout(handle);
  }, [search]);
  async function toggleRole(person: AdminUser) {
    setUpdating(person.id);
    try { await api.patch(`/admin/users/${person.id}/role`, { role: person.role === "admin" ? "student" : "admin" }); await load(search); }
    catch (cause) { setError(errorMessage(cause)); }
    finally { setUpdating(null); }
  }
  if (loading) return <Loading label="Opening the admin console" />;
  return <div><PageTitle eyebrow="SMARTSTUDY MANAGEMENT" title="Admin console" description="A high-level view of your learning community." />{error && <div className="notice-error">{error}</div>}{overview && <><div className="admin-stats"><Card><span className="admin-stat-icon admin-violet"><Users size={18} /></span><strong>{overview.stats.users}</strong><span>Total accounts</span></Card><Card><span className="admin-stat-icon admin-green"><CircleUserRound size={18} /></span><strong>{overview.stats.students}</strong><span>Student accounts</span></Card><Card><span className="admin-stat-icon admin-blue"><BookOpen size={18} /></span><strong>{overview.stats.subjects}</strong><span>Subjects created</span></Card><Card><span className="admin-stat-icon admin-orange"><Shield size={18} /></span><strong>{overview.stats.sessions}</strong><span>Study sessions</span></Card></div><Card className="admin-user-card"><div className="admin-table-heading"><div><h2>Accounts</h2><p>Manage roles for SmartStudy users</p></div><label className="admin-search"><Search size={15} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or email" /></label></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>STUDENT</th><th>ROLE</th><th>SUBJECTS</th><th>STUDY SESSIONS</th><th>XP</th><th>JOINED</th><th>ROLE ACTION</th></tr></thead><tbody>{users.map((person) => <tr key={person.id}><td><div className="admin-person"><span>{person.name.slice(0, 1).toUpperCase()}</span><div><strong>{person.name}</strong><small>{person.email}</small></div></div></td><td><span className={`role-pill role-${person.role}`}>{person.role}</span></td><td>{person._count.subjects}</td><td>{person._count.studySessions}</td><td>{person.xp}</td><td>{new Date(person.createdAt).toLocaleDateString()}</td><td><Button variant="secondary" className="role-toggle" disabled={updating === person.id} onClick={() => void toggleRole(person)}>{person.role === "admin" ? <><ArrowDown size={13} /> Make student</> : <><ArrowUp size={13} /> Make admin</>}</Button></td></tr>)}</tbody></table>{!users.length && <p className="admin-no-results">No accounts match your search.</p>}</div></Card></>}</div>;
}
