"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Asset {
  symbol: string;
  name: string;
  logo: string;
  amount: number;
  averageBuyPrice: number;
  currentPrice: number;
  value: number;
  profit: number;
  profitPercent: number;
  isLaunchToken: boolean;
}

export default function AssetDetailsPage() {
  const { symbol } = useParams<{ symbol: string }>();

  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAsset();
  }, [symbol]);

  async function loadAsset() {
    try {
      const token = localStorage.getItem("user_token");

      if (!token) return;

      const res = await fetch(`/api/assets/${symbol}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (data.success) {
        setAsset(data.asset);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-gray-400">
        Loading asset...
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="py-20 text-center text-red-400">
        Asset not found.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">

      {/* Header */}

      <div className="rounded-3xl border border-gray-800 bg-[#131A2A] p-6">

        <div className="flex items-center gap-5">

          <Image
            src={asset.logo}
            alt={asset.symbol}
            width={64}
            height={64}
            className="rounded-full"
          />

          <div>

            <h1 className="text-3xl font-bold">
              {asset.name}
            </h1>

            <p className="text-gray-400">
              {asset.symbol}
            </p>

          </div>

        </div>

      </div>

      {/* Stats */}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">

        <Card
          title="Current Price"
          value={`$${asset.currentPrice.toLocaleString(undefined,{
            maximumFractionDigits:2,
          })}`}
        />

        <Card
          title="Holdings"
          value={`${asset.amount.toLocaleString(undefined,{
            maximumFractionDigits:8,
          })} ${asset.symbol}`}
        />

        <Card
          title="Current Value"
          value={`$${asset.value.toLocaleString(undefined,{
            maximumFractionDigits:2,
          })}`}
        />

        <Card
          title="Average Buy"
          value={`$${asset.averageBuyPrice.toLocaleString(undefined,{
            maximumFractionDigits:2,
          })}`}
        />

      </div>

      {/* Profit */}

      <div className="rounded-3xl border border-gray-800 bg-[#131A2A] p-6">

        <div className="flex items-center justify-between">

          <div>

            <p className="text-gray-400">
              Profit / Loss
            </p>

            <h2
              className={`mt-2 text-4xl font-bold ${
                asset.profit >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {asset.profit >= 0 ? "+" : ""}
              ${asset.profit.toLocaleString(undefined,{
                maximumFractionDigits:2,
              })}
            </h2>

            <p
              className={`mt-2 ${
                asset.profit >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {asset.profit >= 0 ? "+" : ""}
              {asset.profitPercent.toFixed(2)}%
            </p>

          </div>

        </div>

      </div>

      {/* Actions */}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">

        <Link
          href="/dashboard/convert"
          className="rounded-2xl bg-cyan-500 py-4 text-center font-bold text-black transition hover:bg-cyan-400"
        >
          Convert
        </Link>

        <Link
          href="/dashboard/transfer"
          className="rounded-2xl bg-blue-500 py-4 text-center font-bold"
        >
          Transfer
        </Link>

        <button
          className="rounded-2xl bg-green-600 py-4 font-bold"
        >
          Buy
        </button>

        <button
          className="rounded-2xl bg-red-600 py-4 font-bold"
        >
          Sell
        </button>

      </div>

    </div>
  );
}

function Card({
  title,
  value,
}:{
  title:string;
  value:string;
}) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-[#131A2A] p-5">

      <p className="text-sm text-gray-400">
        {title}
      </p>

      <p className="mt-3 text-2xl font-bold">
        {value}
      </p>

    </div>
  );
}