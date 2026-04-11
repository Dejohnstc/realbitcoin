"use client";

import { useEffect, useState } from "react";

interface Deposit {
  _id: string;
  amount: number;
  status: string;
  createdAt: string;
}

interface Withdraw {
  _id: string;
  amount: number;
  status: string;
  createdAt: string;
}

export default function HistoryPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdraw[]>([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem("user_token");

        if (!token) return;

        const [depRes, withRes] = await Promise.all([
          fetch("/api/user/deposits", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/user/withdrawals", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const depData = await depRes.json();
        const withData = await withRes.json();

        setDeposits(Array.isArray(depData.deposits) ? depData.deposits : []);
        setWithdrawals(
          Array.isArray(withData.withdrawals) ? withData.withdrawals : []
        );
      } catch (error) {
        console.error("History fetch failed:", error);
      }
    };

    fetchHistory();
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white p-6">
      <h1 className="text-xl font-bold mb-6">Transaction History</h1>

      {/* DEPOSITS */}
      <div className="mb-8">
        <h2 className="font-semibold mb-3">Deposits</h2>

        {deposits.length === 0 && (
          <p className="text-gray-400 text-sm">No deposits yet</p>
        )}

        {deposits.map((d) => (
          <div key={d._id} className="card mb-2">
            <p>${d.amount}</p>
            <p className="text-sm text-gray-400">{d.status}</p>
          </div>
        ))}
      </div>

      {/* WITHDRAWALS */}
      <div>
        <h2 className="font-semibold mb-3">Withdrawals</h2>

        {withdrawals.length === 0 && (
          <p className="text-gray-400 text-sm">No withdrawals yet</p>
        )}

        {withdrawals.map((w) => (
          <div key={w._id} className="card mb-2">
            <p>${w.amount}</p>
            <p className="text-sm text-gray-400">{w.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}