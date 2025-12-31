"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRefreshToken = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const generateAccessToken = (payload) => {
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret)
        throw new Error("JWT_ACCESS_SECRET not defined");
    return jsonwebtoken_1.default.sign(payload, secret, { expiresIn: "15m" });
};
exports.generateAccessToken = generateAccessToken;
const generateRefreshToken = (payload) => {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret)
        throw new Error("JWT_REFRESH_SECRET not defined");
    return jsonwebtoken_1.default.sign(payload, secret, { expiresIn: "7d" });
};
exports.generateRefreshToken = generateRefreshToken;
