import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/database.js";
import { getDashboard } from "../services/dashboard.service.js";

export async function dashboard(req: Request, res: Response) {
  res.json(await getDashboard(req.auth!.userId));
}

export async function updateProfile(req: Request, res: Response) {
  const profile = z.object({
    name: z.string().trim().min(2).max(120).optional(),
    dailyStudyTarget: z.number().int().min(15).max(720).optional(),
    preferredStudyStart: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
    preferredStudyEnd: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  }).strict().refine((value) => Object.keys(value).length > 0, "At least one profile field must be provided").parse(req.body);
  const result = await prisma.user.update({
    where: { id: req.auth!.userId },
    data: profile,
    select: { id: true, name: true, email: true, xp: true, level: true, studyStreak: true, dailyStudyTarget: true, preferredStudyStart: true, preferredStudyEnd: true },
  });
  res.json({ user: result });
}
