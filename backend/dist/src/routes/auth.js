"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const node_crypto_1 = require("node:crypto");
const db_1 = __importDefault(require("../db"));
const auth_1 = require("../auth");
const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);
const toUserResponse = (user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    created_at: user.created_at,
});
const router = (0, express_1.Router)();
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
    const existing = db_1.default
        .prepare("SELECT id FROM users WHERE email = ?")
        .get(String(email).toLowerCase().trim());
    if (existing) {
        return res.status(400).json({ success: false, message: "Email already taken" });
    }
    const id = (0, node_crypto_1.randomUUID)();
    const createdAt = new Date().toISOString();
    const passwordHash = await (0, auth_1.hashPassword)(password);
    db_1.default.prepare(`INSERT INTO users (id, name, email, password_hash, role, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?)`).run(id, name, String(email).toLowerCase().trim(), passwordHash, roleValue, createdAt);
    const user = db_1.default.prepare("SELECT * FROM users WHERE id = ?").get(id);
    const payload = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
    };
    return res.json({ success: true, token: (0, auth_1.signToken)(payload), user: toUserResponse(user) });
});
router.post("/login", async (req, res) => {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Missing email or password" });
    }
    const user = db_1.default
        .prepare("SELECT * FROM users WHERE email = ?")
        .get(String(email).toLowerCase().trim());
    if (!user || user.status !== "ACTIVE") {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    const valid = await (0, auth_1.comparePassword)(password, user.password_hash);
    if (!valid) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    const payload = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
    };
    return res.json({ success: true, token: (0, auth_1.signToken)(payload), user: toUserResponse(user) });
});
exports.default = router;
