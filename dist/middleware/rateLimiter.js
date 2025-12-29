"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminSignup = exports.adminLogin = exports.contactForm = exports.general = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
//General API Rate Limiter
exports.general = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
        success: false,
        message: "Too many requests from this IP, please try again after 15 minutes.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// Contact Form Specific Rate Limiter
exports.contactForm = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 1 hour
    max: 5,
    message: {
        success: false,
        message: "Too many contact form submissions from this IP, please try again after an hour.",
    },
    skipSuccessfulRequests: false,
});
// Admin Panel Specific Rate Limiter
exports.adminLogin = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: {
        success: false,
        message: "Too many admin panel requests from this IP, please try again after 15 minutes.",
    },
    skipSuccessfulRequests: true,
});
exports.adminSignup = (0, express_rate_limit_1.default)({
    windowMs: 30 * 30 * 1000, // 1 hour
    max: 3,
    message: {
        success: false,
        message: "Too many admin signup attempts from this IP, please try again after an hour.",
    },
    skipSuccessfulRequests: true,
});
