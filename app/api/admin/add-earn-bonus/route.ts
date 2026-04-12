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

    // 🔥 NOW USING EMAIL
    const { email, amount } = await req.json();

    if (!email || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      );
    }

    // 🔥 NORMALIZE EMAIL (IMPORTANT)
    const cleanEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: cleanEmail,
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const earning = await Earning.findOne({
      userId: user._id,
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

    earning.lastNotifiedAmount =
      (earning.lastNotifiedAmount || 0) + amount;

    await earning.save();

    // 🔔 NOTIFICATION
    await Notification.create({
      userId: user._id.toString(),
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