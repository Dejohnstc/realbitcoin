import { connectDB } from "@/lib/mongodb";
import Withdraw from "@/models/Withdraw";
import User from "@/models/User";
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

    if (!decoded) {
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

    const withdraw = await Withdraw.create({
      userId: decoded.userId,
      amount,
      wallet,
    });

    return NextResponse.json({
      message: "Withdrawal request submitted",
      withdraw,
    });
  } catch {
    return NextResponse.json(
      { error: "Withdrawal failed" },
      { status: 500 }
    );
  }
}