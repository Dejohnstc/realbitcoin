"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

type Status = "idle" | "pending" | "approved";
type Coin = "USDT" | "BTC" | "ETH";
type Network = "TRC20" | "ERC20" | "BTC";

function StartInvestmentContent() {
  const params = useSearchParams();
  const router = useRouter();

  const plan = params.get("plan") ?? "Unknown Plan";

  const [amount, setAmount] = useState<number>(0);
  const [status, setStatus] = useState<Status>("idle");
  const [loading, setLoading] = useState(false);

  const [coin, setCoin] = useState<Coin>("USDT");
  const [network, setNetwork] = useState<Network>("TRC20");

  const planConfig: Record<string, { profit: number; duration: number }> = {
    "Starter Plan": { profit: 10, duration: 24 },
    "Silver Plan": { profit: 25, duration: 72 },
    "Gold Plan": { profit: 50, duration: 168 },
    "VIP Plan": { profit: 80, duration: 336 },
  };

  // ✅ STATUS CHECK
  useEffect(() => {
    const checkStatus = async () => {
      const token = localStorage.getItem("user_token");
      const depositId = localStorage.getItem("currentDepositId");

      if (!depositId || !token) return;

      try {
        const res = await fetch(`/api/deposit/${depositId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) return;

        if (data.status === "pending") setStatus("pending");

        if (data.status === "approved") {
          setStatus("approved");
          localStorage.removeItem("currentDepositId");
        }
      } catch {
        console.log("Status check failed");
      }
    };

    const timeout = setTimeout(checkStatus, 100);
    const interval = setInterval(checkStatus, 5000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  const handleDeposit = async () => {
    const token = localStorage.getItem("user_token");

    if (!token) return alert("Login required");

    localStorage.removeItem("currentDepositId");

    if (amount <= 0) return alert("Enter amount");

    try {
      setLoading(true);

      const res = await fetch("/api/deposit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount,
          coin,
          ...(coin === "USDT" ? { network } : {}),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        return alert(data.error || "Deposit failed");
      }

      localStorage.setItem("currentDepositId", data.deposit._id);

      setStatus("pending");
    } catch {
      alert("Deposit failed");
    } finally {
      setLoading(false);
    }
  };

  const handleStartInvestment = async () => {
    const token = localStorage.getItem("user_token");

    if (!token) return alert("Login required");

    const config = planConfig[plan];

    if (!config) return alert("Invalid plan");

    try {
      setLoading(true);

      const res = await fetch("/api/invest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount,
          plan,
          profit: config.profit,
          durationHours: config.duration,
        }),
      });

      if (!res.ok) {
        return alert("Failed to start investment");
      }

      localStorage.removeItem("currentDepositId");

      alert("Investment started successfully");

      router.push("/dashboard");
    } catch {
      alert("Failed to start investment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white p-6">

      {/* HEADER */}
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white transition"
        >
          <ArrowLeft size={20} />
        </button>

        <h1 className="text-xl font-bold">
          {plan} Investment
        </h1>
      </div>

      {status === "idle" && (
        <>
          <p className="text-gray-400 mb-4">
            Enter amount and complete payment
          </p>

          <select
            value={coin}
            onChange={(e) => setCoin(e.target.value as Coin)}
            className="w-full p-3 mb-3 rounded-xl bg-[#131A2A]"
          >
            <option value="USDT">USDT</option>
            <option value="BTC">BTC</option>
            <option value="ETH">ETH</option>
          </select>

          {coin === "USDT" && (
            <select
              value={network}
              onChange={(e) => setNetwork(e.target.value as Network)}
              className="w-full p-3 mb-3 rounded-xl bg-[#131A2A]"
            >
              <option value="TRC20">TRC20</option>
              <option value="ERC20">ERC20</option>
            </select>
          )}

          <input
            type="number"
            placeholder="Enter amount"
            className="w-full p-3 mb-4 rounded-xl bg-[#131A2A]"
            onChange={(e) => setAmount(Number(e.target.value))}
          />

          <div className="bg-[#131A2A] p-4 rounded-xl mb-4">
            <p>Send {coin} to:</p>
            <p className="text-green-400 break-all mt-2">
              TX9ExampleWalletAddress123456
            </p>
          </div>

          <button
            disabled={loading}
            onClick={handleDeposit}
            className="w-full py-3 bg-yellow-400 text-black rounded-xl font-semibold disabled:opacity-50"
          >
            {loading ? "Processing..." : "I Have Paid"}
          </button>
        </>
      )}

      {status === "pending" && (
        <div className="text-center mt-10">
          <h2 className="text-yellow-400 text-xl font-bold">
            WAITING FOR APPROVAL
          </h2>
        </div>
      )}

      {status === "approved" && (
        <div className="text-center mt-10">

          <h2 className="text-green-400 text-xl font-bold mb-4">
            DEPOSIT APPROVED
          </h2>

          <button
            disabled={loading}
            onClick={handleStartInvestment}
            className="w-full py-3 bg-green-500 text-black rounded-xl mb-3 font-semibold disabled:opacity-50"
          >
            {loading ? "Processing..." : "Start Investment"}
          </button>

          <button
            onClick={() => router.push("/dashboard/investments")}
            className="w-full py-3 bg-yellow-400 text-black rounded-xl mb-3 font-semibold"
          >
            Upgrade Plan
          </button>

          <button
            onClick={() => router.push("/dashboard")}
            className="w-full py-3 bg-[#131A2A] rounded-xl"
          >
            Return to Dashboard
          </button>

        </div>
      )}

    </div>
  );
}

export default function StartInvestment() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StartInvestmentContent />
    </Suspense>
  );
}