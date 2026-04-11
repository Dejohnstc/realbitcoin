import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request): Promise<NextResponse> {
  try {
    await connectDB();

    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    if (!decoded?.userId) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // 🔥 DEBUG (optional)
    console.log("✅ USER FETCH:", {
      balance: user.balance,
      locked: user.lockedBalance,
    });

    return NextResponse.json(
      {
        user: {
          name: user.name || user.email.split("@")[0],
          email: user.email,

          balance: user.balance,

          // 🔥 ADD THIS (CRITICAL FIX)
          lockedBalance: user.lockedBalance || 0,

          role: user.role,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );

  } catch (error) {
    console.error("❌ USER FETCH ERROR:", error);

    return NextResponse.json(
      { error: "Failed" },
      { status: 500 }
    );
  }
}