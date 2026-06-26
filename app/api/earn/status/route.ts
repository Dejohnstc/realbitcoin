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
    
    // ✅ If no token, return null (not error)
    if (!token) {
      return NextResponse.json({ earning: null });
    }

    const decoded = verifyToken(token || "");

    if (!decoded?.userId) {
      return NextResponse.json({ earning: null });
    }

    const earning = await Earning.findOne({
      userId: decoded.userId,
      status: "active",
    });

    // ✅ If no earning, return null
    if (!earning) {
      return NextResponse.json({ earning: null });
    }

    // ✅ SAFETY CHECK: Ensure dailyProfits exists
    if (!earning.dailyProfits || !Array.isArray(earning.dailyProfits) || earning.dailyProfits.length === 0) {
      console.warn("⚠️ dailyProfits missing, initializing with default values");
      const totalDays = earning.durationDays || 7;
      const dailyProfit = (earning.targetAmount || 0) / totalDays;
      earning.dailyProfits = Array(totalDays).fill(dailyProfit);
      await earning.save();
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

    // ✅ Ensure lastCreditedDay exists
    if (typeof earning.lastCreditedDay !== 'number') {
      earning.lastCreditedDay = -1;
    }

    let credited = false;

    // Process credits - with safety checks
    for (let i = earning.lastCreditedDay + 1; i <= earning.currentDay; i++) {
      const requiredTime = (i + 1) * ONE_DAY;
      if (elapsed < requiredTime) break;

      // ✅ SAFETY: Check if dailyProfits[i] exists
      const profit = (i < earning.dailyProfits.length && earning.dailyProfits[i] !== undefined) 
        ? earning.dailyProfits[i] 
        : 0;

      if (profit <= 0) {
        earning.lastCreditedDay = i;
        continue;
      }

      earning.earnedSoFar += profit;
      earning.lastCreditedDay = i;
      earning.lastCreditTime = new Date();

      // Update user balance
      try {
        const user = await User.findById(earning.userId);
        if (user) {
          user.balance = (user.balance || 0) + profit;
          await user.save();
        }
      } catch (userError) {
        console.error("Error updating user balance:", userError);
      }

      // Create notification
      try {
        const profitReference = "PRF" + Date.now() + Math.floor(Math.random() * 10000);
        await Notification.create({
          userId: earning.userId,
          type: "system",
          message: `Daily Trading Profit Credited: $${profit.toLocaleString()}`,
          meta: {
            amount: profit,
            referenceId: profitReference,
            status: "credited",
          },
        });
      } catch (notifError) {
        console.error("Error creating notification:", notifError);
      }

      credited = true;
    }

    // Check completion
    if (elapsed >= durationMs && earning.status !== "completed") {
      earning.status = "completed";

      try {
        const user = await User.findById(earning.userId);
        if (user) {
          user.lockedBalance = 0;
          await user.save();
        }
      } catch (userError) {
        console.error("Error updating user locked balance:", userError);
      }

      try {
        const completionReference = "INV" + Date.now() + Math.floor(Math.random() * 10000);
        await Notification.create({
          userId: earning.userId,
          type: "system",
          message: `Investment Plan Completed! Total Return: $${earning.targetAmount?.toLocaleString() || 0}`,
          meta: {
            amount: earning.targetAmount,
            referenceId: completionReference,
            status: "completed",
          },
        });
      } catch (notifError) {
        console.error("Error creating completion notification:", notifError);
      }
    }

    await earning.save();

    // Calculate progress
    const progress = Math.min((elapsed / durationMs) * 100, 100);

    // ✅ Always return a valid response
    return NextResponse.json({
      earning: {
        _id: earning._id,
        depositAmount: earning.depositAmount,
        targetAmount: earning.targetAmount,
        earnedSoFar: earning.earnedSoFar,
        status: earning.status,
        startTime: earning.startTime,
        endTime: earning.endTime,
        currentDay: earning.currentDay,
        durationDays: earning.durationDays,
        progress: progress,
      },
    });

  } catch (err) {
    console.error("EARNING STATUS ERROR:", err);
    
    // ✅ Always return a valid response, never a 500
    return NextResponse.json({ 
      earning: null,
      error: err instanceof Error ? err.message : "Unknown error"
    });
  }
}