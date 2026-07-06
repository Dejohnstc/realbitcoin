"use client";

import { useEffect, useState } from "react";

interface Reservation {
  user: string;
  coins: number;
  amount: number;
  createdAt: string;
}

interface Props {
  slug: string;
  symbol: string;
}

export default function RecentReservations({
  slug,
  symbol,
}: Props) {
  const [reservations, setReservations] = useState<
    Reservation[]
  >([]);

  useEffect(() => {
    let cancelled = false;

    async function fetchReservations() {
      try {
        const res = await fetch(
          `/api/launchpad/recent/${slug}`,
          {
            cache: "no-store",
          }
        );

        const data = await res.json();

        if (!cancelled && data.success) {
          setReservations(data.reservations);
        }
      } catch (error) {
        console.error(
          "Failed to load reservations:",
          error
        );
      }
    }

    fetchReservations();

    const interval = setInterval(
      fetchReservations,
      10000
    );

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [slug]);

  return (
    <div className="rounded-2xl bg-[#131A2A] border border-gray-800 p-6">

      <div className="flex items-center justify-between mb-6">

        <h2 className="text-xl font-bold">
          🔥 Recent Reservations
        </h2>

        <span className="text-xs font-semibold text-green-400 animate-pulse">
          LIVE
        </span>

      </div>

      {reservations.length === 0 ? (
        <div className="rounded-xl bg-[#0B0F19] p-6 text-center text-gray-500">
          No reservations yet.
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map((item, index) => (
            <div
              key={`${item.user}-${item.createdAt}-${index}`}
              className="rounded-xl bg-[#0B0F19] border border-gray-800 p-4 transition-all duration-300 hover:border-cyan-500 hover:bg-[#151d30]"
            >
              <div className="flex items-center justify-between">

                <div>
                  <p className="font-semibold">
                    🟢 {item.user}
                  </p>

                  <p className="mt-1 text-sm text-gray-400">
                    {item.coins.toLocaleString()} {symbol}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-bold text-cyan-400">
                    ${item.amount.toLocaleString()}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    {new Date(
                      item.createdAt
                    ).toLocaleDateString()}{" "}
                    {new Date(
                      item.createdAt
                    ).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}