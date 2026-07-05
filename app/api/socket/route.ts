import { NextResponse } from "next/server";
import { Server as IOServer } from "socket.io";
import type { Socket } from "socket.io";
import { setIO } from "@/lib/socket";

export const dynamic = "force-dynamic";

const globalForSocket = globalThis as unknown as {
  io?: IOServer;
  onlineUsers?: Set<string>;
};

export async function GET() {
  try {
    if (!globalForSocket.io) {
      

      // 🔥 FIX: attach to global server (IMPORTANT)
      const io = new IOServer({
        path: "/api/socket",
        addTrailingSlash: false,
        cors: {
          origin: "*",
        },
      });

      globalForSocket.io = io;
      globalForSocket.onlineUsers = new Set<string>();

      setIO(io);

      io.on("connection", (socket: Socket) => {
      

        let currentUserId: string | null = null;

        // ✅ JOIN ROOM
        socket.on("join", (userId: string) => {
          if (!userId) return;

          currentUserId = userId;
          socket.join(userId);

          globalForSocket.onlineUsers?.add(userId);

          io.emit(
            "online_users",
            Array.from(globalForSocket.onlineUsers || [])
          );

          console.log("👤 Joined room:", userId);
        });

        // ✅ TYPING
        socket.on("typing", (userId: string) => {
          if (!userId) return;
          socket.to(userId).emit("typing");
        });

        socket.on("stop_typing", (userId: string) => {
          if (!userId) return;
          socket.to(userId).emit("stop_typing");
        });

        // ✅ DISCONNECT
        socket.on("disconnect", () => {
          if (currentUserId) {
            globalForSocket.onlineUsers?.delete(currentUserId);

            io.emit(
              "online_users",
              Array.from(globalForSocket.onlineUsers || [])
            );
          }

          console.log("❌ Disconnected:", socket.id);
        });
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ SOCKET ERROR:", error);

    return NextResponse.json(
      { error: "Socket failed" },
      { status: 500 }
    );
  }
}