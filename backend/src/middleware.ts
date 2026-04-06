import { NextFunction, Request, Response } from "express";
import { AuthPayload, verifyToken } from "./auth";

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;
  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
  req.user = decoded;
  next();
};

export const requireRole =
  (...roles: Array<AuthPayload["role"]>) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    next();
  };

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const status =
    typeof err === "object" && err && "status" in err && typeof err.status === "number"
      ? err.status
      : 500;
  const message =
    typeof err === "object" && err && "message" in err && typeof err.message === "string"
      ? err.message
      : "Internal server error";
  res.status(status).json({ success: false, message });
};
