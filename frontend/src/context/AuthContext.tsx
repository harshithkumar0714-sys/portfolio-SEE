import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "../services/api";
import type { User } from "../types";

interface AuthContextValue {
  user: User | null; loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => void; refreshUser: () => Promise<void>;
}
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshUser = useCallback(async () => {
    if (!localStorage.getItem("smartstudy_token")) { setUser(null); setLoading(false); return; }
    try { setUser((await api.get<{ user: User }>("/auth/me")).data.user); }
    catch { localStorage.removeItem("smartstudy_token"); setUser(null); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    void refreshUser();
    const unauthorized = () => setUser(null);
    window.addEventListener("smartstudy:unauthorized", unauthorized);
    return () => window.removeEventListener("smartstudy:unauthorized", unauthorized);
  }, [refreshUser]);
  const signIn = async (email: string, password: string) => {
    const result = (await api.post<{ user: User; token: string }>("/auth/login", { email, password })).data;
    localStorage.setItem("smartstudy_token", result.token); setUser(result.user);
  };
  const signUp = async (name: string, email: string, password: string) => {
    const result = (await api.post<{ user: User; token: string }>("/auth/register", { name, email, password })).data;
    localStorage.setItem("smartstudy_token", result.token); setUser(result.user);
  };
  const signOut = () => { localStorage.removeItem("smartstudy_token"); setUser(null); };
  return <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, refreshUser }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
