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

    // ✅ CRITICAL SAFETY CHECK: Ensure dailyProfits exists
    if (!earning.dailyProfits || !Array.isArray(earning.dailyProfits)) {
      console.warn("⚠️ dailyProfits is missing or not an array, initializing");
      // Recalculate based on targetAmount and durationDays
      const targetPerDay = (earning.targetAmount || 0) / (earning.durationDays || 7);
      earning.dailyProfits = Array(earning.durationDays || 7).fill(Math.round(targetPerDay));
      await earning.save();
    }

    // ✅ Ensure dailyProfits has the correct length
    const totalDays = earning.durationDays || 7;
    if (earning.dailyProfits.length < totalDays) {
      console.warn(`⚠️ dailyProfits length (${earning.dailyProfits.length}) is less than durationDays (${totalDays}), padding with zeros`);
      while (earning.dailyProfits.length < totalDays) {
        earning.dailyProfits.push(0);
      }
      await earning.save();
    }

    const now = Date.now();
    const start = new Date(earning.startTime).getTime();

    const ONE_DAY = 24 * 60 * 60 * 1000;
    const durationMs = totalDays * ONE_DAY;
    const elapsed = now - start;

    // 🔥 CURRENT DAY (SAFE)
    const dayIndex = Math.floor(elapsed / ONE_DAY);
    earning.currentDay = Math.min(dayIndex, totalDays - 1);

    // ✅ Ensure lastCreditedDay is valid
    if (typeof earning.lastCreditedDay !== 'number') {
      earning.lastCreditedDay = -1;
    }

    let credited = false;

    // Process credits
    for (let i = earning.lastCreditedDay + 1; i <= earning.currentDay; i++) {
      // ✅ CRITICAL: Check if full day has passed
      const requiredTime = (i + 1) * ONE_DAY;
      if (elapsed < requiredTime) break;

      // ✅ SAFETY: Check if dailyProfits[i] exists
      const profit = (i < earning.dailyProfits.length && earning.dailyProfits[i] !== undefined) 
        ? earning.dailyProfits[i] 
        : 0;

      if (profit <= 0) {
        console.log(`⏭️ Skipping day ${i} - profit is ${profit}`);
        earning.lastCreditedDay = i; // Still mark as credited to avoid retry loop
        continue;
      }

      // Credit the profit
      earning.earnedSoFar += profit;
      earning.lastCreditedDay = i;
      earning.lastCreditTime = new Date();

      // Update user balance
      try {
        const user = await User.findById(earning.userId);
        if (user) {
          user.balance = (user.balance || 0) + profit;
          await user.save();
          console.log(`✅ Credited $${profit} to user ${user._id}`);
        } else {
          console.warn(`⚠️ User ${earning.userId} not found`);
        }
      } catch (userError) {
        console.error("❌ Error updating user balance:", userError);
      }

      // Create notification
      try {
        const profitReference = "PRF" + Date.now() + Math.floor(Math.random() * 10000);
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
      } catch (notifError) {
        console.error("❌ Error creating notification:", notifError);
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
        console.error("❌ Error updating user locked balance:", userError);
      }

      try {
        const completionReference = "INV" + Date.now() + Math.floor(Math.random() * 10000);
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
      } catch (notifError) {
        console.error("❌ Error creating completion notification:", notifError);
      }
    }

    await earning.save();

    // Calculate progress
    const progress = Math.min((elapsed / durationMs) * 100, 100);

    // Return the earning data
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
        dailyProfits: earning.dailyProfits, // Include for debugging
      },
    });

  } catch (err) {
    console.error("❌ EARNING STATUS ERROR:", err);
    
    // Return detailed error
    return NextResponse.json(
      { 
        error: "Failed to load earning status",
        details: err instanceof Error ? err.message : "Unknown error",
        stack: process.env.NODE_ENV === "development" ? err instanceof Error ? err.stack : undefined : undefined
      },
      { status: 500 }
    );
  }
}