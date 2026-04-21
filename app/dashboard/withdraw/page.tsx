"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Coin = "BTC" | "USDT" | "ETH";
type Network = "TRC20" | "ERC20" | "BTC";
type Method = "CRYPTO" | "BANK" | "MONEYGRAM" | "MUKURU";

export default function WithdrawPage() {
  const router = useRouter();

  const [method, setMethod] = useState<Method>("CRYPTO");

  const [coin, setCoin] = useState<Coin>("USDT");
  const [network, setNetwork] = useState<Network>("TRC20");

  const [amount, setAmount] = useState<string>("");
  const [wallet, setWallet] = useState<string>("");

  // 🔥 new fields (safe)
  const [accountName, setAccountName] = useState("");
  const [bankName, setBankName] = useState("");
  const [country, setCountry] = useState("");

  const [balance, setBalance] = useState<number>(0);
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [message, setMessage] = useState("");

  const [earningActive, setEarningActive] = useState(false);

  const feeRate = 0.02;
  const fee = Number(amount || 0) * feeRate;
  const receive = Number(amount || 0) - fee;

  useEffect(() => {
    const loadData = async () => {
      const token = localStorage.getItem("user_token");

      try {
        const [userRes, earnRes] = await Promise.all([
          fetch("/api/user/me", {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }),
          fetch("/api/earn/status", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const userData = await userRes.json();
        const earnData = await earnRes.json();

        if (userRes.ok) setBalance(userData.user?.balance || 0);

        setEarningActive(earnData.earning?.status === "active");
      } catch (err) {
        console.log(err);
      }
    };

    loadData();
  }, []);

  const handleWithdraw = async () => {
    const token = localStorage.getItem("user_token");

    if (earningActive) {
      return setMessage("Withdrawal locked while trading is active");
    }

    if (!amount || Number(amount) <= 0)
      return setMessage("Enter valid amount");

    if (Number(amount) > balance)
      return setMessage("Insufficient balance");

    // 🔥 VALIDATION PER METHOD
    if (method === "CRYPTO" && !wallet)
      return setMessage("Enter wallet address");

    if (method === "BANK" && (!accountName || !bankName || !wallet))
      return setMessage("Enter complete bank details");

    if ((method === "MONEYGRAM" || method === "MUKURU") && !accountName)
      return setMessage("Enter full name");

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
          coin: method === "CRYPTO" ? coin : method,
          network: method === "CRYPTO" ? network : "OFFCHAIN",
          meta: {
            accountName,
            bankName,
            country,
          },
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
        setAccountName("");
        setBankName("");
        setCountry("");
      }
    } catch {
      setMessage("Network error");
      setStatus("idle");
    }
  };

  return (
    <div className="pt-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Withdraw</h2>

        <button
          onClick={() => router.push("/dashboard/withdraw/history")}
          className="text-xs px-3 py-1 border border-yellow-400 rounded-lg text-yellow-400"
        >
          History
        </button>
      </div>

      <div className="bg-[#131A2A] rounded-2xl p-5 w-full">

        {earningActive && (
          <div className="mb-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm text-center">
            ⏳ Withdrawal is locked while trading is active
          </div>
        )}

        {/* METHOD */}
        <div className="mb-4">
          <p className="text-sm text-gray-400 mb-1">Method</p>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as Method)}
            className="w-full bg-[#0B0F19] p-3 rounded-xl"
          >
            <option value="CRYPTO">Crypto</option>
            <option value="BANK">Bank Transfer</option>
            <option value="MONEYGRAM">MoneyGram / Western Union</option>
            <option value="MUKURU">Mukuru</option>
          </select>
        </div>

        {/* CRYPTO */}
        {method === "CRYPTO" && (
          <>
            <select
              value={coin}
              onChange={(e) => setCoin(e.target.value as Coin)}
              className="w-full bg-[#0B0F19] p-3 rounded-xl mb-3"
            >
              <option value="USDT">USDT</option>
              <option value="BTC">BTC</option>
              <option value="ETH">ETH</option>
            </select>

            <select
              value={network}
              onChange={(e) => setNetwork(e.target.value as Network)}
              className="w-full bg-[#0B0F19] p-3 rounded-xl mb-3"
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

            <input
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              placeholder="Wallet Address"
              className="w-full bg-[#0B0F19] p-3 rounded-xl mb-3"
            />
          </>
        )}

        {/* BANK */}
        {method === "BANK" && (
          <>
            <input
              placeholder="Account Name"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="w-full bg-[#0B0F19] p-3 rounded-xl mb-3"
            />
            <input
              placeholder="Bank Name"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full bg-[#0B0F19] p-3 rounded-xl mb-3"
            />
            <input
              placeholder="Account Number"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              className="w-full bg-[#0B0F19] p-3 rounded-xl mb-3"
            />
          </>
        )}

        {/* MONEYGRAM / MUKURU */}
        {(method === "MONEYGRAM" || method === "MUKURU") && (
          <>
            <input
              placeholder="Full Name"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="w-full bg-[#0B0F19] p-3 rounded-xl mb-3"
            />
            <input
              placeholder="Country / Phone"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full bg-[#0B0F19] p-3 rounded-xl mb-3"
            />
          </>
        )}

        {/* AMOUNT */}
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          className="w-full bg-[#0B0F19] p-3 rounded-xl mb-3"
        />

        {/* BUTTON */}
        <button
          onClick={handleWithdraw}
          className="w-full py-3 bg-yellow-400 text-black rounded-xl"
        >
          Withdraw
        </button>

        {message && <p className="mt-3 text-center">{message}</p>}
      </div>
    </div>
  );
}