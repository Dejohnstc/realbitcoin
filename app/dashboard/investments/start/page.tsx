"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

type Status = "idle" | "pending" | "approved";
type Coin = "USDT" | "BTC" | "ETH";
type Network = "TRC20" | "ERC20";

function StartInvestmentContent() {
  const params = useSearchParams();
  const router = useRouter();

  const plan = params.get("plan") ?? "Unknown Plan";

  const [amount, setAmount] = useState<number>(0);
  const [status, setStatus] = useState<Status>("idle");
  const [loading, setLoading] = useState(false);

  const [coin, setCoin] = useState<Coin>("USDT");
  const [network, setNetwork] =
  useState<Network>("TRC20");

  const planConfig = {
  "Starter Plan": {
    returnRate: 300,
    durationMonths: 1,
    risk: "Low",
    min: 200,
    max: 999,
  },

  "Silver Plan": {
    returnRate: 8,
    durationMonths: 1,
    risk: "Medium",
    min: 1000,
    max: 4999,
  },

  "Gold Plan": {
    returnRate: 325,
    durationMonths: 1,
    risk: "Medium",
    min: 5000,
    max: 19999,
  },

  "VIP Plan": {
    returnRate: 470,
    durationMonths: 1,
    risk: "Safe",
    min: 20000,
    max: 100000,
  },
} as const;

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
      
      }
    };

    const timeout = setTimeout(checkStatus, 100);
    const interval = setInterval(checkStatus, 5000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  const walletAddresses = {
  USDT: {
    Bep20:"0xf44dcb2a914dd6b5a782ca0dfd23c2d06813c853",
    TRC20: "TCR1wfohbRjb9V2deMReGD74UWhAeUt8pd",
    ERC20: "0xf44dcb2a914dd6b5a782ca0dfd23c2d06813c853",
  },

  BTC: "16Dcw9DXiMb3i3cMDTKUvC8esEy6VGi5bi",

  ETH: "0xf44dcb2a914dd6b5a782ca0dfd23c2d06813c853",
} as const;

  const walletAddress =
  coin === "USDT"
    ? walletAddresses.USDT[network]
    : walletAddresses[coin];

  const copyAddress = async () => {
  try {
    await navigator.clipboard.writeText(walletAddress);
    alert("Wallet address copied");
  } catch {
    alert("Failed to copy");
  }
};

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
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return alert(data.error || "Failed to start investment");
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
    <div className="min-h-screen bg-[#0B0F19] text-white p-2">

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
  <p>
    Send {coin}
    {coin === "USDT" ? ` (${network})` : ""}
    {" "}to:
  </p>

  <p className="text-green-400 break-all mt-2">
    {walletAddress}
  </p>

  <button
    type="button"
    onClick={copyAddress}
    className="mt-3 px-4 py-2 bg-yellow-400 text-black rounded-lg text-sm font-semibold"
  >
    Copy Address
  </button>
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