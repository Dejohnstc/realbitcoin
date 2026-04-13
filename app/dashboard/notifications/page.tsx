"use client";

import { useState, useMemo } from "react";
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
  const { notifications, markOneRead } = useNotifications();

  // 🔥 SAFE FALLBACK (FIX)
  const safeNotifications = notifications || [];

  const [tab, setTab] = useState<Tab>("all");
  const [selected, setSelected] = useState<Notification | null>(null);

  // 🔥 FILTER (FIXED DEPENDENCY)
  const filtered = useMemo(() => {
    return tab === "all"
      ? safeNotifications
      : safeNotifications.filter((n) => n.type === tab);
  }, [tab, safeNotifications]);

  // 🔥 GROUPING
  const grouped = useMemo(() => {
    const today: Notification[] = [];
    const earlier: Notification[] = [];

    const now = new Date();

    filtered.forEach((n) => {
      if (!n.createdAt) return earlier.push(n);

      const date = new Date(n.createdAt);

      const isToday =
        date.toDateString() === now.toDateString();

      if (isToday) today.push(n);
      else earlier.push(n);
    });

    return { today, earlier };
  }, [filtered]);

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

    if (n.message.includes("bonus")) return "Trading Bonus";
    if (n.message.includes("completed")) return "Earnings Completed";

    return "Profit Update";
  };

  const getIcon = (n: Notification) => {
    if (n.type === "deposit") return "💰";
    if (n.type === "withdraw") return "📤";
    if (n.message.includes("bonus")) return "🎁";
    if (n.message.includes("completed")) return "✅";

    return "📈";
  };

  return (
    <div className="pt-4 px-4 pb-24">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Notifications
        </h1>

        <button
          onClick={() => router.push("/dashboard")}
          className="text-sm text-yellow-400 border border-yellow-400 px-3 py-1 rounded-lg hover:bg-yellow-400 hover:text-black transition"
        >
          Back
        </button>
      </div>

      {/* TABS */}
      <div className="flex gap-3 mb-6 overflow-x-auto">
        {(["all", "deposit", "withdraw", "system"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm capitalize transition ${
              tab === t
                ? "bg-yellow-400 text-black font-semibold"
                : "bg-[#131A2A] text-gray-300 hover:bg-[#1A2235]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* LIST */}
      <div className="space-y-6">

        {grouped.today.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 mb-2">Today</p>

            <div className="space-y-3">
              {grouped.today.map((n) => (
                <Item key={n.id} n={n} onClick={handleOpen} getIcon={getIcon} getTitle={getTitle} />
              ))}
            </div>
          </div>
        )}

        {grouped.earlier.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 mb-2">Earlier</p>

            <div className="space-y-3">
              {grouped.earlier.map((n) => (
                <Item key={n.id} n={n} onClick={handleOpen} getIcon={getIcon} getTitle={getTitle} />
              ))}
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="bg-[#131A2A] p-6 rounded-xl text-center text-gray-400">
            No notifications yet
          </div>
        )}
      </div>

      {/* MODAL */}
      {selected && (
        <>
          <div
            className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          />

          <div className="fixed z-50 top-1/2 left-1/2 w-[90%] max-w-md -translate-x-1/2 -translate-y-1/2 bg-[#131A2A] p-6 rounded-2xl border border-gray-800 shadow-xl">

            <h3 className="font-semibold text-lg mb-3">
              {getTitle(selected)}
            </h3>

            <p className="text-sm text-gray-300 mb-3">
              {selected.message}
            </p>

            {selected.meta?.amount && (
              <p className="text-green-400 font-semibold text-lg">
                +${selected.meta.amount}
              </p>
            )}

            <button
              onClick={() => setSelected(null)}
              className="mt-5 w-full bg-yellow-400 text-black py-2 rounded-lg hover:opacity-90"
            >
              Close
            </button>
          </div>
        </>
      )}
    </div>
  );
}

type ItemProps = {
  n: Notification;
  onClick: (n: Notification) => void;
  getIcon: (n: Notification) => string;
  getTitle: (n: Notification) => string;
};

function Item({ n, onClick, getIcon, getTitle }: ItemProps) {
  return (
    <div
      onClick={() => onClick(n)}
      className={`p-4 rounded-xl border cursor-pointer flex items-center gap-3 transition transform hover:scale-[1.01] ${
        n.read
          ? "bg-[#0F1525] opacity-70 border-white/5"
          : "bg-gradient-to-r from-[#131A2A] to-[#1A2235] border-yellow-400/30 shadow"
      }`}
    >
      <div className="text-xl">{getIcon(n)}</div>

      <div className="flex-1">
        <p className="text-sm font-semibold">
          {getTitle(n)}
        </p>

        <p className="text-xs text-gray-400 truncate">
          {n.message}
        </p>
      </div>

      {!n.read && (
        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
      )}
    </div>
  );
}