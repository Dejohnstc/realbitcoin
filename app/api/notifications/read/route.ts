import { connectDB } from "@/lib/mongodb";
import Notification from "@/models/Notification";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  await connectDB();

  const token = req.headers.get("authorization")?.split(" ")[1];
  const decoded = verifyToken(token || "");

  if (!decoded) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await Notification.updateMany(
    { userId: decoded.userId, read: false },
    { $set: { read: true } }
  );

  return NextResponse.json({ message: "Marked as read" });
}