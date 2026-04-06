"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
router.use(middleware_1.requireAuth);
router.get("/", (0, middleware_1.requireRole)("ADMIN"), (req, res) => {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.max(1, Math.min(100, Number(req.query.limit || 20)));
    const offset = (page - 1) * limit;
    const data = db_1.default
        .prepare("SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?")
        .all(limit, offset);
    const total = db_1.default.prepare("SELECT COUNT(*) as count FROM users").get().count;
    return res.json({ success: true, data, total, page, limit });
});
router.get("/me", (req, res) => res.json({ success: true, data: req.user }));
router.patch("/:id", (0, middleware_1.requireRole)("ADMIN"), (req, res) => {
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
    const fields = [];
    const params = [];
    if (role) {
        fields.push("role = ?");
        params.push(role);
    }
    if (status) {
        fields.push("status = ?");
        params.push(status);
    }
    params.push(req.params.id);
    db_1.default.prepare(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`).run(...params);
    const user = db_1.default
        .prepare("SELECT id, name, email, role, status, created_at FROM users WHERE id = ?")
        .get(req.params.id);
    return res.json({ success: true, data: user });
});
router.delete("/:id", (0, middleware_1.requireRole)("ADMIN"), (req, res) => {
    db_1.default.prepare("UPDATE users SET status = 'INACTIVE' WHERE id = ?").run(req.params.id);
    return res.json({ success: true, message: "User deactivated" });
});
exports.default = router;
