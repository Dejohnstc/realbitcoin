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

    // ✅ SAVE MESSAGE (FIXED)
    const chat = new Chat({
      userId,
      chatId: userId,
      message,
      sender: "admin",
      read: false,
      status: "sent", // 🔥 IMPORTANT FIX
    });

    await chat.save();

    console.log("✅ ADMIN MESSAGE SAVED:", chat._id.toString());

    // ✅ SOCKET EMIT
    const io = getIO();

    if (io) {
      io.to(userId).emit("new_message", {
        _id: String(chat._id),
        message: chat.message,
        sender: chat.sender,
        chatId: userId,
        status: chat.status,
      });

      // 🔥 OPTIONAL: confirm delivery
      io.to(userId).emit("message_delivered", {
        chatId: userId,
      });
    } else {
      console.log("⚠️ IO NOT FOUND (ADMIN)");
    }

    return NextResponse.json({
      chat: {
        ...chat.toObject(),
        _id: String(chat._id),
      },
    });

  } catch (error) {
    console.error("❌ ADMIN SEND ERROR FULL:", error);

    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}