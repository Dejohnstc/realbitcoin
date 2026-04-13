import { connectDB } from "@/lib/mongodb";
import Notification from "@/models/Notification";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";
import mongoose from "mongoose"; // 🔥 ADD

export async function POST(req: Request) {
  try {
    await connectDB();

    const token = req.headers.get("authorization")?.split(" ")[1];
    const decoded = verifyToken(token || "");

    if (!decoded?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id }: { id: string } = await req.json();

    // 🔥 CONVERT TYPES
    const notificationId = new mongoose.Types.ObjectId(id);
    const userId = new mongoose.Types.ObjectId(decoded.userId);

    await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { read: true }
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("READ ONE ERROR:", error);

    return NextResponse.json(
      { error: "Failed" },
      { status: 500 }
    );
  }
}