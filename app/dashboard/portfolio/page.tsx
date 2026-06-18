"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Wallet, TrendingUp, Lock } from "lucide-react";

/* ---------- types ---------- */
interface Earning {
  earnedSoFar: number;
  progress: number;
  targetAmount: number;
  depositAmount: number;
  status: "active" | "completed";
  endTime?: string;
}

interface UserMeResponse {
  user?: { balance?: number };
}

interface EarnStatusResponse {
  earning?: Earning | null;
}

type Candle = { open: number; high: number; low: number; close: number };

/* ---------- helpers ---------- */
const formatUSD = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);

/* =============================================================
   LIVE CANDLESTICK CHART
   Simulated price motion anchored to `value`. Pauses when the
   tab is hidden to save battery. Not real market data.
   ============================================================= */
function LiveCandleChart({
  value,
  active,
}: {
  value: number;
  active: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const valueRef = useRef(value);
  const candlesRef = useRef<Candle[]>([]);
  const currentRef = useRef<Candle | null>(null);
  const priceRef = useRef(value || 1000);
  const tickCountRef = useRef(0);
  const lastTickRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const TICK_MS = 150;
    const TICKS_PER_CANDLE = 13;
    const MAX_CANDLES = 46;

    if (candlesRef.current.length === 0) {
      let seed = valueRef.current || 1000;
      const seeded: Candle[] = [];
      for (let i = 0; i < MAX_CANDLES; i++) {
        const open = seed;
        const close = seed * (1 + (Math.random() - 0.45) * 0.01);
        const high = Math.max(open, close) * (1 + Math.random() * 0.004);
        const low = Math.min(open, close) * (1 - Math.random() * 0.004);
        seeded.push({ open, high, low, close });
        seed = close;
      }
      candlesRef.current = seeded;
      priceRef.current = seed;
      currentRef.current = { open: seed, high: seed, low: seed, close: seed };
    }

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height;
      ctx.clearRect(0, 0, W, H);

      const cur = currentRef.current;
      const all = cur ? [...candlesRef.current, cur] : candlesRef.current;
      if (all.length === 0) return;

      let min = Infinity;
      let max = -Infinity;
      for (const c of all) {
        if (c.low < min) min = c.low;
        if (c.high > max) max = c.high;
      }
      const padV = (max - min) * 0.12 || max * 0.01 || 1;
      min -= padV;
      max += padV;
      const range = max - min || 1;

      const padRight = 62;
      const plotW = W - padRight;
      const slot = plotW / all.length;
      const bodyW = Math.max(2, slot * 0.6);
      const y = (p: number) => H - ((p - min) / range) * H;

      ctx.lineWidth = 1;
      ctx.font = "10px Arial";
      for (let i = 0; i <= 4; i++) {
        const gy = (H / 4) * i;
        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(plotW, gy);
        ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,0.28)";
        ctx.fillText((max - (range / 4) * i).toFixed(2), plotW + 6, gy + 3);
      }

      all.forEach((c, i) => {
        const cx = slot * i + slot / 2;
        const up = c.close >= c.open;
        const color = up ? "#22c55e" : "#ef4444";
        ctx.strokeStyle = color;
        ctx.fillStyle = color;

        ctx.beginPath();
        ctx.moveTo(cx, y(c.high));
        ctx.lineTo(cx, y(c.low));
        ctx.stroke();

        const top = Math.min(y(c.open), y(c.close));
        const h = Math.max(1, Math.abs(y(c.close) - y(c.open)));
        ctx.fillRect(cx - bodyW / 2, top, bodyW, h);
      });

      const last = all[all.length - 1];
      const ly = y(last.close);
      const up = last.close >= last.open;
      ctx.strokeStyle = up ? "rgba(34,197,94,0.5)" : "rgba(239,68,68,0.5)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, ly);
      ctx.lineTo(plotW, ly);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = up ? "#22c55e" : "#ef4444";
      ctx.fillRect(plotW, ly - 9, padRight, 18);
      ctx.fillStyle = "#0B0F19";
      ctx.font = "bold 10px Arial";
      ctx.fillText(last.close.toFixed(2), plotW + 6, ly + 3);
    };

    const loop = (ts: number) => {
      // pause work while the tab is hidden (saves battery on mobile)
      if (document.hidden) {
        lastTickRef.current = ts;
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      if (!lastTickRef.current) lastTickRef.current = ts;

      if (active && ts - lastTickRef.current >= TICK_MS) {
        lastTickRef.current = ts;

        const target = valueRef.current || priceRef.current;
        const drift = (target - priceRef.current) * 0.06;
        const noise = priceRef.current * (Math.random() - 0.5) * 0.005;
        priceRef.current = Math.max(0.01, priceRef.current + drift + noise);

        const cur = currentRef.current;
        if (cur) {
          cur.close = priceRef.current;
          cur.high = Math.max(cur.high, priceRef.current);
          cur.low = Math.min(cur.low, priceRef.current);
        }

        tickCountRef.current++;
        if (tickCountRef.current >= TICKS_PER_CANDLE && cur) {
          candlesRef.current.push({ ...cur });
          if (candlesRef.current.length > MAX_CANDLES)
            candlesRef.current.shift();
          currentRef.current = {
            open: priceRef.current,
            high: priceRef.current,
            low: priceRef.current,
            close: priceRef.current,
          };
          tickCountRef.current = 0;
        }
      }

      draw();
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "190px", display: "block" }}
    />
  );
}

export default function PortfolioPage() {
  const [userBalance, setUserBalance] = useState(0);
  const [earning, setEarning] = useState<Earning | null>(null);

  const [displayValue, setDisplayValue] = useState(0);
  const [isUp, setIsUp] = useState(true);

  const [ticker, setTicker] = useState<string[]>([]);
  const [countdown, setCountdown] = useState("");

  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const frameRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const realTotalRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleUnauthorized = useCallback(() => {
    router.push("/auth/login");
  }, [router]);

  /* ---------- data fetching ---------- */
  const refreshUser = useCallback(async () => {
    try {
      const token = localStorage.getItem("user_token");
      const res = await fetch("/api/user/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) return handleUnauthorized();
      if (!res.ok) throw new Error(`user/me ${res.status}`);
      const data: UserMeResponse = await res.json();
      if (mountedRef.current) setUserBalance(data.user?.balance ?? 0);
    } catch (err) {
      console.error("Failed to load user:", err);
      if (mountedRef.current) setError("Could not load your balance.");
    }
  }, [handleUnauthorized]);

  const refreshEarning = useCallback(async () => {
    try {
      const token = localStorage.getItem("user_token");
      const res = await fetch("/api/earn/status", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) return handleUnauthorized();
      if (!res.ok) throw new Error(`earn/status ${res.status}`);
      const data: EarnStatusResponse = await res.json();
      if (mountedRef.current) setEarning(data.earning ?? null);
    } catch (err) {
      console.error("Failed to load earning:", err);
    }
  }, [handleUnauthorized]);

  // initial load
  useEffect(() => {
    (async () => {
      await Promise.all([refreshUser(), refreshEarning()]);
      if (mountedRef.current) setLoading(false);
    })();
  }, [refreshUser, refreshEarning]);

  // poll earning status
  useEffect(() => {
    const interval = setInterval(refreshEarning, 5000);
    return () => clearInterval(interval);
  }, [refreshEarning]);

  /* ---------- countdown ---------- */
  useEffect(() => {
    if (!earning?.endTime) return;
    const interval = setInterval(() => {
      const diff = new Date(earning.endTime!).getTime() - Date.now();
      if (diff <= 0) {
        setCountdown("Completed");
        return;
      }
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      setCountdown(`${d}d ${h}h ${m}m`);
    }, 1000);
    return () => clearInterval(interval);
  }, [earning]);

  /* ---------- trade ticker ---------- */
  useEffect(() => {
    if (!earning) return;
    const coins = ["BTC", "ETH", "SOL", "BNB", "XRP"];
    const interval = setInterval(() => {
      const isBuy = Math.random() > 0.4;
      const amount = (Math.random() * 500 + 20).toFixed(2);
      const coin = coins[Math.floor(Math.random() * coins.length)];
      const text = `${isBuy ? "🟢 Buy" : "🔴 Sell"} ${coin} ${
        isBuy ? "+" : "-"
      }$${amount}`;
      setTicker((prev) => [...prev.slice(-10), text]);
    }, 2000);
    return () => clearInterval(interval);
  }, [earning]);

  /* ---------- derived ---------- */
  const realTotal =
    earning?.status === "active"
      ? (earning.depositAmount || 0) + (earning.earnedSoFar || 0)
      : userBalance;

  useEffect(() => {
    realTotalRef.current = realTotal;
  }, [realTotal]);

  /* ---------- balance easing (re-anchored to realTotal) ---------- */
  useEffect(() => {
    if (!earning) return;
    if (frameRef.current) cancelAnimationFrame(frameRef.current);

    let current = realTotalRef.current;
    let target = realTotalRef.current;

    const animate = () => {
      if (document.hidden) {
        frameRef.current = requestAnimationFrame(animate);
        return;
      }
      // jitter AROUND the real value so the display can't drift away from it
      if (Math.random() < 0.05) {
        const jitter = Math.random() * 0.02 - 0.01; // ±1%
        target = realTotalRef.current * (1 + jitter);
      }
      const next = current + (target - current) * 0.08;
      if (mountedRef.current) {
        setDisplayValue(next);
        setIsUp(next >= current);
      }
      current = next;
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [earning]);

  const locked =
    earning?.status === "active"
      ? (earning.depositAmount || 0) + (earning.earnedSoFar || 0)
      : 0;

  const roi =
    earning && earning.depositAmount > 0
      ? (earning.earnedSoFar / earning.depositAmount) * 100
      : 0;

  /* ---------- start earning (hardened) ---------- */
  const startEarning = async () => {
    if (starting) return; // guard against double-tap
    setStarting(true);
    setError(null);
    try {
      const token = localStorage.getItem("user_token");
      const res = await fetch("/api/earn/start", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) return handleUnauthorized();
      if (!res.ok) throw new Error(`earn/start ${res.status}`);
      await refreshEarning(); // reflect the new state immediately
    } catch (err) {
      console.error("startEarning failed:", err);
      if (mountedRef.current)
        setError("Could not start earning. Please try again.");
    } finally {
      if (mountedRef.current) setStarting(false);
    }
  };

  /* ---------- loading skeleton ---------- */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white px-4 pb-24">
        <div className="mt-6 h-6 w-24 bg-[#131A2A] rounded animate-pulse" />
        <div className="mt-4 h-28 bg-[#131A2A] rounded-2xl animate-pulse" />
        <div className="mt-4 h-48 bg-[#131A2A] rounded-2xl animate-pulse" />
        <div className="mt-4 h-20 bg-[#131A2A] rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white px-4 pb-24">
      <button
        onClick={() => router.back()}
        className="mt-4 mb-4 flex items-center gap-2 text-gray-400"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <h1 className="text-2xl font-bold mb-3 flex items-center gap-2">
        <Wallet size={22} /> Portfolio
      </h1>

      {error && (
        <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
          {error}
        </div>
      )}

      <div className="overflow-hidden mb-4 relative">
        <div className="flex gap-6 animate-scroll whitespace-nowrap text-sm">
          {ticker.map((t, i) => (
            <span key={i}>{t}</span>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#131A2A] to-[#1A2235] p-6 rounded-2xl mb-4 border border-gray-800">
        <p className="text-gray-400 text-sm">Total Balance</p>

        <h2
          className={`text-3xl font-bold ${
            earning ? (isUp ? "text-green-400" : "text-red-400") : "text-white"
          }`}
        >
          {formatUSD(earning ? displayValue : userBalance)}
        </h2>

        {earning?.status === "active" && (
          <p className="text-yellow-400 text-xs mt-2 flex items-center gap-1">
            <Lock size={12} /> Trading • Ends in {countdown}
          </p>
        )}
      </div>

      <div className="bg-[#131A2A] p-4 rounded-2xl mb-5 border border-gray-800">
        <div className="flex justify-between items-center mb-2">
          <p className="text-gray-400 text-sm flex items-center gap-1">
            <TrendingUp size={14} className="text-green-400" /> Performance
          </p>
          <span className="text-[10px] uppercase tracking-wide text-gray-500">
            Simulated
          </span>
        </div>
        <LiveCandleChart
          value={earning ? displayValue : userBalance}
          active={earning?.status === "active"}
        />
      </div>

      <div className="flex gap-3 mb-6">
        <div className="bg-[#131A2A] p-4 rounded-xl flex-1">
          <p className="text-gray-400 text-xs">Available</p>
          <p>{earning ? formatUSD(0) : formatUSD(userBalance)}</p>
        </div>

        <div className="bg-[#131A2A] p-4 rounded-xl flex-1">
          <p className="text-gray-400 text-xs">Locked</p>
          <p className="text-yellow-400">{formatUSD(locked)}</p>
        </div>
      </div>

      <div className="bg-[#131A2A] p-5 rounded-2xl">
        <div className="flex justify-between items-center">
          <p className="text-gray-400 text-sm">Earn Balance</p>
          <TrendingUp className="text-green-400" size={18} />
        </div>

        <h2 className="text-2xl text-green-400 font-bold">
          +{formatUSD(earning?.earnedSoFar ?? 0)}
        </h2>

        <p className="text-xs text-gray-400">ROI: {roi.toFixed(2)}%</p>

        {!earning && userBalance > 0 && (
          <button
            onClick={startEarning}
            disabled={starting}
            className="mt-4 w-full bg-yellow-400 text-black py-2 rounded-xl font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {starting ? "Starting..." : "Start Earning"}
          </button>
        )}
      </div>

      <style jsx>{`
        .animate-scroll {
          animation: scroll 20s linear infinite;
        }
        @keyframes scroll {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </div>
  );
}
