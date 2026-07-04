"use client";

import { useState } from "react";
import Image from "next/image";

interface Coin {
  _id: string;
  name: string;
  symbol: string;
  logo: string;
  listingDate: string;
  currentPrice: number;
  claimEnabled: boolean;
}

interface Reservation {
  _id: string;
  coinsPurchased: number;
  totalPaid: number;
  salePrice: number;
  status: string;
  claimed: boolean;
  coinId: Coin;
}

interface Props {
  reservation: Reservation;
}

export default function MyLaunchpadCard({
  reservation,
}: Props) {
  const coin = reservation.coinId;

  const [loading, setLoading] = useState(false);

  async function claimTokens() {
    setLoading(true);

    try {
      const token = localStorage.getItem("user_token");

      const res = await fetch(
        "/api/launchpad/claim",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            reservationId: reservation._id,
          }),
        }
      );

      const data = await res.json();

      alert(data.message);

      if (data.success) {
        window.location.reload();
      }
    } catch (error) {
      console.error(error);
      alert("Unable to claim tokens.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl bg-[#131A2A] border border-gray-800 p-6">
      <div className="flex gap-4">
        <Image
          src={coin.logo}
          alt={coin.name}
          width={70}
          height={70}
          className="rounded-full"
        />

        <div>
          <h2 className="text-xl font-bold">
            {coin.name}
          </h2>

          <p className="text-gray-400">
            {coin.symbol}
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <Row
          label="Reserved"
          value={`${reservation.coinsPurchased.toLocaleString()} ${coin.symbol}`}
        />

        <Row
          label="Paid"
          value={`$${reservation.totalPaid.toLocaleString()}`}
        />

        <Row
          label="Sale Price"
          value={`$${reservation.salePrice}`}
        />

        <Row
          label="Status"
          value={
            reservation.claimed
              ? "Claimed"
              : reservation.status
          }
        />

        <Row
          label="Listing Date"
          value={new Date(
            coin.listingDate
          ).toLocaleDateString()}
        />

        {!reservation.claimed &&
          coin.claimEnabled && (
            <button
              onClick={claimTokens}
              disabled={loading}
              className="w-full rounded-xl bg-green-500 hover:bg-green-400 disabled:opacity-50 py-3 text-black font-bold transition"
            >
              {loading
                ? "Claiming..."
                : "Claim Tokens"}
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
    <div className="flex justify-between">
      <span className="text-gray-400">
        {label}
      </span>

      <span>{value}</span>
    </div>
  );
}