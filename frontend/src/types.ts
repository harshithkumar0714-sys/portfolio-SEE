export interface User {
  id: number; name: string; email?: string; role: "student" | "admin"; xp: number; level: number;
  studyStreak: number; dailyStudyTarget: number; preferredStudyStart?: string; preferredStudyEnd?: string;
}
export interface Subject {
  id: number; name: string; description?: string | null; color: string; icon: string; examDate?: string | null;
  progress?: number; completedTopics?: number; topicCount?: number; targetCompletion?: number; topics?: Topic[]; _count?: { topics: number; studySessions: number };
}
export interface Topic {
  id: number; subjectId: number; name: string; description?: string | null; difficulty: number; importance: number;
  estimatedMinutes: number; understandingPercentage: number; status: "not_started" | "in_progress" | "completed";
  nextRevisionAt?: string | null;
}
export interface StudySession {
  id: number; title: string; notes?: string | null; scheduledAt: string; durationMinutes: number; actualMinutes?: number | null;
  status: "scheduled" | "completed" | "cancelled"; subjectId: number; topicId?: number | null;
  subject: { id?: number; name: string; color: string }; topic?: Topic | null;
}
export interface DashboardData {
  user: User; stats: { todayMinutes: number; weeklyMinutes: number; subjectCount: number; todayTargetPercent: number };
  todaySessions: StudySession[]; upcomingSessions: StudySession[]; subjects: Subject[];
  weeklyActivity: { day: string; date: string; minutes: number }[];
  weakTopics: (Topic & { subject: { name: string; color: string } })[];
  revisionTopics: (Topic & { subject: { name: string; color: string } })[];
  recentAttempts: { id: number; score: number; totalPoints: number; testTitle: string; subjectName: string; completedAt: string }[];
}
