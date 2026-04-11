"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Coin = "BTC" | "USDT" | "ETH";
type Network = "TRC20" | "ERC20" | "BTC";

export default function WithdrawPage() {
  const router = useRouter();

  const [coin, setCoin] = useState<Coin>("USDT");
  const [network, setNetwork] = useState<Network>("TRC20");

  const [amount, setAmount] = useState<string>("");
  const [wallet, setWallet] = useState<string>("");

  const [balance, setBalance] = useState<number>(0);
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [message, setMessage] = useState("");

  const feeRate = 0.02;
  const fee = Number(amount || 0) * feeRate;
  const receive = Number(amount || 0) - fee;

  // ✅ FETCH BALANCE (UNCHANGED)
  useEffect(() => {
    const fetchBalance = async () => {
      const token = localStorage.getItem("user_token");

      const res = await fetch("/api/user", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      const data = await res.json();
      if (res.ok) setBalance(data.balance || 0);
    };

    fetchBalance();
  }, []);

  // ✅ WITHDRAW FUNCTION (UNCHANGED)
  const handleWithdraw = async () => {
    const token = localStorage.getItem("user_token");

    if (!wallet) return setMessage("Enter wallet address");
    if (!amount || Number(amount) <= 0)
      return setMessage("Enter valid amount");
    if (Number(amount) > balance)
      return setMessage("Insufficient balance");

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: Number(amount),
          wallet,
          coin,
          network,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Withdrawal failed");
        setStatus("idle");
      } else {
        setStatus("success");
        setMessage("Withdrawal submitted successfully");

        setAmount("");
        setWallet("");
      }
    } catch {
      setMessage("Network error");
      setStatus("idle");
    }
  };

  return (
    <div className="pt-2">

      {/* ✅ TOP BAR (FIXED ALIGNMENT) */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Withdraw</h2>

        <button
          onClick={() => router.push("/dashboard/withdraw/history")}
          className="text-xs px-3 py-1 border border-yellow-400 rounded-lg text-yellow-400"
        >
          History
        </button>
      </div>

      {/* ✅ FULL WIDTH CARD (FIXED) */}
      <div className="bg-[#131A2A] rounded-2xl p-5 w-full">

        {/* COIN */}
        <div className="mb-4">
          <p className="text-sm text-gray-400 mb-1">Coin</p>

          <select
            value={coin}
            onChange={(e) => setCoin(e.target.value as Coin)}
            className="w-full bg-[#0B0F19] p-3 rounded-xl"
          >
            <option value="USDT">USDT</option>
            <option value="BTC">BTC</option>
            <option value="ETH">ETH</option>
          </select>
        </div>

        {/* NETWORK */}
        <div className="mb-4">
          <p className="text-sm text-gray-400 mb-1">Network</p>

          <select
            value={network}
            onChange={(e) => setNetwork(e.target.value as Network)}
            className="w-full bg-[#0B0F19] p-3 rounded-xl"
          >
            {coin === "USDT" && (
              <>
                <option value="TRC20">TRC20</option>
                <option value="ERC20">ERC20</option>
              </>
            )}

            {coin === "BTC" && <option value="BTC">BTC</option>}
            {coin === "ETH" && <option value="ERC20">ERC20</option>}
          </select>
        </div>

        {/* WALLET */}
        <div className="mb-4">
          <p className="text-sm text-gray-400 mb-1">Wallet Address</p>

          <input
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            placeholder="Enter address"
            className="w-full bg-[#0B0F19] p-3 rounded-xl"
          />
        </div>

        {/* AMOUNT */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-400 mb-1">
            <span>Amount</span>
            <span>Balance: ${balance.toFixed(2)}</span>
          </div>

          <div className="flex items-center bg-[#0B0F19] rounded-xl">
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
              placeholder="Enter amount"
              className="flex-1 p-3 bg-transparent outline-none"
            />

            <button
              onClick={() => setAmount(balance.toString())}
              className="px-3 text-yellow-400 text-sm"
            >
              MAX
            </button>
          </div>
        </div>

        {/* INFO */}
        <div className="bg-[#0B0F19] p-3 rounded-xl text-sm mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-gray-400">Fee</span>
            <span>${fee.toFixed(2)}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">You will receive</span>
            <span className="text-green-400">
              ${receive > 0 ? receive.toFixed(2) : "0.00"}
            </span>
          </div>
        </div>

        {/* BUTTON */}
        <button
          onClick={handleWithdraw}
          disabled={status === "loading" || status === "success"}
          className={`w-full py-3 rounded-xl font-semibold transition ${
            status === "success"
              ? "bg-green-500 text-black"
              : "bg-yellow-400 text-black"
          }`}
        >
          {status === "loading"
            ? "Processing..."
            : status === "success"
            ? "Withdrawal Submitted"
            : "Withdraw"}
        </button>

        {/* MESSAGE */}
        {message && (
          <p
            className={`mt-3 text-sm text-center ${
              status === "success" ? "text-green-400" : "text-red-400"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}