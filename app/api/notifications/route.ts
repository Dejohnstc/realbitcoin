import { connectDB } from "@/lib/mongodb";
import Notification from "@/models/Notification";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    await connectDB();

    const token = req.headers.get("authorization")?.split(" ")[1];
    const decoded = verifyToken(token || "");

    if (!decoded) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const notifications = await Notification.find({
      userId: decoded.userId,
    }).sort({ createdAt: -1 });

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed" },
      { status: 500 }
    );
  }
}