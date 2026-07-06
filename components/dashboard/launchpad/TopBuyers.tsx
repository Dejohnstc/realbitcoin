"use client";

import { useEffect, useState } from "react";

interface Buyer {
  user: string;
  coins: number;
  amount: number;
}

interface Props {
  slug: string;
  symbol: string;
}

export default function TopBuyers({
  slug,
  symbol,
}: Props) {
  const [buyers, setBuyers] = useState<Buyer[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadBuyers() {
      try {
        const res = await fetch(
          `/api/launchpad/top-buyers/${slug}`,
          {
            cache: "no-store",
          }
        );

        const data = await res.json();

        if (!cancelled && data.success) {
          setBuyers(data.buyers);
        }
      } catch (error) {
        console.error(error);
      }
    }

    loadBuyers();

    const interval = setInterval(
      loadBuyers,
      10000
    );

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [slug]);

  const medal = (index: number) => {
    switch (index) {
      case 0:
        return "🥇";
      case 1:
        return "🥈";
      case 2:
        return "🥉";
      default:
        return `#${index + 1}`;
    }
  };

  return (
    <div className="rounded-2xl bg-[#131A2A] border border-gray-800 p-6">

      <div className="flex justify-between items-center mb-6">

        <h2 className="text-xl font-bold">
          🏆 Top Buyers
        </h2>

        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full">
          LIVE
        </span>

      </div>

      {buyers.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          No buyers yet.
        </div>
      ) : (
        <div className="space-y-3">
          {buyers.map((buyer, index) => (
            <div
              key={`${buyer.user}-${index}`}
              className="flex items-center justify-between rounded-xl border border-gray-800 bg-[#0B0F19] p-4 hover:border-yellow-500 transition-all"
            >
              <div className="flex items-center gap-4">

                <div className="w-10 h-10 rounded-full bg-[#1A2235] flex items-center justify-center font-bold">
                  {medal(index)}
                </div>

                <div>

                  <p className="font-semibold">
                    {buyer.user}
                  </p>

                  <p className="text-xs text-gray-400">
                    {buyer.coins.toLocaleString()} {symbol}
                  </p>

                </div>

              </div>

              <div className="text-right">

                <p className="font-bold text-cyan-400">
                  ${buyer.amount.toLocaleString()}
                </p>

              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}