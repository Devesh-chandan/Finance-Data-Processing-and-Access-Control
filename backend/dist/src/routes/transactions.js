"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const node_crypto_1 = require("node:crypto");
const db_1 = __importDefault(require("../db"));
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
router.use(middleware_1.requireAuth);
const isValidDate = (value) => !Number.isNaN(new Date(value).getTime());
const toPaise = (rupees) => Math.round(rupees * 100);
router.get("/", (req, res) => {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.max(1, Math.min(100, Number(req.query.limit || 20)));
    const offset = (page - 1) * limit;
    const where = ["is_deleted = 0"];
    const params = [];
    if (req.query.type) {
        where.push("type = ?");
        params.push(String(req.query.type));
    }
    if (req.query.category) {
        where.push("category LIKE ?");
        params.push(`%${String(req.query.category)}%`);
    }
    if (req.query.startDate) {
        where.push("date >= ?");
        params.push(String(req.query.startDate));
    }
    if (req.query.endDate) {
        where.push("date <= ?");
        params.push(String(req.query.endDate));
    }
    const whereSql = `WHERE ${where.join(" AND ")}`;
    const data = db_1.default
        .prepare(`SELECT * FROM transactions ${whereSql} ORDER BY date DESC LIMIT ? OFFSET ?`)
        .all(...params, limit, offset);
    const total = db_1.default.prepare(`SELECT COUNT(*) as count FROM transactions ${whereSql}`).get(...params).count;
    return res.json({ success: true, data, total, page, limit });
});
router.get("/:id", (req, res) => {
    const row = db_1.default
        .prepare("SELECT * FROM transactions WHERE id = ? AND is_deleted = 0")
        .get(req.params.id);
    if (!row) {
        return res.status(404).json({ success: false, message: "Transaction not found" });
    }
    return res.json({ success: true, data: row });
});
router.post("/", (0, middleware_1.requireRole)("ADMIN"), (req, res) => {
    const { amount, type, category, date, notes } = req.body ?? {};
    const amountNum = Number(amount);
    if (!Number.isInteger(amountNum * 100) || amountNum <= 0) {
        return res.status(400).json({ success: false, message: "Amount must be positive" });
    }
    if (!["INCOME", "EXPENSE"].includes(type)) {
        return res.status(400).json({ success: false, message: "Invalid type" });
    }
    if (!category || !String(category).trim()) {
        return res.status(400).json({ success: false, message: "Category is required" });
    }
    if (!date || !isValidDate(String(date))) {
        return res.status(400).json({ success: false, message: "Invalid date" });
    }
    const id = (0, node_crypto_1.randomUUID)();
    const createdAt = new Date().toISOString();
    db_1.default.prepare(`INSERT INTO transactions
     (id, amount, type, category, date, notes, created_by, is_deleted, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`).run(id, toPaise(amountNum), type, String(category).trim(), new Date(date).toISOString(), notes ? String(notes) : null, req.user.id, createdAt);
    const created = db_1.default.prepare("SELECT * FROM transactions WHERE id = ?").get(id);
    return res.status(201).json({ success: true, data: created });
});
router.patch("/:id", (0, middleware_1.requireRole)("ADMIN"), (req, res) => {
    const { amount, type, category, date, notes } = req.body ?? {};
    const fields = [];
    const params = [];
    if (amount !== undefined) {
        const amountNum = Number(amount);
        if (!Number.isInteger(amountNum * 100) || amountNum <= 0) {
            return res.status(400).json({ success: false, message: "Invalid amount" });
        }
        fields.push("amount = ?");
        params.push(toPaise(amountNum));
    }
    if (type !== undefined) {
        if (!["INCOME", "EXPENSE"].includes(type)) {
            return res.status(400).json({ success: false, message: "Invalid type" });
        }
        fields.push("type = ?");
        params.push(type);
    }
    if (category !== undefined) {
        if (!String(category).trim()) {
            return res.status(400).json({ success: false, message: "Invalid category" });
        }
        fields.push("category = ?");
        params.push(String(category).trim());
    }
    if (date !== undefined) {
        if (!isValidDate(String(date))) {
            return res.status(400).json({ success: false, message: "Invalid date" });
        }
        fields.push("date = ?");
        params.push(new Date(date).toISOString());
    }
    if (notes !== undefined) {
        fields.push("notes = ?");
        params.push(notes ? String(notes) : null);
    }
    if (!fields.length) {
        return res.status(400).json({ success: false, message: "No fields to update" });
    }
    params.push(req.params.id);
    db_1.default.prepare(`UPDATE transactions SET ${fields.join(", ")} WHERE id = ? AND is_deleted = 0`).run(...params);
    const updated = db_1.default.prepare("SELECT * FROM transactions WHERE id = ?").get(req.params.id);
    return res.json({ success: true, data: updated });
});
router.delete("/:id", (0, middleware_1.requireRole)("ADMIN"), (req, res) => {
    db_1.default.prepare("UPDATE transactions SET is_deleted = 1 WHERE id = ?").run(req.params.id);
    return res.json({ success: true, message: "Transaction deleted" });
});
exports.default = router;
