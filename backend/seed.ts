import "dotenv/config";
import { randomUUID } from "node:crypto";
import db from "./src/db";
import { hashPassword } from "./src/auth";

const users = [
  { name: "Admin User", email: "admin@finance.dev", password: "Admin@123", role: "ADMIN" },
  {
    name: "Analyst User",
    email: "analyst@finance.dev",
    password: "Analyst@123",
    role: "ANALYST",
  },
  { name: "Viewer User", email: "viewer@finance.dev", password: "Viewer@123", role: "VIEWER" },
] as const;

const categories = [
  "Salary",
  "Freelance",
  "Rent",
  "Food",
  "Utilities",
  "Transport",
  "Healthcare",
  "Entertainment",
];

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

async function seedUsers() {
  for (const user of users) {
    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(user.email);
    if (existing) continue;
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    const hash = await hashPassword(user.password);
    db.prepare(
      `INSERT INTO users (id, name, email, password_hash, role, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?)`,
    ).run(id, user.name, user.email, hash, user.role, createdAt);
  }
}

function seedTransactions() {
  const count = (db.prepare("SELECT COUNT(*) as count FROM transactions").get() as { count: number })
    .count;
  if (count >= 25) return;
  const admin = db.prepare("SELECT id FROM users WHERE email = ?").get("admin@finance.dev") as
    | { id: string }
    | undefined;
  if (!admin) return;

  for (let i = 0; i < 25; i += 1) {
    const now = new Date();
    const monthsBack = randomInt(0, 5);
    const day = randomInt(1, 28);
    const date = new Date(now.getFullYear(), now.getMonth() - monthsBack, day).toISOString();
    const rupees = randomInt(500, 50000);
    const type = Math.random() > 0.45 ? "EXPENSE" : "INCOME";
    const category = categories[randomInt(0, categories.length - 1)];
    db.prepare(
      `INSERT INTO transactions
       (id, amount, type, category, date, notes, created_by, is_deleted, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`,
    ).run(
      randomUUID(),
      rupees * 100,
      type,
      category,
      date,
      `${type} entry for ${category}`,
      admin.id,
      new Date().toISOString(),
    );
  }
}

async function main() {
  await seedUsers();
  seedTransactions();
  console.log("Seeding complete.");
}

main();
