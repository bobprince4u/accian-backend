import { Request, Response, NextFunction } from "express";

// Define a runtime AppError class if you want to throw custom errors
export class AppError extends Error {
  statusCode: number;
  code?: string;

  constructor(message: string, statusCode = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, AppError.prototype); // fix instanceof
  }
}

// Express error handler middleware
const errorHandler = (
  err: AppError, // typed error
  req: Request,
  res: Response,
  next: NextFunction
) => {
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

export default errorHandler;
