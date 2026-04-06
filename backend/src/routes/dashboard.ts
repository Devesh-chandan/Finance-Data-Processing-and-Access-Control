import { Router } from "express";
import db from "../db";
import { requireAuth, requireRole } from "../middleware";

const router = Router();
router.use(requireAuth, requireRole("ANALYST", "ADMIN"));

router.get("/summary", (req, res) => {
  const where = ["is_deleted = 0"];
  const params: unknown[] = [];
  if (req.query.startDate) {
    where.push("date >= ?");
    params.push(String(req.query.startDate));
  }
  if (req.query.endDate) {
    where.push("date <= ?");
    params.push(String(req.query.endDate));
  }
  const whereSql = `WHERE ${where.join(" AND ")}`;
  const row = db
    .prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount END), 0) as totalIncome,
         COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount END), 0) as totalExpenses,
         COUNT(*) as transactionCount
       FROM transactions ${whereSql}`,
    )
    .get(...params) as { totalIncome: number; totalExpenses: number; transactionCount: number };
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
  const data = db
    .prepare(
      `SELECT
         category,
         COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount END), 0) as totalIncome,
         COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount END), 0) as totalExpenses
       FROM transactions
       WHERE is_deleted = 0
       GROUP BY category
       ORDER BY category ASC`,
    )
    .all();
  return res.json({ success: true, data });
});

router.get("/trends", (req, res) => {
  const groupBy = req.query.groupBy === "weekly" ? "weekly" : "monthly";
  const periodExpr =
    groupBy === "weekly"
      ? "strftime('%Y-W%W', date)"
      : "strftime('%Y-%m', date)";
  const data = db
    .prepare(
      `SELECT
         ${periodExpr} as period,
         COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount END), 0) as totalIncome,
         COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount END), 0) as totalExpenses
       FROM transactions
       WHERE is_deleted = 0
       GROUP BY period
       ORDER BY period ASC`,
    )
    .all();
  return res.json({ success: true, data });
});

router.get("/recent", (_req, res) => {
  const data = db
    .prepare(
      `SELECT t.*, u.name as created_by_name
       FROM transactions t
       LEFT JOIN users u ON t.created_by = u.id
       WHERE t.is_deleted = 0
       ORDER BY t.date DESC
       LIMIT 10`,
    )
    .all();
  return res.json({ success: true, data });
});

export default router;
