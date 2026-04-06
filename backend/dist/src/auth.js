"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.signToken = exports.comparePassword = exports.hashPassword = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const getSecret = () => process.env.JWT_SECRET || "dev-secret";
const hashPassword = async (plain) => bcryptjs_1.default.hash(plain, 10);
exports.hashPassword = hashPassword;
const comparePassword = async (plain, hash) => bcryptjs_1.default.compare(plain, hash);
exports.comparePassword = comparePassword;
const signToken = (payload) => jsonwebtoken_1.default.sign(payload, getSecret(), { expiresIn: "7d" });
exports.signToken = signToken;
const verifyToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, getSecret());
    }
    catch {
        return null;
    }
};
exports.verifyToken = verifyToken;
