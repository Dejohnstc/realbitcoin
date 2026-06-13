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
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    if (!decoded?.userId) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const admin = await User.findById(decoded.userId);

    if (!admin || admin.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
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

    // 🔥 fallback for old withdrawals
    if (!withdraw.transactionId) {
      withdraw.transactionId =
        "TX" +
        Date.now() +
        Math.floor(Math.random() * 10000);
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

      // 🔥 BALANCE DEDUCTION
      user.balance -= withdraw.amount;

      await user.save({ session });

      console.log(
        "✅ New balance after withdrawal:",
        user.balance
      );

      // 🔥 EMAIL
      console.log("📧 Sending withdrawal email", {
        email: user.email,
        amount: withdraw.amount,
        transactionId: withdraw.transactionId,
        method: withdraw.method,
      });

      sendWithdrawEmail(
        user.email,
        withdraw.amount,
        withdraw.transactionId,
        withdraw.method
      ).catch((err) =>
        console.error(
          "❌ Withdraw email failed:",
          err
        )
      );

      // 🔔 PROFESSIONAL NOTIFICATION
    // 🔔 APPROVED NOTIFICATION
await Notification.create(
  [
    {
      userId: withdraw.userId,
      type: "withdraw",
      message:
        `Withdrawal Approved\n\n` +
        `We are pleased to inform you that your withdrawal request has been successfully approved and released for processing by our payments department.\n\n` +
        `Amount: $${withdraw.amount.toLocaleString()}\n` +
        `Transaction ID: ${withdraw.transactionId}\n` +
        `Withdrawal Method: ${withdraw.method}\n` +
        `Status: Processing\n\n` +
        `Your funds are currently being transferred through your selected withdrawal method. Depending on processing requirements, delivery may take between 1 and 24 hours.\n\n` +
        `Please retain your transaction reference for future correspondence with our support team.`,
      meta: {
        amount: withdraw.amount,
        transactionId: withdraw.transactionId,
        method: withdraw.method,
      },
    },
  ],
  { session }
);

} else {

  withdraw.status = "rejected";

  // 🔔 REJECTED NOTIFICATION
  await Notification.create(
    [
      {
        userId: withdraw.userId,
        type: "withdraw",
        message:
          `Withdrawal Request Declined\n\n` +
          `We regret to inform you that your withdrawal request could not be approved at this time following a review by our finance department.\n\n` +
          `Amount: $${withdraw.amount.toLocaleString()}\n` +
          `Transaction ID: ${withdraw.transactionId}\n` +
          `Withdrawal Method: ${withdraw.method}\n` +
          `Status: Rejected\n\n` +
          `If you believe this decision was made in error or require additional information, please contact our support team and provide the transaction reference above for further assistance.`,
        meta: {
          amount: withdraw.amount,
          transactionId: withdraw.transactionId,
          method: withdraw.method,
        },
      },
    ],
    { session }
  );
}

    await withdraw.save({ session });

    await session.commitTransaction();
    session.endSession();

    return NextResponse.json({
      message: "Done",
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error(
      "❌ WITHDRAW ERROR:",
      error
    );

    return NextResponse.json(
      { error: "Failed" },
      { status: 500 }
    );
  }
}