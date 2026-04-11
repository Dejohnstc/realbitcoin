"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Market {
  id: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
}

export default function LiveMarketPage() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  const fetchMarkets = async () => {
    try {
      const res = await fetch("/api/markets", { cache: "no-store" });
      const data = await res.json();

      setMarkets(Array.isArray(data.markets) ? data.markets : []);
    } catch {
      console.log("Market error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarkets();

    // 🔥 AUTO REFRESH EVERY 10s
    const interval = setInterval(fetchMarkets, 10000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white px-4 pb-12">

      {/* 🔙 BACK BUTTON */}
      <button
        onClick={() => router.back()}
        className="mt-4 mb-2 text-gray-400 hover:text-white"
      >
        ← Back
      </button>

      {/* HEADER */}
      <h1 className="text-2xl font-bold my-4">
        📈 Live Market
      </h1>

      {/* LOADING */}
      {loading && (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-[#131A2A] rounded-xl" />
          ))}
        </div>
      )}

      {/* MARKETS */}
      {!loading &&
        markets.slice(0, 5).map((m) => (
          <div
            key={m.id}
            onClick={() =>
              router.push(`/dashboard/livemarket/${m.symbol.toLowerCase()}`)
            }
            className="bg-[#131A2A] p-4 rounded-xl mb-3 flex justify-between items-center cursor-pointer hover:bg-[#1A2235] transition"
          >
            {/* LEFT */}
            <div>
              <p className="font-semibold text-lg">
                {m.symbol.toUpperCase()}
              </p>

              <p className="text-sm text-gray-400">
                ${m.current_price.toLocaleString()}
              </p>

              <p
                className={
                  m.price_change_percentage_24h > 0
                    ? "text-green-400 text-xs"
                    : "text-red-400 text-xs"
                }
              >
                {m.price_change_percentage_24h.toFixed(2)}%
              </p>
            </div>

            {/* BUTTON */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push("/dashboard/investments");
              }}
              className="bg-yellow-400 text-black px-4 py-2 rounded-lg font-semibold"
            >
              Start Investment
            </button>
          </div>
        ))}
    </div>
  );
}