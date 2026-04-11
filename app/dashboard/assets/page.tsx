"use client";

import { useEffect, useState } from "react";

interface User {
  name: string;
  email: string;
  balance: number;
}

interface Market {
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
}

export default function AssetsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ FETCH USER + MARKETS
  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("user_token");

        const [userRes, marketRes] = await Promise.all([
          fetch("/api/user/me", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/markets"),
        ]);

        const userData = await userRes.json();
        const marketData = await marketRes.json();

        setUser(userData.user);
        setMarkets(marketData.markets || []);
      } catch (err) {
        console.log("Load error", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading...
      </div>
    );
  }

  // ✅ DERIVED DATA
  const totalUSD = user.balance;

  const btcPrice =
    markets.find((m) => m.symbol === "btc")?.current_price || 0;

  const totalBTC = btcPrice ? totalUSD / btcPrice : 0;

  const maskedEmail =
    user.email?.replace(/(.{3}).+(@.+)/, "$1***$2") || "user";

  return (
    <div className="min-h-screen bg-black text-white px-4 pt-4 pb-24">

      {/* USER */}
      <div className="flex justify-between mb-4">
        <p className="text-gray-400 text-sm">{maskedEmail}</p>
      </div>

      {/* TOTAL ASSETS */}
      <div className="mb-6">
        <p className="text-gray-400 text-sm">Total Assets</p>

        <h1 className="text-4xl font-bold mt-2">
          {totalUSD.toFixed(2)} <span className="text-lg">USD</span>
        </h1>

        <p className="text-gray-500 text-sm mt-1">
          ≈ {totalBTC.toFixed(8)} BTC
        </p>
      </div>

      {/* BALANCE */}
      <div className="flex justify-between mb-6">
        <div>
          <p className="text-gray-400 text-sm">Available</p>
          <p className="font-semibold">{totalUSD.toFixed(2)} USD</p>
        </div>

        <div>
          <p className="text-gray-400 text-sm">In Use</p>
          <p className="font-semibold">0.00 USD</p>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex justify-between mb-6">

        {[
          { name: "Deposit", path: "/dashboard/deposit" },
          { name: "Withdraw", path: "/dashboard/withdraw" },
          { name: "Transfer", path: "/dashboard" },
          { name: "Convert", path: "/dashboard" },
        ].map((btn, i) => (
          <button
            key={i}
            onClick={() => (window.location.href = btn.path)}
            className="flex flex-col items-center"
          >
            <div className="w-12 h-12 rounded-full bg-[#131A2A] flex items-center justify-center mb-1">
              {btn.name[0]}
            </div>
            <p className="text-xs">{btn.name}</p>
          </button>
        ))}

      </div>

      {/* ASSET LIST */}
      <div className="space-y-4">

        {markets.slice(0, 4).map((m) => (
          <div
            key={m.symbol}
            className="flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">
                {m.symbol.toUpperCase()}
              </p>

              <p
                className={`text-xs ${
                  m.price_change_percentage_24h > 0
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {m.price_change_percentage_24h.toFixed(2)}%
              </p>
            </div>

            <div className="text-right">
              <p>{(user.balance / 1000).toFixed(8)}</p>
              <p className="text-xs text-gray-400">
                ${m.current_price.toFixed(2)}
              </p>
            </div>
          </div>
        ))}

      </div>

    </div>
  );
}