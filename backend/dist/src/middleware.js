"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.requireRole = exports.requireAuth = void 0;
const auth_1 = require("./auth");
const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
        ? authHeader.slice(7).trim()
        : null;
    if (!token) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const decoded = (0, auth_1.verifyToken)(token);
    if (!decoded) {
        return res.status(401).json({ success: false, message: "Invalid token" });
    }
    req.user = decoded;
    next();
};
exports.requireAuth = requireAuth;
const requireRole = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ success: false, message: "Forbidden" });
    }
    next();
};
exports.requireRole = requireRole;
const errorHandler = (err, _req, res, _next) => {
    const status = typeof err === "object" && err && "status" in err && typeof err.status === "number"
        ? err.status
        : 500;
    const message = typeof err === "object" && err && "message" in err && typeof err.message === "string"
        ? err.message
        : "Internal server error";
    res.status(status).json({ success: false, message });
};
exports.errorHandler = errorHandler;
