"use client";

import Image from "next/image";
import Countdown from "./Countdown";
import { useRouter } from "next/navigation";

interface LaunchCardProps {
  coin: {
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
  };
}

export default function LaunchCard({
  coin,
}: LaunchCardProps) {
  const router = useRouter();

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border transition-all duration-300 hover:scale-[1.02] ${
        coin.featured
          ? "border-yellow-500 bg-gradient-to-br from-[#172033] via-[#111827] to-[#0B0F19]"
          : "border-gray-800 bg-[#131A2A]"
      }`}
    >
      {coin.featured && (
        <div className="absolute right-4 top-4 rounded-full bg-yellow-500 px-3 py-1 text-xs font-bold text-black">
          ⭐ FEATURED
        </div>
      )}

      <div className="p-6">
        <div className="flex items-center gap-4">
          {coin.logo ? (
            <Image
              src={coin.logo}
              alt={coin.name}
              width={70}
              height={70}
              className="rounded-full border border-gray-700 object-cover"
            />
          ) : (
            <div className="flex h-[70px] w-[70px] items-center justify-center rounded-full bg-[#0B0F19] text-3xl">
              🪙
            </div>
          )}

          <div>
            <h2 className="text-2xl font-bold">
              {coin.name}
            </h2>

            <p className="text-gray-400">
              {coin.symbol}
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <Row
            label="Network"
            value={coin.network || "N/A"}
          />

          <Row
            label="Listing Price"
            value={`$${coin.listingPrice}`}
          />

          <Row
            label="Status"
            value={coin.status}
          />
        </div>

        <div className="mt-6">
          <Countdown targetDate={coin.listingDate} />
        </div>

        {coin.allowReservation && (
          <button
            onClick={() =>
              router.push(`/launchpad/${coin.slug}`)
            }
            className="mt-8 w-full rounded-xl bg-cyan-500 py-3 font-semibold text-black transition hover:bg-cyan-400"
          >
            Reserve Spot
          </button>
        )}
      </div>
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
    <div className="flex items-center justify-between">
      <span className="text-gray-400">
        {label}
      </span>

      <span className="font-semibold capitalize">
        {value}
      </span>
    </div>
  );
}