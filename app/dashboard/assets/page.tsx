"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Repeat,
  RefreshCcw,
  Eye,
  EyeOff,
} from "lucide-react";
import LaunchpadHoldings from "@/components/dashboard/assets/LaunchpadHoldings";
import RecentActivity from "@/components/dashboard/assets/RecentActivity";

interface User {
  name: string;
  email: string;
  balance: number;
  lockedBalance?: number; // 🔥 ADD
}

interface Market {
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
}
interface AssetSummary {
  availableBalance: number;
  lockedBalance: number;
  launchpadReserved: number;
  activeInvestments: number;
  reservationCount: number;
  totalNetWorth: number;
}
interface Activity {
  type: string;
  title: string;
  amount: number;
  date: string;
}


export default function AssetsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
const [reservations, setReservations] = useState([]);
const [activity, setActivity] = useState<Activity[]>([]);
interface PortfolioAsset {
  _id: string;
  assetName: string;
  assetSymbol: string;
  logo: string;
  amount: number;
  currentPrice: number;
  averageBuyPrice: number;
  value: number;
  profit: number;
  profitPercent: number;
  isLaunchToken: boolean;
}

const [portfolio, setPortfolio] =
  useState<PortfolioAsset[]>([]);
const [summary, setSummary] =
  useState<AssetSummary | null>(null);
  
  const [hideBalance, setHideBalance] = useState(false);
  const [flash, setFlash] = useState(false);
const router = useRouter();

useEffect(() => {
  const saved = localStorage.getItem("hideBalance");

  if (saved) {
    setHideBalance(saved === "true");
  }
}, []);

useEffect(() => {
  localStorage.setItem(
    "hideBalance",
    String(hideBalance)
  );
}, [hideBalance]);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("user_token");
const [
  userRes,
  marketRes,
  reservationRes,
  summaryRes,
  activityRes,
  portfolioRes,
] = await Promise.all([
  fetch("/api/user/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  }),

  fetch("/api/markets", {
    cache: "no-store",
  }),

  fetch("/api/assets/launchpad", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  }),

  fetch("/api/assets/summary", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
    
  }),

  fetch("/api/assets/activity", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  }),
  fetch("/api/assets/portfolio", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
  cache: "no-store",
}),
]);
  

      const userData = await userRes.json();

const marketData = await marketRes.json();

const summaryData =
  await summaryRes.json();
const reservationData =
  await reservationRes.json();
  const portfolioData =
  await portfolioRes.json();
  const activityData =
  await activityRes.json();
        setUser(userData.user);
        setMarkets(marketData.markets || []);
        setSummary(summaryData.summary);
        setReservations(
  reservationData.reservations || []
);
setPortfolio(
  portfolioData.portfolio || []
);
setActivity(activityData.activity);
      } catch (err) {
        console.log("Load error", err);
      } finally {
        setLoading(false);
      }
    };

    load();

    const interval = setInterval(() => {
      setFlash(true);
      setTimeout(() => setFlash(false), 300);
      load();
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading...
      </div>
    );
  }

  // 🔥 FIXED LOGIC (MATCH PORTFOLIO)
 const available =
  summary?.availableBalance ?? 0;

const locked =
  summary?.lockedBalance ?? 0;

const totalUSD =
  summary?.totalNetWorth ?? 0;

const launchpadReserved =
  summary?.launchpadReserved ?? 0;

 const btcPrice =
markets.find((m) =>
m.symbol?.toLowerCase().includes("btc")
)?.current_price || 0;

  const totalBTC = btcPrice ? totalUSD / btcPrice : 0;

  const maskedEmail =
    user.email?.replace(/(.{3}).+(@.+)/, "$1***$2") || "user";

  // 🔥 FIXED ICONS (MOBILE SAFE CDN)
  const coinIcons: Record<string, string> = {
    btc: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
    eth: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
    bnb: "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png",
    sol: "https://assets.coingecko.com/coins/images/4128/large/solana.png",
    usdt: "https://assets.coingecko.com/coins/images/325/large/Tether.png",
    xrp: "https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png",
  };

  return (
    <div className="min-h-screen bg-black text-white px-4 pt-4 pb-24">

      {/* HEADER */}
      <div className="
flex justify-between items-center
bg-[#131A2A]
p-4
rounded-xl
hover:bg-[#1A2235]
hover:scale-[1.01]
transition-all
cursor-pointer
">
        <p className="text-gray-500 text-sm">{maskedEmail}</p>

        <button
          onClick={() => setHideBalance(!hideBalance)}
          className="text-gray-400"
        >
          {hideBalance ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {/* TOTAL ASSETS */}
      <div className="bg-gradient-to-br from-[#131A2A] to-[#0B0F19] p-5 rounded-2xl mb-6 border border-white/5 shadow-lg">

        <p className="text-gray-400 text-sm">Total Assets</p>
<div className="mt-4 flex items-center gap-2">
  <span className="text-green-400 font-semibold">
    +5.42%
  </span>

  <span className="text-gray-400 text-sm">
    This Month
  </span>
</div>
        <h1
          className={`text-4xl font-bold mt-2 transition ${
            flash ? "text-yellow-400" : ""
          }`}
        >
          {hideBalance ? "****" : totalUSD.toFixed(2)}{" "}
          <span className="text-lg">USD</span>
        </h1>

        <p className="text-gray-500 text-sm mt-1">
          {hideBalance ? "****" : `≈ ${totalBTC.toFixed(8)} BTC`}
        </p>

       <div className="grid grid-cols-3 gap-3 mt-6">

  <div className="bg-[#1A2235] rounded-xl p-3 text-center">
    <p className="text-xs text-gray-400">
      Available
    </p>

    <p className="mt-2 font-bold">
      {hideBalance
        ? "****"
        : `$${available.toLocaleString(undefined, {
            maximumFractionDigits: 2,
          })}`}
    </p>
  </div>

  <div className="bg-[#1A2235] rounded-xl p-3 text-center">
    <p className="text-xs text-gray-400">
      Locked
    </p>

    <p className="mt-2 font-bold text-yellow-400">
      {hideBalance
        ? "****"
        : `$${locked.toLocaleString(undefined, {
            maximumFractionDigits: 2,
          })}`}
    </p>
  </div>

  <div className="bg-[#1A2235] rounded-xl p-3 text-center">
    <p className="text-xs text-gray-400">
      Launchpad
    </p>

    <p className="mt-2 font-bold text-cyan-400">
      {hideBalance
        ? "****"
        : `$${launchpadReserved.toLocaleString(undefined, {
            maximumFractionDigits: 2,
          })}`}
    </p>
  </div>

</div>

<div className="grid grid-cols-2 gap-3 mt-4">

  <div className="bg-[#1A2235] rounded-xl p-4">
    <p className="text-xs text-gray-400">
      Active Investments
    </p>

    <p className="mt-2 text-2xl font-bold text-yellow-400">
      {summary?.activeInvestments ?? 0}
    </p>
  </div>

  <div className="bg-[#1A2235] rounded-xl p-4">
    <p className="text-xs text-gray-400">
      Monthly Return
    </p>

    <p className="mt-2 text-2xl font-bold text-green-400">
      +5.42%
    </p>
  </div>

</div>
</div>

      {/* ACTIONS */}
      {/* QUICK ACTIONS */}

<div className="mb-8">

  <h2 className="mb-4 text-lg font-bold">
    Quick Actions
  </h2>

  <div className="grid grid-cols-2 gap-4">

    {[
      {
        name: "Deposit",
        icon: ArrowDownLeft,
        path: "/dashboard/deposit",
        color: "from-green-500 to-green-600",
      },
      {
        name: "Withdraw",
        icon: ArrowUpRight,
        path: "/dashboard/withdraw",
        color: "from-red-500 to-red-600",
      },
      {
        name: "Transfer",
        icon: Repeat,
        path: "/dashboard/transfer",
        color: "from-blue-500 to-cyan-500",
      },
      {
        name: "Convert",
        icon: RefreshCcw,
        path: "/dashboard/convert",
        color: "from-yellow-400 to-orange-400",
        text: "text-black",
      },
    ].map((btn) => {
      const Icon = btn.icon;

      return (
        <button
          key={btn.name}
          onClick={() => router.push(btn.path)}
          className={`
            rounded-2xl
            p-5
            bg-gradient-to-r
            ${btn.color}
            ${btn.text ?? "text-white"}
            shadow-lg
            hover:scale-[1.03]
            active:scale-95
            transition-all
          `}
        >
          <div className="flex flex-col items-center">

            <Icon size={28} />

            <p className="mt-3 font-semibold">
              {btn.name}
            </p>

          </div>
        </button>
      );
    })}

  </div>

</div>
      {/* ASSETS */}
    <div className="space-y-4">
  {portfolio.length === 0 ? (
    <div className="rounded-2xl bg-[#131A2A] border border-gray-800 p-8 text-center text-gray-400">
      No crypto assets yet
    </div>
  ) : (
    portfolio.map((asset) => (
      <Link
  key={asset._id}
  href={`/dashboard/assets/${asset.assetSymbol.toLowerCase()}`}
  className="block"
>
  <div className="rounded-2xl border border-gray-800 bg-[#131A2A] p-5 transition-all duration-300 hover:border-cyan-500 hover:bg-[#182136]">

    <div className="flex items-center justify-between">

      <div className="flex items-center gap-4">

        <img
          src={asset.logo}
          alt={asset.assetSymbol}
          className="h-12 w-12 rounded-full"
        />

        <div>

          <div className="flex items-center gap-2">

            <p className="font-bold text-lg">
              {asset.assetSymbol}
            </p>

            {asset.isLaunchToken && (
              <span className="rounded-full bg-yellow-500/20 px-2 py-1 text-xs text-yellow-400">
                Launchpad
              </span>
            )}

          </div>

          <p className="text-sm text-gray-400">
            {asset.amount.toLocaleString(undefined, {
              maximumFractionDigits: 8,
            })}
          </p>

        </div>

      </div>

      <div className="text-right">

        <p className="text-xl font-bold">
          {hideBalance
            ? "****"
            : `$${asset.value.toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}`}
        </p>

        <p
          className={`text-sm ${
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
</Link>
    ))
  )}
</div>

<LaunchpadHoldings
  items={reservations}
/>
<RecentActivity items={activity} />
    </div>
  );
}