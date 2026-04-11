"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Deposit {
  _id: string;
  userId: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
}

export default function AdminDepositsPage() {
  const router = useRouter();

  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔒 ADMIN PROTECTION
  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    const adminData = localStorage.getItem("admin_data");

    let role = null;

    try {
      role = adminData ? JSON.parse(adminData).role : null;
    } catch {}

    if (!token || role !== "admin") {
      router.replace("/admin/login");
      return;
    }

    const load = async () => {
      try {
        const res = await fetch("/api/admin/deposits", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (res.ok && Array.isArray(data.deposits)) {
          setDeposits(data.deposits);
        }
      } catch {
        console.log("Failed to fetch deposits");
      }

      setLoading(false);
    };

    load();
  }, [router]);

  // 🔥 PREVENT HYDRATION + BLOCK ACCESS
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("admin_token");
  const adminData = localStorage.getItem("admin_data");

  let role = null;

  try {
    role = adminData ? JSON.parse(adminData).role : null;
  } catch {}

  if (!token || role !== "admin") return null;

  // ✅ APPROVE / REJECT
  const handleAction = async (
    id: string,
    action: "approve" | "reject"
  ) => {
    const token = localStorage.getItem("admin_token");

    await fetch("/api/admin/approve-deposit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        depositId: id,
        action,
      }),
    });

    setDeposits((prev) =>
      prev.map((d) =>
        d._id === id
          ? {
              ...d,
              status:
                action === "approve" ? "approved" : "rejected",
            }
          : d
      )
    );
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white p-6">

      <h1 className="text-2xl font-bold mb-6">
        Deposits (Admin)
      </h1>

      {loading ? (
        <p>Loading...</p>
      ) : deposits.length === 0 ? (
        <p>No deposits yet</p>
      ) : (
        <div className="space-y-4">

          {deposits.map((dep) => (
            <div
              key={dep._id}
              className="bg-[#131A2A] p-4 rounded-xl flex justify-between items-center"
            >
              <div>
                <p className="text-sm text-gray-400">
                  User: {dep.userId}
                </p>

                <p className="text-lg font-bold">
                  ${dep.amount}
                </p>

                <p
                  className={`text-xs mt-1 ${
                    dep.status === "pending"
                      ? "text-yellow-400"
                      : dep.status === "approved"
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {dep.status.toUpperCase()}
                </p>
              </div>

              {dep.status === "pending" && (
                <div className="flex gap-2">

                  <button
                    onClick={() =>
                      handleAction(dep._id, "approve")
                    }
                    className="bg-green-500 px-3 py-1 rounded text-black font-semibold"
                  >
                    Approve
                  </button>

                  <button
                    onClick={() =>
                      handleAction(dep._id, "reject")
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