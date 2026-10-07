import { z } from "zod";

export const idParam = z.object({ id: z.coerce.number().int().positive() });
export const subjectInput = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().max(5000).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#4f46e5"),
  icon: z.string().max(16).default("📘"),
  examDate: z.coerce.date().optional().nullable(),
  targetCompletion: z.number().int().min(1).max(100).default(100),
});
export const topicInput = z.object({
  subjectId: z.number().int().positive(),
  name: z.string().trim().min(1).max(160),
  description: z.string().max(5000).optional(),
  difficulty: z.number().int().min(1).max(5).default(3),
  importance: z.number().int().min(1).max(5).default(3),
  estimatedMinutes: z.number().int().min(5).max(1440).default(60),
  understandingPercentage: z.number().int().min(0).max(100).default(0),
  status: z.enum(["not_started", "in_progress", "completed"]).default("not_started"),
});
export const sessionInput = z.object({
  subjectId: z.number().int().positive(),
  topicId: z.number().int().positive().optional().nullable(),
  title: z.string().trim().min(1).max(180),
  notes: z.string().max(5000).optional(),
  scheduledAt: z.coerce.date(),
  durationMinutes: z.number().int().min(5).max(720),
});
