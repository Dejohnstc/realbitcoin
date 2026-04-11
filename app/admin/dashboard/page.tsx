"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

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

    // 🔥 REDIRECT IF NOT ADMIN
    if (!token || role !== "admin") {
      router.replace("/admin/login");
    }
  }, [router]);

  // 🔥 PREVENT HYDRATION ERROR
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("admin_token");
  const adminData = localStorage.getItem("admin_data");

  let role = null;

  try {
    role = adminData ? JSON.parse(adminData).role : null;
  } catch {}

  // 🔥 BLOCK ACCESS UNTIL VALID
  if (!token || role !== "admin") return null;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white p-6">

      <h1 className="text-2xl font-bold mb-6">
        Admin Dashboard
      </h1>

      <p className="text-gray-400 mb-8">
        Manage users, deposits, and withdrawals
      </p>

      <div className="space-y-4">

        <div
          onClick={() => router.push("/admin/deposits")}
          className="p-5 bg-[#131A2A] rounded-xl cursor-pointer hover:bg-[#1A2235] transition"
        >
          <h2 className="font-semibold">Manage Deposits</h2>
          <p className="text-sm text-gray-400">
            Approve or reject user deposits
          </p>
        </div>

        <div
          onClick={() => router.push("/admin/withdrawals")}
          className="p-5 bg-[#131A2A] rounded-xl cursor-pointer hover:bg-[#1A2235] transition"
        >
          <h2 className="font-semibold">Manage Withdrawals</h2>
          <p className="text-sm text-gray-400">
            Approve or reject withdrawal requests
          </p>
        </div>

        <div
          onClick={() => router.push("/admin/users")}
          className="p-5 bg-[#131A2A] rounded-xl cursor-pointer hover:bg-[#1A2235] transition"
        >
          <h2 className="font-semibold">Manage Users</h2>
          <p className="text-sm text-gray-400">
            View and control user accounts
          </p>
        </div>

        <div
          onClick={() => router.push("/admin/chat")}
          className="p-5 bg-[#131A2A] rounded-xl cursor-pointer hover:bg-[#1A2235] transition"
        >
          <h2 className="font-semibold">Live Chat</h2>
          <p className="text-sm text-gray-400">
            Chat with users
          </p>
        </div>

      </div>
    </div>
  );
}