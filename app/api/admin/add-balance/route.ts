import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Notification from "@/models/Notification";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request): Promise<NextResponse> {
  try {
    await connectDB();

    const token = req.headers.get("authorization")?.split(" ")[1];
    const decoded = verifyToken(token || "");

    const admin = await User.findById(decoded?.userId);

    if (!admin || admin.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const { userId, amount } = await req.json();

    // ✅ VALIDATION
    if (!userId || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      );
    }

    // 🔥 UPDATE BALANCE
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $inc: {
          balance: amount,
        },
      },
      {
        new: true,
      }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

  

    // 🔥 CREDIT REFERENCE
    const creditReference =
      "CRD" +
      Date.now() +
      Math.floor(Math.random() * 10000);

    // 🔔 PREMIUM NOTIFICATION
    await Notification.create({
      userId,

      type: "system",

      message:
  `Account Credit Successful\n\n` +
  `A balance adjustment has been successfully applied to your CoinlyBitora account by our finance department.\n\n` +
  `Credit Amount: $${amount.toLocaleString()}\n` +
  `Reference ID: ${creditReference}\n` +
  `Status: Completed\n\n` +
  `The funds are immediately available for trading, investment plans, and withdrawals subject to account conditions.\n\n` +
  `Thank you for choosing CoinlyBitora.`,

     meta: {
  amount,
  referenceId: creditReference,
  status: "credited",
  transactionType: "admin_credit",
  creditedBy: admin.email,
},
    });

    return NextResponse.json({
      message: "Balance updated successfully",
      balance: updatedUser.balance,
      referenceId: creditReference,
    });

  } catch (error) {
    console.error(
      "❌ ADD BALANCE ERROR:",
      error
    );

    return NextResponse.json(
      { error: "Failed to update balance" },
      { status: 500 }
    );
  }
}