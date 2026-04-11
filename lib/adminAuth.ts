import { verifyToken } from "@/lib/auth";

export function requireAdmin(req: Request) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { error: "Unauthorized", status: 401 };
  }

  const token = authHeader.split(" ")[1];

  let decoded: { userId?: string; role?: string } | null = null;

  try {
    decoded = verifyToken(token);
  } catch {
    return { error: "Invalid token", status: 401 };
  }

  if (!decoded?.userId) {
    return { error: "Unauthorized", status: 401 };
  }

  // 🔥 CRITICAL CHECK
  if (decoded.role !== "admin") {
    return { error: "Forbidden", status: 403 };
  }

  return { userId: decoded.userId };
}