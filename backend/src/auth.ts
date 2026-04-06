import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export type AuthPayload = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "ANALYST" | "VIEWER";
  status: "ACTIVE" | "INACTIVE";
};

const getSecret = () => process.env.JWT_SECRET || "dev-secret";

export const hashPassword = async (plain: string) => bcrypt.hash(plain, 10);

export const comparePassword = async (plain: string, hash: string) =>
  bcrypt.compare(plain, hash);

export const signToken = (payload: AuthPayload) =>
  jwt.sign(payload, getSecret(), { expiresIn: "7d" });

export const verifyToken = (token: string): AuthPayload | null => {
  try {
    return jwt.verify(token, getSecret()) as AuthPayload;
  } catch {
    return null;
  }
};
