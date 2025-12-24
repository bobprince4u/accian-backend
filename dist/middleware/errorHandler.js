"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
// Define a runtime AppError class if you want to throw custom errors
class AppError extends Error {
    constructor(message, statusCode = 500, code) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        Object.setPrototypeOf(this, AppError.prototype); // fix instanceof
    }
}
exports.AppError = AppError;
// Express error handler middleware
const errorHandler = (err, // typed error
req, res, next) => {
    console.error("Error:", err.message);
    console.error("Stack:", err.stack);
    // Default error
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";
    // Handle specific error types
    if (err.name === "ValidationError") {
        statusCode = 400;
        message = "Validation error.";
    }
    if (err.name === "JsonWebTokenError") {
        statusCode = 401;
        message = "Invalid token.";
    }
    if (err.name === "TokenExpiredError") {
        statusCode = 401;
        message = "Token expired.";
    }
    // PostgreSQL errors
    if (err.code === "23505") {
        statusCode = 409;
        message = "Resource already exists.";
    }
    if (err.code === "23503") {
        statusCode = 400;
        message = "Invalid reference to another resource.";
    }
    if (err.code === "22P02") {
        statusCode = 400;
        message = "Invalid data format.";
    }
    // Send the error response
    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === "development" && {
            error: err.message,
            stack: err.stack,
        }),
    });
};
exports.default = errorHandler;
