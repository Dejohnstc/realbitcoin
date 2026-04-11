import jwt from "jsonwebtoken";

interface TokenPayload {
  userId: string;
  role?: string;
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error("❌ JWT_SECRET missing");
      return null;
    }

    const decoded = jwt.verify(token, secret) as TokenPayload;

    return decoded;
  } catch (error) {
    console.error("❌ JWT verify failed:", error);
    return null;
  }
}