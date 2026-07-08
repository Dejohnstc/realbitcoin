import { connectDB } from "@/lib/mongodb";
import Withdraw from "@/models/Withdraw";
import User from "@/models/User";
import Earning from "@/models/Earning";
import Notification from "@/models/Notification";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";
import { sendWithdrawalRejectedEmail } from "@/lib/mail";

interface Body {
  amount: number;
  wallet?: string;
  coin?: string;
  network?: string;

  meta?: {
    accountName?: string;
    bankName?: string;
    country?: string;
  };
}

export async function POST(
  req: Request
): Promise<NextResponse> {
  try {
    await connectDB();

    const authHeader =
      req.headers.get("authorization");

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

    const {
      amount,
      wallet,
      coin,
      network,
      meta,
    }: Body = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    const user = await User.findById(
      decoded.userId
    );

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (user.balance < amount) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    // ==================================
    // BLOCK WITHDRAWAL DURING ACTIVE TRADE
    // ==================================

    const earning = await Earning.findOne({
      userId: decoded.userId,
      status: "active",
    });

    if (earning) {
      const remainingTime =
        new Date(earning.endTime).getTime() -
        Date.now();

      const daysLeft = Math.max(
        1,
        Math.ceil(
          remainingTime /
            (24 * 60 * 60 * 1000)
        )
      );

      await Notification.create({
        userId: decoded.userId,
        type: "system",
        message: `Withdrawal on hold. Trading completes in ${daysLeft} day(s).`,
      });

      return NextResponse.json(
        {
          error: `Withdrawal locked. ${daysLeft} day(s) remaining.`,
        },
        {
          status: 400,
        }
      );
    }

    // ==================================
    // DETERMINE WITHDRAW METHOD
    // ==================================

    let method:
      | "CRYPTO"
      | "BANK"
      | "MONEYGRAM"
      | "MUKURU" = "CRYPTO";

    if (coin === "BANK") {
      method = "BANK";
    } else if (coin === "MONEYGRAM") {
      method = "MONEYGRAM";
    } else if (coin === "MUKURU") {
      method = "MUKURU";
    }

    // ==================================
    // TRANSACTION INFO
    // ==================================

    const transactionId =
      "TX" +
      Date.now() +
      Math.floor(
        Math.random() * 10000
      );

    const fee = Number(
      (amount * 0.02).toFixed(2)
    );

    const netAmount = Number(
      (amount - fee).toFixed(2)
    );

    console.log("WITHDRAW REQUEST:", {
      amount,
      wallet,
      coin,
      network,
      meta,
      method,
      transactionId,
      fee,
      netAmount,
    });

    // ==================================
    // CREATE WITHDRAWAL
    // ==================================

    const withdraw =
      await Withdraw.create({
        userId: decoded.userId,

        amount,

        method,

        wallet: wallet || "",

        coin: coin || "",

        network: network || "",

        accountName:
          meta?.accountName || "",

        bankName:
          meta?.bankName || "",

        country:
          meta?.country || "",

        transactionId,

        fee,

        netAmount,
      });

    // ==================================
    // USER NOTIFICATION
    // ==================================

    await Notification.create({
      userId: decoded.userId,

      type: "withdraw",

      message:
        `Withdrawal request submitted.\n\n` +
        `Amount: $${amount.toLocaleString()}\n` +
        `Transaction ID: ${transactionId}\n` +
        `Method: ${method}\n` +
        `Status: Pending Review`,

      meta: {
        amount,
        transactionId,
      },
    });

    // ==================================
    // SEND EMAIL
    // ==================================

    try {
      await sendWithdrawalRejectedEmail(
        user.email,
        amount,
        transactionId,
        method
      );
    } catch (error) {
      console.error(
        "Withdrawal request email failed:",
        error
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Withdrawal request submitted",
      withdraw,
    });

  } catch (error) {
    console.error(
      "WITHDRAW ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Withdrawal failed",
      },
      {
        status: 500,
      }
    );
  }
}