import { connectDB } from "@/lib/mongodb";
import Withdraw from "@/models/Withdraw";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";
import { sendWithdrawEmail } from "@/lib/mail";
import Notification from "@/models/Notification";

interface Body {
  withdrawId: string;
  action: "approve" | "reject";
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

    if (!decoded?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // ✅ CHECK ADMIN
    const admin = await User.findById(decoded.userId);

    if (!admin || admin.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { withdrawId, action }: Body = await req.json();

    const withdraw = await Withdraw.findById(withdrawId);

    if (!withdraw || withdraw.status !== "pending") {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 }
      );
    }

    // ✅ GET USER
    const user = await User.findById(withdraw.userId);

    if (!user || !user.email) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (action === "approve") {
      // ⚠️ SAFETY CHECK
      if (user.balance < withdraw.amount) {
        return NextResponse.json(
          { error: "Insufficient user balance" },
          { status: 400 }
        );
      }

      withdraw.status = "approved";

      // ✅ DEDUCT BALANCE
      await User.findByIdAndUpdate(withdraw.userId, {
        $inc: { balance: -withdraw.amount },
      });

      // ✅ EMAIL
      await sendWithdrawEmail(user.email, withdraw.amount);

      // ✅ NOTIFICATION (APPROVED)
      await Notification.create({
        userId: withdraw.userId.toString(),
        type: "withdraw",
        message: "Withdrawal processed",

        meta: {
          amount: withdraw.amount,
        },
      });

    } else {
      withdraw.status = "rejected";

      // ✅ NOTIFICATION (REJECTED)
      await Notification.create({
        userId: withdraw.userId.toString(),
        type: "withdraw",
        message: "Withdrawal rejected",

        meta: {
          amount: withdraw.amount,
        },
      });
    }

    await withdraw.save();

    return NextResponse.json({ message: "Done" });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed" },
      { status: 500 }
    );
  }
}