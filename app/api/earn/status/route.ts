import { connectDB } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";
import Earning from "@/models/Earning";
import Notification from "@/models/Notification";
import User from "@/models/User";

export async function GET(req: Request) {
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

    const earning = await Earning.findOne({
      userId: decoded.userId,
      status: "active",
    });

    if (!earning) {
      return NextResponse.json({ earning: null });
    }

    const now = Date.now();
    const start = new Date(earning.startTime).getTime();

    const ONE_DAY = 24 * 60 * 60 * 1000;

    const totalDays = earning.durationDays || 7;
    const durationMs = totalDays * ONE_DAY;

    const elapsed = now - start;

    // 🔥 CURRENT DAY (SAFE)
    const dayIndex = Math.floor(elapsed / ONE_DAY);
    earning.currentDay = Math.min(dayIndex, totalDays - 1);

    // =============================
    // ✅ FIXED PROFIT DISTRIBUTION
    // =============================

    let credited = false;

    for (
      let i = earning.lastCreditedDay + 1;
      i <= earning.currentDay;
      i++
    ) {
      // 🔥 STRICT: only credit if FULL 24h passed
      const requiredTime = (i + 1) * ONE_DAY;

      if (elapsed < requiredTime) break;

      const profit = earning.dailyProfits[i] || 0;

      earning.earnedSoFar += profit;
      earning.lastCreditedDay = i;
      earning.lastCreditTime = new Date();

      const user = await User.findById(earning.userId);

      if (user) {
        user.balance += profit;
        await user.save();
      }

      await Notification.create({
        userId: earning.userId,
        type: "system",
        message: `Daily trading profit of $${profit} added`,
        meta: { amount: profit },
      });

      credited = true;
    }

    // =============================
    // ✅ COMPLETE ONLY AFTER FULL TIME
    // =============================

    if (elapsed >= durationMs && earning.status !== "completed") {
      earning.status = "completed";

      const user = await User.findById(earning.userId);

      if (user) {
        user.lockedBalance = 0;
        await user.save();
      }

      await Notification.create({
        userId: earning.userId,
        type: "system",
        message:
          "Investment completed. Your earnings are now available for withdrawal.",
        meta: {
          amount: earning.targetAmount,
        },
      });
    }

    await earning.save();

    return NextResponse.json({
      earning: {
        ...earning.toObject(),
        depositAmount: earning.depositAmount,
        earnedSoFar: earning.earnedSoFar,

        // 🔥 TIME-BASED PROGRESS (ACCURATE)
        progress: Math.min((elapsed / durationMs) * 100, 100),
      },
    });

  } catch (err) {
    console.error("EARNING STATUS ERROR:", err);

    return NextResponse.json(
      { error: "Failed" },
      { status: 500 }
    );
  }
}