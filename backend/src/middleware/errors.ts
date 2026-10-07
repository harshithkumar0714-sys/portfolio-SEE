import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/errors.js";

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ error: "Route not found" });
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({ error: "Validation failed", details: error.flatten().fieldErrors });
    return;
  }
  if (error instanceof AppError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }
  if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
    res.status(409).json({ error: "A record with these details already exists" });
    return;
  }
  if (typeof error === "object" && error && "code" in error && error.code === "P2025") {
    res.status(404).json({ error: "Record not found" });
    return;
  }
  if (typeof error === "object" && error && "status" in error && typeof error.status === "number" && error.status >= 400 && error.status < 500) {
    const message = error.status === 413 ? "Request body is too large" : "Invalid request";
    res.status(error.status).json({ error: message });
    return;
  }
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
};
