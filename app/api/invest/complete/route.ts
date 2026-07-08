import { connectDB } from "@/lib/mongodb";
import Investment from "@/models/Investment";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";
import Notification from "@/models/Notification";
import { sendInvestmentCompletedEmail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    await connectDB();

    // ✅ Add authentication (security)
    const token = req.headers.get("authorization")?.split(" ")[1];
    const decoded = verifyToken(token || "");

    if (!decoded?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // ✅ Optional: Check if user is admin
    const user = await User.findById(decoded.userId);
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const now = new Date();

    const investments = await Investment.find({
      status: "active",
      endDate: { $lte: now },
    });

    let completedCount = 0;
    const errors: string[] = [];

    for (const inv of investments) {
      try {
        const profitAmount = inv.amount * (inv.profit / 100);
        const totalReturn = inv.amount + profitAmount;

        // ✅ Check if user exists before updating
        const userExists = await User.findById(inv.userId);
        if (!userExists) {
          errors.push(`User ${inv.userId} not found for investment ${inv._id}`);
          continue;
        }

        // ✅ Ensure lockedBalance doesn't go negative
        const currentLockedBalance = userExists.lockedBalance || 0;
        const newLockedBalance = Math.max(0, currentLockedBalance - inv.amount);

        await User.findByIdAndUpdate(
          inv.userId,
          {
            $inc: {
              balance: totalReturn,
              // ✅ Use Math.max to prevent negative lockedBalance
            },
            $set: {
              lockedBalance: newLockedBalance,
            },
          }
        );

        inv.status = "completed";
        await inv.save();

        completedCount++;

       // ===================================
// CREATE NOTIFICATION
// ===================================

await Notification.create({
  userId: inv.userId,
  type: "investment",
  message:
    `Investment Completed\n\n` +
    `Your ${inv.plan} has successfully matured.\n\n` +
    `Investment: $${inv.amount.toLocaleString()}\n` +
    `Profit Earned: $${profitAmount.toLocaleString()}\n` +
    `Total Returned: $${totalReturn.toLocaleString()}\n\n` +
    `The funds have been credited to your available balance.`,
});
// ===================================
// SEND EMAIL
// ===================================

if (userExists.email) {
  try {
    await sendInvestmentCompletedEmail(
      userExists.email,
      inv.amount,
      profitAmount,
      totalReturn,
      inv.plan
    );
  } catch (error) {
    console.error(
      "Investment completion email failed:",
      error
    );
  }
}

      } catch (error) {
        console.error(`Error processing investment ${inv._id}:`, error);
        errors.push(`Failed to process investment ${inv._id}`);
      }
    }

    return NextResponse.json({
      success: true,
      completed: completedCount,
      errors: errors.length > 0 ? errors : undefined,
      message: `Processed ${completedCount} completed investments${errors.length > 0 ? ` with ${errors.length} errors` : ''}`,
    });

  } catch (error) {
    console.error("INVEST COMPLETE ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed",
      },
      {
        status: 500,
      }
    );
  }
}