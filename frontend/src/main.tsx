import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AppLayout from "./components/AppLayout";
import { Loading } from "./components/ui";
import "./styles.css";

const AuthPage = lazy(() => import("./pages/AuthPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const SubjectsPage = lazy(() => import("./pages/SubjectsPage"));
const PlannerPage = lazy(() => import("./pages/PlannerPage"));
const FocusPage = lazy(() => import("./pages/FocusPage"));
const TestsPage = lazy(() => import("./pages/TestsPage"));
const InsightsPage = lazy(() => import("./pages/InsightsPage"));
const AssistantPage = lazy(() => import("./pages/AssistantPage"));
const AchievementsPage = lazy(() => import("./pages/AchievementsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));

function Protected({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/" replace />;
  return <>{children}</>;
}

function App() {
  return <AuthProvider><BrowserRouter><Suspense fallback={<Loading />}><Routes>
    <Route path="/login" element={<AuthPage mode="login" />} />
    <Route path="/register" element={<AuthPage mode="register" />} />
    <Route element={<Protected><AppLayout /></Protected>}>
      <Route index element={<DashboardPage />} />
      <Route path="/subjects" element={<SubjectsPage />} />
      <Route path="/planner" element={<PlannerPage />} />
      <Route path="/focus" element={<FocusPage />} />
      <Route path="/tests" element={<TestsPage />} />
      <Route path="/insights" element={<InsightsPage />} />
      <Route path="/assistant" element={<AssistantPage />} />
      <Route path="/achievements" element={<AchievementsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/admin" element={<Protected adminOnly><AdminPage /></Protected>} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></Suspense></BrowserRouter></AuthProvider>;
}

ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><App /></React.StrictMode>);
