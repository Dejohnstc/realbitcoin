import { connectDB } from "@/lib/mongodb";
import Chat from "@/models/Chat";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getIO } from "@/lib/socket";

export async function POST(req: Request) {
  try {
    await connectDB();

    // ✅ AUTH
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    const decoded = verifyToken(token || "");

    if (!decoded || typeof decoded.userId !== "string") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ BODY
    const body = await req.json();
    const message = body?.message;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    const chatId = decoded.userId;

    // ✅ SAVE MESSAGE
    const chat = new Chat({
      userId: decoded.userId,
      chatId,
      message,
      sender: "user",
      read: false,
    });

    await chat.save();

    // ✅ PREPARE CLEAN PAYLOAD (IMPORTANT)
    const payload = {
      _id: String(chat._id),
      message: chat.message,
      sender: chat.sender,
      chatId,
      status: "sent",
      createdAt: chat.createdAt,
    };

    // ✅ SOCKET EMIT (FIXED PROPERLY)
    const io = getIO();

    if (io) {
      // 🔥 send to user's room (for admin panel listeners)
      io.to(chatId).emit("new_message", payload);

      // 🔥 optional global emit (admin dashboard fallback)
      io.emit("new_message_admin", payload);
    } else {
      console.log("⚠️ IO NOT FOUND");
    }

    return NextResponse.json({
      chat: payload,
    });

  } catch (error) {
    console.error("❌ SEND ERROR FULL:", error);

    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}