import { connectDB } from "@/lib/mongodb";
import Withdraw from "@/models/Withdraw";
import User from "@/models/User"; // 🔥 ADD THIS
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

    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    // 🔥 CHECK ROLE FROM DATABASE (NOT TOKEN)
    const user = await User.findById(decoded.userId);

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const withdrawals = await Withdraw.find().sort({ createdAt: -1 });

    return NextResponse.json({ withdrawals });
  } catch {
    return NextResponse.json(
      { error: "Failed" },
      { status: 500 }
    );
  }
}