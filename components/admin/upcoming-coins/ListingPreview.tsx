"use client";

import Image from "next/image";
import Countdown from "./CountDown";

interface ListingPreviewProps {
  logo: string;
  name: string;
  symbol: string;
  listingPrice: string;
  listingDate: string;
  featured: boolean;
  status: string;
}

export default function ListingPreview({
  logo,
  name,
  symbol,
  listingPrice,
  listingDate,
  featured,
  status,
}: ListingPreviewProps) {
  return (
    <div className="sticky top-0 rounded-2xl bg-[#131A2A] border border-gray-800 overflow-hidden">

      {/* HEADER */}

      <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-6">

        {featured && (
          <div className="inline-flex rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold text-black">
            ⭐ FEATURED
          </div>
        )}

      </div>

      <div className="p-6">

        <div className="flex items-center gap-4">

          {logo ? (
            <Image
              src={logo}
              alt={name}
              width={72}
              height={72}
              className="rounded-full object-cover border border-gray-700"
            />
          ) : (
            <div className="w-[72px] h-[72px] rounded-full bg-[#0B0F19] border border-gray-700 flex items-center justify-center text-2xl">
              🪙
            </div>
          )}

          <div>

            <h2 className="text-xl font-bold">
              {name || "Coin Name"}
            </h2>

            <p className="text-gray-400">
              {symbol || "SYMBOL"}
            </p>

          </div>

        </div>

        <div className="mt-8 space-y-5">

          <Row
            title="Listing Price"
            value={
              listingPrice
                ? `$${listingPrice}`
                : "$0.00"
            }
          />

          <Row
            title="Status"
            value={status}
          />

        </div>

        {listingDate && (
          <div className="mt-8">

            <Countdown
              targetDate={listingDate}
            />

          </div>
        )}

      </div>

    </div>
  );
}

function Row({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="flex justify-between">

      <span className="text-gray-400">
        {title}
      </span>

      <span className="font-semibold capitalize">
        {value}
      </span>

    </div>
  );
}