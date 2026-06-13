import { connectDB } from "@/lib/mongodb";
import Deposit from "@/models/Deposit";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";
import Notification from "@/models/Notification";
import { sendDepositEmail } from "@/lib/mail";
import mongoose from "mongoose";
import { getIO } from "@/lib/socket"; // 🔥 NEW

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
      return NextResponse.json({ error: "Invalid deposit" }, { status: 400 });
    }

    const user = await User.findById(deposit.userId).session(session);

    if (!user || !user.email) {
      await session.abortTransaction();
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (action === "approve") {
      deposit.status = "approved";

      // 🔥 UPDATE BALANCE
      user.balance += deposit.amount;
      await user.save({ session });

      // 🔔 NOTIFICATION
      const depositReference =
  "DEP" +
  Date.now() +
  Math.floor(Math.random() * 10000);

      await Notification.create(
        [
          {
            userId: deposit.userId,
            type: "deposit",
            message:
  `Deposit Confirmed Successfully\n\n` +
  `We are pleased to inform you that your deposit of $${deposit.amount.toLocaleString()} has been successfully verified and credited to your CoinlyBitora trading account.\n\n` +
  `Reference ID: ${depositReference}\n` +
  `Funding Method: ${deposit.coin}\n` +
  `Network: ${deposit.network}\n` +
  `Status: Successfully Credited\n\n` +
  `Your account balance has been updated and the funds are now available for trading, investment plans, and withdrawals where applicable.`,
           meta: {
  amount: deposit.amount,
  coin: deposit.coin,
  network: deposit.network,
  referenceId: depositReference,
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
            userId: deposit.userId,
            type: "deposit",
           message:
  `Deposit Verification Unsuccessful\n\n` +
  `Following a review by our finance and compliance team, we were unable to verify and approve your recent deposit request.\n\n` +
  `Deposit Amount: $${deposit.amount.toLocaleString()}\n` +
  `Funding Method: ${deposit.coin}\n` +
  `Network: ${deposit.network}\n` +
  `Status: Rejected\n\n` +
  `This may occur due to missing confirmations, incorrect transaction details, or network inconsistencies. If you require further clarification, please contact support and provide your transaction information for review.`,
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

    // 🔥 AFTER COMMIT (SAFE ZONE)

    if (action === "approve") {
      try {
        await sendDepositEmail(user.email, deposit.amount);
      } catch (err) {
        console.error("Email failed:", err);
      }
    }

    // 🔥 REAL-TIME NOTIFICATION
    const io = getIO();
    if (io) {
      io.to(String(deposit.userId)).emit("new_notification");
    }

    return NextResponse.json({ message: "Done" });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("❌ APPROVE DEPOSIT ERROR:", error);

    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}