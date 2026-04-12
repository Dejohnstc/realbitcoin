import { connectDB } from "@/lib/mongodb";
import Withdraw from "@/models/Withdraw";
import User from "@/models/User";
import Earning from "@/models/Earning"; // 🔥 NEW
import Notification from "@/models/Notification"; // 🔥 NEW
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";

interface Body {
  amount: number;
  wallet: string;
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    await connectDB();

    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    if (!decoded?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { amount, wallet }: Body = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    const user = await User.findById(decoded.userId);

    if (!user || user.balance < amount) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    // 🔥 CHECK ACTIVE EARNING
    const earning = await Earning.findOne({
      userId: decoded.userId,
      status: "active",
    });

    if (earning) {
      const remainingTime =
        new Date(earning.endTime).getTime() - Date.now();

      const daysLeft = Math.max(
        1,
        Math.ceil(remainingTime / (24 * 60 * 60 * 1000))
      );

      // 🔔 SYSTEM NOTIFICATION
      await Notification.create({
        userId: decoded.userId,
        type: "system",
        message: `Withdrawal on hold. Trading completes in ${daysLeft} day(s).`,
      });

      return NextResponse.json(
        {
          error: `Withdrawal locked. ${daysLeft} day(s) remaining.`,
        },
        { status: 400 }
      );
    }

    // ✅ CREATE WITHDRAWAL
    const withdraw = await Withdraw.create({
      userId: decoded.userId,
      amount,
      wallet,
    });

    return NextResponse.json({
      message: "Withdrawal request submitted",
      withdraw,
    });

  } catch (error) {
    console.error("WITHDRAW ERROR:", error);

    return NextResponse.json(
      { error: "Withdrawal failed" },
      { status: 500 }
    );
  }
}