import { connectDB } from "@/lib/mongodb";
import Withdraw from "@/models/Withdraw";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";
import { sendWithdrawEmail } from "@/lib/mail";
import Notification from "@/models/Notification";
import mongoose from "mongoose";

interface Body {
  withdrawId: string;
  action: "approve" | "reject";
}

export async function POST(req: Request): Promise<NextResponse> {
  const session = await mongoose.startSession();

  try {
    await connectDB();
    session.startTransaction();

    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    if (!decoded?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const admin = await User.findById(decoded.userId);

    if (!admin || admin.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { withdrawId, action }: Body = await req.json();

    const withdraw = await Withdraw.findById(withdrawId).session(session);

    if (!withdraw || withdraw.status !== "pending") {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 }
      );
    }

    const user = await User.findById(withdraw.userId).session(session);

    if (!user || !user.email) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (action === "approve") {
      if (user.balance < withdraw.amount) {
        await session.abortTransaction();
        return NextResponse.json(
          { error: "Insufficient user balance" },
          { status: 400 }
        );
      }

      withdraw.status = "approved";

      // 🔥 GUARANTEED BALANCE DEDUCTION
      user.balance -= withdraw.amount;
      await user.save({ session });

      console.log("✅ New balance after withdrawal:", user.balance);

      // 🔥 SAFE EMAIL (non-blocking)
      sendWithdrawEmail(user.email, withdraw.amount).catch((err) =>
        console.error("Withdraw email failed:", err)
      );

      await Notification.create(
        [
          {
            userId: withdraw.userId.toString(),
            type: "withdraw",
            message: "Withdrawal processed",
            meta: {
              amount: withdraw.amount,
            },
          },
        ],
        { session }
      );

    } else {
      withdraw.status = "rejected";

      await Notification.create(
        [
          {
            userId: withdraw.userId.toString(),
            type: "withdraw",
            message: "Withdrawal rejected",
            meta: {
              amount: withdraw.amount,
            },
          },
        ],
        { session }
      );
    }

    await withdraw.save({ session });

    await session.commitTransaction();
    session.endSession();

    return NextResponse.json({ message: "Done" });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("❌ WITHDRAW ERROR:", error);

    return NextResponse.json(
      { error: "Failed" },
      { status: 500 }
    );
  }
}