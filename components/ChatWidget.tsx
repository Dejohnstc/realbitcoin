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
  const unreadRef = useRef(0);
  const [showToast, setShowToast] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const openRef = useRef(false);
  const userIdRef = useRef<string | null>(null);

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
  if (userIdRef.current) return userIdRef.current;

  const token = localStorage.getItem("user_token");
  if (!token) return null;

  const res = await fetch("/api/user", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return null;

  const data: UserResponse = await res.json();
  userIdRef.current = data.user?._id || null;

  return userIdRef.current;
};

  // ✅ INIT SOCKET ON LOAD (FIXED PROPERLY)
  useEffect(() => {
    const setup = async () => {
      if (socketRef.current) return;

      const userId = await getUserId();
      if (!userId) return;

      await fetch("/api/socket");

      const socket: Socket = io({
        path: "/api/socket",
      });

      socket.emit("join", userId);

      socket.on("new_message", (msg: Chat) => {
  setMessages((prev) => {
    // ❌ prevent duplicates
    if (prev.find((m) => m._id === msg._id)) return prev;

    return [...prev, msg];
  });

  // 🔥 ONLY COUNT VALID NEW ADMIN MESSAGE
  const isAdminMessage = msg.sender === "admin";
  const isUnread = msg.status !== "read";

  if (isAdminMessage && isUnread) {
    // 🔥 only count if chat is closed
    if (!openRef.current) {
      unreadRef.current += 1;
      setUnreadCount(unreadRef.current);
    }

    playSound();

    // toast
    if (!openRef.current) {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
    else {
  // 🔥 if chat already open → keep unread at 0
  unreadRef.current = 0;
  setUnreadCount(0);
}
  }
});
      socket.on("message_delivered", () => {
        setMessages((prev) =>
          prev.map((m) =>
            m.sender === "user" ? { ...m, status: "delivered" } : m
          )
        );
      });

      socket.on("message_read", () => {
        setMessages((prev) =>
          prev.map((m) =>
            m.sender === "user" ? { ...m, status: "read" } : m
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

    setup();
  }, []);

  // ✅ LOAD MESSAGES ON START
 useEffect(() => {
  const load = async () => {
    const token = localStorage.getItem("user_token");
    if (!token) return;

    const userId = await getUserId();
    if (!userId) return;

    const res = await fetch(`/api/chat?userId=${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    const msgs = data.messages || [];

    // 🔥 FORCE READ IF OPEN
    const finalMsgs = openRef.current
      ? msgs.map((m: Chat) =>
          m.sender === "admin" ? { ...m, status: "read" } : m
        )
      : msgs;

    setMessages(finalMsgs);

    const unread = finalMsgs.filter(
      (m: Chat) =>
        m.sender === "admin" &&
        m.status !== "read"
    ).length;

    if (openRef.current) {
      unreadRef.current = 0;
      setUnreadCount(0);
    } else {
      unreadRef.current = unread;
      setUnreadCount(unread);
    }
  };

  load();

  // ✅ ONLY cleanup allowed here
  return () => {};
}, []);

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

    unreadRef.current = 0;
    setUnreadCount(0);
  };
  const handleOpen = async () => {
  const next = !open;
  setOpen(next);

  if (next) {
    // 🔥 reset count
    unreadRef.current = 0;
    setUnreadCount(0);

    // 🔥 update UI messages to read
    setMessages((prev) =>
      prev.map((m) =>
        m.sender === "admin" ? { ...m, status: "read" } : m
      )
    );

    // 🔥 sync backend
    await markAsRead();
  }
};

  const sendMessage = async () => {
    const token = localStorage.getItem("user_token");
    const userId = await getUserId();

    if (!token || !input.trim() || !userId) return;

    const tempId = Date.now().toString();

    const newMsg: Chat = {
      _id: tempId,
      message: input,
      sender: "user",
      chatId: userId,
      status: "sent",
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMsg]);

    try {
      await fetch("/api/chat/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: input,
          userId,
        }),
      });

      socketRef.current?.emit("new_message", newMsg);
    } catch (err) {
      console.log("Send failed", err);
    }

    socketRef.current?.emit("stop_typing", userId);
    setInput("");
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="fixed bottom-24 right-6 z-[9999] bg-yellow-400 text-black p-4 rounded-full shadow-lg"
      >
        💬
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
            {unreadCount}
          </span>
        )}
      </button>

      {showToast && (
        <div className="fixed bottom-24 right-6 bg-black text-white px-4 py-2 rounded shadow-lg z-[9999]">
          New message from support
        </div>
      )}

      {open && (
        <div className="fixed bottom-0 right-0 w-full sm:w-80 h-[70vh] bg-[#131A2A] rounded-t-xl z-[9999] shadow-lg">
          <div className="flex justify-between p-3 border-b border-gray-700">
            <span className="flex items-center gap-1">
  Live Support
  {online && <span className="text-green-400 text-xs">●</span>}
</span>
            <button
  onClick={() => {
    setOpen(false);
    openRef.current = false; // 🔥 force sync instantly
  }}
>
  ✕
</button>
          </div>

          <div className="p-3 space-y-3 overflow-y-auto h-[60%]">
            {messages.map((m) => (
  <div
    key={m._id}
    className={`p-3 rounded-2xl max-w-[80%] text-sm flex flex-col shadow ${
      m.sender === "user"
        ? "bg-yellow-400 text-black ml-auto"
        : "bg-gray-700 text-white"
    }`}
  >
    <span className="break-words">{m.message}</span>

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
  <p className="text-xs text-gray-400 italic">
    Admin is typing...
  </p>
)}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 p-2 rounded bg-[#0B0F19]"
            />
            <button
  onClick={sendMessage}
  className="bg-yellow-400 text-black px-3 py-2 rounded-lg font-semibold hover:bg-yellow-300 transition"
>
  ➤
</button>
          </div>
        </div>
      )}
    </>
  );
}