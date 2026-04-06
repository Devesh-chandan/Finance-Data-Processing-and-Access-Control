"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
router.use(middleware_1.requireAuth, (0, middleware_1.requireRole)("ANALYST", "ADMIN"));
router.get("/summary", (req, res) => {
    const where = ["is_deleted = 0"];
    const params = [];
    if (req.query.startDate) {
        where.push("date >= ?");
        params.push(String(req.query.startDate));
    }
    if (req.query.endDate) {
        where.push("date <= ?");
        params.push(String(req.query.endDate));
    }
    const whereSql = `WHERE ${where.join(" AND ")}`;
    const row = db_1.default
        .prepare(`SELECT
         COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount END), 0) as totalIncome,
         COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount END), 0) as totalExpenses,
         COUNT(*) as transactionCount
       FROM transactions ${whereSql}`)
        .get(...params);
    return res.json({
        success: true,
        data: {
            totalIncome: row.totalIncome,
            totalExpenses: row.totalExpenses,
            netBalance: row.totalIncome - row.totalExpenses,
            transactionCount: row.transactionCount,
        },
    });
});
router.get("/by-category", (_req, res) => {
    const data = db_1.default
        .prepare(`SELECT
         category,
         COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount END), 0) as totalIncome,
         COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount END), 0) as totalExpenses
       FROM transactions
       WHERE is_deleted = 0
       GROUP BY category
       ORDER BY category ASC`)
        .all();
    return res.json({ success: true, data });
});
router.get("/trends", (req, res) => {
    const groupBy = req.query.groupBy === "weekly" ? "weekly" : "monthly";
    const periodExpr = groupBy === "weekly"
        ? "strftime('%Y-W%W', date)"
        : "strftime('%Y-%m', date)";
    const data = db_1.default
        .prepare(`SELECT
         ${periodExpr} as period,
         COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount END), 0) as totalIncome,
         COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount END), 0) as totalExpenses
       FROM transactions
       WHERE is_deleted = 0
       GROUP BY period
       ORDER BY period ASC`)
        .all();
    return res.json({ success: true, data });
});
router.get("/recent", (_req, res) => {
    const data = db_1.default
        .prepare(`SELECT t.*, u.name as created_by_name
       FROM transactions t
       LEFT JOIN users u ON t.created_by = u.id
       WHERE t.is_deleted = 0
       ORDER BY t.date DESC
       LIMIT 10`)
        .all();
    return res.json({ success: true, data });
});
exports.default = router;
