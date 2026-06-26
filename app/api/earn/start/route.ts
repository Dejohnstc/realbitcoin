import { connectDB } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";
import User from "@/models/User";
import Earning from "@/models/Earning";

// 🔥 GENERATE STABLE DAILY PROFITS
function generateDailyProfits(target: number, days: number): number[] {
  if (days <= 0) return [];

  const profits: number[] = [];
  let remaining = target;

  for (let i = 0; i < days; i++) {
    if (i === days - 1) {
      // last day gets remaining (ensures exact total)
      profits.push(Math.max(0, Math.round(remaining)));
    } else {
      const avg = remaining / (days - i);
      const variance = avg * 0.3;

      let value =
        avg + (Math.random() * variance * 2 - variance);

      value = Math.max(0, Math.round(value));

      profits.push(value);
      remaining -= value;
    }
  }

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

    if (
      typeof depositAmount !== "number" ||
      depositAmount <= 0
    ) {
      return NextResponse.json(
        { error: "No balance available" },
        { status: 400 }
      );
    }

    // 🔥 SAFE CONFIG
    const multiplier =
      typeof user.multiplier === "number" && user.multiplier > 0
        ? user.multiplier
        : 10;

    const durationDays =
      typeof user.durationDays === "number" &&
      user.durationDays > 0
        ? user.durationDays
        : 7;

    const targetAmount = Math.round(depositAmount * multiplier);

    const startTime = new Date();

    const ONE_DAY = 24 * 60 * 60 * 1000;
    const endTime = new Date(startTime.getTime() + durationDays * ONE_DAY);

    // 🔥 GENERATE PROFITS
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

      // 🔥 IMPORTANT: set to startTime (not now later)
      lastCreditTime: startTime,

      startTime,
      endTime,
      durationDays,
      multiplier,

      earnedSoFar: 0,
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