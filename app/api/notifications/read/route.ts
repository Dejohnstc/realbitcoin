import { connectDB } from "@/lib/mongodb";
import Notification from "@/models/Notification";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";
import mongoose from "mongoose"; // 🔥 ADD

export async function POST(req: Request) {
  await connectDB();

  const token = req.headers.get("authorization")?.split(" ")[1];
  const decoded = verifyToken(token || "");

  if (!decoded?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 🔥 FIX TYPE
  const userId = new mongoose.Types.ObjectId(decoded.userId);

  await Notification.updateMany(
    { userId, read: false },
    { $set: { read: true } }
  );

  return NextResponse.json({ message: "Marked as read" });
}