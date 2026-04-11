import { connectDB } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";
import Earning from "@/models/Earning";
import User from "@/models/User";
import Notification from "@/models/Notification";

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

    const { userId, amount } = await req.json();

    // ✅ VALIDATION (VERY IMPORTANT)
    if (!userId || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      );
    }

    const earning = await Earning.findOne({
      userId,
      status: "active",
    });

    if (!earning) {
      return NextResponse.json(
        { error: "No active earning" },
        { status: 400 }
      );
    }

    // ✅ ADD BONUS
    earning.earnedSoFar += amount;

    // OPTIONAL: update lastNotifiedAmount to avoid duplicate profit alerts
    earning.lastNotifiedAmount =
      (earning.lastNotifiedAmount || 0) + amount;

    await earning.save();

    // 🔥 SYSTEM NOTIFICATION (BONUS)
    await Notification.create({
      userId: userId.toString(),
      type: "system",
      message: "🎁 Trading bonus received",

      meta: {
        amount,
      },
    });

    return NextResponse.json({
      message: "Bonus added successfully",
    });

  } catch (error) {
    console.error("ADMIN BONUS ERROR:", error);

    return NextResponse.json(
      { error: "Failed to add bonus" },
      { status: 500 }
    );
  }
}