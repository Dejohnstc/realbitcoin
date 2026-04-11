import { connectDB } from "@/lib/mongodb";
import Chat from "@/models/Chat";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    await connectDB();

    // ✅ AUTH
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];
    const decoded = verifyToken(token || "");

    if (!decoded || typeof decoded.userId !== "string") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ GET PARAM
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId required" },
        { status: 400 }
      );
    }

    // ✅ SUPPORT OLD + NEW DATA
    const messages = await Chat.find({
      $or: [
        { chatId: userId },
        { userId: userId },
      ],
    })
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({ messages });

  } catch (error) {
    console.error("CHAT GET ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}