"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Countdown from "@/components/dashboard/upcoming-coins/Countdown";
import PurchaseCalculator from "@/components/dashboard/launchpad/PurchaseCalculator";
import LaunchProgress from "@/components/dashboard/launchpad/LaunchProgress";
interface Coin {
  _id: string;
  name: string;
  symbol: string;
  slug: string;

  logo: string;
  description: string;

  salePrice: number;
  listingPrice: number;
  currentPrice: number;

  listingDate: string;

  network: string;

  marketCap: string;
  circulatingSupply: string;
  maxSupply: string;

  totalSupply: number;
  reservedSupply: number;

  minPurchase: number;
  maxPurchase: number;

  reservationEnabled: boolean;
  reservations: number;

  website: string;
  whitepaper: string;
  twitter: string;
  telegram: string;

  featured: boolean;

  status: string;
}

export default function LaunchDetailsPage() {
  const { slug } = useParams();

  const [coin, setCoin] = useState<Coin | null>(null);
const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  if (!slug) return;

  async function initialize() {
    await Promise.all([
      loadCoin(),
      loadUser(),
    ]);
  }

  initialize();
}, [slug]);



  async function loadCoin() {
    try {
      const res = await fetch(`/api/upcoming-coins/${slug}`);

      const data = await res.json();

      if (data.success) {
        setCoin(data.coin);
      }
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] animate-pulse" />
    );
  }

  if (!coin) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center">
        Coin not found.
      </div>
    );
  }
async function loadUser() {
  const token = localStorage.getItem("token");

  if (!token) return;

  const res = await fetch("/api/user", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();

  if (data.user) {
    setBalance(data.user.balance);
  }
}
  return (
    <div className="min-h-screen bg-[#0B0F19] text-white">

      {/* HERO */}

      <div className="bg-gradient-to-br from-cyan-600 via-blue-700 to-indigo-900">

        <div className="max-w-7xl mx-auto px-6 py-16">

          <div className="flex flex-col lg:flex-row justify-between gap-10">

            <div className="flex gap-6">

              <Image
                src={coin.logo}
                alt={coin.name}
                width={120}
                height={120}
                className="rounded-full border-4 border-white/20"
              />

              <div>

                {coin.featured && (
                  <div className="inline-flex bg-yellow-400 text-black rounded-full px-3 py-1 text-xs font-bold">
                    ⭐ FEATURED
                  </div>
                )}

                <h1 className="mt-5 text-5xl font-extrabold">
                  {coin.name}
                </h1>

                <p className="text-white/70 mt-2">
                  {coin.symbol}
                </p>

                <p className="mt-4 text-lg">
                  {coin.network}
                </p>

              </div>

            </div>

            <div>

              <p className="mb-4 text-center text-white/80">
                Launch Countdown
              </p>

              <Countdown
                targetDate={coin.listingDate}
              />

            </div>

          </div>

        </div>

      </div>

      {/* CONTENT */}

      <div className="max-w-7xl mx-auto p-6 grid lg:grid-cols-3 gap-8">

        {/* LEFT */}

        <div className="lg:col-span-2 space-y-8">

          <Card title="About">

            <p className="leading-8 text-gray-300">
              {coin.description}
            </p>

          </Card>

          <Card title="Tokenomics">

            <Info
              label="Market Cap"
              value={coin.marketCap}
            />

            <Info
              label="Circulating Supply"
              value={coin.circulatingSupply}
            />

            <Info
              label="Maximum Supply"
              value={coin.maxSupply}
            />

          </Card>

        </div>

        {/* RIGHT */}

        <div className="space-y-6">

          <Card title="Launch Information">

            <Info
  label="Sale Price"
  value={`$${coin.salePrice}`}
/>

<Info
  label="Listing Price"
  value={`$${coin.listingPrice}`}
/>

<Info
  label="Remaining Supply"
  value={(
    coin.totalSupply -
    coin.reservedSupply
  ).toLocaleString()}
/>

<Info
  label="Status"
  value={coin.status}
/>
          </Card>

          <Card title="Official Links">

            <LinkButton
              href={coin.website}
              title="Website"
            />

            <LinkButton
              href={coin.whitepaper}
              title="Whitepaper"
            />

            <LinkButton
              href={coin.twitter}
              title="Twitter"
            />

            <LinkButton
              href={coin.telegram}
              title="Telegram"
            />

          </Card>

          {coin.reservationEnabled && (
  <PurchaseCalculator
    coinId={coin._id}
    salePrice={coin.salePrice}
    minPurchase={coin.minPurchase}
    maxPurchase={coin.maxPurchase}
    balance={balance}
    remainingSupply={
      coin.totalSupply - coin.reservedSupply
    }
    symbol={coin.symbol}
    onSuccess={(newBalance, reservedSupply) => {
      setBalance(newBalance);

      setCoin((prev) =>
        prev
          ? {
              ...prev,
              reservedSupply,
            }
          : prev
      );
    }}
  />
)}
<LaunchProgress
  totalSupply={coin.totalSupply}
  reservedSupply={coin.reservedSupply}
  investors={coin.reservations}
/>
        </div>

      </div>

    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-[#131A2A] border border-gray-800 p-6">

      <h2 className="text-xl font-bold mb-6">
        {title}
      </h2>

      {children}

    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex justify-between py-3 border-b border-gray-800">

      <span className="text-gray-400">
        {label}
      </span>

      <span>
        {value || "-"}
      </span>

    </div>
  );
}

function LinkButton({
  href,
  title,
}: {
  href: string;
  title: string;
}) {
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl bg-[#0B0F19] hover:bg-[#1A2235] p-4 mb-3 transition"
    >
      {title}
    </a>
  );
}