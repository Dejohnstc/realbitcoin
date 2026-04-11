"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type User = {
  _id: string;
  email: string;
  balance: number;
  isSuspended?: boolean;
};

export default function AdminUsersPage() {
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem("admin_token");

      const res = await fetch("/api/admin/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      showToast("Failed to load users");
    }
  }, []);

  // 🔒 ADMIN PROTECTION + LOAD (FIXED)
  useEffect(() => {
    const token = localStorage.getItem("admin_token");

    if (!token) {
      router.replace("/admin/login");
      return;
    }

    // ✅ safe async call
    (async () => {
      await fetchUsers();
    })();
  }, [router, fetchUsers]);

  // 🔥 BLOCK SSR / UNAUTHORIZED
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("admin_token");

  if (!token) return null;

  const action = async (
    userId: string,
    actionType: string,
    amount?: number
  ) => {
    try {
      setLoading(true);

      const token = localStorage.getItem("admin_token");

      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, action: actionType, amount }),
      });

      const data = await res.json();

      if (!res.ok) {
        return showToast(data.error || "Action failed");
      }

      showToast("Action successful");
      fetchUsers();
    } catch {
      showToast("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white p-6">

      {/* TOAST */}
      {toast && (
        <div className="fixed top-6 right-6 bg-black px-4 py-2 rounded">
          {toast}
        </div>
      )}

      <h1 className="text-2xl font-bold mb-6">
        👑 Manage Users
      </h1>

      {users.map((u) => (
        <div
          key={u._id}
          className="bg-[#131A2A] p-4 rounded-xl mb-3"
        >
          <p className="font-semibold">{u.email}</p>

          <p className="text-sm text-gray-400">
            Balance: ${u.balance}
          </p>

          <p
            className={
              u.isSuspended
                ? "text-red-400 text-xs"
                : "text-green-400 text-xs"
            }
          >
            {u.isSuspended ? "Suspended" : "Active"}
          </p>

          {/* ACTIONS */}
          <div className="flex gap-2 mt-3 flex-wrap">

            <button
              disabled={loading}
              onClick={() => {
                const amt = prompt("Enter amount");
                if (!amt) return;
                action(u._id, "add_balance", Number(amt));
              }}
              className="bg-green-500 px-3 py-1 rounded text-black"
            >
              + Balance
            </button>

            {!u.isSuspended ? (
              <button
                disabled={loading}
                onClick={() => action(u._id, "suspend")}
                className="bg-yellow-500 px-3 py-1 rounded text-black"
              >
                Suspend
              </button>
            ) : (
              <button
                disabled={loading}
                onClick={() => action(u._id, "unsuspend")}
                className="bg-blue-500 px-3 py-1 rounded"
              >
                Unsuspend
              </button>
            )}

            <button
              disabled={loading}
              onClick={() => action(u._id, "delete")}
              className="bg-red-500 px-3 py-1 rounded"
            >
              Delete
            </button>

          </div>
        </div>
      ))}

    </div>
  );
}