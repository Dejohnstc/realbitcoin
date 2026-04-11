import { connectDB } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";
import User from "@/models/User";
import Earning from "@/models/Earning";

export async function POST(req: Request) {
  try {
    await connectDB();

    const token = req.headers.get("authorization")?.split(" ")[1];
    const decoded = verifyToken(token || "");

    if (!decoded?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ❌ prevent multiple active sessions
    const existing = await Earning.findOne({
      userId: user._id,
      status: "active",
    });

    if (existing) {
      return NextResponse.json(
        { error: "Earning already active" },
        { status: 400 }
      );
    }

    const depositAmount = user.balance;
    const targetAmount = depositAmount * 10;

    const startTime = new Date();
    const endTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await Earning.create({
      userId: user._id,
      depositAmount,
      targetAmount,
      startTime,
      endTime,
    });

    return NextResponse.json({ message: "Earning started" });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}