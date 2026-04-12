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
  endTime?: string;
}

export default function PortfolioPage() {
  const [userBalance, setUserBalance] = useState(0);
  const [earning, setEarning] = useState<Earning | null>(null);

  const [displayValue, setDisplayValue] = useState(0);
  const [isUp, setIsUp] = useState(true);

  const [ticker, setTicker] = useState<string[]>([]);
  const [countdown, setCountdown] = useState("");

  const router = useRouter();
  const frameRef = useRef<number | null>(null);

  // ✅ FETCH USER
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("user_token");

      const res = await fetch("/api/user/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setUserBalance(data.user?.balance || 0);
    };

    loadUser();
  }, []);

  // ✅ FETCH EARNING
  useEffect(() => {
    const loadEarning = async () => {
      const token = localStorage.getItem("user_token");

      const res = await fetch("/api/earn/status", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setEarning(data.earning || null);
    };

    loadEarning();
    const interval = setInterval(loadEarning, 5000);
    return () => clearInterval(interval);
  }, []);

  // 🔥 COUNTDOWN TIMER
  useEffect(() => {
    if (!earning?.endTime) return;

    const interval = setInterval(() => {
      const diff =
        new Date(earning.endTime!).getTime() - Date.now();

      if (diff <= 0) {
        setCountdown("Completed");
        return;
      }

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);

      setCountdown(`${d}d ${h}h ${m}m`);
    }, 1000);

    return () => clearInterval(interval);
  }, [earning]);

  // 🔥 TRADE TICKER
  useEffect(() => {
    if (!earning) return;

    const coins = ["BTC", "ETH", "SOL", "BNB", "XRP"];

    const interval = setInterval(() => {
      const isBuy = Math.random() > 0.4;
      const amount = (Math.random() * 500 + 20).toFixed(2);
      const coin = coins[Math.floor(Math.random() * coins.length)];

      const text = `${isBuy ? "🟢 Buy" : "🔴 Sell"} ${coin} ${
        isBuy ? "+" : "-"
      }$${amount}`;

      setTicker((prev) => [...prev.slice(-10), text]);
    }, 2000);

    return () => clearInterval(interval);
  }, [earning]);

  // 🔥 BASE
  const realTotal =
    earning?.status === "active"
      ? (earning.depositAmount || 0) + (earning.earnedSoFar || 0)
      : userBalance;

  // 🔥 ANIMATION
  // 🔥 ANIMATION (EASING VERSION)
useEffect(() => {
  if (!earning) return;

  if (frameRef.current) cancelAnimationFrame(frameRef.current);

  let current = realTotal;
  let target = realTotal;

  const animate = () => {
    // update target occasionally
    if (Math.random() < 0.05) {
      const change = current * (Math.random() * 0.02 - 0.01);
      target = current + change;
    }

    // smooth easing
    const next = current + (target - current) * 0.08;

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



  const locked =
    earning?.status === "active"
      ? (earning.depositAmount || 0) + (earning.earnedSoFar || 0)
      : 0;

  const roi =
    earning && earning.depositAmount > 0
      ? (earning.earnedSoFar / earning.depositAmount) * 100
      : 0;

  const startEarning = async () => {
    const token = localStorage.getItem("user_token");

    await fetch("/api/earn/start", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white px-4 pb-24">

      <button
        onClick={() => router.back()}
        className="mt-4 mb-4 flex items-center gap-2 text-gray-400"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <h1 className="text-2xl font-bold mb-3 flex items-center gap-2">
        <Wallet size={22} /> Portfolio
      </h1>

      {/* 🔥 SLIDER */}
      <div className="overflow-hidden mb-4 relative">
        <div className="flex gap-6 animate-scroll whitespace-nowrap text-sm">
          {ticker.map((t, i) => (
            <span key={i}>{t}</span>
          ))}
        </div>
      </div>

      {/* TOTAL */}
      <div className="bg-gradient-to-br from-[#131A2A] to-[#1A2235] p-6 rounded-2xl mb-5 border border-gray-800">

        <p className="text-gray-400 text-sm">Total Balance</p>

        <h2 className={`text-3xl font-bold ${
  earning
    ? isUp
      ? "text-green-400"
      : "text-red-400"
    : "text-white"
}`}>
        ${(earning ? displayValue : userBalance).toFixed(2)}
        </h2>

        {earning?.status === "active" && (
          <p className="text-yellow-400 text-xs mt-2 flex items-center gap-1">
            <Lock size={12} /> Trading • Ends in {countdown}
          </p>
        )}
      </div>

      {/* BALANCE */}
      <div className="flex gap-3 mb-6">

        <div className="bg-[#131A2A] p-4 rounded-xl flex-1">
          <p className="text-gray-400 text-xs">Available</p>
          <p>{earning ? "$0.00" : `$${userBalance.toFixed(2)}`}</p>
        </div>

        <div className="bg-[#131A2A] p-4 rounded-xl flex-1">
          <p className="text-gray-400 text-xs">Locked</p>
          <p className="text-yellow-400">${locked.toFixed(2)}</p>
        </div>

      </div>

      {/* EARN */}
      <div className="bg-[#131A2A] p-5 rounded-2xl">

        <div className="flex justify-between items-center">
          <p className="text-gray-400 text-sm">Earn Balance</p>
          <TrendingUp className="text-green-400" size={18} />
        </div>

        <h2 className="text-2xl text-green-400 font-bold">
          +${earning?.earnedSoFar.toFixed(2) || "0.00"}
        </h2>

        <p className="text-xs text-gray-400">
          ROI: {roi.toFixed(2)}%
        </p>

        {!earning && userBalance > 0 && (
          <button
            onClick={startEarning}
            className="mt-4 w-full bg-yellow-400 text-black py-2 rounded-xl"
          >
            Start Earning
          </button>
        )}
      </div>

      {/* 🔥 STYLE */}
      <style jsx>{`
        .animate-scroll {
          animation: scroll 20s linear infinite;
        }

        @keyframes scroll {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </div>
  );
}