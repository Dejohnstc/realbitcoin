"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  Wallet,
  ArrowDownCircle,
  Users,
  MessageCircle,
  Gift,
} from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    const token = localStorage.getItem("admin_token");
    const adminData = localStorage.getItem("admin_data");

    let role = null;

    try {
      role = adminData ? JSON.parse(adminData).role : null;
    } catch {}

    if (!token || role !== "admin") {
      router.replace("/admin/login");
    }
  }, [router]);

  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("admin_token");
  const adminData = localStorage.getItem("admin_data");

  let role = null;

  try {
    role = adminData ? JSON.parse(adminData).role : null;
  } catch {}

  if (!token || role !== "admin") return null;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white p-6">

      {/* HEADER */}
      <h1 className="text-2xl font-bold mb-2">
        Admin Dashboard
      </h1>

      <p className="text-gray-400 mb-8">
        Manage your platform operations
      </p>

      {/* GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* DEPOSITS */}
        <div
          onClick={() => router.push("/admin/deposits")}
          className="p-5 bg-[#131A2A] rounded-xl cursor-pointer hover:bg-[#1A2235] transition flex items-center gap-4"
        >
          <Wallet className="text-green-400" />
          <div>
            <h2 className="font-semibold">Deposits</h2>
            <p className="text-sm text-gray-400">
              Approve or reject deposits
            </p>
          </div>
        </div>

        {/* WITHDRAWALS */}
        <div
          onClick={() => router.push("/admin/withdrawals")}
          className="p-5 bg-[#131A2A] rounded-xl cursor-pointer hover:bg-[#1A2235] transition flex items-center gap-4"
        >
          <ArrowDownCircle className="text-red-400" />
          <div>
            <h2 className="font-semibold">Withdrawals</h2>
            <p className="text-sm text-gray-400">
              Process user withdrawals
            </p>
          </div>
        </div>

        {/* USERS */}
        <div
          onClick={() => router.push("/admin/users")}
          className="p-5 bg-[#131A2A] rounded-xl cursor-pointer hover:bg-[#1A2235] transition flex items-center gap-4"
        >
          <Users className="text-blue-400" />
          <div>
            <h2 className="font-semibold">Users</h2>
            <p className="text-sm text-gray-400">
              Manage user accounts
            </p>
          </div>
        </div>

        {/* CHAT */}
        <div
          onClick={() => router.push("/admin/chat")}
          className="p-5 bg-[#131A2A] rounded-xl cursor-pointer hover:bg-[#1A2235] transition flex items-center gap-4"
        >
          <MessageCircle className="text-purple-400" />
          <div>
            <h2 className="font-semibold">Live Chat</h2>
            <p className="text-sm text-gray-400">
              Chat with users
            </p>
          </div>
        </div>

        {/* 🔥 NEW: BONUS */}
        <div
          onClick={() => router.push("/admin/earn-bonus")}
          className="p-5 bg-gradient-to-r from-[#131A2A] to-[#1A2235] rounded-xl cursor-pointer hover:scale-[1.02] transition flex items-center gap-4 border border-yellow-400/20"
        >
          <Gift className="text-yellow-400" />
          <div>
            <h2 className="font-semibold">Add Bonus</h2>
            <p className="text-sm text-gray-400">
              Reward users with trading bonuses
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}