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
    const lastCredit = earning.lastCreditTime
      ? new Date(earning.lastCreditTime).getTime()
      : 0;

    const ONE_DAY = 24 * 60 * 60 * 1000;

    // 🔥 DETERMINE CURRENT DAY (0 → 6)
    const dayIndex = Math.floor(
      (now - new Date(earning.startTime).getTime()) / ONE_DAY
    );

    earning.currentDay = Math.min(dayIndex, 6);

    // 🔥 CREDIT ONLY ONCE PER DAY
    if (
      earning.currentDay > earning.lastCreditedDay &&
      now - lastCredit >= ONE_DAY
    ) {
      const profit = earning.dailyProfits[earning.currentDay] || 0;

      // 🔥 UPDATE EARNINGS
      earning.earnedSoFar += profit;
      earning.lastCreditedDay = earning.currentDay;
      earning.lastCreditTime = new Date();

      // 🔥 UPDATE USER BALANCE
      const user = await User.findById(earning.userId);

      if (user) {
        user.balance += profit;
        await user.save();
      }

      // 🔔 DAILY PROFIT NOTIFICATION
      await Notification.create({
        userId: earning.userId.toString(),
        type: "system",
        message: "Daily trading profit added",
        meta: {
          amount: profit,
        },
      });
    }

    // 🔓 COMPLETE AFTER DAY 6
    if (earning.currentDay >= 6 && earning.status !== "completed") {
      earning.status = "completed";

      const user = await User.findById(earning.userId);

      if (user) {
        user.lockedBalance = 0;
        await user.save();
      }

      await Notification.create({
        userId: earning.userId.toString(),
        type: "system",
        message:
          "Investment completed. Your full earnings are now available.",
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

        // 🔥 PROGRESS BASED ON DAYS
        progress: ((earning.currentDay + 1) / 7) * 100,
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