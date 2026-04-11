"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Investment {
  _id: string;
  amount: number;
  profit: number;
  status: "active" | "completed";
}

export default function PortfolioPage() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [totalInvested, setTotalInvested] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);

  const [displayBalance, setDisplayBalance] = useState(0);
  const [displayProfit, setDisplayProfit] = useState(0);

  const router = useRouter();

  useEffect(() => {
    let ignore = false;

    (async () => {
      try {
        const token = localStorage.getItem("user_token");

        const res = await fetch("/api/invest", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (ignore) return;

        const invs = Array.isArray(data.investments)
          ? data.investments
          : [];

        setInvestments(invs);

        let invested = 0;
        let profit = 0;

        for (const inv of invs) {
          invested += inv.amount;

          if (inv.status === "completed") {
            profit += inv.amount * (inv.profit / 100);
          }
        }

        setTotalInvested(invested);
        setTotalProfit(profit);
      } catch (err) {
        console.log("Fetch error", err);
      }
    })();

    return () => {
      ignore = true;
    };
  }, []);

  // 🔥 ANIMATION (SAFE)
  useEffect(() => {
    let frame: number;

    const animate = () => {
      setDisplayBalance((prev) => {
        const target = totalInvested + totalProfit;
        const diff = target - prev;
        if (Math.abs(diff) < 0.01) return target;
        return prev + diff * 0.1;
      });

      setDisplayProfit((prev) => {
        const diff = totalProfit - prev;
        if (Math.abs(diff) < 0.01) return totalProfit;
        return prev + diff * 0.1;
      });

      frame = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(frame);
  }, [totalInvested, totalProfit]);

  const roi =
    totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white px-4 pb-24">

      {/* BACK */}
      <button
        onClick={() => router.back()}
        className="mt-4 mb-4 text-gray-400 hover:text-white"
      >
        ← Back
      </button>

      {/* HEADER */}
      <h1 className="text-2xl font-bold mb-4">
        💼 My Portfolio
      </h1>

      {/* SUMMARY */}
      <div className="bg-gradient-to-r from-[#131A2A] to-[#1A2235] p-5 rounded-2xl mb-6 shadow-lg">

        <p className="text-gray-400 text-sm mb-1">
          Total Balance
        </p>

        <h2 className="text-3xl font-bold mb-3">
          ${displayBalance.toFixed(2)}
        </h2>

        <div className="flex justify-between text-sm">

          <div>
            <p className="text-gray-400">Invested</p>
            <p>${totalInvested.toFixed(2)}</p>
          </div>

          <div>
            <p className="text-gray-400">Profit</p>
            <p className="text-green-400 animate-pulse">
              +${displayProfit.toFixed(2)}
            </p>
          </div>

          <div>
            <p className="text-gray-400">ROI</p>
            <p className="text-green-400">
              {roi.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>

      {/* EMPTY */}
      {investments.length === 0 && (
        <div className="bg-[#131A2A] p-6 rounded-xl text-center text-gray-400">
          No investments yet
        </div>
      )}

      {/* LIST */}
      {investments.map((inv) => {
        const profitValue = inv.amount * (inv.profit / 100);

        return (
          <div
            key={inv._id}
            className="bg-[#131A2A] p-4 rounded-xl mb-3 hover:bg-[#1A2235] transition"
          >
            <div className="flex justify-between mb-2">
              <p className="font-semibold">
                ${inv.amount.toFixed(2)}
              </p>

              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  inv.status === "active"
                    ? "bg-yellow-500/20 text-yellow-400"
                    : "bg-green-500/20 text-green-400"
                }`}
              >
                {inv.status}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <p className="text-gray-400">Profit</p>
              <p className="text-green-400">
                +${profitValue.toFixed(2)}
              </p>
            </div>

            <div className="mt-3 h-2 bg-[#0B0F19] rounded-full">
              <div
                className={`h-full ${
                  inv.status === "completed"
                    ? "bg-green-400 w-full"
                    : "bg-yellow-400 w-1/2"
                }`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}