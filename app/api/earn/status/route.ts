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

      const profitReference =
  "PRF" +
  Date.now() +
  Math.floor(Math.random() * 10000);

await Notification.create({
  userId: earning.userId,
  type: "system",
  message:
    `Daily Trading Profit Credited\n\n` +
    `A scheduled trading profit has been successfully credited to your investment account under your active trading plan.\n\n` +
    `Profit Amount: $${profit.toLocaleString()}\n` +
    `Reference ID: ${profitReference}\n` +
    `Status: Successfully Credited\n\n` +
    `The credited amount has been added to your available balance and is now reflected in your account performance statistics. Thank you for choosing CoinlyBitora.`,
  meta: {
    amount: profit,
    referenceId: profitReference,
    status: "credited",
  },
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

    const completionReference =
  "INV" +
  Date.now() +
  Math.floor(Math.random() * 10000);

await Notification.create({
  userId: earning.userId,
  type: "system",
  message:
    `Investment Plan Completed\n\n` +
    `Congratulations! Your investment cycle has been completed successfully and all scheduled trading activities have now concluded.\n\n` +
    `Reference ID: ${completionReference}\n` +
    `Investment Value: $${earning.depositAmount?.toLocaleString() || 0}\n` +
    `Total Target Return: $${earning.targetAmount?.toLocaleString() || 0}\n` +
    `Status: Completed\n\n` +
    `Your investment earnings are now fully unlocked and available for withdrawal or reinvestment through your CoinlyBitora dashboard.`,
  meta: {
    amount: earning.targetAmount,
    referenceId: completionReference,
    status: "completed",
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