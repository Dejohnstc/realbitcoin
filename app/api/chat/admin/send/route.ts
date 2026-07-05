import { connectDB } from "@/lib/mongodb";
import Chat from "@/models/Chat";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getIO } from "@/lib/socket";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    await connectDB();

    // ✅ AUTH
    const token = req.headers.get("authorization")?.split(" ")[1];
    const decoded = verifyToken(token || "");

    if (!decoded?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await User.findById(decoded.userId);

    if (!admin || admin.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ✅ BODY
    const body = await req.json();
    const userId = body?.userId;
    const message = body?.message;

    if (!userId || !message || typeof message !== "string") {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    // ✅ SAVE MESSAGE
    const chat = new Chat({
      userId,
      chatId: userId,
      message,
      sender: "admin",
      read: false,
      status: "sent",
    });

    await chat.save();

    

    // ✅ CLEAN PAYLOAD (CRITICAL FIX)
    const payload = {
      _id: String(chat._id),
      message: chat.message,
      sender: chat.sender,
      chatId: userId,
      status: chat.status,
      createdAt: chat.createdAt, // 🔥 THIS WAS MISSING
    };

    // ✅ SOCKET EMIT (FIXED)
    const io = getIO();

    if (io) {
      io.to(userId).emit("new_message", payload);

      // optional delivery event
      io.to(userId).emit("message_delivered", {
        chatId: userId,
      });

      // optional admin panel broadcast
      io.emit("new_message_admin", payload);
    } else {
      
    }

    return NextResponse.json({
      chat: payload,
    });

  } catch (error) {
    console.error("❌ ADMIN SEND ERROR FULL:", error);

    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}