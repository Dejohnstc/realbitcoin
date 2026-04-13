import { connectDB } from "@/lib/mongodb";
import Notification from "@/models/Notification";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET(req: Request) {
  try {
    await connectDB();

    // 🔐 AUTH HEADER
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    if (!decoded?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 🔥 NOW CLEAN — ONLY OBJECTID
    const userId = new mongoose.Types.ObjectId(decoded.userId);

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({ notifications });

  } catch (error) {
    console.error("❌ NOTIFICATION GET ERROR:", error);

    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}