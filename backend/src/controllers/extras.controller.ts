import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/database.js";
import { AppError } from "../utils/errors.js";

export async function recommendations(req: Request, res: Response) {
  const userId = req.auth!.userId;
  const now = new Date();
  const [exams, weak, revisions, upcoming] = await Promise.all([
    prisma.subject.findMany({ where: { userId, examDate: { gte: now } }, include: { topics: true }, orderBy: { examDate: "asc" } }),
    prisma.topic.findMany({ where: { subject: { userId }, understandingPercentage: { lt: 65 } }, include: { subject: true }, orderBy: [{ importance: "desc" }, { understandingPercentage: "asc" }], take: 4 }),
    prisma.topic.findMany({ where: { subject: { userId }, nextRevisionAt: { lte: now } }, include: { subject: true }, take: 4 }),
    prisma.studySession.findMany({ where: { userId, status: "scheduled", scheduledAt: { gte: now } }, orderBy: { scheduledAt: "asc" }, take: 1 }),
  ]);
  const items: { type: string; title: string; detail: string; subjectId?: number; topicId?: number; action: string }[] = [];
  for (const subject of exams.slice(0, 3)) {
    const days = Math.max(0, Math.ceil((subject.examDate!.getTime() - now.getTime()) / 86_400_000));
    const progress = subject.topics.length ? Math.round(subject.topics.reduce((sum, topic) => sum + topic.understandingPercentage, 0) / subject.topics.length) : 0;
    items.push({ type: "exam", title: `${subject.name} exam in ${days} day${days === 1 ? "" : "s"}`, detail: `Current topic confidence is ${progress}%. Prioritize a short daily review.`, subjectId: subject.id, action: "Review exam plan" });
  }
  for (const topic of weak) items.push({ type: "weak", title: `Revisit ${topic.name}`, detail: `${topic.subject.name} · ${topic.understandingPercentage}% confidence · importance ${topic.importance}/5`, subjectId: topic.subjectId, topicId: topic.id, action: "Schedule review" });
  for (const topic of revisions) items.push({ type: "revision", title: `Revision due: ${topic.name}`, detail: `Spaced repetition suggests a refresh in ${topic.subject.name}.`, subjectId: topic.subjectId, topicId: topic.id, action: "Start revision" });
  if (upcoming[0]) items.push({ type: "plan", title: "Stay on track with your next session", detail: `Your next block is scheduled for ${upcoming[0].scheduledAt.toLocaleString()}.`, action: "View schedule" });
  if (!items.length) items.push({ type: "positive", title: "You're right on track", detail: "Add a subject or study topic to get personalized recommendations.", action: "Add a subject" });
  res.json({ recommendations: items });
}

export async function assistant(req: Request, res: Response) {
  const input = z.object({ message: z.string().trim().min(1).max(1000) }).parse(req.body);
  const userId = req.auth!.userId;
  const message = input.message.toLowerCase();
  const [weak, sessions, subjects] = await Promise.all([
    prisma.topic.findMany({ where: { subject: { userId }, understandingPercentage: { lt: 60 } }, include: { subject: { select: { name: true } } }, orderBy: [{ importance: "desc" }, { understandingPercentage: "asc" }], take: 3 }),
    prisma.studySession.findMany({ where: { userId, status: "scheduled", scheduledAt: { gte: new Date() } }, include: { subject: { select: { name: true } } }, orderBy: { scheduledAt: "asc" }, take: 3 }),
    prisma.subject.findMany({ where: { userId }, include: { topics: true } }),
  ]);
  const aiApiKey = process.env.AI_API_KEY;
  if (aiApiKey) {
    const context = {
      upcomingExams: subjects.filter((subject) => subject.examDate && subject.examDate > new Date()).map((subject) => ({
        subject: subject.name,
        examDate: subject.examDate,
        topics: subject.topics.map((topic) => ({ name: topic.name, confidence: topic.understandingPercentage, importance: topic.importance })),
      })),
      topicsToReview: weak.map((topic) => ({ subject: topic.subject.name, topic: topic.name, confidence: topic.understandingPercentage, importance: topic.importance })),
      upcomingSessions: sessions.map((session) => ({ subject: session.subject.name, title: session.title, startsAt: session.scheduledAt })),
    };
    const baseUrl = (process.env.AI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/+$/, "");
    const model = process.env.AI_MODEL ?? "gpt-4o-mini";
    let response: globalThis.Response;
    try {
      response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${aiApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: `You are SmartStudy, a supportive and practical study coach. Give concise, specific guidance, prioritize realistic next steps, and avoid claiming guaranteed results. Use only this learner's study context when relevant: ${JSON.stringify(context)}` },
            { role: "user", content: input.message },
          ],
        }),
        signal: AbortSignal.timeout(20_000),
      });
    } catch (cause) {
      if (cause instanceof Error && cause.name === "TimeoutError") throw new AppError("The study assistant timed out. Please try again.", 504);
      throw new AppError("The configured study assistant provider could not be reached", 502);
    }
    if (!response.ok) {
      console.error(`Study assistant provider returned HTTP ${response.status}`);
      throw new AppError("The configured study assistant provider is temporarily unavailable", 502);
    }
    let responseBody: unknown;
    try {
      responseBody = await response.json();
    } catch {
      throw new AppError("The configured study assistant returned an invalid response", 502);
    }
    const parsedPayload = z.object({
      choices: z.array(z.object({ message: z.object({ content: z.string().nullable() }) })).min(1),
    }).safeParse(responseBody);
    if (!parsedPayload.success) throw new AppError("The configured study assistant returned an invalid response", 502);
    const payload = parsedPayload.data;
    const reply = payload.choices[0].message.content?.trim();
    if (!reply) throw new AppError("The configured study assistant returned an empty response", 502);
    res.json({ reply, provider: "configured-ai", generatedAt: new Date().toISOString() });
    return;
  }
  let reply: string;
  if (/weak|difficult|struggling|focus/.test(message)) {
    reply = weak.length ? `I'd focus on ${weak.map((topic) => `${topic.name} (${topic.subject.name}, ${topic.understandingPercentage}% confidence)`).join(", ")}. Try a 25-minute focused block, then explain the key idea from memory.` : "Your topic confidence looks good. Add topic understanding scores as you study, and I can surface areas that need attention.";
  } else if (/plan|today|schedule|study/.test(message)) {
    reply = sessions.length ? `Your next study block${sessions.length > 1 ? "s are" : " is"} ${sessions.map((session) => `${session.title} for ${session.subject.name} at ${session.scheduledAt.toLocaleString()}`).join("; ")}. Keep the first block focused and take a short break afterward.` : "You have no upcoming blocks scheduled. Pick one high-priority topic, set a 25-minute focus session, and add it to your planner.";
  } else if (/exam|test|revision|revise/.test(message)) {
    const upcoming = subjects.filter((subject) => subject.examDate && subject.examDate > new Date()).sort((a, b) => a.examDate!.getTime() - b.examDate!.getTime()).slice(0, 3);
    reply = upcoming.length ? `Your nearest exams are ${upcoming.map((subject) => `${subject.name} on ${subject.examDate!.toLocaleDateString()}`).join(", ")}. Use active recall first, then revisit low-confidence topics.` : "I don't see an upcoming exam date yet. Add one to a subject and I'll help prioritize revision.";
  } else {
    reply = `You have ${subjects.length} subject${subjects.length === 1 ? "" : "s"} in your workspace. Ask me about your study plan, upcoming exams, revision, or topics to focus on.`;
  }
  res.json({ reply, provider: "local", generatedAt: new Date().toISOString() });
}

export function assistantStatus(_req: Request, res: Response) {
  res.json({ provider: process.env.AI_API_KEY ? "configured-ai" : "local" });
}

const testSchema = z.object({
  subjectId: z.number().int().positive(),
  title: z.string().trim().min(1).max(180),
  description: z.string().max(2000).optional(),
  durationMinutes: z.number().int().min(1).max(600),
  questions: z.array(z.object({ prompt: z.string().min(1), options: z.array(z.string().min(1)).min(2).max(6), answerIndex: z.number().int().min(0), explanation: z.string().optional(), points: z.number().int().min(1).default(1) })).min(1).max(100),
}).superRefine((test, ctx) => {
  test.questions.forEach((question, index) => {
    if (question.answerIndex >= question.options.length) ctx.addIssue({ code: "custom", path: ["questions", index, "answerIndex"], message: "Answer index must refer to an option" });
  });
});

export async function listTests(req: Request, res: Response) {
  const tests = await prisma.mockTest.findMany({
    where: { subject: { userId: req.auth!.userId }, status: "published" },
    include: { subject: { select: { name: true, color: true } }, _count: { select: { questions: true } }, attempts: { where: { userId: req.auth!.userId }, orderBy: { completedAt: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });
  res.json({ tests });
}

export async function createTest(req: Request, res: Response) {
  const data = testSchema.parse(req.body);
  const subject = await prisma.subject.findFirst({ where: { id: data.subjectId, userId: req.auth!.userId } });
  if (!subject) throw new AppError("Subject not found", 404);
  const test = await prisma.mockTest.create({ data: { subjectId: data.subjectId, title: data.title, description: data.description, durationMinutes: data.durationMinutes, questions: { create: data.questions } }, include: { questions: true } });
  res.status(201).json({ test });
}

export async function getTest(req: Request, res: Response) {
  const id = z.coerce.number().int().positive().parse(req.params.id);
  const test = await prisma.mockTest.findFirst({ where: { id, subject: { userId: req.auth!.userId }, status: "published" }, include: { subject: { select: { name: true } }, questions: { select: { id: true, prompt: true, options: true, points: true } } } });
  if (!test) throw new AppError("Mock test not found", 404);
  res.json({ test });
}

export async function submitTest(req: Request, res: Response) {
  const id = z.coerce.number().int().positive().parse(req.params.id);
  const answers = z.object({ answers: z.record(z.string(), z.number().int().min(0)) }).parse(req.body).answers;
  const test = await prisma.mockTest.findFirst({ where: { id, subject: { userId: req.auth!.userId }, status: "published" }, include: { questions: true } });
  if (!test) throw new AppError("Mock test not found", 404);
  const score = test.questions.reduce((sum, question) => sum + (answers[String(question.id)] === question.answerIndex ? question.points : 0), 0);
  const totalPoints = test.questions.reduce((sum, question) => sum + question.points, 0);
  const attempt = await prisma.$transaction(async (tx) => {
    const result = await tx.testAttempt.create({ data: { userId: req.auth!.userId, testId: id, answers, score, totalPoints } });
    const xp = Math.max(10, Math.round((score / totalPoints) * 50));
    const user = await tx.user.update({ where: { id: req.auth!.userId }, data: { xp: { increment: xp } } });
    const achievement = await tx.achievement.findUnique({ where: { code: "test-taker" } });
    if (achievement) {
      const earned = await tx.userAchievement.createMany({
        data: [{ userId: req.auth!.userId, achievementId: achievement.id }],
        skipDuplicates: true,
      });
      if (earned.count) await tx.user.update({ where: { id: user.id }, data: { xp: { increment: achievement.xpReward } } });
    }
    const finalUser = await tx.user.findUniqueOrThrow({ where: { id: user.id }, select: { xp: true } });
    await tx.user.update({ where: { id: user.id }, data: { level: Math.floor(finalUser.xp / 500) + 1 } });
    return result;
  });
  res.status(201).json({ attempt, score, totalPoints, percentage: Math.round((score / totalPoints) * 100), questions: test.questions.map((question) => ({ id: question.id, correctAnswer: question.answerIndex, explanation: question.explanation })) });
}

export async function achievements(req: Request, res: Response) {
  const [all, awards] = await Promise.all([
    prisma.achievement.findMany({ orderBy: { id: "asc" } }),
    prisma.userAchievement.findMany({ where: { userId: req.auth!.userId } }),
  ]);
  const earned = new Map(awards.map((award) => [award.achievementId, award.earnedAt]));
  const result = all.map((achievement) => ({ achievement, earnedAt: earned.get(achievement.id) ?? null }));
  res.json({ achievements: result });
}
