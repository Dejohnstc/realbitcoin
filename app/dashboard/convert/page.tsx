"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import ConvertSuccessModal from "@/components/dashboard/assets/ConvertSuccessModal";

interface Market {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
}

export default function ConvertPage() {
  const router = useRouter();

  const [markets, setMarkets] = useState<Market[]>([]);
  const [selected, setSelected] = useState<Market | null>(null);

  const [usd, setUsd] = useState("");

  const [balance, setBalance] = useState(0);

  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

const [successData, setSuccessData] = useState({
  coin: "",
  amount: 0,
  usd: 0,
  balance: 0,
});

  useEffect(() => {
    loadMarkets();
    loadUser();
  }, []);

  async function loadMarkets() {
    const res = await fetch("/api/markets", {
      cache: "no-store",
    });

    const data = await res.json();

    setMarkets(data.markets);

    if (data.markets.length) {
      setSelected(data.markets[0]);
    }
  }

  async function loadUser() {
    const token = localStorage.getItem("user_token");

    if (!token) return;

    const res = await fetch("/api/user", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (data.user) {
      setBalance(data.user.balance);
    }
  }

  const receive = useMemo(() => {
    if (!selected) return 0;

    const value = Number(usd);

    if (!value) return 0;

    return value / selected.current_price;
  }, [usd, selected]);

 async function convert() {
  if (!selected) return;

  const token = localStorage.getItem("user_token");

  if (!token) return;

  setLoading(true);

  try {
    const res = await fetch("/api/convert", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        symbol: selected.symbol.toUpperCase(),
        usdAmount: Number(usd),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message);
      return;
    }

    setSuccessData({
      coin: selected.name,
      amount: receive,
      usd: Number(usd),
      balance: data.balance,
    });

    setBalance(data.balance);
    setShowSuccess(true);
    setUsd("");

  } catch (error) {
    console.error(error);
    alert("Conversion failed.");
  } finally {
    setLoading(false);
  }
}

  return (
    <>
    <div className="mx-auto max-w-xl">

      <div className="rounded-3xl bg-[#131A2A] border border-gray-800 p-6">

        <h1 className="text-2xl font-bold">
          Convert USD
        </h1>

        <p className="mt-2 text-gray-400">
          Purchase crypto instantly.
        </p>

        <div className="mt-6 rounded-xl bg-[#0B0F19] p-4">

          <p className="text-sm text-gray-400">
            Available Balance
          </p>

          <p className="mt-2 text-3xl font-bold">
            ${balance.toLocaleString()}
          </p>

        </div>

        <div className="mt-6">

          <label className="text-sm text-gray-400">
            Select Asset
          </label>

         <div className="mt-3 max-h-72 overflow-y-auto rounded-2xl border border-gray-800 bg-[#0B0F19]">

  {markets.map((coin) => (

    <button
      key={coin.id}
      type="button"
      onClick={() => setSelected(coin)}
      className={`flex w-full items-center justify-between border-b border-gray-800 p-4 transition hover:bg-[#182136] ${
        selected?.id === coin.id
          ? "bg-cyan-500/10 border-cyan-500"
          : ""
      }`}
    >

      <div className="flex items-center gap-4">

        <Image
          src={coin.image}
          alt={coin.name}
          width={42}
          height={42}
          className="rounded-full"
        />

        <div className="text-left">

          <p className="font-semibold">
            {coin.name}
          </p>

          <p className="text-xs text-gray-400">
            {coin.symbol.toUpperCase()}
          </p>

        </div>

      </div>

      <div className="text-right">

        <p className="font-bold">
          ${coin.current_price.toLocaleString()}
        </p>

      </div>

    </button>

  ))}

</div>

        </div>

        {selected && (

          <div className="mt-5 flex items-center gap-3 rounded-xl bg-[#0B0F19] p-4">

            <Image
              src={selected.image}
              alt={selected.name}
              width={40}
              height={40}
              className="rounded-full"
            />

            <div>

              <p className="font-semibold">
                {selected.name}
              </p>

              <p className="text-sm text-gray-400">
                ${selected.current_price.toLocaleString()}
              </p>

            </div>

          </div>

        )}
<div className="mt-5 grid grid-cols-2 gap-4">

  <div className="rounded-xl bg-[#0B0F19] p-4">

    <p className="text-xs text-gray-500">
      Current Price
    </p>

    <p className="mt-2 text-xl font-bold">
      ${selected?.current_price?.toLocaleString() ?? "0"}
    </p>

  </div>

  <div className="rounded-xl bg-[#0B0F19] p-4">

    <p className="text-xs text-gray-500">
      Estimated Coins
    </p>

    <p className="mt-2 text-xl font-bold text-cyan-400">
      {receive.toFixed(8)}
    </p>

  </div>

</div>
        <div className="relative mt-2">

  <input
    type="number"
    value={usd}
    onChange={(e) => setUsd(e.target.value)}
    className="w-full rounded-xl border border-gray-700 bg-[#0B0F19] p-4 pr-20"
    placeholder="0.00"
  />

  <button
    type="button"
    onClick={() => setUsd(balance.toString())}
    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-cyan-500 px-3 py-1 text-xs font-bold text-black"
  >
    MAX
  </button>

</div>

        <div className="mt-6 rounded-xl bg-[#0B0F19] p-4">

          <p className="text-sm text-gray-400">
            You Receive
          </p>

          <p className="mt-2 text-2xl font-bold text-cyan-400">
            {receive.toFixed(8)}{" "}
            {selected?.symbol.toUpperCase()}
          </p>

        </div>

        <button
          disabled={
            loading ||
            !usd ||
            Number(usd) <= 0
          }
          onClick={convert}
          className="mt-6 w-full rounded-xl bg-cyan-500 py-4 font-bold text-black hover:bg-cyan-400 disabled:opacity-40"
        >
          {loading
            ? "Converting..."
            : "Convert Now"}
        </button>

      </div>

    </div>
    <ConvertSuccessModal
  open={showSuccess}
  coin={successData.coin}
  amount={successData.amount}
  usd={successData.usd}
  balance={successData.balance}
  onClose={() => {
    setShowSuccess(false);
    router.push("/dashboard/assets");
  }}
/>
</>
  );
}