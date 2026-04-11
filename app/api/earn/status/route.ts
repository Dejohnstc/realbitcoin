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
    const end = new Date(earning.endTime).getTime();

    const progress = Math.min((now - start) / (end - start), 1);

    const earned = earning.targetAmount * progress;

    // 🔥 PROFIT NOTIFICATION
    const lastNotified = earning.lastNotifiedAmount || 0;

    if (earned - lastNotified >= 50) {
      await Notification.create({
        userId: earning.userId.toString(),
        type: "system",
        message: "New profit added to your earnings",
        meta: {
          amount: Math.floor(earned),
        },
      });

      earning.lastNotifiedAmount = earned;
    }

    // 🔓 COMPLETE + UNLOCK
    if (progress >= 1 && earning.status !== "completed") {
      earning.status = "completed";
      earning.earnedSoFar = earning.targetAmount;

      // 🔥 GET USER
      const user = await User.findById(earning.userId);

      if (user) {
        // 🔓 UNLOCK FUNDS + ADD PROFIT
        user.balance += earning.targetAmount;
        user.lockedBalance = 0;

        await user.save();
      }

      // 🔔 NOTIFICATION
      await Notification.create({
        userId: earning.userId.toString(),
        type: "system",
        message:
          "Earnings completed. Your balance has been unlocked.",

        meta: {
          amount: earning.targetAmount,
        },
      });
    }

    // ✅ SAVE EARNING
    await earning.save();

    return NextResponse.json({
      earning: {
        ...earning.toObject(),
        earnedSoFar: earned,
        progress: progress * 100,
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