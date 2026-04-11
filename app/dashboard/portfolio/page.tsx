"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Wallet,
  TrendingUp,
  Lock,
  Unlock,
} from "lucide-react";

interface Investment {
  _id: string;
  amount: number;
  profit: number;
  status: "active" | "completed";
}

interface Earning {
  earnedSoFar: number;
  progress: number;
  targetAmount: number;
  status: "active" | "completed";
}

export default function PortfolioPage() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [userBalance, setUserBalance] = useState(0); // ✅ FIX
  const [earning, setEarning] = useState<Earning | null>(null);

  const router = useRouter();

  // ✅ FETCH USER BALANCE (CRITICAL FIX)
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

  // ✅ FETCH INVESTMENTS (unchanged)
  useEffect(() => {
    let ignore = false;

    (async () => {
      try {
        const token = localStorage.getItem("user_token");

        const res = await fetch("/api/invest", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        if (ignore) return;

        const invs: Investment[] = Array.isArray(data.investments)
          ? data.investments
          : [];

        setInvestments(invs);
      } catch (err) {
        console.log(err);
      }
    })();

    return () => {
      ignore = true;
    };
  }, []);

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

  // ✅ START EARNING
  const startEarning = async () => {
    try {
      const token = localStorage.getItem("user_token");

      const res = await fetch("/api/earn/start", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error);
      }
    } catch (err) {
      console.log(err);
    }
  };

  // ✅ FIXED BALANCE (NO BUG)
  
const displayBalance =
  userBalance + (earning?.earnedSoFar || 0);
  const roi =
    userBalance > 0 && earning
      ? (earning.earnedSoFar / userBalance) * 100
      : 0;

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

      {/* BALANCE */}
      <div className="bg-gradient-to-r from-[#131A2A] to-[#1A2235] p-5 rounded-2xl mb-4 shadow-lg">

        <p className="text-gray-400 text-sm">Total Balance</p>

        <h2 className="text-3xl font-bold mt-1">
  ${displayBalance.toFixed(2)}
</h2>

        {earning?.status === "active" && (
          <p className="text-yellow-400 text-sm mt-2 flex items-center gap-1">
            <Lock size={14} /> Earning in progress
          </p>
        )}

        {earning?.status === "completed" && (
          <p className="text-green-400 text-sm mt-2 flex items-center gap-1">
            <Unlock size={14} /> Earnings available
          </p>
        )}
      </div>

      {/* EARN CARD */}
      <div className="bg-[#131A2A] p-5 rounded-2xl mb-6 shadow-lg border border-gray-800">

        <div className="flex justify-between items-center mb-2">
          <p className="text-gray-400 text-sm">Earn Balance</p>
          <TrendingUp className="text-green-400" size={18} />
        </div>

        <h2 className="text-2xl font-bold text-green-400">
          +${(earning?.earnedSoFar || 0).toFixed(2)}
        </h2>

        <p className="text-sm text-gray-400 mt-1">
          ROI: {roi.toFixed(2)}%
        </p>

        <div className="mt-4 h-2 bg-[#0B0F19] rounded-full">
          <div
            className="h-full bg-green-400"
            style={{ width: `${earning?.progress || 0}%` }}
          />
        </div>

        {/* 🔥 FIXED BUTTON */}
        {!earning && userBalance > 0 && (
          <button
            onClick={startEarning}
            className="mt-4 w-full bg-yellow-400 text-black py-2 rounded-xl font-semibold"
          >
            Start Earning
          </button>
        )}
      </div>

      {/* EMPTY */}
      {userBalance === 0 && (
        <div className="bg-[#131A2A] p-6 rounded-xl text-center text-gray-400">
          No balance available
        </div>
      )}
    </div>
  );
}