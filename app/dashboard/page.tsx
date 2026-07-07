"use client";

import { useEffect, useState, useRef } from "react";
import UpcomingSection from "@/components/dashboard/upcoming-coins/UpcomingSection";
import FeaturedLaunch from "@/components/dashboard/upcoming-coins/FeaturedLaunch";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Lock,
  CreditCard,
  Rocket,
  Bitcoin,
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
  BarChart3,
  Briefcase,
  LineChart,
  Settings,
  MessageCircle,
  ChevronRight,
  RefreshCw,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface Market {
  id: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
}

interface ToastState {
  msg: string;
  type: "success" | "error";
}

const formatUSD = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);

export default function DashboardPage() {
  const [available, setAvailable] = useState<number>(0);
  const [locked, setLocked] = useState<number>(0);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [btcPrice, setBtcPrice] = useState<number>(0);
  const [tradeAmount, setTradeAmount] = useState<number>(0);

  const [balanceLoading, setBalanceLoading] = useState(true);
  const [loadingMarkets, setLoadingMarkets] = useState(true);
  const [marketError, setMarketError] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [hideBalance, setHideBalance] = useState(false);
  const [trading, setTrading] = useState(false);

  const router = useRouter();
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const total = available + locked;

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  /* ---------- data fetching ---------- */
  const fetchBalance = async () => {
    const token = localStorage.getItem("user_token");
    if (!token) return;
    try {
      const res = await fetch("/api/user/me", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setAvailable(data.user.balance || 0);
        setLocked(data.user.lockedBalance || 0);
      }
    } catch (err) {
      console.error("Balance fetch failed", err);
    } finally {
      setBalanceLoading(false);
    }
  };

  const fetchEarningStatus = async () => {
    const token = localStorage.getItem("user_token");
    if (!token) return;
    try {
      const res = await fetch("/api/earn/status", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await res.json();
      setIsLocked(res.ok && data.earning?.status === "active");
    } catch (err) {
      console.error("Earning status fetch failed", err);
    }
  };

  const fetchMarkets = async () => {
    try {
      setLoadingMarkets(true);
      setMarketError(false);
      const res = await fetch("/api/markets", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error("markets");
      const list: Market[] = Array.isArray(data.markets) ? data.markets : [];
      setMarkets(list);
      const btc = list.find((c) => c.id === "bitcoin");
      if (btc) setBtcPrice(btc.current_price);
    } catch {
      setMarketError(true);
    } finally {
      setLoadingMarkets(false);
    }
  };

  useEffect(() => {
    fetchBalance();
    fetchMarkets();
    fetchEarningStatus();
    const interval = setInterval(() => {
      fetchBalance();
      fetchMarkets();
      fetchEarningStatus();
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  /* ---------- trade (server-confirmed, no fabricated gains) ---------- */
  const handleTrade = async (type: "buy" | "sell") => {
    if (trading) return;
    if (!tradeAmount || tradeAmount <= 0) {
      return showToast("Enter a valid amount", "error");
    }
    if (type === "buy" && tradeAmount > available) {
      return showToast("Insufficient balance", "error");
    }

    setTrading(true);
    try {
      const token = localStorage.getItem("user_token");
      const res = await fetch("/api/trade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type, amount: tradeAmount, symbol: "BTC" }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Trade failed", "error");
        return;
      }
      showToast(
        type === "buy" ? "Buy order placed" : "Sell order executed",
        "success"
      );
      setTradeAmount(0);
      await fetchBalance(); // reflect the server's confirmed balance
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setTrading(false);
    }
  };

  const setTradePct = (pct: number) =>
    setTradeAmount(Number((available * pct).toFixed(2)));

  /* ---------- navigation ---------- */
  const menu: { icon: typeof CreditCard; label: string; onClick: () => void }[] =
    [
      {
        icon: ArrowDownToLine,
        label: "Deposit Funds",
        onClick: () => router.push("/dashboard/deposit"),
      },
      {
        icon: ArrowUpFromLine,
        label: "Withdraw Funds",
        onClick: () => router.push("/dashboard/withdraw"),
      },
      {
        icon: BarChart3,
        label: "Investment Plans",
        onClick: () => router.push("/dashboard/investments"),
      },
      {
        icon: Briefcase,
        label: "My Portfolio",
        onClick: () => router.push("/dashboard/portfolio"),
      },
      {
        icon: LineChart,
        label: "Live Markets",
        onClick: () => router.push("/dashboard/livemarket"),
      },
      {
        icon: Settings,
        label: "Settings",
        onClick: () => router.push("/dashboard/settings"),
      },
      {
        icon: MessageCircle,
        label: "Contact Support Via WhatsApp",
        onClick: () => window.open("https://wa.me/18025484090", "_blank"),
      },
    ];

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white px-4 pb-24">
      {/* TOAST */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-6 right-6 z-50 px-4 py-2 rounded-lg shadow-lg text-sm font-medium animate-fadein ${
            toast.type === "error"
              ? "bg-red-500/90 text-white"
              : "bg-green-500/90 text-black"
          }`}
        >
          {toast.msg}
        </div>
      )}

 {/* HERO BALANCE */}
     <div className="relative mb-5 overflow-hidden rounded-3xl border border-cyan-500/10 bg-gradient-to-br from-[#1F2942] via-[#182135] to-[#111827] p-6 shadow-2xl">

  {/* Background Effects */}
  <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
  <div className="absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />

  <div className="relative z-10">

    {/* Header */}
    <div className="flex items-start justify-between">

      <div>

        <p className="text-[11px] uppercase tracking-[0.25em] text-cyan-300/80">
          Portfolio Value
        </p>

        {balanceLoading ? (
          <div className="mt-3 h-10 w-48 animate-pulse rounded bg-white/10" />
        ) : (
          <h1 className="mt-2 text-4xl font-black tracking-tight">
            {hideBalance ? "••••••" : formatUSD(total)}
          </h1>
        )}

        <div className="mt-3 inline-flex items-center rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1">

          <span className="text-xs font-semibold text-green-400">
            ● Portfolio Active
          </span>

        </div>

      </div>

      <div className="flex items-center gap-2">

        {isLocked && (
          <div className="rounded-full border border-yellow-500/20 bg-yellow-500/10 p-2">

            <Lock
              size={15}
              className="text-yellow-400"
            />

          </div>
        )}

      </div>

    </div>

    {/* Stats */}

    <div className="mt-6 grid grid-cols-2 gap-4">

      <div className="rounded-2xl border border-white/5 bg-[#0F1526]/90 p-4 backdrop-blur">

        <p className="text-xs uppercase tracking-wide text-gray-500">
          Available
        </p>

        <p className="mt-2 text-xl font-bold">
          {hideBalance ? "••••" : formatUSD(available)}
        </p>

      </div>

      <div className="rounded-2xl border border-white/5 bg-[#0F1526]/90 p-4 backdrop-blur">

        <p className="text-xs uppercase tracking-wide text-gray-500">
          Locked
        </p>

        <p className="mt-2 text-xl font-bold text-yellow-400">
          {hideBalance ? "••••" : formatUSD(locked)}
        </p>

      </div>

    </div>

    {/* Footer */}

    <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">

      <div>

        <p className="text-xs text-gray-500">
          Account Status
        </p>

        <p className="font-semibold text-green-400">
          Verified & Secure
        </p>

      </div>

      <button
        className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/20"
      >
        View Portfolio →
      </button>

    </div>

  </div>

</div>
      {/* TOP ACTIONS */}
      <div className="grid grid-cols-4 gap-3 my-5">

  <button
    onClick={() => router.push("/dashboard/deposit")}
    className="group rounded-2xl border border-white/5 bg-gradient-to-b from-[#1B2338] to-[#141B2D] p-4 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/40 hover:shadow-cyan-500/10"
  >
    <ArrowDownToLine className="mx-auto h-6 w-6 transition-transform duration-300 group-hover:scale-110" />
    <p className="mt-2 text-xs font-medium">
      Deposit
    </p>
  </button>

  <button
    onClick={() => router.push("/dashboard/withdraw")}
    className="group rounded-2xl border border-white/5 bg-gradient-to-b from-[#1B2338] to-[#141B2D] p-4 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/40 hover:shadow-cyan-500/10"
  >
    <ArrowUpFromLine className="mx-auto h-6 w-6 text-red-400 transition-transform duration-300 group-hover:scale-110" />
    <p className="mt-2 text-xs font-medium">
      Withdraw
    </p>
  </button>

  <button
    onClick={() => router.push("/dashboard/convert")}
    className="group rounded-2xl border border-white/5 bg-gradient-to-b from-[#1B2338] to-[#141B2D] p-4 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/40 hover:shadow-cyan-500/10"
  >
    <RefreshCw className="mx-auto h-6 w-6 text-cyan-400" />
    <p className="mt-2 text-xs font-medium">
      Convert
    </p>
  </button>

  <button
    onClick={() => router.push("/dashboard/investments")}
    className="rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-500 p-4 text-black transition hover:scale-[1.03]"
  >
    <Rocket className="mx-auto h-6 w-6" />
    <p className="mx-auto h-6 w-6 transition-transform duration-300 group-hover:scale-110">
      Invest
    </p>
  </button>

</div>

     
      {/* UPCOMING COIN LISTINGS */}

<div className="mb-3 mt-8 flex items-center justify-between">

  <h2 className="text-lg font-bold">
    Featured Launch
  </h2>

  <button className="text-sm text-cyan-400 hover:text-cyan-300">
    View All
  </button>

</div>

<FeaturedLaunch />

<UpcomingSection />

      {/* STAT CHIPS */}
      <div className="grid grid-cols-2 gap-3 mb-2">
        <div className="bg-[#131A2A] p-4 rounded-xl flex items-center gap-3">
          <div className="p-2 rounded-lg bg-yellow-400/10">
            <Bitcoin size={18} className="text-yellow-400" />
          </div>
          <div>
            <p className="text-gray-400 text-xs">BTC Price</p>
            <p className="font-bold">
              {btcPrice ? formatUSD(btcPrice) : "—"}
            </p>
          </div>
        </div>

        <div className="bg-[#131A2A] p-4 rounded-xl flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-400/10">
            <Activity size={18} className="text-green-400" />
          </div>
          <div>
            <p className="text-gray-400 text-xs">Market Status</p>
            <p className="font-bold text-green-400">Open</p>
          </div>
        </div>
      </div>

      {/* CHART */}
      <div className="mt-4 bg-[#131A2A] p-2 rounded-xl">
        <iframe
          title="BTC/USDT chart"
          loading="lazy"
          src="https://s.tradingview.com/widgetembed/?symbol=BINANCE:BTCUSDT&interval=60&theme=dark"
          className="w-full h-64 rounded-lg"
        />
      </div>

      {/* MARKETS */}
      {/* LIVE MARKETS */}

<div className="mt-6">

  <div className="mb-4 flex items-center justify-between">

    <h2 className="text-lg font-bold">
      Live Markets
    </h2>

    <button
      onClick={() => router.push("/dashboard/livemarket")}
      className="text-sm text-cyan-400 hover:text-cyan-300"
    >
      View All
    </button>

  </div>

  <div className="space-y-3">

    {markets.slice(0, 5).map((coin) => {

      const up =
        coin.price_change_percentage_24h >= 0;

      return (

        <button
          key={coin.id}
          onClick={() =>
            router.push(
              `/dashboard/livemarket/${coin.symbol}`
            )
          }
          className="flex w-full items-center justify-between rounded-2xl border border-white/5 bg-gradient-to-b from-[#1B2338] to-[#141B2D] p-4 transition hover:border-cyan-400/30 hover:bg-[#1A2235]"
        >

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan-500/10">

              <Bitcoin
                size={20}
                className="text-yellow-400"
              />

            </div>

            <div className="text-left">

              <p className="font-semibold">
                {coin.symbol.toUpperCase()}
              </p>

              <p className="text-xs text-gray-400">
                {coin.id}
              </p>

            </div>

          </div>

          <div className="text-right">

            <p className="font-bold">

              {formatUSD(coin.current_price)}

            </p>

            <p
              className={`text-sm ${
                up
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >

              {up ? "+" : ""}

              {coin.price_change_percentage_24h.toFixed(
                2
              )}
              %

            </p>

          </div>

        </button>

      );

    })}

  </div>

</div>

      {/* QUICK TRADE */}
      {/* QUICK CONVERT */}

<div className="mt-6 rounded-3xl border border-white/5 bg-gradient-to-b from-[#1B2338] to-[#141B2D] p-5">

  <div className="mb-5 flex items-center justify-between">

    <div>

      <h2 className="text-lg font-bold">
        Quick Convert
      </h2>

      <p className="text-sm text-gray-400">
        Instantly convert assets
      </p>

    </div>

  </div>

  <div className="grid grid-cols-3 gap-3">

    <div className="rounded-2xl bg-[#0F1526] p-3">

      <p className="text-xs text-gray-500">
        From
      </p>

      <p className="mt-2 font-semibold">
        USD
      </p>

    </div>

    <div className="flex items-center justify-center">

      <RefreshCw
        size={22}
        className="text-cyan-400"
      />

    </div>

    <div className="rounded-2xl bg-[#0F1526] p-3">

      <p className="text-xs text-gray-500">
        To
      </p>

      <p className="mt-2 font-semibold">
        BTC
      </p>

    </div>

  </div>

  <button
    onClick={() =>
      router.push("/dashboard/convert")
    }
    className="mt-5 w-full rounded-2xl bg-cyan-500 py-3 font-bold text-black transition hover:bg-cyan-400"
  >
    Open Converter
  </button>

</div>
      {/* MENU */}
      <div className="mt-4 space-y-3">
       <div className="mt-6">

  <div className="mb-4 flex items-center justify-between">

    <h2 className="text-lg font-bold">
      Services
    </h2>

  </div>

  <div className="grid grid-cols-2 gap-4">

    {menu.map(({ icon: Icon, label, onClick }) => (

      <button
        key={label}
        onClick={onClick}
        className="group rounded-2xl border border-white/5 bg-gradient-to-b from-[#1B2338] to-[#141B2D] p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/30"
      >

        <Icon
          size={26}
          className="mb-4 text-cyan-400 transition group-hover:scale-110"
        />

        <p className="font-semibold">
          {label}
        </p>

        <p className="mt-1 text-xs text-gray-400">
          Open
        </p>

      </button>

    ))}

  </div>

</div> 
      </div>

      <style jsx>{`
        @keyframes fadein {
          from {
            opacity: 0;
            transform: translateY(-6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadein {
          animation: fadein 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
