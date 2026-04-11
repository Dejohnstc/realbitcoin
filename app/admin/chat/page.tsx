"use client";

import { useState, useRef, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { useRouter } from "next/navigation";

interface UserChat {
  _id: string;
  lastMessage: string;
  unread?: number;
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
    <div className="flex h-screen text-white">

      {/* USERS */}
      <div className="w-1/3 bg-[#0B0F19] border-r border-gray-800 p-3 overflow-y-auto">
        <button
          onClick={fetchUsers}
          className="mb-3 bg-yellow-400 text-black px-3 py-1 rounded"
        >
          Load Chats
        </button>

        {users.map((u) => (
          <div
            key={u._id}
            onClick={() => handleSelect(u._id)}
            className="p-3 bg-[#131A2A] mb-2 rounded cursor-pointer hover:bg-[#1A2235] flex justify-between"
          >
            <div>
              <p className="text-sm flex gap-2">
                {u._id}
                {onlineUsers.includes(u._id) && (
                  <span className="text-green-400">●</span>
                )}
              </p>
              <p className="text-xs text-gray-400">
                {u.lastMessage}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* CHAT */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-4 overflow-y-auto">
          {messages.map((m) => (
            <div key={m._id} className="mb-2">
              {m.message}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 border-t border-gray-800 flex">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-[#131A2A] p-2 rounded"
          />
          <button
            onClick={sendMessage}
            className="ml-2 bg-yellow-400 text-black px-4 rounded"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}