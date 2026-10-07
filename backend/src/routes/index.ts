import { Router } from "express";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import * as auth from "../controllers/auth.controller.js";
import * as study from "../controllers/study.controller.js";
import * as dashboard from "../controllers/dashboard.controller.js";
import * as extras from "../controllers/extras.controller.js";
import * as admin from "../controllers/admin.controller.js";

const router = Router();

router.get("/health", (_req, res) => res.json({ status: "ok", service: "smartstudy-api" }));
router.post("/auth/register", auth.register);
router.post("/auth/login", auth.login);
router.get("/auth/me", requireAuth, auth.me);

router.use(requireAuth);
router.get("/dashboard", dashboard.dashboard);
router.patch("/profile", dashboard.updateProfile);
router.get("/subjects", study.subjects);
router.post("/subjects", study.createSubject);
router.patch("/subjects/:id", study.updateSubject);
router.delete("/subjects/:id", study.deleteSubject);
router.post("/topics", study.createTopic);
router.patch("/topics/:id", study.updateTopic);
router.delete("/topics/:id", study.deleteTopic);
router.get("/sessions", study.sessions);
router.post("/sessions", study.createSession);
router.post("/sessions/:id/complete", study.completeSession);
router.delete("/sessions/:id", study.deleteSession);
router.get("/recommendations", extras.recommendations);
router.get("/assistant/status", extras.assistantStatus);
router.post("/assistant", extras.assistant);
router.get("/tests", extras.listTests);
router.post("/tests", extras.createTest);
router.get("/tests/:id", extras.getTest);
router.post("/tests/:id/attempts", extras.submitTest);
router.get("/achievements", extras.achievements);
router.get("/admin/overview", requireAdmin, admin.overview);
router.get("/admin/users", requireAdmin, admin.users);
router.patch("/admin/users/:id/role", requireAdmin, admin.setUserRole);

export default router;
