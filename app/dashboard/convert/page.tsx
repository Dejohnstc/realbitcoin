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

const [fromAsset, setFromAsset] = useState("USD");

const [toAsset, setToAsset] = useState("BTC");

const [amount, setAmount] = useState("");
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

  const value = Number(amount);

  if (!value) return 0;

  if (fromAsset === "USD") {
    return value / selected.current_price;
  }

  return value * selected.current_price;
}, [amount, selected, fromAsset]);

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
  fromAsset,
  toAsset,
  amount: Number(amount),
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
      usd: Number(amount),
      balance: data.balance,
    });

    setBalance(data.balance);
    setShowSuccess(true);
    setAmount("");

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
         Convert Assets
        </h1>

        <p className="mt-2 text-gray-400">
          Convert between USD and your crypto assets.
        </p>

        <div className="mt-6 rounded-xl bg-[#0B0F19] p-4">

          <p className="text-sm text-gray-400">
            Available Balance
          </p>

          <p className="mt-2 text-3xl font-bold">
            ${balance.toLocaleString()}
          </p>

        </div>

       <div className="space-y-5">

  <div>

    <label className="text-sm text-gray-400">
      From
    </label>

    <select
      value={fromAsset}
      onChange={(e) => setFromAsset(e.target.value)}
      className="mt-2 w-full rounded-xl bg-[#0B0F19] border border-gray-700 p-4"
    >
      <option value="USD">USD Wallet</option>

      {markets.map((coin) => (
        <option
          key={coin.id}
          value={coin.symbol.toUpperCase()}
        >
          {coin.name}
        </option>
      ))}

    </select>

  </div>

  <div className="flex justify-center">

    <button
      type="button"
      onClick={() => {
        const from = fromAsset;

        setFromAsset(toAsset);

        setToAsset(from);
      }}
      className="rounded-full bg-cyan-500 p-4 text-black font-bold hover:bg-cyan-400"
    >
      ⇅
    </button>

  </div>

  <div>

    <label className="text-sm text-gray-400">
      To
    </label>

    <select
      value={toAsset}
      onChange={(e) => {
        setToAsset(e.target.value);

        const coin = markets.find(
          (m) =>
            m.symbol.toUpperCase() ===
            e.target.value
        );

        if (coin) {
          setSelected(coin);
        }
      }}
      className="mt-2 w-full rounded-xl bg-[#0B0F19] border border-gray-700 p-4"
    >
      <option value="USD">
        USD Wallet
      </option>

      {markets.map((coin) => (
        <option
          key={coin.id}
          value={coin.symbol.toUpperCase()}
        >
          {coin.name}
        </option>
      ))}

    </select>

  </div>

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
   value={amount}
onChange={(e) => setAmount(e.target.value)}
    className="w-full rounded-xl border border-gray-700 bg-[#0B0F19] p-4 pr-20"
    placeholder="0.00"
  />

  <button
    type="button"
   onClick={() => {
  if (fromAsset === "USD") {
    setAmount(balance.toString());
  }
}}
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
           {receive.toFixed(8)} {toAsset}
          </p>

        </div>

       <button disabled={
  loading ||
  !amount ||
  Number(amount) <= 0
}
          onClick={convert}
          className="mt-6 w-full rounded-xl bg-cyan-500 py-4 font-bold text-black hover:bg-cyan-400 disabled:opacity-40"
        >
          {loading
            ? "Converting..."
            : "Convert Now"}
        </button>

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