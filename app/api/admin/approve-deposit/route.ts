import { connectDB } from "@/lib/mongodb";
import Deposit from "@/models/Deposit";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";
import Notification from "@/models/Notification";
import { sendDepositEmail } from "@/lib/mail";
import mongoose from "mongoose";
import { getIO } from "@/lib/socket";

interface Body {
depositId: string;
action: "approve" | "reject";
}

export async function POST(req: Request) {
const session = await mongoose.startSession();

try {
await connectDB();


session.startTransaction();

const authHeader = req.headers.get("authorization");

if (!authHeader) {
  await session.abortTransaction();
  session.endSession();

  return NextResponse.json(
    { error: "Unauthorized" },
    { status: 401 }
  );
}

const token = authHeader.split(" ")[1];

const decoded = verifyToken(token);

if (!decoded?.userId) {
  await session.abortTransaction();
  session.endSession();

  return NextResponse.json(
    { error: "Invalid token" },
    { status: 401 }
  );
}

const admin = await User.findById(
  decoded.userId
);

if (!admin || admin.role !== "admin") {
  await session.abortTransaction();
  session.endSession();

  return NextResponse.json(
    { error: "Forbidden" },
    { status: 403 }
  );
}

const { depositId, action }: Body =
  await req.json();

const deposit =
  await Deposit.findById(
    depositId
  ).session(session);

if (
  !deposit ||
  deposit.status !== "pending"
) {
  await session.abortTransaction();
  session.endSession();

  return NextResponse.json(
    { error: "Invalid deposit" },
    { status: 400 }
  );
}

const user =
  await User.findById(
    deposit.userId
  ).session(session);

if (!user || !user.email) {
  await session.abortTransaction();
  session.endSession();

  return NextResponse.json(
    { error: "User not found" },
    { status: 404 }
  );
}

const depositReference =
  "DEP" +
  Date.now() +
  Math.floor(Math.random() * 10000);

if (action === "approve") {
  deposit.status = "approved";

  await User.findByIdAndUpdate(
    user._id,
    {
      $inc: {
        balance: deposit.amount,
      },
    },
    { session }
  );

  await Notification.create(
    [
      {
        userId: deposit.userId,
        type: "deposit",

        message:
          `Deposit Confirmed Successfully\n\n` +
          `We are pleased to inform you that your deposit of $${deposit.amount.toLocaleString()} has been successfully verified and credited to your account.\n\n` +
          `Reference ID: ${depositReference}\n` +
          `Funding Method: ${deposit.coin}\n` +
          `Network: ${deposit.network || deposit.coin}\n` +
          `Status: Successfully Credited\n\n` +
          `Your account balance has been updated and funds are now available.`,

        meta: {
          amount: deposit.amount,
          coin: deposit.coin,
          network:
            deposit.network ||
            deposit.coin,
          referenceId:
            depositReference,
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
          `We were unable to verify your recent deposit request.\n\n` +
          `Deposit Amount: $${deposit.amount.toLocaleString()}\n` +
          `Funding Method: ${deposit.coin}\n` +
          `Network: ${deposit.network || deposit.coin}\n` +
          `Status: Rejected\n\n` +
          `Please contact support if you believe this was made in error.`,

        meta: {
          amount: deposit.amount,
          coin: deposit.coin,
          network:
            deposit.network ||
            deposit.coin,
        },
      },
    ],
    { session }
  );
}

await deposit.save({ session });

await session.commitTransaction();
session.endSession();

if (action === "approve") {
  try {
    await sendDepositEmail(
      user.email,
      deposit.amount
    );
  } catch (err) {
    console.error(
      "Email failed:",
      err
    );
  }
}

const io = getIO();

if (io) {
  io.to(
    String(deposit.userId)
  ).emit("new_notification");
}

return NextResponse.json({
  success: true,
  message:
    action === "approve"
      ? "Deposit approved"
      : "Deposit rejected",
});


} catch (error) {
await session.abortTransaction();
session.endSession();


console.error(
  "APPROVE DEPOSIT ERROR:",
  error
);

return NextResponse.json(
  {
    success: false,
    error: "Failed",
  },
  {
    status: 500,
  }
);

}
}
