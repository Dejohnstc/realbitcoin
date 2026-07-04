"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Countdown from "./Countdown";
import { Rocket } from "lucide-react";
import { useRouter } from "next/navigation";

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
}

export default function FeaturedLaunch() {
  const router = useRouter();

  const [coin, setCoin] = useState<Coin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeatured();
  }, []);

  async function loadFeatured() {
    try {
      const res = await fetch("/api/upcoming-coins");

      const data = await res.json();

      if (!data.success) return;

      const featured =
        data.coins.find((c: Coin) => c.featured) ??
        data.coins[0];

      setCoin(featured || null);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="mb-6 h-64 rounded-3xl bg-[#131A2A] animate-pulse" />
    );
  }

  if (!coin) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 p-8 mb-6">

      <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-3xl" />

      <div className="relative z-10 flex flex-col lg:flex-row justify-between gap-8">

        <div className="flex items-center gap-5">

          {coin.logo && (
            <Image
              src={coin.logo}
              alt={coin.name}
              width={90}
              height={90}
              className="rounded-full border-4 border-white/20"
            />
          )}

          <div>

            <div className="inline-flex items-center gap-2 rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold text-black">

              ⭐ FEATURED LAUNCH

            </div>

            <h2 className="mt-4 text-4xl font-extrabold">

              {coin.name}

            </h2>

            <p className="mt-2 text-white/80">

              {coin.network}

            </p>

            <p className="mt-5 text-xl font-semibold">

              Listing Price

            </p>

            <h3 className="text-4xl font-bold">

              ${coin.listingPrice}

            </h3>

          </div>

        </div>

        <div className="flex flex-col justify-center">

          <p className="mb-4 text-center text-white/80">

            Launch Begins In

          </p>

          <Countdown targetDate={coin.listingDate} />

          <button
            onClick={() =>
            router.push(`/dashboard/upcoming-coins/${coin.slug}`)
            }
            className="mt-8 rounded-2xl bg-white py-4 px-8 font-bold text-black hover:scale-105 transition flex items-center justify-center gap-2"
          >
            <Rocket size={18} />

            View Launch
          </button>

        </div>

      </div>

    </div>
  );
}