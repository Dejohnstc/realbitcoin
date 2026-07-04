"use client";

import { useEffect, useState } from "react";
import LaunchCard from "./LaunchCard";

interface Coin {
  _id: string;
  name: string;
  symbol: string;
   slug: string;
  logo: string;
  listingPrice: number;
  listingDate: string;
  network: string;
  featured: boolean;
  status: string;
  allowReservation: boolean;
}

export default function UpcomingSection() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCoins();
  }, []);

  async function loadCoins() {
    try {
      const res = await fetch("/api/upcoming-coins");

      const data = await res.json();

      if (data.success) {
        setCoins(data.coins);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <section className="mt-8">
        <h2 className="mb-6 text-2xl font-bold text-white">
          🔥 Upcoming Listings
        </h2>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-80 animate-pulse rounded-3xl bg-[#131A2A]"
            />
          ))}
        </div>
      </section>
    );
  }

  if (coins.length === 0) {
    return (
      <section className="mt-8">
        <h2 className="mb-6 text-2xl font-bold text-white">
          🔥 Upcoming Listings
        </h2>

        <div className="rounded-3xl border border-gray-800 bg-[#131A2A] p-10 text-center">
          <div className="text-6xl">🚀</div>

          <h3 className="mt-5 text-xl font-bold">
            No Upcoming Listings
          </h3>

          <p className="mt-2 text-gray-400">
            New crypto launches will appear here.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-8">

      <div className="mb-6 flex items-center justify-between">

        <div>

          <h2 className="text-2xl font-bold">
            🔥 Upcoming Listings
          </h2>

          <p className="text-sm text-gray-400">
            Discover the next generation of crypto launches.
          </p>

        </div>

      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {coins.map((coin) => (
          <LaunchCard
            key={coin._id}
            coin={coin}
          />
        ))}
      </div>

    </section>
  );
}