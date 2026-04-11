"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/context/NotificationContext";

type Tab = "all" | "deposit" | "withdraw" | "system";

interface Notification {
  id: string;
  message: string;
  read: boolean;
  type?: "deposit" | "withdraw" | "system";
  createdAt?: string;

  meta?: {
    amount?: number;
    coin?: string;
    network?: string;
  };
}

export default function NotificationsPage() {
  const router = useRouter();
  const { notifications = [], markOneRead } = useNotifications(); // ✅ SAFE DEFAULT

  const [tab, setTab] = useState<Tab>("all");
  const [selected, setSelected] = useState<Notification | null>(null);

  const filtered =
    tab === "all"
      ? notifications
      : notifications.filter((n) => n.type === tab);

  const handleOpen = async (n: Notification) => {
    setSelected(n);
    markOneRead(n.id);

    try {
      const token = localStorage.getItem("user_token");

      await fetch("/api/notifications/read-one", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: n.id }),
      });
    } catch {}
  };

  const getTitle = (n: Notification) => {
    if (n.type === "deposit") return "Deposit Successful";
    if (n.type === "withdraw") return "Withdrawal Update";
    return "System Notification";
  };

  const getSubtitle = (n: Notification) => {
    if (!n.meta) return n.message;

    if (n.type === "deposit") {
      return `$${n.meta.amount} • ${n.meta.coin?.toUpperCase()} ${n.meta.network}`;
    }

    if (n.type === "withdraw") {
      return `$${n.meta.amount}`;
    }

    return n.message;
  };

  const getIcon = (type?: Notification["type"]) => {
    if (type === "deposit") return "💰";
    if (type === "withdraw") return "📤";
    return "🔔";
  };

  return (
    <div className="pt-4 px-4">

      {/* BACK */}
      <button
        onClick={() => router.push("/dashboard")}
        className="mb-4 px-3 py-1 border border-yellow-400 text-yellow-400 rounded-lg text-sm"
      >
        Back
      </button>

      {/* TABS */}
      <div className="flex gap-3 mb-6 overflow-x-auto">
        {(["all", "deposit", "withdraw", "system"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm capitalize whitespace-nowrap transition ${
              tab === t
                ? "bg-yellow-400 text-black font-semibold"
                : "bg-[#131A2A] text-gray-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* LIST */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="bg-[#131A2A] p-6 rounded-xl text-center text-gray-400">
            No notifications
          </div>
        )}

        {filtered.map((n) => (
          <div
            key={n.id}
            onClick={() => handleOpen(n)}
            className={`p-4 rounded-xl border cursor-pointer flex items-center gap-3 transition ${
              n.read
                ? "bg-[#0F1525] opacity-70 border-white/5"
                : "bg-[#131A2A] border-yellow-400/30 hover:bg-[#1A2235]"
            }`}
          >
            {/* ICON */}
            <div className="text-xl">{getIcon(n.type)}</div>

            {/* CONTENT */}
            <div className="flex-1">
              <p className="text-sm font-semibold">
                {getTitle(n)}
              </p>

              <p className="text-xs text-gray-400">
                {getSubtitle(n)}
              </p>

              {n.createdAt && (
                <p className="text-[10px] text-gray-500 mt-1">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              )}
            </div>

            {/* UNREAD DOT */}
            {!n.read && (
              <div className="w-2 h-2 bg-yellow-400 rounded-full" />
            )}
          </div>
        ))}
      </div>

      {/* MODAL */}
      {selected && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40"
            onClick={() => setSelected(null)}
          />

          <div className="fixed z-50 top-1/2 left-1/2 w-[90%] max-w-md -translate-x-1/2 -translate-y-1/2 bg-[#131A2A] p-5 rounded-xl border border-gray-800">

            <h3 className="font-semibold mb-3">
              {getTitle(selected)}
            </h3>

            <p className="text-sm text-gray-300 mb-3">
              {getSubtitle(selected)}
            </p>

            {selected.createdAt && (
              <p className="text-xs text-gray-500">
                {new Date(selected.createdAt).toLocaleString()}
              </p>
            )}

            <button
              onClick={() => setSelected(null)}
              className="mt-4 w-full bg-yellow-400 text-black py-2 rounded-lg"
            >
              Close
            </button>
          </div>
        </>
      )}
    </div>
  );
}