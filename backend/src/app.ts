import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import routes from "./routes/index.js";
import { errorHandler, notFound } from "./middleware/errors.js";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be configured");
}

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be configured with at least 32 characters");
}

const app = express();

app.disable("x-powered-by");
app.use(helmet());

const configuredFrontendUrl =
  process.env.FRONTEND_URL ?? "http://localhost:5173";

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || origin === configuredFrontendUrl) {
        callback(null, true);
        return;
      }

      if (process.env.NODE_ENV !== "production") {
        try {
          const url = new URL(origin);

          if (
            ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) &&
            ["5173", "5174", "5175", "5176", "5177", "5178", "5179"].includes(
              url.port
            )
          ) {
            callback(null, true);
            return;
          }
        } catch {
          callback(new Error("Invalid request origin"));
          return;
        }
      }

      callback(new Error("Origin is not allowed by CORS"));
    },
  })
);

app.use(express.json({ limit: "1mb" }));

app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  })
);

app.use("/api", routes);
app.use(notFound);
app.use(errorHandler);

export default app;