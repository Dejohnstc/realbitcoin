"use client";

import { useEffect, useState, useRef } from "react";
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

      {/* TOP ACTIONS */}
      <div className="flex items-center gap-3 my-4">
        <button
          onClick={() => setHideBalance((h) => !h)}
          aria-label={hideBalance ? "Show balance" : "Hide balance"}
          className="p-3 rounded-xl bg-[#131A2A] hover:bg-[#1A2235] transition-colors"
        >
          {hideBalance ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>

        <button
          onClick={() => router.push("/dashboard/deposit")}
          aria-label="Deposit"
          className="p-3 rounded-xl bg-[#131A2A] hover:bg-[#1A2235] transition-colors"
        >
          <CreditCard size={18} />
        </button>

        <button
          onClick={() => router.push("/dashboard/investments")}
          className="flex-1 py-3 rounded-xl bg-yellow-400 text-black font-semibold flex items-center justify-center gap-2 hover:bg-yellow-300 active:scale-[0.99] transition"
        >
          <Rocket size={18} /> Start Investment
        </button>
      </div>

      {/* HERO BALANCE */}
      <div className="bg-gradient-to-br from-[#1A2235] to-[#131A2A] border border-gray-800 p-6 rounded-2xl mb-4">
        <div className="flex items-center justify-between">
          <p className="text-gray-400 text-sm flex items-center gap-1.5">
            Total Balance
            {isLocked && <Lock size={13} className="text-yellow-400" />}
          </p>
        </div>

        {balanceLoading ? (
          <div className="mt-2 h-9 w-44 bg-white/5 rounded animate-pulse" />
        ) : (
          <h1 className="mt-1 text-4xl font-bold tracking-tight">
            {hideBalance ? "••••••" : formatUSD(total)}
          </h1>
        )}

        <div className="mt-4 flex gap-3">
          <div className="flex-1 bg-[#0B0F19]/60 rounded-xl px-3 py-2">
            <p className="text-gray-500 text-[11px]">Available</p>
            <p className="text-sm font-medium">
              {hideBalance ? "••••" : formatUSD(available)}
            </p>
          </div>
          <div className="flex-1 bg-[#0B0F19]/60 rounded-xl px-3 py-2">
            <p className="text-gray-500 text-[11px]">Locked</p>
            <p className="text-sm font-medium text-yellow-400">
              {hideBalance ? "••••" : formatUSD(locked)}
            </p>
          </div>
        </div>
      </div>

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
      <div className="mt-6 bg-[#131A2A] p-2 rounded-xl">
        <iframe
          title="BTC/USDT chart"
          loading="lazy"
          src="https://s.tradingview.com/widgetembed/?symbol=BINANCE:BTCUSDT&interval=60&theme=dark"
          className="w-full h-64 rounded-lg"
        />
      </div>

      {/* MARKETS */}
      <div className="mt-6 bg-[#131A2A] p-4 rounded-xl">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold flex items-center gap-2">
            <LineChart size={16} className="text-yellow-400" /> Live Markets
          </h2>
          {marketError && (
            <button
              onClick={fetchMarkets}
              className="text-xs flex items-center gap-1 text-yellow-400 hover:text-yellow-300"
            >
              <RefreshCw size={12} /> Retry
            </button>
          )}
        </div>

        {loadingMarkets && (
          <div className="space-y-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-8 bg-white/5 rounded animate-pulse"
              />
            ))}
          </div>
        )}

        {!loadingMarkets && marketError && (
          <p className="text-red-400 text-sm">
            Couldn&apos;t load markets. Tap retry to try again.
          </p>
        )}

        {!loadingMarkets &&
          !marketError &&
          markets.slice(0, 5).map((m) => {
            const change = m.price_change_percentage_24h ?? 0;
            const up = change >= 0;
            return (
              <div
                key={m.id}
                onClick={() =>
                  router.push(`/dashboard/livemarket/${m.symbol}`)
                }
                className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0 cursor-pointer hover:bg-white/[0.02] px-1 rounded transition-colors"
              >
                <span className="font-medium">{m.symbol.toUpperCase()}</span>
                <span className="text-gray-300">
                  {formatUSD(m.current_price ?? 0)}
                </span>
                <span
                  className={`flex items-center gap-1 text-sm ${
                    up ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {up ? (
                    <TrendingUp size={13} />
                  ) : (
                    <TrendingDown size={13} />
                  )}
                  {Math.abs(change).toFixed(2)}%
                </span>
              </div>
            );
          })}
      </div>

      {/* QUICK TRADE */}
      <div className="mt-6 bg-[#131A2A] p-4 rounded-xl">
        <h2 className="mb-3 font-semibold flex items-center gap-2">
          <Activity size={16} className="text-yellow-400" /> Quick Trade
        </h2>

        <input
          type="number"
          min={0}
          value={tradeAmount || ""}
          onChange={(e) => setTradeAmount(Number(e.target.value))}
          className="w-full p-3 mb-2 bg-[#0B0F19] rounded-lg outline-none focus:ring-1 focus:ring-yellow-400"
          placeholder="Enter amount (USD)"
        />

        <div className="flex gap-2 mb-3">
          {[
            { label: "25%", pct: 0.25 },
            { label: "50%", pct: 0.5 },
            { label: "Max", pct: 1 },
          ].map((c) => (
            <button
              key={c.label}
              onClick={() => setTradePct(c.pct)}
              className="flex-1 py-1.5 text-xs rounded-lg bg-[#0B0F19] text-gray-300 hover:text-white hover:bg-[#0B0F19]/70 transition-colors"
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => handleTrade("buy")}
            disabled={trading || tradeAmount <= 0}
            className="flex-1 py-3 bg-green-500 text-black rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-400 active:scale-[0.99] transition"
          >
            {trading ? "..." : "Buy"}
          </button>

          <button
            onClick={() => handleTrade("sell")}
            disabled={trading || tradeAmount <= 0}
            className="flex-1 py-3 bg-red-500 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-400 active:scale-[0.99] transition"
          >
            {trading ? "..." : "Sell"}
          </button>
        </div>
      </div>

      {/* MENU */}
      <div className="mt-6 space-y-3">
        {menu.map(({ icon: Icon, label, onClick }) => (
          <div
            key={label}
            onClick={onClick}
            className="flex items-center justify-between p-4 bg-[#131A2A] rounded-xl cursor-pointer hover:bg-[#1A2235] active:scale-[0.99] transition"
          >
            <span className="flex items-center gap-3">
              <Icon size={18} className="text-gray-300" />
              {label}
            </span>
            <ChevronRight size={18} className="text-gray-500" />
          </div>
        ))}
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
