import type { Request, Response } from "express";
import { z } from "zod";
import * as authService from "../services/auth.service.js";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().email().max(255).transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
});
const loginSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(128),
});

export async function register(req: Request, res: Response) {
  const input = registerSchema.parse(req.body);
  res.status(201).json(await authService.register(input.name, input.email, input.password));
}

export async function login(req: Request, res: Response) {
  const input = loginSchema.parse(req.body);
  res.json(await authService.login(input.email, input.password));
}

export async function me(req: Request, res: Response) {
  res.json({ user: await authService.getCurrentUser(req.auth!.userId) });
}
