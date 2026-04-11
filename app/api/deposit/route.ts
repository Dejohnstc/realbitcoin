import { connectDB } from "@/lib/mongodb";
import Deposit from "@/models/Deposit";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";

interface DepositBody {
  amount: number;
  coin: "BTC" | "USDT" | "ETH" | "LTC";
  network?: "ERC20" | "BEP20" | "TRC20";
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    await connectDB();

    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
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

    const body: DepositBody = await req.json();
    const { amount, coin, network } = body;

    // ✅ VALIDATION
    if (!amount || amount < 10) {
      return NextResponse.json(
        { error: "Minimum deposit is $10" },
        { status: 400 }
      );
    }

    if (!coin) {
      return NextResponse.json(
        { error: "Select coin" },
        { status: 400 }
      );
    }

    if (coin === "USDT" && !network) {
      return NextResponse.json(
        { error: "Select network" },
        { status: 400 }
      );
    }

    // 🔥 CREATE DEPOSIT (FINAL SAFE VERSION)
    const deposit = await Deposit.create({
      userId: decoded.userId,
      amount,
      coin,
      ...(coin === "USDT" && network ? { network } : {}),
      status: "pending",
    });

    return NextResponse.json({
      message: "Deposit request created",
      deposit,
    });

  } catch (error) {
    console.error("❌ DEPOSIT ERROR:", error);

    return NextResponse.json(
      { error: "Deposit failed" },
      { status: 500 }
    );
  }
}