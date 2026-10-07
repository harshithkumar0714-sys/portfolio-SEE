import type { Request, Response } from "express";
import { prisma } from "../config/database.js";
import { AppError } from "../utils/errors.js";
import { z } from "zod";

export async function overview(_req: Request, res: Response) {
  const [users, students, admins, sessions, subjects, attempts] = await Promise.all([
    prisma.user.count(), prisma.user.count({ where: { role: "student" } }), prisma.user.count({ where: { role: "admin" } }),
    prisma.studySession.count(), prisma.subject.count(), prisma.testAttempt.count(),
  ]);
  const recentUsers = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, xp: true, createdAt: true, _count: { select: { subjects: true } } }, orderBy: { createdAt: "desc" }, take: 10 });
  res.json({ stats: { users, students, admins, sessions, subjects, attempts }, recentUsers });
}

export async function users(req: Request, res: Response) {
  const query = z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(20), search: z.string().max(120).optional() }).parse(req.query);
  const where = query.search ? { OR: [{ name: { contains: query.search } }, { email: { contains: query.search } }] } : {};
  const [total, data] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({ where, select: { id: true, name: true, email: true, role: true, xp: true, level: true, studyStreak: true, createdAt: true, _count: { select: { subjects: true, studySessions: true } } }, orderBy: { createdAt: "desc" }, skip: (query.page - 1) * query.limit, take: query.limit }),
  ]);
  res.json({ users: data, pagination: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) } });
}

export async function setUserRole(req: Request, res: Response) {
  const id = z.coerce.number().int().positive().parse(req.params.id);
  const { role } = z.object({ role: z.enum(["student", "admin"]) }).parse(req.body);
  if (id === req.auth!.userId && role !== "admin") throw new AppError("You cannot remove your own administrator role", 400);
  const user = await prisma.user.update({ where: { id }, data: { role }, select: { id: true, name: true, email: true, role: true } });
  res.json({ user });
}
