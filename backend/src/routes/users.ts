import { Router } from "express";
import db from "../db";
import { requireAuth, requireRole } from "../middleware";

const router = Router();

router.use(requireAuth);

router.get("/", requireRole("ADMIN"), (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.max(1, Math.min(100, Number(req.query.limit || 20)));
  const offset = (page - 1) * limit;
  const data = db
    .prepare(
      "SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?",
    )
    .all(limit, offset);
  const total = (db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number }).count;
  return res.json({ success: true, data, total, page, limit });
});

router.get("/me", (req, res) => res.json({ success: true, data: req.user }));

router.patch("/:id", requireRole("ADMIN"), (req, res) => {
  const { role, status } = req.body ?? {};
  if (!role && !status) {
    return res.status(400).json({ success: false, message: "No changes provided" });
  }
  if (role && !["ADMIN", "ANALYST", "VIEWER"].includes(role)) {
    return res.status(400).json({ success: false, message: "Invalid role" });
  }
  if (status && !["ACTIVE", "INACTIVE"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status" });
  }
  const fields: string[] = [];
  const params: unknown[] = [];
  if (role) {
    fields.push("role = ?");
    params.push(role);
  }
  if (status) {
    fields.push("status = ?");
    params.push(status);
  }
  params.push(req.params.id);
  db.prepare(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`).run(...params);
  const user = db
    .prepare("SELECT id, name, email, role, status, created_at FROM users WHERE id = ?")
    .get(req.params.id);
  return res.json({ success: true, data: user });
});

router.delete("/:id", requireRole("ADMIN"), (req, res) => {
  db.prepare("UPDATE users SET status = 'INACTIVE' WHERE id = ?").run(req.params.id);
  return res.json({ success: true, message: "User deactivated" });
});

export default router;
