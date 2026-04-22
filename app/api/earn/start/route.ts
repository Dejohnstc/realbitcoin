import { connectDB } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";
import User from "@/models/User";
import Earning from "@/models/Earning";

// 🔥 GENERATE RANDOM PROFITS BASED ON DAYS
function generateDailyProfits(target: number, days: number): number[] {
  const profits: number[] = [];
  let remaining = target;

  for (let i = 0; i < days - 1; i++) {
    const min = remaining * 0.05;
    const max = remaining * 0.25;

    let value = Math.random() * (max - min) + min;
    value = Math.floor(value);

    profits.push(value);
    remaining -= value;
  }

  profits.push(Math.max(0, Math.floor(remaining)));

  return profits;
}

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

    // 🔥 NEW: DYNAMIC CONFIG
    const multiplier = user.multiplier || 10;
    const durationDays = user.durationDays || 7;

    const targetAmount = depositAmount * multiplier;

    const startTime = new Date();
    const endTime = new Date(
      Date.now() + durationDays * 24 * 60 * 60 * 1000
    );

    // 🔥 DYNAMIC DAILY PROFITS
    const dailyProfits = generateDailyProfits(
      targetAmount,
      durationDays
    );

    // ✅ CREATE EARNING
    await Earning.create({
      userId: user._id,
      depositAmount,
      targetAmount,

      dailyProfits,
      currentDay: 0,
      lastCreditedDay: -1,
      lastCreditTime: startTime,

      startTime,
      endTime,
      durationDays, // 🔥 store for reference
      multiplier,   // 🔥 store for reference

      status: "active",
    });

    // 🔒 LOCK FUNDS
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