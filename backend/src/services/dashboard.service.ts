import { prisma } from "../config/database.js";

export async function getDashboard(userId: number) {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const weekStart = new Date(start);
  weekStart.setDate(weekStart.getDate() - 6);

  const [user, subjects, todaySessions, weekSessions, upcomingSessions, weakTopics, revisionTopics, recentAttempts] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { id: true, name: true, xp: true, level: true, studyStreak: true, dailyStudyTarget: true } }),
    prisma.subject.findMany({ where: { userId }, include: { topics: { select: { status: true, understandingPercentage: true } } }, orderBy: { examDate: "asc" } }),
    prisma.studySession.findMany({ where: { userId, scheduledAt: { gte: start, lt: end } }, include: { subject: { select: { name: true, color: true } } }, orderBy: { scheduledAt: "asc" } }),
    prisma.studySession.findMany({ where: { userId, status: "completed", completedAt: { gte: weekStart } }, select: { actualMinutes: true, completedAt: true } }),
    prisma.studySession.findMany({ where: { userId, status: "scheduled", scheduledAt: { gte: start } }, include: { subject: { select: { name: true, color: true } } }, orderBy: { scheduledAt: "asc" }, take: 6 }),
    prisma.topic.findMany({ where: { subject: { userId }, understandingPercentage: { lt: 60 } }, include: { subject: { select: { name: true, color: true } } }, orderBy: [{ importance: "desc" }, { understandingPercentage: "asc" }], take: 5 }),
    prisma.topic.findMany({ where: { subject: { userId }, nextRevisionAt: { lte: end } }, include: { subject: { select: { name: true, color: true } } }, take: 5 }),
    prisma.testAttempt.findMany({ where: { userId }, include: { test: { include: { subject: { select: { name: true } } } } }, orderBy: { completedAt: "desc" }, take: 5 }),
  ]);
  const todayMinutes = todaySessions.filter((s) => s.status === "completed").reduce((sum, s) => sum + (s.actualMinutes ?? s.durationMinutes), 0);
  const weeklyMinutes = weekSessions.reduce((sum, s) => sum + (s.actualMinutes ?? 0), 0);
  const weeklyActivity = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + index);
    const minutes = weekSessions.filter((session) => session.completedAt?.toDateString() === date.toDateString()).reduce((sum, session) => sum + (session.actualMinutes ?? 0), 0);
    return { day: date.toLocaleDateString("en-US", { weekday: "short" }), date: date.toISOString().slice(0, 10), minutes };
  });
  const subjectProgress = subjects.map(({ topics, ...subject }) => ({
    ...subject,
    progress: topics.length ? Math.round(topics.reduce((sum, topic) => sum + topic.understandingPercentage, 0) / topics.length) : 0,
    completedTopics: topics.filter((topic) => topic.status === "completed").length,
    topicCount: topics.length,
  }));
  return {
    user, stats: { todayMinutes, weeklyMinutes, subjectCount: subjects.length, todayTargetPercent: Math.min(100, Math.round((todayMinutes / user.dailyStudyTarget) * 100)) },
    todaySessions, upcomingSessions, subjects: subjectProgress, weeklyActivity,
    weakTopics, revisionTopics,
    recentAttempts: recentAttempts.map((attempt) => ({ id: attempt.id, score: attempt.score, totalPoints: attempt.totalPoints, completedAt: attempt.completedAt, testTitle: attempt.test.title, subjectName: attempt.test.subject.name })),
  };
}
