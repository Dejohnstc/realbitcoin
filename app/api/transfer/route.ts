import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";

import User from "@/models/User";
import Transfer from "@/models/Transfer";

export async function POST(req: NextRequest) {
  const session = await mongoose.startSession();

  try {
    await connectDB();

    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];

    const decoded = verifyToken(token);

    if (!decoded?.userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const {
      email,
      amount,
      note,
    }: {
      email: string;
      amount: number;
      note?: string;
    } = await req.json();

    if (!email || !amount || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid transfer details.",
        },
        { status: 400 }
      );
    }

    await session.withTransaction(async () => {
      const sender = await User.findById(decoded.userId).session(session);

      if (!sender) {
        throw new Error("Sender not found.");
      }

      const receiver = await User.findOne({
        email: email.toLowerCase().trim(),
      }).session(session);

      if (!receiver) {
        throw new Error("Recipient not found.");
      }

      if (
        sender._id.toString() ===
        receiver._id.toString()
      ) {
        throw new Error("You cannot transfer to yourself.");
      }

      if (sender.balance < amount) {
        throw new Error("Insufficient balance.");
      }

      sender.balance -= amount;
      receiver.balance += amount;

      await sender.save({ session });
      await receiver.save({ session });

      await Transfer.create(
        [
          {
            senderId: sender._id,
            receiverId: receiver._id,
            amount,
            note: note ?? "",
            status: "completed",
          },
        ],
        { session }
      );

      return NextResponse.json({
        success: true,
        balance: sender.balance,
      });
    });

    await session.endSession();

    const updatedSender = await User.findById(decoded.userId);

    return NextResponse.json({
      success: true,
      balance: updatedSender?.balance ?? 0,
    });

  } catch (error) {
    await session.endSession();

    const message =
      error instanceof Error
        ? error.message
        : "Transfer failed.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      {
        status: 400,
      }
    );
  }
}