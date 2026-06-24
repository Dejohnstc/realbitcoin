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

  user.balance -= withdraw.amount;

  await user.save({ session });

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

          (withdraw.method === "BANK"
            ? `Account Holder: ${withdraw.accountName || "N/A"}\n` +
              `Bank Name: ${withdraw.bankName || "N/A"}\n` +
              `Account Number: ${withdraw.accountNumber || "N/A"}\n`
            : "") +

          (withdraw.method === "CRYPTO"
            ? `Coin: ${withdraw.coin || "N/A"}\n` +
              `Network: ${withdraw.network || "N/A"}\n` +
              `Wallet: ${withdraw.wallet || "N/A"}\n`
            : "") +

          `Status: Processing\n\n` +
          `Your funds are currently being transferred through your selected withdrawal method. Depending on processing requirements, delivery may take between 1 and 24 hours.\n\n` +
          `Please retain your transaction reference for future correspondence with our support team.`,

        meta: {
          amount: withdraw.amount,
          transactionId: withdraw.transactionId,
          method: withdraw.method,
          accountName: withdraw.accountName,
          bankName: withdraw.bankName,
          accountNumber: withdraw.accountNumber,
          coin: withdraw.coin,
          network: withdraw.network,
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
        userId: withdraw.userId,
        type: "withdraw",
        message:
          `Withdrawal Request Declined\n\n` +
          `We regret to inform you that your withdrawal request could not be approved at this time following a review by our finance department.\n\n` +
          `Amount: $${withdraw.amount.toLocaleString()}\n` +
          `Transaction ID: ${withdraw.transactionId}\n` +
          `Withdrawal Method: ${withdraw.method}\n` +

          (withdraw.method === "BANK"
            ? `Account Holder: ${withdraw.accountName || "N/A"}\n` +
              `Bank Name: ${withdraw.bankName || "N/A"}\n` +
              `Account Number: ${withdraw.accountNumber || "N/A"}\n`
            : "") +

          (withdraw.method === "CRYPTO"
            ? `Coin: ${withdraw.coin || "N/A"}\n` +
              `Network: ${withdraw.network || "N/A"}\n`
            : "") +

          `Status: Rejected\n\n` +
          `If you believe this decision was made in error or require additional information, please contact our support team and provide the transaction reference above for further assistance.`,

        meta: {
          amount: withdraw.amount,
          transactionId: withdraw.transactionId,
          method: withdraw.method,
          accountName: withdraw.accountName,
          bankName: withdraw.bankName,
          accountNumber: withdraw.accountNumber,
          coin: withdraw.coin,
          network: withdraw.network,
        },
      },
    ],
    { session }
  );
}

await withdraw.save({ session });

await session.commitTransaction();
session.endSession();

if (action === "approve") {
  try {
    await sendWithdrawEmail(
      user.email,
      withdraw.amount,
      withdraw.transactionId,
      withdraw.method,
      withdraw.accountName,
      withdraw.bankName,
      withdraw.accountNumber
    );
  } catch (err) {
    console.error(
      "❌ Withdraw email failed:",
      err
    );
  }
}

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