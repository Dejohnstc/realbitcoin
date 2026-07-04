"use client";

import { Star, Pencil, Trash2 } from "lucide-react";
import Countdown from "./CountDown";

import { CoinListing } from "@/types/coin-listing";

interface Props {
  coin: CoinListing;
  onEdit: () => void;
  onDelete: () => void;
}

export default function CoinCard({
  coin,
  onEdit,
  onDelete,
}: Props) {
  return (
    <div className="rounded-2xl bg-[#131A2A] border border-gray-800 p-5 hover:border-cyan-500 transition">

      <div className="flex justify-between">

        <div>

          <h2 className="text-xl font-bold">
            {coin.name}
          </h2>

          <p className="text-gray-400">
            {coin.symbol}
          </p>

        </div>

        {coin.featured && (
          <Star
            className="text-yellow-400"
            fill="currentColor"
          />
        )}

      </div>

      <div className="mt-4 flex justify-between">

        <span className="text-gray-400">
          Listing Price
        </span>

        <span>
          ${coin.listingPrice}
        </span>

      </div>

      <Countdown
        targetDate={coin.listingDate}
      />

      <div className="flex gap-3 mt-6">

        <button
          onClick={onEdit}
          className="flex-1 bg-cyan-500 text-black rounded-lg py-2 flex justify-center gap-2"
        >
          <Pencil size={16}/>
          Edit
        </button>

        <button
          onClick={onDelete}
          className="bg-red-500 px-4 rounded-lg"
        >
          <Trash2 size={18}/>
        </button>

      </div>

    </div>
  );
}