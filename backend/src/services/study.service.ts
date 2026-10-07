import { SessionStatus } from "@prisma/client";
import { prisma } from "../config/database.js";
import { AppError } from "../utils/errors.js";
import type { sessionInput, subjectInput, topicInput } from "../validators/common.js";
import type { z } from "zod";

type SubjectData = z.infer<typeof subjectInput>;
type TopicData = z.infer<typeof topicInput>;
type SessionData = z.infer<typeof sessionInput>;

export async function listSubjects(userId: number) {
  return prisma.subject.findMany({
    where: { userId },
    include: { _count: { select: { topics: true, studySessions: true } }, topics: true },
    orderBy: [{ examDate: "asc" }, { name: "asc" }],
  });
}

export async function createSubject(userId: number, data: SubjectData) {
  return prisma.subject.create({ data: { ...data, userId } });
}

export async function updateSubject(userId: number, id: number, data: Partial<SubjectData>) {
  await ownedSubject(userId, id);
  return prisma.subject.update({ where: { id }, data });
}

export async function deleteSubject(userId: number, id: number) {
  await ownedSubject(userId, id);
  return prisma.subject.delete({ where: { id } });
}

export async function createTopic(userId: number, data: TopicData) {
  await ownedSubject(userId, data.subjectId);
  return prisma.topic.create({ data });
}

export async function updateTopic(userId: number, id: number, data: Partial<TopicData>) {
  const topic = await prisma.topic.findFirstOrThrow({ where: { id, subject: { userId } } });
  if (data.subjectId && data.subjectId !== topic.subjectId) await ownedSubject(userId, data.subjectId);
  return prisma.topic.update({ where: { id }, data });
}

export async function deleteTopic(userId: number, id: number) {
  await prisma.topic.findFirstOrThrow({ where: { id, subject: { userId } } });
  return prisma.topic.delete({ where: { id } });
}

export async function listSessions(userId: number, from?: Date, to?: Date) {
  return prisma.studySession.findMany({
    where: { userId, ...(from || to ? { scheduledAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}) },
    include: { subject: { select: { id: true, name: true, color: true } }, topic: true },
    orderBy: { scheduledAt: "asc" },
  });
}

export async function createSession(userId: number, data: SessionData) {
  await ownedSubject(userId, data.subjectId);
  if (data.topicId) await prisma.topic.findFirstOrThrow({ where: { id: data.topicId, subjectId: data.subjectId } });
  return prisma.studySession.create({ data: { ...data, userId } });
}

export async function completeSession(userId: number, id: number, actualMinutes?: number) {
  const completedAt = new Date();
  const day = new Date(completedAt);
  day.setUTCHours(0, 0, 0, 0);
  const yesterday = new Date(day);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  return prisma.$transaction(async (tx) => {
    const session = await tx.studySession.findFirst({ where: { id, userId } });
    if (!session) throw new AppError("Study session not found", 404);
    if (session.status === SessionStatus.completed) throw new AppError("Session is already completed", 409);
    const minutes = actualMinutes ?? session.durationMinutes;
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 720) throw new AppError("Actual minutes must be between 1 and 720");
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    const lastDay = user.lastStudyDate ? new Date(user.lastStudyDate) : null;
    lastDay?.setUTCHours(0, 0, 0, 0);
    const streak = lastDay?.getTime() === day.getTime() ? user.studyStreak : lastDay?.getTime() === yesterday.getTime() ? user.studyStreak + 1 : 1;
    await tx.user.update({
      where: { id: userId },
      data: { xp: { increment: Math.max(5, Math.floor(minutes / 5)) }, studyStreak: streak, lastStudyDate: day },
    });
    const done = await tx.studySession.update({
      where: { id },
      data: { status: SessionStatus.completed, actualMinutes: minutes, completedAt },
    });
    const completedCount = await tx.studySession.count({ where: { userId, status: SessionStatus.completed } });
    const earnedCodes = [
      ...(completedCount === 1 ? ["first-session"] : []),
      ...(streak >= 7 ? ["streak-7"] : []),
    ];
    if (earnedCodes.length) {
      const achievements = await tx.achievement.findMany({ where: { code: { in: earnedCodes } } });
      for (const achievement of achievements) {
        const award = await tx.userAchievement.createMany({
          data: [{ userId, achievementId: achievement.id }],
          skipDuplicates: true,
        });
        if (award.count) {
          await tx.user.update({ where: { id: userId }, data: { xp: { increment: achievement.xpReward } } });
        }
      }
      const finalUser = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { xp: true } });
      await tx.user.update({ where: { id: userId }, data: { level: Math.floor(finalUser.xp / 500) + 1 } });
    }
    if (session.topicId) {
      await tx.topic.update({
        where: { id: session.topicId },
        data: { status: "in_progress", nextRevisionAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
      });
    }
    const finalUser = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { xp: true, level: true, studyStreak: true } });
    const level = Math.floor(finalUser.xp / 500) + 1;
    if (finalUser.level !== level) await tx.user.update({ where: { id: userId }, data: { level } });
    return { session: done, ...finalUser, level };
  });
}

export async function deleteSession(userId: number, id: number) {
  await prisma.studySession.findFirstOrThrow({ where: { id, userId } });
  return prisma.studySession.delete({ where: { id } });
}

async function ownedSubject(userId: number, subjectId: number) {
  const subject = await prisma.subject.findFirst({ where: { id: subjectId, userId } });
  if (!subject) throw new AppError("Subject not found", 404);
  return subject;
}
