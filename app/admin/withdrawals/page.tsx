"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Withdraw {
  _id: string;
  userId: string;
  amount: number;
  wallet: string;
  coin?: string;
  network?: string;
  meta?: {
    accountName?: string;
    bankName?: string;
    country?: string;
  };
  status: "pending" | "approved" | "rejected";
}

export default function AdminWithdrawalsPage() {
  const router = useRouter();

  const [withdrawals, setWithdrawals] = useState<Withdraw[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  const fetchWithdrawals = async () => {
    const token = localStorage.getItem("admin_token");

    try {
      const res = await fetch("/api/admin/withdrawals", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setWithdrawals(data.withdrawals || []);
      }
    } catch {
      console.log("Failed to fetch withdrawals");
    }

    setLoading(false);
  };

  useEffect(() => {
  const token = localStorage.getItem("admin_token");

  // 🔥 redirect only (no setState)
  if (!token) {
    router.replace("/admin/login");
    return;
  }

  // 🔥 defer fetch (prevents warning)
  setTimeout(() => {
    fetchWithdrawals();
  }, 0);

}, [router]);

  if (hasToken === null) return null;
  if (!hasToken) return null;

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

          {withdrawals.map((w) => {
            const method =
              w.coin === "BANK"
                ? "Bank Transfer"
                : w.coin === "MONEYGRAM"
                ? "MoneyGram / Western Union"
                : w.coin === "MUKURU"
                ? "Mukuru"
                : "Crypto";

            return (
              <div
                key={w._id}
                className="bg-[#131A2A] p-4 rounded-xl flex justify-between items-start"
              >
                <div className="space-y-1">

                  <p className="text-xs text-gray-400">
                    User: {w.userId}
                  </p>

                  <p className="text-lg font-bold">
                    ${w.amount}
                  </p>

                  {/* METHOD */}
                  <p className="text-sm text-yellow-400">
                    {method}
                  </p>

                  {/* DETAILS */}
                  {method === "Crypto" ? (
                    <>
                      <p className="text-xs text-gray-400 break-all">
                        {w.wallet}
                      </p>
                      <p className="text-xs text-gray-500">
                        {w.coin} • {w.network}
                      </p>
                    </>
                  ) : (
                    <>
                      {w.meta?.accountName && (
                        <p className="text-xs">
                          Name: {w.meta.accountName}
                        </p>
                      )}

                      {w.meta?.bankName && (
                        <p className="text-xs">
                          Bank: {w.meta.bankName}
                        </p>
                      )}

                      {w.wallet && (
                        <p className="text-xs break-all">
                          Account: {w.wallet}
                        </p>
                      )}

                      {w.meta?.country && (
                        <p className="text-xs">
                          Location: {w.meta.country}
                        </p>
                      )}
                    </>
                  )}

                  {/* STATUS */}
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
            );
          })}

        </div>
      )}
    </div>
  );
}