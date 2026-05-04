import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await connectDB();

    const token = req.headers.get("authorization")?.split(" ")[1];
    const decoded = verifyToken(token || "");

    if (!decoded?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const admin = await User.findById(decoded.userId);
    if (!admin || admin.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const { userId, multiplier, durationDays } = await req.json();

    // ✅ FIXED VALIDATION
    if (
      !userId ||
      typeof multiplier !== "number" ||
      typeof durationDays !== "number"
    ) {
      return NextResponse.json(
        { error: "Missing or invalid data" },
        { status: 400 }
      );
    }

    if (multiplier <= 0 || durationDays <= 0) {
      return NextResponse.json(
        { error: "Values must be greater than 0" },
        { status: 400 }
      );
    }

    await User.findByIdAndUpdate(userId, {
      multiplier,
      durationDays,
    });

    return NextResponse.json({ success: true });

  } catch (err) {
    return NextResponse.json(
      { error: "Failed to update config" },
      { status: 500 }
    );
  }
}