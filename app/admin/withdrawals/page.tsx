"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Withdraw {
  _id: string;
  userId: string;
  amount: number;
  wallet: string;
  status: "pending" | "approved" | "rejected";
}

export default function AdminWithdrawalsPage() {
  const router = useRouter();

  const [withdrawals, setWithdrawals] = useState<Withdraw[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchWithdrawals = async () => {
    const token = localStorage.getItem("admin_token");

    try {
      const res = await fetch("/api/admin/withdrawals", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data: { withdrawals?: Withdraw[] } = await res.json();

      if (res.ok && data.withdrawals) {
        setWithdrawals(data.withdrawals);
      }
    } catch {
      console.log("Failed to fetch withdrawals");
    }

    setLoading(false);
  };

  // 🔒 ADMIN PROTECTION + LOAD (FIXED)
  useEffect(() => {
    const token = localStorage.getItem("admin_token");

    if (!token) {
      router.replace("/admin/login");
      return;
    }

    // ✅ run async safely
    (async () => {
      await fetchWithdrawals();
    })();
  }, [router]);

  // 🔥 BLOCK SSR / UNAUTHORIZED
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("admin_token");

  if (!token) return null;

  const handleAction = async (
    id: string,
    action: "approve" | "reject"
  ) => {
    const token = localStorage.getItem("admin_token");

    await fetch("/api/admin/approve-withdraw", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        withdrawId: id,
        action,
      }),
    });

    fetchWithdrawals();
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white p-6">

      <h1 className="text-2xl font-bold mb-6">
        Withdrawals (Admin)
      </h1>

      {loading ? (
        <p>Loading...</p>
      ) : withdrawals.length === 0 ? (
        <p>No withdrawals yet</p>
      ) : (
        <div className="space-y-4">

          {withdrawals.map((w) => (
            <div
              key={w._id}
              className="bg-[#131A2A] p-4 rounded-xl flex justify-between items-center"
            >
              <div>
                <p className="text-sm text-gray-400">
                  User: {w.userId}
                </p>

                <p className="text-lg font-bold">
                  ${w.amount}
                </p>

                <p className="text-xs text-gray-400 break-all">
                  {w.wallet}
                </p>

                <p
                  className={`text-xs mt-1 ${
                    w.status === "pending"
                      ? "text-yellow-400"
                      : w.status === "approved"
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {w.status.toUpperCase()}
                </p>
              </div>

              {w.status === "pending" && (
                <div className="flex gap-2">

                  <button
                    onClick={() =>
                      handleAction(w._id, "approve")
                    }
                    className="bg-green-500 px-3 py-1 rounded text-black font-semibold"
                  >
                    Approve
                  </button>

                  <button
                    onClick={() =>
                      handleAction(w._id, "reject")
                    }
                    className="bg-red-500 px-3 py-1 rounded text-white"
                  >
                    Reject
                  </button>

                </div>
              )}
            </div>
          ))}

        </div>
      )}

    </div>
  );
}