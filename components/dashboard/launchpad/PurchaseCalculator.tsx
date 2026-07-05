"use client";

import { useMemo, useState } from "react";

interface PurchaseCalculatorProps {
  coinId: string;

  salePrice: number;

  minPurchase: number;

  maxPurchase: number;

  balance: number;

  remainingSupply: number;

  symbol: string;

  onSuccess?: (
    balance: number,
    reservedSupply: number
  ) => void;
}

export default function PurchaseCalculator({
  coinId,
  salePrice,
  minPurchase,
  maxPurchase,
  balance,
  remainingSupply,
  symbol,
  onSuccess,
}: PurchaseCalculatorProps) {
  const [mode, setMode] = useState<"usd" | "coins">("usd");

  const [usd, setUsd] = useState("");
  const [coins, setCoins] = useState("");

 function handleUsdChange(value: string) {
  setUsd(value);

  if (!value || salePrice <= 0) {
    setCoins("");
    return;
  }

  const amount = Number(value);

  setCoins((amount / salePrice).toFixed(0));
}

function handleCoinsChange(value: string) {
  setCoins(value);

  if (!value || salePrice <= 0) {
    setUsd("");
    return;
  }

  const qty = Number(value);

  setUsd((qty * salePrice).toFixed(2));
}

 

  const validation = useMemo(() => {
  const qty = Number(coins);
  const total = Number(usd);

  if (!qty || !total) {
    return "";
  }

  // Minimum investment (USD)
  if (total < minPurchase) {
    return `Minimum investment is $${minPurchase.toLocaleString()}`;
  }

  // Maximum investment (USD)
  if (total > maxPurchase) {
    return `Maximum investment is $${maxPurchase.toLocaleString()}`;
  }

  if (qty > remainingSupply) {
    return "Not enough remaining supply.";
  }

  if (total > balance) {
    return "Insufficient balance. Please deposit funds.";
  }

  return "";
}, [
  coins,
  usd,
  minPurchase,
  maxPurchase,
  remainingSupply,
  balance,
]);
  async function reserveAllocation() {
  try {
    const token = localStorage.getItem("user_token");

    if (!token) {
      alert("Please login.");
      return;
    }

    
      const res = await fetch(
  "/api/upcoming-coins/reserve",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          coinId,

          coinsPurchased: Number(coins),
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      alert(data.message);
      return;
    }

    alert("Reservation successful!");

    onSuccess?.(
      data.balance,
      data.reservedSupply
    );

    setUsd("");
    setCoins("");

  } catch (error) {

    console.error(error);

    alert("Reservation failed.");

  }
}

  return (
    <div className="rounded-2xl bg-[#131A2A] border border-gray-800 p-6">

      <h2 className="text-2xl font-bold mb-6">
        Purchase Allocation
      </h2>

      <div className="flex justify-between mb-4">
        <span className="text-gray-400">Sale Price</span>

        <span className="font-semibold">
          ${salePrice} / Coin
        </span>
      </div>

      <div className="flex gap-4 mb-6">

        <button
          type="button"
          onClick={() => setMode("usd")}
          className={`flex-1 rounded-xl py-3 ${
            mode === "usd"
              ? "bg-cyan-500 text-black"
              : "bg-[#0B0F19]"
          }`}
        >
          USD
        </button>

        <button
          type="button"
          onClick={() => setMode("coins")}
          className={`flex-1 rounded-xl py-3 ${
            mode === "coins"
              ? "bg-cyan-500 text-black"
              : "bg-[#0B0F19]"
          }`}
        >
          Coins
        </button>

      </div>

      {mode === "usd" ? (
        <input
          value={usd}
          onChange={(e) => handleUsdChange(e.target.value)}
          placeholder="USD Amount"
          type="number"
          className="w-full rounded-xl bg-[#0B0F19] border border-gray-700 p-4 mb-5"
        />
      ) : (
        <input
          value={coins}
          onChange={(e) => handleCoinsChange(e.target.value)}
          placeholder="Coins"
          type="number"
          className="w-full rounded-xl bg-[#0B0F19] border border-gray-700 p-4 mb-5"
        />
      )}

      <div className="space-y-3 text-sm">

        <Row
          label="Coins"
          value={`${Number(coins || 0).toLocaleString()} ${symbol}`}
        />

        <Row
          label="Total"
          value={`$${Number(usd || 0).toFixed(2)}`}
        />

        <Row
          label="Balance"
          value={`$${balance.toFixed(2)}`}
        />

        <Row
          label="Remaining"
          value={remainingSupply.toLocaleString()}
        />

      </div>

      {validation && (
        <div className="mt-5 rounded-xl bg-red-500/15 border border-red-500/40 p-3 text-red-300">
          {validation}
        </div>
      )}

      <button
  type="button"
  disabled={!!validation}
  onClick={() => {
    alert("Reserve clicked");
    reserveAllocation();
  }}
  className="mt-6 w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 py-4 text-black font-bold"
>
  Reserve Allocation
</button>

    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-400">{label}</span>
      <span>{value}</span>
    </div>
  );
}