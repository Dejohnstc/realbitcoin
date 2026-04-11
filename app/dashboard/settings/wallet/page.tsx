"use client";

import { useEffect, useState } from "react";

export default function WalletPage() {
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    let ignore = false;

    (async () => {
      const token = localStorage.getItem("token");

      const res = await fetch("/api/user", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!ignore) setBalance(data.balance || 0);
    })();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white p-6">

      <h1 className="text-xl font-bold mb-6">Wallet</h1>

      <div className="bg-[#131A2A] p-4 rounded-xl">
        <p className="text-gray-400">Available Balance</p>
        <h2 className="text-2xl font-bold">
          ${balance.toFixed(2)}
        </h2>
      </div>

    </div>
  );
}