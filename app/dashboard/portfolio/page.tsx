"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Wallet,
  TrendingUp,
  Lock,
} from "lucide-react";

interface Earning {
  earnedSoFar: number;
  progress: number;
  targetAmount: number;
  depositAmount: number;
  status: "active" | "completed";
}

export default function PortfolioPage() {
  const [userBalance, setUserBalance] = useState(0);
  const [earning, setEarning] = useState<Earning | null>(null);

  const [displayValue, setDisplayValue] = useState(0);
  const [isUp, setIsUp] = useState(true);

  const router = useRouter();
  const frameRef = useRef<number | null>(null);
  const [trades, setTrades] = useState<
  { id: number; text: string; type: "buy" | "sell" }[]
>([]);

  // ✅ FETCH USER
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem("user_token");

        const res = await fetch("/api/user/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        setUserBalance(data.user?.balance || 0);
      } catch (err) {
        console.log(err);
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
  if (!earning) return;

  let id = 0;

  const coins = ["BTC", "ETH", "SOL", "BNB", "XRP"];

  const interval = setInterval(() => {
    const isBuy = Math.random() > 0.4;

    const amount = (Math.random() * 500 + 20).toFixed(2);
    const coin = coins[Math.floor(Math.random() * coins.length)];

   const trade: {
  id: number;
  type: "buy" | "sell";
  text: string;
} = {
  id: id++,
  type: isBuy ? "buy" : "sell",
  text: `${isBuy ? "Buy" : "Sell"} ${coin} ${
    isBuy ? "+" : "-"
  }$${amount}`,
};

    setTrades((prev) => [...prev.slice(-5), trade]);

    // auto remove after 5s
    setTimeout(() => {
      setTrades((prev) => prev.filter((t) => t.id !== trade.id));
    }, 5000);
  }, 2000);

  return () => clearInterval(interval);
}, [earning]);
  // ✅ FETCH EARNING
  useEffect(() => {
    const loadEarning = async () => {
      try {
        const token = localStorage.getItem("user_token");

        const res = await fetch("/api/earn/status", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        setEarning(data.earning || null);
      } catch (err) {
        console.log(err);
      }
    };

    loadEarning();

    const interval = setInterval(loadEarning, 5000);
    return () => clearInterval(interval);
  }, []);

  // 🔥 BASE REAL VALUE
  const realTotal =
    earning?.status === "active"
      ? (earning.depositAmount || 0) + (earning.earnedSoFar || 0)
      : userBalance;

  // 🔥 SAFE TRADING SIMULATION
  useEffect(() => {
    if (!earning) return;

    if (frameRef.current) cancelAnimationFrame(frameRef.current);

    let current = realTotal;

    const animate = () => {
      const change = current * (Math.random() * 0.01 - 0.005);
      const next = current + change;

      setDisplayValue(next);
      setIsUp(next > current);

      current = next;

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [realTotal, earning]);

  // fallback
  useEffect(() => {
    if (!earning) setDisplayValue(userBalance);
  }, [earning, userBalance]);

  // 🔥 LOCKED
  const locked =
    earning?.status === "active"
      ? (earning.depositAmount || 0) + (earning.earnedSoFar || 0)
      : 0;

  const roi =
    earning && earning.depositAmount > 0
      ? (earning.earnedSoFar / earning.depositAmount) * 100
      : 0;

  // ✅ START
  const startEarning = async () => {
    try {
      const token = localStorage.getItem("user_token");

      await fetch("/api/earn/start", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white px-4 pb-24">

      {/* BACK */}
      <button
        onClick={() => router.back()}
        className="mt-4 mb-4 flex items-center gap-2 text-gray-400"
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* HEADER */}
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Wallet size={22} /> Portfolio
      </h1>

      {/* TOTAL */}
      <div className="bg-gradient-to-br from-[#131A2A] to-[#1A2235] p-6 rounded-2xl mb-5 shadow-xl border border-gray-800">

        <p className="text-gray-400 text-sm mb-1">Total Balance</p>

        <h2
          className={`text-3xl font-bold transition-all duration-300 ${
            isUp ? "text-green-400" : "text-red-400"
          }`}
        >
          ${displayValue.toFixed(2)}
        </h2>

        {earning?.status === "active" && (
          <p className="text-yellow-400 text-xs mt-2 flex items-center gap-1">
            <Lock size={12} /> Live trading simulation active
          </p>
        )}
      </div>

      {/* AVAILABLE / LOCKED */}
      <div className="flex gap-3 mb-6">

        <div className="bg-[#131A2A] p-4 rounded-xl flex-1 border border-gray-800">
          <p className="text-gray-400 text-xs flex items-center gap-1">
            <Wallet size={12} /> Available
          </p>
          <p className="font-semibold text-white mt-1">
            {earning ? "$0.00" : `$${userBalance.toFixed(2)}`}
          </p>
        </div>

        <div className="bg-[#131A2A] p-4 rounded-xl flex-1 border border-gray-800">
          <p className="text-gray-400 text-xs flex items-center gap-1">
            <Lock size={12} /> Locked
          </p>
          <p className="font-semibold text-yellow-400 mt-1">
            ${locked.toFixed(2)}
          </p>
        </div>

      </div>

      {/* EARN CARD */}
      <div className="bg-[#131A2A] p-5 rounded-2xl mb-6 border border-gray-800 shadow-lg">

        <div className="flex justify-between items-center mb-2">
          <p className="text-gray-400 text-sm">Earn Balance</p>
          <TrendingUp className="text-green-400" size={18} />
        </div>

        <h2 className="text-2xl font-bold text-green-400">
          +${earning?.earnedSoFar.toFixed(2) || "0.00"}
        </h2>

        <p className="text-sm text-gray-400 mt-1 flex items-center gap-1">
          <TrendingUp size={12} /> ROI: {roi.toFixed(2)}%
        </p>

        <div className="mt-4 h-2 bg-black rounded-full overflow-hidden">
          <div
            className="h-full bg-green-400"
            style={{
              width: `${earning?.progress || 0}%`,
              transition: "width 0.5s ease",
            }}
          />
        </div>

        {!earning && userBalance > 0 && (
          <button
            onClick={startEarning}
            className="mt-4 w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-black py-2 rounded-xl font-semibold shadow-md hover:opacity-90 transition"
          >
            Start Earning
          </button>
        )}
        <div className="fixed bottom-24 right-3 z-50 space-y-2">

  {trades.map((trade) => (
    <div
      key={trade.id}
      className={`px-3 py-2 rounded-lg text-xs shadow-lg backdrop-blur-md border
      ${
        trade.type === "buy"
          ? "bg-green-500/10 text-green-400 border-green-500/20"
          : "bg-red-500/10 text-red-400 border-red-500/20"
      } animate-slideUp`}
    >
      {trade.text}
    </div>
  ))}

</div>
      </div>
    </div>
  );
}