"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Withdraw {
  _id: string;
  userId: string;

  amount: number;

  method?: "CRYPTO" | "BANK" | "MONEYGRAM" | "MUKURU";

  wallet?: string;

  coin?: string;
  network?: string;

  accountName?: string;
  bankName?: string;
  country?: string;

  status: "pending" | "approved" | "rejected";
}

export default function AdminWithdrawalsPage() {
  const router = useRouter();

  const [withdrawals, setWithdrawals] = useState<Withdraw[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWithdrawals = async () => {
    const token = localStorage.getItem("admin_token");

    if (!token) {
      router.replace("/admin/login");
      return;
    }

    try {
      const res = await fetch("/api/admin/withdrawals", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setWithdrawals(data.withdrawals || []);
      } else if (res.status === 401 || res.status === 403) {
        router.replace("/admin/login");
      }
    } catch {
      console.log("Failed to fetch withdrawals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("admin_token");

    if (!token) {
      router.replace("/admin/login");
      return;
    }

    setTimeout(() => {
      fetchWithdrawals();
    }, 0);
  }, [router]);

  const handleAction = async (
    id: string,
    action: "approve" | "reject"
  ) => {
    const token = localStorage.getItem("admin_token");

    try {
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
    } catch (err) {
      console.error("Action failed", err);
    }
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
              w.method === "BANK"
                ? "Bank Transfer"
                : w.method === "MONEYGRAM"
                ? "MoneyGram / Western Union"
                : w.method === "MUKURU"
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

                  <p className="text-sm text-yellow-400">
                    {method}
                  </p>

                  {w.method === "CRYPTO" ? (
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
                      {w.accountName && (
                        <p className="text-xs">
                          Name: {w.accountName}
                        </p>
                      )}

                      {w.bankName && (
                        <p className="text-xs">
                          Bank: {w.bankName}
                        </p>
                      )}

                      {w.wallet && (
                        <p className="text-xs break-all">
                          Account: {w.wallet}
                        </p>
                      )}

                      {w.country && (
                        <p className="text-xs">
                          Location: {w.country}
                        </p>
                      )}
                    </>
                  )}

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