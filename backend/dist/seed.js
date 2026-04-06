"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const node_crypto_1 = require("node:crypto");
const db_1 = __importDefault(require("./src/db"));
const auth_1 = require("./src/auth");
const users = [
    { name: "Admin User", email: "admin@finance.dev", password: "Admin@123", role: "ADMIN" },
    {
        name: "Analyst User",
        email: "analyst@finance.dev",
        password: "Analyst@123",
        role: "ANALYST",
    },
    { name: "Viewer User", email: "viewer@finance.dev", password: "Viewer@123", role: "VIEWER" },
];
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
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
async function seedUsers() {
    for (const user of users) {
        const existing = db_1.default.prepare("SELECT id FROM users WHERE email = ?").get(user.email);
        if (existing)
            continue;
        const id = (0, node_crypto_1.randomUUID)();
        const createdAt = new Date().toISOString();
        const hash = await (0, auth_1.hashPassword)(user.password);
        db_1.default.prepare(`INSERT INTO users (id, name, email, password_hash, role, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?)`).run(id, user.name, user.email, hash, user.role, createdAt);
    }
}
function seedTransactions() {
    const count = db_1.default.prepare("SELECT COUNT(*) as count FROM transactions").get()
        .count;
    if (count >= 25)
        return;
    const admin = db_1.default.prepare("SELECT id FROM users WHERE email = ?").get("admin@finance.dev");
    if (!admin)
        return;
    for (let i = 0; i < 25; i += 1) {
        const now = new Date();
        const monthsBack = randomInt(0, 5);
        const day = randomInt(1, 28);
        const date = new Date(now.getFullYear(), now.getMonth() - monthsBack, day).toISOString();
        const rupees = randomInt(500, 50000);
        const type = Math.random() > 0.45 ? "EXPENSE" : "INCOME";
        const category = categories[randomInt(0, categories.length - 1)];
        db_1.default.prepare(`INSERT INTO transactions
       (id, amount, type, category, date, notes, created_by, is_deleted, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`).run((0, node_crypto_1.randomUUID)(), rupees * 100, type, category, date, `${type} entry for ${category}`, admin.id, new Date().toISOString());
    }
}
async function main() {
    await seedUsers();
    seedTransactions();
    console.log("Seeding complete.");
}
main();
