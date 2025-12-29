"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = exports.requireAdmin = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const token = authHeader?.split(" ")[1]; // Bearer <token>
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        if (!decoded.id || !decoded.email || decoded.role !== "admin") {
            return res.status(403).json({ message: "Invalid token payload" });
        }
        req.user = decoded;
        next();
    }
    catch {
        return res.status(403).json({ message: "Invalid token" });
    }
};
exports.authenticateToken = authenticateToken;
const requireAdmin = (req, res, next) => {
    if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "Admin only" });
    }
    next();
};
exports.requireAdmin = requireAdmin;
const generateToken = (user) => {
    return jsonwebtoken_1.default.sign(user, process.env.JWT_SECRET, { expiresIn: "10h" });
};
exports.generateToken = generateToken;
