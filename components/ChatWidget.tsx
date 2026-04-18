"use client";

import { useState, useRef, useEffect } from "react";
import { io, Socket } from "socket.io-client";

interface Chat {
  _id: string;
  message: string;
  sender: "user" | "admin";
  chatId?: string;
  status?: "sent" | "delivered" | "read";
  createdAt?: string;
}

interface UserResponse {
  user?: {
    _id: string;
  };
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Chat[]>([]);
  const [input, setInput] = useState("");

  const [typing, setTyping] = useState(false);
  const [online, setOnline] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showToast, setShowToast] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 🔥 FIX: track open state correctly
  const openRef = useRef(false);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

useEffect(() => {
  if ("Notification" in window && Notification.permission !== "granted") {
    Notification.requestPermission();
  }
}, []);

  const playSound = () => {
    const audio = new Audio("/notification.mp3");
    audio.play().catch(() => {});
  };

  const formatTime = (date?: string) => {
    if (!date) return "";
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getUserId = async (): Promise<string | null> => {
    const token = localStorage.getItem("user_token");
    if (!token) return null;

    const res = await fetch("/api/user", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return null;

    const data: UserResponse = await res.json();
    return data.user?._id || null;
  };

  const initSocket = async () => {
    if (socketRef.current) return;

    await fetch("/api/socket");

    const socket: Socket = io({
      path: "/api/socket",
    });

    const userId = await getUserId();
    if (!userId) return;

    socket.emit("join", userId);

    socket.on("new_message", (msg: Chat) => {
  setMessages((prev) => {
    if (prev.find((m) => m._id === msg._id)) return prev;
    return [...prev, msg];
  });

  // 🔥 ONLY FOR ADMIN MESSAGES
  if (msg.sender !== "admin") return;

  const isChatOpen = openRef.current;

  // 🔊 ALWAYS PLAY SOUND
  playSound();

  // 🔥 CHAT CLOSED → FULL NOTIFICATION
  if (!isChatOpen) {
    setUnreadCount((prev) => prev + 1);

    // 🔔 TOAST
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);

    // 🔔 BROWSER NOTIFICATION
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification("New message from support", {
          body: msg.message,
        });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission();
      }
    }
  } else {
    // 🔥 CHAT OPEN → subtle notification
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  }
});

    socket.on("message_delivered", () => {
      setMessages((prev) =>
        prev.map((m) =>
          m.sender === "user"
            ? { ...m, status: "delivered" }
            : m
        )
      );
    });

    socket.on("message_read", () => {
      setMessages((prev) =>
        prev.map((m) =>
          m.sender === "user"
            ? { ...m, status: "read" }
            : m
        )
      );
    });

    socket.on("typing", () => setTyping(true));
    socket.on("stop_typing", () => setTyping(false));

    socket.on("online_users", (users: string[]) => {
      setOnline(users.includes(userId));
    });

    socketRef.current = socket;
  };

  const fetchMessages = async () => {
    const token = localStorage.getItem("user_token");
    if (!token) return;

    const userId = await getUserId();
    if (!userId) return;

    const res = await fetch(`/api/chat?userId=${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    setMessages(data.messages || []);
  };

  const markAsRead = async () => {
    const token = localStorage.getItem("user_token");
    const userId = await getUserId();

    if (!userId) return;

    await fetch("/api/chat/read", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ chatId: userId }),
    });

    setUnreadCount(0);
  };

  const handleOpen = async () => {
    setOpen(true);
    setUnreadCount(0); // 🔥 reset badge immediately
    await fetchMessages();
    await initSocket();
    await markAsRead();
  };

  const sendMessage = async () => {
    const token = localStorage.getItem("user_token");
    const userId = await getUserId();

    if (!token || !input.trim() || !userId) return;

    const tempId = Date.now().toString();

    setMessages((prev) => [
      ...prev,
      {
        _id: tempId,
        message: input,
        sender: "user",
        chatId: userId,
        status: "sent",
        createdAt: new Date().toISOString(),
      },
    ]);

    await fetch("/api/chat/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message: input }),
    });

    socketRef.current?.emit("stop_typing", userId);

    setInput("");
  };

  return (
    <>
      {/* BUTTON */}
        <button
  onClick={handleOpen}
  className="fixed bottom-24 right-6 z-[9999] bg-yellow-400 text-black p-4 rounded-full shadow-lg"
  style={{ right: "24px", left: "auto" }} // 🔥 FORCE RIGHT
      >
        💬

        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow">
            {unreadCount}
          </span>
        )}
      </button>

      {/* TOAST */}
      {showToast && (
        <div className="fixed bottom-24 right-6 bg-black text-white px-4 py-2 rounded shadow-lg z-[9999]">
          New message received
        </div>
      )}

      {/* CHAT PANEL */}
      {open && (
        <div className="fixed bottom-0 right-0 w-full sm:w-80 h-[70vh] bg-[#131A2A] rounded-t-xl z-[9999] shadow-lg">

          <div className="flex justify-between p-3 border-b border-gray-700">
            <span className="flex items-center gap-2">
              Live Support
              {online && <span className="text-green-400 text-xs">●</span>}
            </span>

            <button onClick={() => setOpen(false)}>✕</button>
          </div>

          <div className="p-3 space-y-3 overflow-y-auto h-[60%]">
            {messages.map((m) => (
              <div
                key={m._id}
                className={`p-2 rounded max-w-[80%] text-sm flex flex-col ${
                  m.sender === "user"
                    ? "bg-yellow-400 text-black ml-auto"
                    : "bg-gray-700 text-white"
                }`}
              >
                <span>{m.message}</span>

                <div className="flex justify-end items-center gap-1 mt-1 text-[10px] opacity-70">
                  <span>{formatTime(m.createdAt)}</span>

                  {m.sender === "user" && (
                    <span className={m.status === "read" ? "text-blue-500" : ""}>
                      {m.status === "sent" && "✓"}
                      {m.status === "delivered" && "✓✓"}
                      {m.status === "read" && "✓✓"}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {typing && (
              <p className="text-xs text-gray-400">
                Admin is typing...
              </p>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 flex gap-2">
            <input
              value={input}
              onChange={async (e) => {
                setInput(e.target.value);

                const userId = await getUserId();
                if (!userId) return;

                socketRef.current?.emit("typing", userId);

                if (typingTimeoutRef.current) {
                  clearTimeout(typingTimeoutRef.current);
                }

                typingTimeoutRef.current = setTimeout(() => {
                  socketRef.current?.emit("stop_typing", userId);
                }, 1000);
              }}
              className="flex-1 p-2 rounded bg-[#0B0F19]"
              placeholder="Type message..."
            />

            <button
              onClick={sendMessage}
              className="bg-yellow-400 px-3 rounded text-black"
            >
              Send
            </button>
          </div>

        </div>
      )}
    </>
  );
}