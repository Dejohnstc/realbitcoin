import { connectDB } from "@/lib/mongodb";
import Deposit from "@/models/Deposit";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";
import Notification from "@/models/Notification";
import { sendDepositEmail } from "@/lib/mail";
import mongoose from "mongoose";

interface Body {
  depositId: string;
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

    const { depositId, action }: Body = await req.json();

    const deposit = await Deposit.findById(depositId).session(session);

    if (!deposit || deposit.status !== "pending") {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "Invalid deposit" },
        { status: 400 }
      );
    }

    const user = await User.findById(deposit.userId).session(session);

    if (!user || !user.email) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (action === "approve") {
      deposit.status = "approved";

      // 🔥 GUARANTEED BALANCE UPDATE
      user.balance += deposit.amount;
      await user.save({ session });

      console.log("✅ New balance:", user.balance);

      // 🔥 SAFE EMAIL (DO NOT BREAK FLOW)
      sendDepositEmail(user.email, deposit.amount).catch((err) =>
        console.error("Email failed:", err)
      );

      await Notification.create(
        [
          {
            userId: deposit.userId.toString(),
            type: "deposit",
            message: "Deposit approved",
            meta: {
              amount: deposit.amount,
              coin: deposit.coin,
              network: deposit.network,
            },
          },
        ],
        { session }
      );

    } else {
      deposit.status = "rejected";

      await Notification.create(
        [
          {
            userId: deposit.userId.toString(),
            type: "deposit",
            message: "Deposit rejected",
            meta: {
              amount: deposit.amount,
              coin: deposit.coin,
              network: deposit.network,
            },
          },
        ],
        { session }
      );
    }

    await deposit.save({ session });

    await session.commitTransaction();
    session.endSession();

    return NextResponse.json({ message: "Done" });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("❌ APPROVE DEPOSIT ERROR:", error);

    return NextResponse.json(
      { error: "Failed" },
      { status: 500 }
    );
  }
}