"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
require("./db");
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const transactions_1 = __importDefault(require("./routes/transactions"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const middleware_1 = require("./middleware");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get("/health", (_req, res) => res.json({ success: true, message: "OK" }));
app.use("/api/auth", auth_1.default);
app.use("/api/users", users_1.default);
app.use("/api/transactions", transactions_1.default);
app.use("/api/dashboard", dashboard_1.default);
app.use(middleware_1.errorHandler);
const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
