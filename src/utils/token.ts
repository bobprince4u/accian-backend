import jwt from "jsonwebtoken";

// Updated to include all required fields
export const generateAccessToken = (payload: {
  id: string;
  email: string;
  role: string;
}) => {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET not defined");
  return jwt.sign(payload, secret, { expiresIn: "15m" });
};

export const generateRefreshToken = (payload: { id: string }) => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error("JWT_REFRESH_SECRET not defined");
  return jwt.sign(payload, secret, { expiresIn: "7d" });
};
