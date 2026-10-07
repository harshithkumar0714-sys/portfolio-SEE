import type { Request, Response } from "express";
import { z } from "zod";
import * as study from "../services/study.service.js";
import { idParam, sessionInput, subjectInput, topicInput } from "../validators/common.js";

const patchSubject = subjectInput.partial();
const patchTopic = topicInput.partial().omit({ subjectId: true });
const completeSchema = z.object({ actualMinutes: z.number().int().min(1).max(720).optional() });

export async function subjects(req: Request, res: Response) {
  res.json({ subjects: await study.listSubjects(req.auth!.userId) });
}
export async function createSubject(req: Request, res: Response) {
  res.status(201).json({ subject: await study.createSubject(req.auth!.userId, subjectInput.parse(req.body)) });
}
export async function updateSubject(req: Request, res: Response) {
  const { id } = idParam.parse(req.params);
  res.json({ subject: await study.updateSubject(req.auth!.userId, id, patchSubject.parse(req.body)) });
}
export async function deleteSubject(req: Request, res: Response) {
  const { id } = idParam.parse(req.params);
  await study.deleteSubject(req.auth!.userId, id);
  res.status(204).end();
}
export async function createTopic(req: Request, res: Response) {
  res.status(201).json({ topic: await study.createTopic(req.auth!.userId, topicInput.parse(req.body)) });
}
export async function updateTopic(req: Request, res: Response) {
  const { id } = idParam.parse(req.params);
  res.json({ topic: await study.updateTopic(req.auth!.userId, id, patchTopic.parse(req.body)) });
}
export async function deleteTopic(req: Request, res: Response) {
  const { id } = idParam.parse(req.params);
  await study.deleteTopic(req.auth!.userId, id);
  res.status(204).end();
}
export async function sessions(req: Request, res: Response) {
  const from = req.query.from ? new Date(String(req.query.from)) : undefined;
  const to = req.query.to ? new Date(String(req.query.to)) : undefined;
  if ((from && Number.isNaN(from.getTime())) || (to && Number.isNaN(to.getTime()))) {
    res.status(400).json({ error: "Invalid date filter" });
    return;
  }
  res.json({ sessions: await study.listSessions(req.auth!.userId, from, to) });
}
export async function createSession(req: Request, res: Response) {
  res.status(201).json({ session: await study.createSession(req.auth!.userId, sessionInput.parse(req.body)) });
}
export async function completeSession(req: Request, res: Response) {
  const { id } = idParam.parse(req.params);
  const { actualMinutes } = completeSchema.parse(req.body);
  res.json(await study.completeSession(req.auth!.userId, id, actualMinutes));
}
export async function deleteSession(req: Request, res: Response) {
  const { id } = idParam.parse(req.params);
  await study.deleteSession(req.auth!.userId, id);
  res.status(204).end();
}
