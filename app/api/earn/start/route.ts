import { connectDB } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";
import User from "@/models/User";
import Earning from "@/models/Earning";

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

    const user = await User.findById(decoded.userId);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // ❌ prevent multiple active sessions
    const existing = await Earning.findOne({
      userId: user._id,
      status: "active",
    });

    if (existing) {
      return NextResponse.json(
        { error: "Earning already active" },
        { status: 400 }
      );
    }

    // 🔒 CHECK BALANCE
    const depositAmount = user.balance;

    if (depositAmount <= 0) {
      return NextResponse.json(
        { error: "No balance available" },
        { status: 400 }
      );
    }

    const targetAmount = depositAmount * 10;

    const startTime = new Date();
    const endTime = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    );

    // ✅ CREATE EARNING
    await Earning.create({
      userId: user._id,
      depositAmount,
      targetAmount,
      startTime,
      endTime,
    });

    // 🔒 LOCK FUNDS (CRITICAL FIX)
    user.lockedBalance = depositAmount;
    user.balance = 0;

    await user.save();

    return NextResponse.json({
      message: "Earning started successfully",
    });

  } catch (err) {
    console.error("START EARNING ERROR:", err);

    return NextResponse.json(
      { error: "Failed" },
      { status: 500 }
    );
  }
}