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
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader?.split(" ")[1]; // Bearer <token>

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as Partial<UserPayload>;

    if (!decoded.id || !decoded.email || decoded.role !== "admin") {
      return res.status(403).json({ message: "Invalid token payload" });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
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

export const generateToken = (user: UserPayload): string => {
  return jwt.sign(user, process.env.JWT_SECRET as string, { expiresIn: "10h" });
};
