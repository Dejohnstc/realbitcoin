"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Market {
  id: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
}

export default function CoinDetailPage() {
  const params = useParams();
  const router = useRouter();

  const symbol =
    typeof params?.symbol === "string" ? params.symbol : "";

  const [coin, setCoin] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!symbol) return;

    const fetchCoin = async () => {
      try {
        const res = await fetch("/api/markets", { cache: "no-store" });
        const data = await res.json();

        const markets = Array.isArray(data.markets)
          ? data.markets
          : [];

        const found = markets.find(
          (c: Market) =>
            c.symbol?.toLowerCase() === symbol.toLowerCase()
        );

        setCoin(found || null);
      } catch (error) {
        console.log("Error loading coin", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCoin();
  }, [symbol]);

  // LOADING
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center">
        Loading...
      </div>
    );
  }

  // NOT FOUND
  if (!coin) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col items-center justify-center gap-3">
        <p>Coin not found</p>
        <button
          onClick={() => router.back()}
          className="text-yellow-400"
        >
          ← Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white p-4">

      {/* BACK */}
      <button
        onClick={() => router.back()}
        className="mb-4 text-gray-400 hover:text-white"
      >
        ← Back
      </button>

      {/* HEADER */}
      <h1 className="text-2xl font-bold mb-2">
        {coin.symbol.toUpperCase()}
      </h1>

      <p className="text-xl mb-2">
        ${coin.current_price.toLocaleString()}
      </p>

      <p
        className={
          coin.price_change_percentage_24h > 0
            ? "text-green-400 mb-4"
            : "text-red-400 mb-4"
        }
      >
        {coin.price_change_percentage_24h.toFixed(2)}%
      </p>

      {/* CHART */}
      <div className="bg-[#131A2A] p-2 rounded-xl mb-6">
        <iframe
          src={`https://s.tradingview.com/widgetembed/?symbol=BINANCE:${coin.symbol.toUpperCase()}USDT&interval=60&theme=dark`}
          className="w-full h-64 rounded-lg"
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      {/* ACTION */}
      <button
        onClick={() => router.push("/dashboard/investments")}
        className="w-full py-3 bg-yellow-400 text-black rounded-lg font-semibold"
      >
        Start Investment
      </button>

    </div>
  );
}