"use client";

import { useEffect, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Repeat,
  RefreshCcw,
  Eye,
  EyeOff,
} from "lucide-react";

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
  const [hideBalance, setHideBalance] = useState(false);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("user_token");

        const [userRes, marketRes] = await Promise.all([
          fetch("/api/user/me", {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }),
          fetch("/api/markets", { cache: "no-store" }),
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

    // 🔥 auto refresh + flash
    const interval = setInterval(() => {
      setFlash(true);
      setTimeout(() => setFlash(false), 300);
      load();
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading...
      </div>
    );
  }

  const totalUSD = user.balance;

  const btcPrice =
    markets.find((m) => m.symbol === "btc")?.current_price || 0;

  const totalBTC = btcPrice ? totalUSD / btcPrice : 0;

  const maskedEmail =
    user.email?.replace(/(.{3}).+(@.+)/, "$1***$2") || "user";

  // 🔥 COIN ICONS
  const coinIcons: Record<string, string> = {
  btc: "https://cryptologos.cc/logos/bitcoin-btc-logo.png?v=029",
  eth: "https://cryptologos.cc/logos/ethereum-eth-logo.png?v=029",
  bnb: "https://cryptologos.cc/logos/bnb-bnb-logo.png?v=029",
  sol: "https://cryptologos.cc/logos/solana-sol-logo.png?v=029",
  usdt: "https://cryptologos.cc/logos/tether-usdt-logo.png?v=029",
  xrp: "https://cryptologos.cc/logos/xrp-xrp-logo.png?v=029",
};

  return (
    <div className="min-h-screen bg-black text-white px-4 pt-4 pb-24">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-500 text-sm">{maskedEmail}</p>

        <button
          onClick={() => setHideBalance(!hideBalance)}
          className="text-gray-400"
        >
          {hideBalance ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {/* TOTAL ASSETS */}
      <div className="bg-gradient-to-br from-[#131A2A] to-[#0B0F19] p-5 rounded-2xl mb-6 border border-white/5 shadow-lg">

        <p className="text-gray-400 text-sm">Total Assets</p>

        <h1
          className={`text-4xl font-bold mt-2 transition ${
            flash ? "text-yellow-400" : ""
          }`}
        >
          {hideBalance ? "****" : totalUSD.toFixed(2)}{" "}
          <span className="text-lg">USD</span>
        </h1>

        <p className="text-gray-500 text-sm mt-1">
          {hideBalance ? "****" : `≈ ${totalBTC.toFixed(8)} BTC`}
        </p>

        <div className="flex justify-between mt-5 text-sm">
          <div>
            <p className="text-gray-400">Available</p>
            <p>
              {hideBalance ? "****" : `${totalUSD.toFixed(2)} USD`}
            </p>
          </div>

          <div>
            <p className="text-gray-400">In Use</p>
            <p>0.00 USD</p>
          </div>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex justify-between mb-8">

        {[
          {
            name: "Deposit",
            icon: ArrowDownLeft,
            path: "/dashboard/deposit",
            color: "bg-green-500",
          },
          {
            name: "Withdraw",
            icon: ArrowUpRight,
            path: "/dashboard/withdraw",
            color: "bg-red-500",
          },
          {
            name: "Transfer",
            icon: Repeat,
            path: "/dashboard",
            color: "bg-blue-500",
          },
          {
            name: "Convert",
            icon: RefreshCcw,
            path: "/dashboard",
            color: "bg-yellow-400 text-black",
          },
        ].map((btn, i) => {
          const Icon = btn.icon;

          return (
            <button
              key={i}
              onClick={() => (window.location.href = btn.path)}
              className="flex flex-col items-center gap-2"
            >
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg ${btn.color}`}
              >
                <Icon size={20} />
              </div>

              <p className="text-xs text-gray-300">{btn.name}</p>
            </button>
          );
        })}

      </div>

      {/* ASSETS */}
      <div className="space-y-4">

        {markets.slice(0, 6).map((m) => (
          <div
            key={m.symbol}
            className="flex justify-between items-center bg-[#131A2A] p-4 rounded-xl hover:bg-[#1A2235] transition cursor-pointer"
          >
            <div className="flex items-center gap-3">

              <img
                src={
                  coinIcons[m.symbol.toLowerCase()] ||
                  "https://cryptoicons.org/api/icon/btc/32"
                }
                alt={m.symbol}
                className="w-7 h-7 object-contain"
              />

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
            </div>

            <div className="text-right">
              <p>
                {hideBalance
                  ? "****"
                  : (user.balance / 1000).toFixed(8)}
              </p>

              <p className="text-xs text-gray-400">
                ${m.current_price.toLocaleString()}
              </p>
            </div>
          </div>
        ))}

      </div>

    </div>
  );
}