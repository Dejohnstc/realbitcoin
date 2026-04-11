import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";

type DecodedToken = {
  userId?: string;
  role?: string;
};

type ActionBody = {
  userId: string;
  action: "add_balance" | "suspend" | "unsuspend" | "delete";
  amount?: number;
};

/* ================= HELPER ================= */
function getAdmin(req: Request): { error?: string; status?: number; adminId?: string } {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { error: "Unauthorized", status: 401 };
  }

  const token = authHeader.split(" ")[1];

  let decoded: DecodedToken | null = null;

  try {
    decoded = verifyToken(token);
  } catch {
    return { error: "Invalid token", status: 401 };
  }

  if (!decoded?.userId || decoded.role !== "admin") {
    return { error: "Forbidden", status: 403 };
  }

  return { adminId: decoded.userId };
}

/* ================= GET USERS ================= */
export async function GET(req: Request) {
  await connectDB();

  const auth = getAdmin(req);

  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const users = await User.find().select(
    "_id email balance isSuspended createdAt"
  );

  return NextResponse.json({ users });
}

/* ================= UPDATE USER ================= */
export async function POST(req: Request) {
  await connectDB();

  const auth = getAdmin(req);

  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body: ActionBody = await req.json();
  const { userId, action, amount } = body;

  if (!userId || !action) {
    return NextResponse.json(
      { error: "Missing fields" },
      { status: 400 }
    );
  }

  // 🚫 Prevent admin deleting themselves
  if (auth.adminId === userId && action === "delete") {
    return NextResponse.json(
      { error: "Cannot delete yourself" },
      { status: 400 }
    );
  }

  const user = await User.findById(userId);

  if (!user) {
    return NextResponse.json(
      { error: "User not found" },
      { status: 404 }
    );
  }

  // 🔥 ACTIONS
  switch (action) {
    case "add_balance":
      if (!amount || amount <= 0) {
        return NextResponse.json(
          { error: "Invalid amount" },
          { status: 400 }
        );
      }
      user.balance += amount;
      break;

    case "suspend":
      user.isSuspended = true;
      break;

    case "unsuspend":
      user.isSuspended = false;
      break;

    case "delete":
      await User.findByIdAndDelete(userId);
      return NextResponse.json({ success: true });

    default:
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
  }

  await user.save();

  return NextResponse.json({ success: true });
}