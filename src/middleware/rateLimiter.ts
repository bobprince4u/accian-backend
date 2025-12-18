import rateLimit, { RateLimitRequestHandler } from "express-rate-limit";
import { skip } from "node:test";

//General API Rate Limiter
export const general: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message:
      "Too many requests from this IP, please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Contact Form Specific Rate Limiter
export const contactForm: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    success: false,
    message:
      "Too many contact form submissions from this IP, please try again after an hour.",
  },
  skipSuccessfulRequests: false,
});

// Admin Panel Specific Rate Limiter
export const adminLogin: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    message:
      "Too many admin panel requests from this IP, please try again after 15 minutes.",
  },
  skipSuccessfulRequests: true,
});

export const adminSignup: RateLimitRequestHandler = rateLimit({
  windowMs: 30 * 30 * 1000, // 1 hour
  max: 3,
  message: {
    success: false,
    message:
      "Too many admin signup attempts from this IP, please try again after an hour.",
  },
  skipSuccessfulRequests: true,
});
