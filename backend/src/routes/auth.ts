import { Router } from "express";
import { randomUUID } from "node:crypto";
import db from "../db";
import { hashPassword, comparePassword, signToken, AuthPayload } from "../auth";

type UserRow = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: "ADMIN" | "ANALYST" | "VIEWER";
  status: "ACTIVE" | "INACTIVE";
  created_at: string;
};

const isValidEmail = (email: string) => /\S+@\S+\.\S+/.test(email);
const toUserResponse = (user: UserRow) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  created_at: user.created_at,
});

const router = Router();

router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body ?? {};
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ success: false, message: "Invalid email format" });
  }
  if (String(password).length < 6) {
    return res
      .status(400)
      .json({ success: false, message: "Password must be at least 6 characters" });
  }
  const roleValue = ["ADMIN", "ANALYST", "VIEWER"].includes(role) ? role : "VIEWER";
  const existing = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(String(email).toLowerCase().trim());
  if (existing) {
    return res.status(400).json({ success: false, message: "Email already taken" });
  }

  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const passwordHash = await hashPassword(password);
  db.prepare(
    `INSERT INTO users (id, name, email, password_hash, role, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?)`,
  ).run(id, name, String(email).toLowerCase().trim(), passwordHash, roleValue, createdAt);

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow;
  const payload: AuthPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
  };
  return res.json({ success: true, token: signToken(payload), user: toUserResponse(user) });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Missing email or password" });
  }
  const user = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(String(email).toLowerCase().trim()) as UserRow | undefined;

  if (!user || user.status !== "ACTIVE") {
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }
  const valid = await comparePassword(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }
  const payload: AuthPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
  };
  return res.json({ success: true, token: signToken(payload), user: toUserResponse(user) });
});

export default router;
