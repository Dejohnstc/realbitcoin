"use client";

import { useState, useRef, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { useRouter } from "next/navigation";

interface UserChat {
  _id: string;
  lastMessage: string;
  unread?: number;
  email?: string; 
}

interface Message {
  _id: string;
  message: string;
  sender: "user" | "admin";
  chatId?: string;
  status?: "sent" | "delivered" | "read";
  createdAt?: string;
}

export default function AdminChatPage() {
  const router = useRouter();

  const [users, setUsers] = useState<UserChat[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const [typing, setTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  const socketRef = useRef<Socket | null>(null);
  const selectedUserRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // ✅ keep selected user synced
  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  // ✅ scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ AUTH GUARD (NO setState)
  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) router.replace("/admin/login");
  }, [router]);

  // ✅ SAFE FETCH USERS
  const fetchUsers = async () => {
    const token = localStorage.getItem("admin_token");

    try {
      const res = await fetch("/api/chat/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch {
      console.log("fetch users error");
    }
  };

  // ✅ SAFE FETCH MESSAGES
  const fetchMessages = async (userId: string) => {
    const token = localStorage.getItem("admin_token");

    const res = await fetch(`/api/chat?userId=${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    setMessages(Array.isArray(data.messages) ? data.messages : []);
  };

  // ✅ SOCKET (NO WARNINGS)
  useEffect(() => {
    const socket = io({ path: "/api/socket" });
    socketRef.current = socket;

    socket.on("new_message", (msg: Message) => {
      setMessages((prev) => {
        if (prev.find((m) => m._id === msg._id)) return prev;

        if (msg.chatId === selectedUserRef.current) {
          return [...prev, msg];
        }

        return prev;
      });

      // ✅ async safe call
      Promise.resolve().then(fetchUsers);
    });

    socket.on("message_delivered", ({ chatId }) => {
      if (chatId === selectedUserRef.current) {
        setMessages((prev) =>
          prev.map((m) =>
            m.sender === "admin"
              ? { ...m, status: "delivered" }
              : m
          )
        );
      }
    });

    socket.on("message_read", ({ chatId }) => {
      if (chatId === selectedUserRef.current) {
        setMessages((prev) =>
          prev.map((m) =>
            m.sender === "admin"
              ? { ...m, status: "read" }
              : m
          )
        );
      }

      setUsers((prev) =>
        prev.map((u) =>
          u._id === chatId ? { ...u, unread: 0 } : u
        )
      );
    });

    socket.on("online_users", (users: string[]) => {
      setOnlineUsers(users);
    });

    socket.on("typing", (userId: string) => {
      if (userId === selectedUserRef.current) setTyping(true);
    });

    socket.on("stop_typing", (userId: string) => {
      if (userId === selectedUserRef.current) setTyping(false);
    });

    // ✅ SAFE INITIAL LOAD
    Promise.resolve().then(fetchUsers);

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleSelect = async (userId: string) => {
    setSelectedUser(userId);

    await fetchMessages(userId);

    socketRef.current?.emit("join", userId);

    const token = localStorage.getItem("admin_token");

    await fetch("/api/chat/read", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ chatId: userId }),
    });

    setUsers((prev) =>
      prev.map((u) =>
        u._id === userId ? { ...u, unread: 0 } : u
      )
    );
  };

  const sendMessage = async () => {
    const token = localStorage.getItem("admin_token");

    if (!input.trim() || !selectedUser) return;

    const tempId = Date.now().toString();

    setMessages((prev) => [
      ...prev,
      {
        _id: tempId,
        message: input,
        sender: "admin",
        chatId: selectedUser,
        status: "sent",
        createdAt: new Date().toISOString(),
      },
    ]);

    await fetch("/api/chat/admin/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        userId: selectedUser,
        message: input,
      }),
    });

    socketRef.current?.emit("stop_typing", selectedUser);

    setInput("");
  };

  // ✅ SAFE RENDER GUARD
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("admin_token");
  if (!token) return null;
return (
  <div className="h-screen bg-[#0B0F19] text-white flex">

    {/* USERS (HIDDEN ON MOBILE WHEN CHAT OPEN) */}
    <div
      className={`${
        selectedUser ? "hidden md:flex" : "flex"
      } w-full md:w-[300px] border-r border-white/10 flex-col`}
    >
      <div className="p-4 font-semibold text-lg border-b border-white/10">
        Chats
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {users.map((u) => {
          const active = selectedUser === u._id;

          return (
            <div
              key={u._id}
              onClick={() => handleSelect(u._id)}
              className={`p-3 rounded-xl cursor-pointer transition flex justify-between items-center
              ${
                active
                  ? "bg-blue-600/20 border border-blue-500/30"
                  : "bg-[#131A2A] hover:bg-[#1A2235]"
              }`}
            >
              <div>
                <p className="text-sm flex items-center gap-2">
                  {u.email?.split("@")[0] || "User"}

                  {onlineUsers.includes(u._id) && (
                    <span className="w-2 h-2 bg-green-400 rounded-full" />
                  )}
                </p>

                <p className="text-xs text-gray-400 truncate max-w-[160px]">
                  {u.lastMessage}
                </p>
              </div>

              {u.unread ? (
                <span className="bg-red-500 text-xs px-2 py-0.5 rounded-full">
                  {u.unread}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>

    {/* CHAT */}
    <div
      className={`flex-1 flex flex-col ${
        !selectedUser ? "hidden md:flex" : "flex"
      }`}
    >

      {/* HEADER */}
      <div className="p-4 border-b border-white/10 flex items-center gap-3">

        {/* 🔙 BACK BUTTON (MOBILE) */}
        <button
          onClick={() => setSelectedUser(null)}
          className="md:hidden text-gray-400"
        >
          ←
        </button>

        <p className="font-semibold">
          {users.find((u) => u._id === selectedUser)?.email || "Chat"}
        </p>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m) => {
          const isAdmin = m.sender === "admin";

          return (
            <div
              key={m._id}
              className={`flex ${
                isAdmin ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[75%] px-4 py-2 rounded-xl text-sm
                ${
                  isAdmin
                    ? "bg-yellow-400 text-black"
                    : "bg-[#1A2235]"
                }`}
              >
                <p>{m.message}</p>

                <div className="flex justify-end text-[10px] mt-1 opacity-70 gap-1">
                  {m.createdAt
                    ? new Date(m.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""}

                  {isAdmin && m.status && (
                    <span>
                      {m.status === "sent" && "✓"}
                      {m.status === "delivered" && "✓✓"}
                      {m.status === "read" && "✓✓"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {typing && (
          <p className="text-xs text-gray-400">Typing...</p>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      {selectedUser && (
        <div className="p-3 border-t border-white/10 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 bg-[#131A2A] px-4 py-2 rounded-full outline-none"
          />

          <button
            onClick={sendMessage}
            className="bg-yellow-400 text-black px-5 rounded-full font-medium"
          >
            Send
          </button>
        </div>
      )}
    </div>
  </div>
);
}