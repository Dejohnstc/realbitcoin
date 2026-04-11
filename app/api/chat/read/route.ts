import { connectDB } from "@/lib/mongodb";
import Chat from "@/models/Chat";
import { NextResponse } from "next/server";
import { getIO } from "@/lib/socket";

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const chatId = body?.chatId;

    if (!chatId || typeof chatId !== "string") {
      return NextResponse.json(
        { error: "chatId required" },
        { status: 400 }
      );
    }

    // 🔥 FIX: MARK USER MESSAGES AS READ
    const result = await Chat.updateMany(
      { chatId, sender: "user", read: false },
      {
        $set: {
          read: true,
          status: "read",
        },
      }
    );

    console.log("✅ READ UPDATED:", result.modifiedCount);

    // 🔥 REAL-TIME UPDATE
    const io = getIO();

    if (io) {
      io.to(chatId).emit("message_read", {
        chatId,
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("❌ READ ERROR:", error);

    return NextResponse.json(
      { error: "Failed to update read status" },
      { status: 500 }
    );
  }
}