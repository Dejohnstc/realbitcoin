import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request): Promise<NextResponse> {
  try {
    await connectDB();

    const token = req.headers.get("authorization")?.split(" ")[1];
    const decoded = verifyToken(token || "");

    const admin = await User.findById(decoded?.userId);

    if (!admin || admin.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId, amount } = await req.json();

    // ✅ VALIDATION
    if (!userId || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      );
    }

    // 🔥 GUARANTEED UPDATE + RETURN UPDATED USER
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $inc: { balance: amount } },
      { new: true } // ✅ VERY IMPORTANT
    );

    if (!updatedUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    console.log("✅ Balance updated:", updatedUser.balance);

    return NextResponse.json({
      message: "Balance updated",
      balance: updatedUser.balance, // ✅ RETURN NEW VALUE
    });

  } catch (error) {
    console.error("❌ ADD BALANCE ERROR:", error);

    return NextResponse.json(
      { error: "Failed to update balance" },
      { status: 500 }
    );
  }
}