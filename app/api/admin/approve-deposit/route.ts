import { connectDB } from "@/lib/mongodb";
import Deposit from "@/models/Deposit";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";
import Notification from "@/models/Notification";
import { sendDepositEmail } from "@/lib/mail";

interface Body {
  depositId: string;
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

    const { depositId, action }: Body = await req.json();

    const deposit = await Deposit.findById(depositId);

    if (!deposit || deposit.status !== "pending") {
      return NextResponse.json(
        { error: "Invalid deposit" },
        { status: 400 }
      );
    }

    // ✅ GET USER
    const user = await User.findById(deposit.userId);

    if (!user || !user.email) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (action === "approve") {
      deposit.status = "approved";

      // ✅ UPDATE BALANCE
      await User.findByIdAndUpdate(deposit.userId, {
        $inc: { balance: deposit.amount },
      });

      // ✅ EMAIL
      await sendDepositEmail(user.email, deposit.amount);

      // ✅ NOTIFICATION (APPROVED)
      await Notification.create({
        userId: deposit.userId.toString(),
        type: "deposit",
        message: "Deposit approved",

        meta: {
          amount: deposit.amount,
          coin: deposit.coin,
          network: deposit.network,
        },
      });

    } else {
      deposit.status = "rejected";

      // ✅ NOTIFICATION (REJECTED)
      await Notification.create({
        userId: deposit.userId.toString(),
        type: "deposit",
        message: "Deposit rejected",

        meta: {
          amount: deposit.amount,
          coin: deposit.coin,
          network: deposit.network,
        },
      });
    }

    await deposit.save();

    return NextResponse.json({ message: "Done" });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed" },
      { status: 500 }
    );
  }
}