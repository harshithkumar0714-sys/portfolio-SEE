import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/errors.js";

type TokenPayload = { userId: number; role: "student" | "admin" };

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return next(new AppError("Authentication required", 401));
  try {
    req.auth = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    next();
  } catch {
    next(new AppError("Invalid or expired token", 401));
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (req.auth?.role !== "admin") return next(new AppError("Administrator access required", 403));
  next();
}
