"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Wallet, TrendingUp } from "lucide-react";

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
  user?: {
    balance?: number;
    lockedBalance?: number;
  };
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
   REALISTIC PRICE SIMULATOR
   ============================================================= */
class PriceSimulator {
  public price: number;
  private trend: number;
  private volatility: number;
  private mean: number;
  private trendStrength: number;
  private meanReversion: number;
  private lastUpdate: number;

  constructor(initialPrice: number) {
    this.price = initialPrice || 1000;
    this.trend = 0;
    this.volatility = 0.0008;
    this.mean = this.price;
    this.trendStrength = 0.00005;
    this.meanReversion = 0.005;
    this.lastUpdate = Date.now();
  }

  nextPrice(): number {
    const now = Date.now();
    const dt = Math.min((now - this.lastUpdate) / 1000, 1);
    this.lastUpdate = now;

    if (Math.random() < 0.005 * dt) {
      this.trend = (Math.random() - 0.5) * 0.0004;
      this.mean = this.price * (1 + (Math.random() - 0.5) * 0.003);
    }

    let vol = this.volatility;
    if (Math.random() < 0.001 * dt) {
      vol = this.volatility * (2 + Math.random() * 2);
    }

    const drift = this.trend + (this.meanReversion * (this.mean - this.price)) / this.price;
    const noise = vol * Math.sqrt(dt) * this.randomNormal();
    const change = drift * dt + noise;
    
    let newPrice = this.price * (1 + change);
    
    const maxMove = 0.08;
    if (Math.abs(change) > maxMove) {
      newPrice = this.price * (1 + Math.sign(change) * maxMove);
    }
    
    newPrice = Math.max(newPrice, 0.01);
    this.mean = this.mean * (1 - 0.00005 * dt) + newPrice * 0.00005 * dt;
    
    this.price = newPrice;
    return this.price;
  }

  private randomNormal(): number {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }
}

/* =============================================================
   REALISTIC CANDLESTICK CHART
   ============================================================= */
function LiveCandleChart({
  value,
  active,
  simulator,
}: {
  value: number;
  active: boolean;
  simulator: PriceSimulator;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const candlesRef = useRef<Candle[]>([]);
  const currentRef = useRef<Candle | null>(null);
  const tickCountRef = useRef(0);
  const lastTickRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const peakPriceRef = useRef(value);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const TICK_MS = 2000;
    const TICKS_PER_CANDLE = 30;
    const MAX_CANDLES = 60;

    if (candlesRef.current.length === 0) {
      let seed = value || 1000;
      const tempSim = new PriceSimulator(seed);
      
      for (let i = 0; i < MAX_CANDLES; i++) {
        const open = seed;
        let close = seed;
        let high = seed;
        let low = seed;
        
        for (let t = 0; t < 60; t++) {
          close = tempSim.nextPrice();
          high = Math.max(high, close);
          low = Math.min(low, close);
        }
        
        candlesRef.current.push({ open, high, low, close });
        seed = close;
      }
      
      const lastPrice = candlesRef.current[candlesRef.current.length - 1].close;
      currentRef.current = { open: lastPrice, high: lastPrice, low: lastPrice, close: lastPrice };
      peakPriceRef.current = lastPrice;
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
      const padV = (max - min) * 0.15 || max * 0.01 || 1;
      min -= padV;
      max += padV;
      const range = max - min || 1;

      const padRight = 72;
      const plotW = W - padRight;
      const slot = plotW / all.length;
      const bodyW = Math.max(2, slot * 0.6);
      const y = (p: number) => H - ((p - min) / range) * H;

      for (let i = 0; i <= 5; i++) {
        const gy = (H / 5) * i;
        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(plotW, gy);
        ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.font = "9px Arial";
        ctx.textAlign = "right";
        ctx.fillText((max - (range / 5) * i).toFixed(2), plotW + 6, gy + 3);
      }

      all.forEach((c, i) => {
        const cx = slot * i + slot / 2;
        const up = c.close >= c.open;
        const color = up ? "#22c55e" : "#ef4444";
        ctx.strokeStyle = color;
        ctx.fillStyle = color;

        ctx.lineWidth = 0.5;
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
      ctx.strokeStyle = up ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)";
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, ly);
      ctx.lineTo(plotW, ly);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.textAlign = "center";
      const priceColor = last.close >= peakPriceRef.current * 0.9 ? "#22c55e" : "#ef4444";
      ctx.fillStyle = priceColor;
      const labelText = last.close.toFixed(2);
      const metrics = ctx.measureText(labelText);
      const textWidth = metrics.width + 12;
      ctx.fillRect(plotW, ly - 10, textWidth, 20);
      ctx.fillStyle = "#0B0F19";
      ctx.font = "bold 9px Arial";
      ctx.fillText(labelText, plotW + textWidth / 2, ly + 3);
    };

    const loop = (ts: number) => {
      if (document.hidden) {
        lastTickRef.current = ts;
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      if (!lastTickRef.current) lastTickRef.current = ts;

      if (active && ts - lastTickRef.current >= TICK_MS) {
        lastTickRef.current = ts;
        const newPrice = simulator.price;
        
        if (newPrice > peakPriceRef.current) {
          peakPriceRef.current = newPrice;
        }

        const cur = currentRef.current;
        if (cur) {
          cur.close = newPrice;
          cur.high = Math.max(cur.high, newPrice);
          cur.low = Math.min(cur.low, newPrice);
        }

        tickCountRef.current++;
        
        if (tickCountRef.current >= TICKS_PER_CANDLE && cur) {
          candlesRef.current.push({ ...cur });
          if (candlesRef.current.length > MAX_CANDLES) {
            candlesRef.current.shift();
          }
          currentRef.current = {
            open: newPrice,
            high: newPrice,
            low: newPrice,
            close: newPrice,
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
  }, [active, simulator, value]);

  return (
    <div className="w-full">
      <canvas ref={canvasRef} style={{ width: "100%", height: "200px", display: "block" }} />
    </div>
  );
}

/* =============================================================
   MAIN PORTFOLIO PAGE
   ============================================================= */
export default function PortfolioPage() {
  const [userBalance, setUserBalance] = useState(0);
  const [earning, setEarning] = useState<Earning | null>(null);
  const [lockedBalance, setLockedBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maxDrawdown, setMaxDrawdown] = useState(0);
  const [ticker, setTicker] = useState<string[]>([]);
  const [countdown, setCountdown] = useState("");

  const router = useRouter();
  const frameRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  
  // Real-time DOM references
  const domBalanceRef = useRef<HTMLHeadingElement | null>(null);
  const domChartBalanceRef = useRef<HTMLHeadingElement | null>(null);
  const domPercentRef = useRef<HTMLSpanElement | null>(null);
  const domChangeRef = useRef<HTMLSpanElement | null>(null);

  const realTotal = earning?.status === "active"
    ? (earning.depositAmount || 0) + (earning.earnedSoFar || 0)
    : userBalance;

  const simulatorRef = useRef<PriceSimulator | null>(null);
  if (!simulatorRef.current && !loading) {
    simulatorRef.current = new PriceSimulator(realTotal);
  }

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleUnauthorized = useCallback(() => {
    router.push("/auth/login");
  }, [router]);

  const refreshUser = useCallback(async () => {
    try {
      const token = localStorage.getItem("user_token");
      const res = await fetch("/api/user/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) return handleUnauthorized();
      if (!res.ok) throw new Error(`user/me ${res.status}`);
      const data: UserMeResponse = await res.json();
      if (mountedRef.current) {
        setUserBalance(data.user?.balance ?? 0);
        setLockedBalance(data.user?.lockedBalance ?? 0);
      }
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
      if (mountedRef.current) {
        setEarning(data.earning ?? null);
      }
    } catch (err) {
      console.error("Failed to load earning:", err);
    }
  }, [handleUnauthorized]);

  useEffect(() => {
    (async () => {
      await Promise.all([refreshUser(), refreshEarning()]);
      if (mountedRef.current) setLoading(false);
    })();
  }, [refreshUser, refreshEarning]);

  useEffect(() => {
    const interval = setInterval(refreshEarning, 30000);
    return () => clearInterval(interval);
  }, [refreshEarning]);

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

  useEffect(() => {
    if (!earning) return;
    const symbols = ["BTC/USD", "ETH/USD", "SOL/USD", "XAU/USD", "SPX500"];
    const interval = setInterval(() => {
      const isBuy = Math.random() > 0.45;
      const amount = (Math.random() * 800 + 50).toFixed(2);
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      const price = (Math.random() * 100 + 50).toFixed(2);
      const action = isBuy ? "BUY" : "SELL";
      const change = isBuy ? "+" : "-";
      const text = `${action} ${symbol} ${change}$${amount} @ ${price}`;
      setTicker((prev) => [...prev.slice(-15), text]);
    }, 1500);
    return () => clearInterval(interval);
  }, [earning]);

  // Fixed display lag by using safe structural frame fallback boundaries
  useEffect(() => {
    if (loading || !simulatorRef.current) return;
    
    if (!earning || earning.status !== "active") {
      // Small structural fallback layout timeout to ensure references are bound after loading drops
      const t = setTimeout(() => {
        if (domBalanceRef.current) domBalanceRef.current.innerText = formatUSD(realTotal);
        if (domChartBalanceRef.current) domChartBalanceRef.current.innerText = formatUSD(realTotal);
      }, 50);
      return () => clearTimeout(t);
    }

    if (frameRef.current) cancelAnimationFrame(frameRef.current);

    let current = realTotal;
    let maxValue = realTotal;
    let previous = realTotal;

    const animate = () => {
      if (document.hidden) {
        frameRef.current = requestAnimationFrame(animate);
        return;
      }

      const simulator = simulatorRef.current;
      if (simulator) {
        const newPrice = simulator.nextPrice();
        const volatility = 0.0008;
        const movement = (newPrice / 1000) * volatility;
        
        let trend = 0;
        if (Math.random() < 0.001) {
          trend = (Math.random() - 0.5) * 0.005;
        }
        
        const reversion = (realTotal - current) * 0.0005;
        const change = movement + trend + reversion;
        const nextValue = Math.max(current * (1 + change), 0.01);
        
        const maxDeviation = 0.15;
        const deviation = (nextValue - realTotal) / realTotal;
        let finalValue = nextValue;
        if (deviation > maxDeviation) {
          finalValue = realTotal * (1 + maxDeviation);
        } else if (deviation < -maxDeviation * 0.5) {
          finalValue = realTotal * (1 - maxDeviation * 0.5);
        }
        
        current = finalValue;
        
        if (current > maxValue) maxValue = current;
        const drawdown = (maxValue - current) / maxValue;
        if (drawdown > maxDrawdown) setMaxDrawdown(drawdown);
        
        const changeAmount = current - previous;
        const changePercent = previous > 0 ? (changeAmount / previous) * 100 : 0;
        const isUpNow = current >= previous;

        // Verify elements are bound in the DOM layout before updating
        if (domBalanceRef.current) {
          domBalanceRef.current.innerText = formatUSD(current);
          domBalanceRef.current.className = `text-4xl font-bold transition-all duration-300 ${isUpNow ? "text-green-400" : "text-red-400"}`;
        }
        if (domChartBalanceRef.current) {
          domChartBalanceRef.current.innerText = formatUSD(current);
        }
        if (domPercentRef.current) {
          domPercentRef.current.innerText = `${isUpNow ? "+" : ""}${changePercent.toFixed(2)}%`;
          domPercentRef.current.className = `text-xs font-semibold ${isUpNow ? "text-green-400" : "text-red-400"}`;
        }
        if (domChangeRef.current) {
          domChangeRef.current.innerText = `${isUpNow ? "▲" : "▼"} $${Math.abs(changeAmount).toFixed(2)}`;
          domChangeRef.current.className = `text-sm ${isUpNow ? "text-green-400" : "text-red-400"}`;
        }

        previous = current;
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    // Delay initialization slightly to let the loading DOM fully unmount
    const frameDelay = setTimeout(() => {
      frameRef.current = requestAnimationFrame(animate);
    }, 60);

    return () => {
      clearTimeout(frameDelay);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [earning, realTotal, loading, maxDrawdown]);

  const roi = earning && earning.depositAmount > 0
    ? (earning.earnedSoFar / earning.depositAmount) * 100
    : 0;

  const startEarning = async () => {
    if (starting) return;
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
      await refreshEarning();
    } catch (err) {
      console.error("startEarning failed:", err);
      if (mountedRef.current) setError("Could not start earning. Please try again.");
    } finally {
      if (mountedRef.current) setStarting(false);
    }
  };

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
      <style>{`
        @keyframes tickerScroll {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .animate-ticker {
          display: inline-flex;
          animation: tickerScroll 30s linear infinite;
        }
      `}</style>

      <button
        onClick={() => router.back()}
        className="mt-4 mb-4 flex items-center gap-2 text-gray-400 hover:text-white transition"
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

      {/* Ticker Container */}
      <div className="overflow-hidden mb-4 bg-[#131A2A] rounded-xl py-2 px-4 border border-gray-800 flex">
        <div className="animate-ticker gap-8 whitespace-nowrap text-sm">
          {ticker.map((t, i) => (
            <span key={i} className="text-gray-300 font-mono mr-8">
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Main Net Worth Balance Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#131A2A] via-[#1A2235] to-[#101827] p-6 rounded-3xl mb-4 border border-yellow-500/20 shadow-[0_0_40px_rgba(250,204,21,0.08)]">
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-yellow-400/10 blur-3xl rounded-full" />

        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-yellow-400">Total Net Worth</p>
            <p className="text-gray-500 text-xs mt-1">Portfolio Value</p>
          </div>
          <div className="px-3 py-1 rounded-full border bg-white/5 border-white/10">
            <span ref={domPercentRef} className="text-xs font-semibold text-gray-300">
              0.00%
            </span>
          </div>
        </div>

        {/* Target elements given initial values to prevent blank spaces on first paint */}
        <h2 ref={domBalanceRef} className="text-4xl font-bold text-white">
          {formatUSD(realTotal)}
        </h2>

        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-2">
            <span className="text-green-400 font-semibold">
              +{formatUSD(earning?.earnedSoFar ?? 0)}
            </span>
            <span className="text-gray-500 text-sm">Total Profit</span>
          </div>
          <div className="flex items-center gap-2">
            <span ref={domChangeRef} className="text-sm text-gray-400">
              $0.00
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-6">
          <div className="bg-white/5 rounded-xl p-3">
            <p className="text-gray-500 text-xs">Available</p>
            <p className="font-semibold">{formatUSD(userBalance)}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3">
            <p className="text-gray-500 text-xs">Locked</p>
            <p className="font-semibold text-yellow-400">{formatUSD(lockedBalance)}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3">
            <p className="text-gray-500 text-xs">ROI</p>
            <p className={`font-semibold ${roi >= 0 ? "text-green-400" : "text-red-400"}`}>
              {roi.toFixed(2)}%
            </p>
          </div>
        </div>

        {earning?.status === "active" && (
          <div className="mt-5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
            <p className="text-yellow-400 text-xs uppercase tracking-wide">Active Trading Session</p>
            <p className="text-white text-sm mt-1">Ends in {countdown}</p>
            <div className="mt-2 bg-[#0B0F19] rounded-full h-1.5 overflow-hidden">
              <div 
                className="h-full bg-yellow-400 transition-all duration-500"
                style={{ width: `${Math.min(earning.progress || 0, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Grid Indicators */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-[#131A2A] border border-white/5 rounded-2xl p-4">
          <p className="text-gray-500 text-xs uppercase">Portfolio Value</p>
          <h3 className="text-xl font-bold mt-2">
            {formatUSD(userBalance + lockedBalance + (earning?.earnedSoFar || 0))}
          </h3>
          <p className="text-green-400 text-xs mt-1">+{roi.toFixed(2)}% Growth</p>
        </div>
        <div className="bg-[#131A2A] border border-white/5 rounded-2xl p-4">
          <p className="text-gray-500 text-xs uppercase">Active Capital</p>
          <h3 className="text-xl font-bold mt-2">{formatUSD(lockedBalance)}</h3>
          <p className="text-yellow-400 text-xs mt-1">Currently Trading</p>
        </div>
        <div className="bg-[#131A2A] border border-white/5 rounded-2xl p-4">
          <p className="text-gray-500 text-xs uppercase">Total Profit</p>
          <h3 className="text-xl font-bold mt-2 text-green-400">
            +{formatUSD(earning?.earnedSoFar || 0)}
          </h3>
          <p className="text-gray-400 text-xs mt-1">Since Activation</p>
        </div>
        <div className="bg-[#131A2A] border border-white/5 rounded-2xl p-4">
          <p className="text-gray-500 text-xs uppercase">Max Drawdown</p>
          <h3 className={`text-xl font-bold mt-2 ${maxDrawdown < 0.05 ? "text-green-400" : "text-yellow-400"}`}>
            {(maxDrawdown * 100).toFixed(2)}%
          </h3>
          <p className="text-gray-400 text-xs mt-1">{maxDrawdown < 0.05 ? "Low Risk" : "Medium Risk"}</p>
        </div>
      </div>

      {/* Candlestick Visualization Wrapper */}
      <div className="bg-[#131A2A] p-4 rounded-2xl mb-5 border border-gray-800">
        <div className="flex justify-between items-center mb-2">
          <p className="text-gray-400 text-sm flex items-center gap-1">
            <TrendingUp size={14} className="text-green-400" /> Performance
          </p>
          <span className="text-[10px] uppercase tracking-wide text-gray-500">Live Trading Chart</span>
        </div>
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="font-semibold">Market Performance</h3>
            <p className="text-xs text-gray-500">Real-Time Trading Activity</p>
          </div>
          <div className="flex gap-2">
            <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-1 rounded">LIVE</span>
          </div>
        </div>
        <div className="flex justify-between items-center mb-3">
          <div>
            <p className="text-gray-500 text-xs">Current Portfolio Value</p>
            <h3 ref={domChartBalanceRef} className="font-bold text-lg text-white">
              {formatUSD(realTotal)}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 text-xs">LIVE</span>
          </div>
        </div>
        
        {simulatorRef.current && (
          <LiveCandleChart
            value={realTotal}
            active={earning?.status === "active"}
            simulator={simulatorRef.current}
          />
        )}
      </div>

      {/* Insight Panel */}
      <div className="bg-[#131A2A] p-5 rounded-2xl">
        <div className="flex justify-between items-center">
          <p className="text-gray-400 text-sm">Earn Balance</p>
          <TrendingUp className="text-green-400" size={18} />
        </div>

        <h2 className="text-2xl text-green-400 font-bold">
          +{formatUSD(earning?.earnedSoFar ?? 0)}
        </h2>
        <p className="text-xs text-gray-400">ROI: {roi.toFixed(2)}%</p>

        <div className="mt-4 bg-[#0B0F19] rounded-2xl p-4 border border-white/5">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">AI Portfolio Insight</h3>
            <span className="text-green-400 text-xs">LIVE</span>
          </div>

          <div className="bg-[#131A2A] p-4 rounded-2xl mt-4">
            <div className="flex justify-between mb-2">
              <span>Wealth Goal</span>
              <span>$50,000</span>
            </div>
            <div className="h-3 bg-[#0B0F19] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-400 to-green-400 transition-all duration-500"
                style={{
                  width: `${Math.min(((userBalance + lockedBalance + (earning?.earnedSoFar || 0)) / 50000) * 100, 100)}%`,
                }}
              />
            </div>
          </div>

          <p className="text-sm text-gray-300 leading-relaxed mt-4">
            Your portfolio has generated a positive return of {roi.toFixed(2)}% and remains within an optimal risk range.
            Based on current performance, projected growth remains strong for the active trading cycle.
          </p>
        </div>

        {!earning && userBalance > 0 && (
          <button
            onClick={startEarning}
            disabled={starting}
            className="mt-4 w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-black py-3 rounded-xl font-semibold hover:from-yellow-500 hover:to-yellow-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {starting ? "Starting..." : "Start Earning"}
          </button>
        )}
      </div>
    </div>
  );
}