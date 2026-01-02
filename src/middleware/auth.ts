import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

// JWT Token Payload (what goes IN the token - minimal)
interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

// User Payload (what the app uses - includes all user info)
export interface UserPayload {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

// Extend Express Request interface
declare module "express-serve-static-core" {
  interface Request {
    user?: TokenPayload;
  }
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader?.split(" ")[1]; // Bearer <token>

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as Partial<TokenPayload>;

    if (!decoded.id || !decoded.email || decoded.role !== "admin") {
      return res.status(403).json({ message: "Invalid token payload" });
    }

    req.user = decoded as TokenPayload;
    next();
  } catch {
    return res.status(403).json({ message: "Invalid token" });
  }
};

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }
  next();
};

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: "10h",
  });
};
