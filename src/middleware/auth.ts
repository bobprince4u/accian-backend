import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

interface UserPayload {
  id: string;
  email: string;
  role: string;
}

// Extend Express Request interface
declare module "express-serve-static-core" {
  interface Request {
    user?: UserPayload;
  }
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access token required",
    });
  }

  try {
    const secret = process.env.JWT_SECRET as string;
    const decoded = jwt.verify(token, secret) as JwtPayload;

    // Map to UserPayload type
    req.user = {
      id: decoded.id as string,
      email: decoded.email as string,
      role: decoded.role as string,
    };

    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

export const generateToken = (user: UserPayload): string => {
  const secret = process.env.JWT_SECRET as string;

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    secret,
    { expiresIn: "24h" }
  );
};
