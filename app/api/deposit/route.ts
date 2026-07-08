import { connectDB } from "@/lib/mongodb";
import Deposit from "@/models/Deposit";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";
import { sendDepositReceivedEmail } from "@/lib/mail";
import { NextResponse } from "next/server";

interface DepositBody {
  amount: number;
  coin: "BTC" | "USDT" | "ETH";
  network?: "ERC20" | "BEP20" | "TRC20";
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const authHeader = req.headers.get("authorization");

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];

    let decoded: { userId?: string } | null = null;

    try {
      decoded = verifyToken(token);
    } catch {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    if (!decoded?.userId) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const {
      amount,
      coin,
      network,
    }: DepositBody = await req.json();

    const allowedCoins = [
      "BTC",
      "USDT",
      "ETH",
    ];

    if (!allowedCoins.includes(coin)) {
      return NextResponse.json(
        { error: "Invalid coin" },
        { status: 400 }
      );
    }

    if (!amount || amount < 100) {
      return NextResponse.json(
        {
          error: "Minimum deposit is $100",
        },
        {
          status: 400,
        }
      );
    }

    if (coin === "USDT" && !network) {
      return NextResponse.json(
        {
          error: "Select USDT network",
        },
        {
          status: 400,
        }
      );
    }

    if (
      coin === "USDT" &&
      network &&
      !["TRC20", "ERC20", "BEP20"].includes(network)
    ) {
      return NextResponse.json(
        {
          error: "Invalid network",
        },
        {
          status: 400,
        }
      );
    }

    const existingDeposit =
      await Deposit.findOne({
        userId: decoded.userId,
        status: "pending",
      });

    if (existingDeposit) {
      return NextResponse.json(
        {
          error:
            "You already have a pending deposit awaiting review",
        },
        {
          status: 400,
        }
      );
    }

    const referenceId =
      "DEP" +
      Date.now() +
      Math.floor(Math.random() * 10000);

    const deposit =
      await Deposit.create({
        userId: decoded.userId,
        amount,
        coin,

        ...(coin === "USDT" && network
          ? { network }
          : {}),

        referenceId,
        status: "pending",
      });

    // ===========================
    // SEND DEPOSIT RECEIVED EMAIL
    // ===========================

    try {
      await sendDepositReceivedEmail(
        user.email,
        amount
      );
    } catch (error) {
      console.error(
        "Deposit email failed:",
        error
      );
    }

    return NextResponse.json({
      success: true,
      message: "Deposit request created",
      deposit,
    });

  } catch (error) {
    console.error(
      "DEPOSIT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Deposit failed",
      },
      {
        status: 500,
      }
    );
  }
}