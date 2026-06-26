"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Wallet, TrendingUp, Lock, TrendingDown, DollarSign } from "lucide-react";

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
   REALISTIC PRICE SIMULATOR - LIKE MT5
   Uses geometric Brownian motion with volatility, trend, and mean reversion
   ============================================================= */
class PriceSimulator {
  private price: number;
  private trend: number;
  private volatility: number;
  private mean: number;
  private trendStrength: number;
  private meanReversion: number;
  private lastUpdate: number;

  constructor(initialPrice: number) {
    this.price = initialPrice;
    this.trend = 0;
    this.volatility = 0.002; // 0.2% base volatility
    this.mean = initialPrice;
    this.trendStrength = 0.0001;
    this.meanReversion = 0.01;
    this.lastUpdate = Date.now();
  }

  // Generate realistic price with trends, volatility spikes, and mean reversion
  nextPrice(): number {
    const now = Date.now();
    const dt = Math.min((now - this.lastUpdate) / 1000, 1);
    this.lastUpdate = now;

    // Randomly shift trend every 10-30 seconds
    if (Math.random() < 0.01 * dt) {
      this.trend = (Math.random() - 0.5) * 0.0008;
      this.mean = this.price * (1 + (Math.random() - 0.5) * 0.005);
    }

    // Volatility spikes (market events)
    let vol = this.volatility;
    if (Math.random() < 0.002 * dt) {
      vol = this.volatility * (2 + Math.random() * 3); // 2-5x spike
    }

    // Geometric Brownian Motion with mean reversion
    const drift = this.trend + this.meanReversion * (this.mean - this.price) / this.price;
    const noise = vol * Math.sqrt(dt) * this.randomNormal();
    const change = drift * dt + noise;
    
    // Apply with safety bounds
    let newPrice = this.price * (1 + change);
    
    // Prevent extreme moves (>15% in one tick)
    const maxMove = 0.15;
    if (Math.abs(change) > maxMove) {
      newPrice = this.price * (1 + Math.sign(change) * maxMove);
    }
    
    // Keep price positive
    newPrice = Math.max(newPrice, 0.01);
    
    // Update mean gradually
    this.mean = this.mean * (1 - 0.0001 * dt) + newPrice * 0.0001 * dt;
    
    this.price = newPrice;
    return this.price;
  }

  // Box-Muller transform for normal distribution
  private randomNormal(): number {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  // Update target price for chart
  setTarget(target: number) {
    this.mean = target;
  }
}

/* =============================================================
   REALISTIC CANDLESTICK CHART
   ============================================================= */
function LiveCandleChart({
  value,
  active,
  depositAmount,
}: {
  value: number;
  active: boolean;
  depositAmount: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const simulatorRef = useRef<PriceSimulator | null>(null);
  const candlesRef = useRef<Candle[]>([]);
  const currentRef = useRef<Candle | null>(null);
  const priceHistoryRef = useRef<number[]>([]);
  const tickCountRef = useRef(0);
  const lastTickRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const maxDrawdownRef = useRef(0);
  const peakPriceRef = useRef(value);

  // Initialize simulator
  useEffect(() => {
    if (!simulatorRef.current) {
      simulatorRef.current = new PriceSimulator(value);
    }
  }, [value]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const TICK_MS = 500; // Faster ticks for more realistic movement
    const TICKS_PER_CANDLE = 30; // 15 seconds per candle
    const MAX_CANDLES = 80;

    // Initialize with realistic price history
    if (candlesRef.current.length === 0) {
      let seed = value || 1000;
      const simulator = new PriceSimulator(seed);
      
      // Generate initial candles with realistic volatility
      for (let i = 0; i < MAX_CANDLES; i++) {
        const open = seed;
        const close = simulator.nextPrice();
        const high = Math.max(open, close) * (1 + Math.random() * 0.002);
        const low = Math.min(open, close) * (1 - Math.random() * 0.002);
        candlesRef.current.push({ open, high, low, close });
        seed = close;
      }
      
      const lastPrice = candlesRef.current[candlesRef.current.length - 1].close;
      simulatorRef.current = new PriceSimulator(lastPrice);
      currentRef.current = { 
        open: lastPrice, 
        high: lastPrice, 
        low: lastPrice, 
        close: lastPrice 
      };
      priceHistoryRef.current = candlesRef.current.map(c => c.close);
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
      const bodyW = Math.max(2, slot * 0.5);
      const y = (p: number) => H - ((p - min) / range) * H;

      // Grid
      ctx.lineWidth = 1;
      ctx.font = "9px Arial";
      for (let i = 0; i <= 5; i++) {
        const gy = (H / 5) * i;
        ctx.strokeStyle = "rgba(255,255,255,0.04)";
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(plotW, gy);
        ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,0.25)";
        ctx.fillText((max - (range / 5) * i).toFixed(2), plotW + 6, gy + 3);
      }

      // Candles
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

      // Current price line
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

      // Current price label
      const priceColor = last.close >= peakPriceRef.current * 0.9 ? "#22c55e" : "#ef4444";
      ctx.fillStyle = priceColor;
      ctx.fillRect(plotW, ly - 10, padRight, 20);
      ctx.fillStyle = "#0B0F19";
      ctx.font = "bold 9px Arial";
      ctx.fillText(last.close.toFixed(2), plotW + 6, ly + 3);
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

        const simulator = simulatorRef.current;
        if (simulator) {
          // Generate realistic price
          const newPrice = simulator.nextPrice();
          
          // Update peak for drawdown tracking
          if (newPrice > peakPriceRef.current) {
            peakPriceRef.current = newPrice;
          }
          
          const drawdown = (peakPriceRef.current - newPrice) / peakPriceRef.current;
          if (drawdown > maxDrawdownRef.current) {
            maxDrawdownRef.current = drawdown;
          }

          priceHistoryRef.current.push(newPrice);
          if (priceHistoryRef.current.length > 200) {
            priceHistoryRef.current.shift();
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
      }

      draw();
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, value]);

  return (
    <div className="w-full">
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "200px", display: "block" }}
      />
    </div>
  );
}

/* =============================================================
   MAIN PORTFOLIO PAGE
   ============================================================= */
export default function PortfolioPage() {
  const [userBalance, setUserBalance] = useState(0);
  const [earning, setEarning] = useState<Earning | null>(null);

  const [displayValue, setDisplayValue] = useState(0);
  const [isUp, setIsUp] = useState(true);
  const [priceChange, setPriceChange] = useState(0);
  const [priceChangePercent, setPriceChangePercent] = useState(0);

  const [ticker, setTicker] = useState<string[]>([]);
  const [countdown, setCountdown] = useState("");
  const [lockedBalance, setLockedBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [equityHistory, setEquityHistory] = useState<number[]>([]);
  const [maxDrawdown, setMaxDrawdown] = useState(0);

  const router = useRouter();
  const frameRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const realTotalRef = useRef(0);
  const previousValueRef = useRef(0);
  const simulatorRef = useRef<PriceSimulator | null>(null);

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

  // initial load
  useEffect(() => {
    (async () => {
      await Promise.all([refreshUser(), refreshEarning()]);
      if (mountedRef.current) setLoading(false);
    })();
  }, [refreshUser, refreshEarning]);

  // poll earning status (30 seconds)
  useEffect(() => {
    const interval = setInterval(refreshEarning, 30000);
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

  /* ---------- trade ticker with realistic market events ---------- */
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

  /* ---------- derived values ---------- */
  const realTotal = earning?.status === "active"
    ? (earning.depositAmount || 0) + (earning.earnedSoFar || 0)
    : userBalance;

  useEffect(() => {
    realTotalRef.current = realTotal;
    previousValueRef.current = realTotal;
  }, [realTotal]);

  /* ---------- REALISTIC BALANCE SIMULATION ---------- */
  /* ---------- REALISTIC BALANCE SIMULATION ---------- */
useEffect(() => {
  if (!earning || earning.status !== "active") {
    setDisplayValue(realTotal);
    return;
  }

  if (frameRef.current) cancelAnimationFrame(frameRef.current);

  // Initialize simulator with deposit amount
  if (!simulatorRef.current) {
    simulatorRef.current = new PriceSimulator(realTotal);
  }

  let current = realTotal;
  const history: number[] = [];
  let maxValue = realTotal;

  const animate = () => {
    if (document.hidden) {
      frameRef.current = requestAnimationFrame(animate);
      return;
    }

    const simulator = simulatorRef.current;
    if (simulator) {
      // Generate realistic price movement
      const newPrice = simulator.nextPrice();
      
      // Scale movement to portfolio value
      const volatility = 0.002; // 0.2% per tick
      const movement = (newPrice / 1000) * volatility;
      
      // Add market trend with occasional large moves
      let trend = 0;
      if (Math.random() < 0.001) {
        trend = (Math.random() - 0.5) * 0.01; // 1% trend shift
      }
      
      // Mean reversion to target (using realTotal directly)
      const reversion = (realTotal - current) * 0.0005;
      
      // Combine movements
      const change = movement + trend + reversion;
      const nextValue = Math.max(current * (1 + change), 0.01);
      
      // Ensure we don't deviate too far from target
      const maxDeviation = 0.15; // 15% max deviation
      const deviation = (nextValue - realTotal) / realTotal;
      let finalValue = nextValue;
      if (deviation > maxDeviation) {
        finalValue = realTotal * (1 + maxDeviation);
      } else if (deviation < -maxDeviation * 0.5) {
        // Allow bigger drops (50% of max deviation)
        finalValue = realTotal * (1 - maxDeviation * 0.5);
      }
      
      current = finalValue;
      
      // Track max value for drawdown
      if (current > maxValue) {
        maxValue = current;
      }
      const drawdown = (maxValue - current) / maxValue;
      if (drawdown > maxDrawdown) {
        setMaxDrawdown(drawdown);
      }
      
      // Store history for performance tracking
      history.push(current);
      if (history.length > 300) history.shift();
      setEquityHistory(history);
      
      // Update display
      if (mountedRef.current) {
        setDisplayValue(current);
        const changeAmount = current - previousValueRef.current;
        setPriceChange(changeAmount);
        setPriceChangePercent(previousValueRef.current > 0 
          ? (changeAmount / previousValueRef.current) * 100 
          : 0);
        setIsUp(current >= previousValueRef.current);
        previousValueRef.current = current;
      }
    }

    frameRef.current = requestAnimationFrame(animate);
  };

  frameRef.current = requestAnimationFrame(animate);

  return () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
  };
}, [earning, realTotal]);

  const roi = earning && earning.depositAmount > 0
    ? (earning.earnedSoFar / earning.depositAmount) * 100
    : 0;

  /* ---------- start earning ---------- */
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

      {/* Ticker */}
      <div className="overflow-hidden mb-4 relative bg-[#131A2A] rounded-xl py-2 px-4 border border-gray-800">
        <div className="flex gap-8 animate-scroll whitespace-nowrap text-sm">
          {ticker.map((t, i) => (
            <span key={i} className="text-gray-300 font-mono">
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Main Balance Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#131A2A] via-[#1A2235] to-[#101827] p-6 rounded-3xl mb-4 border border-yellow-500/20 shadow-[0_0_40px_rgba(250,204,21,0.08)]">
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-yellow-400/10 blur-3xl rounded-full" />

        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-yellow-400">
              Total Net Worth
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Portfolio Value
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full border ${
            isUp ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"
          }`}>
            <span className={`text-xs font-semibold ${isUp ? "text-green-400" : "text-red-400"}`}>
              {isUp ? "+" : ""}{priceChangePercent.toFixed(2)}%
            </span>
          </div>
        </div>

        <h2 className={`text-4xl font-bold transition-all duration-300 ${
          earning ? (isUp ? "text-green-400" : "text-red-400") : "text-white"
        }`}>
          {formatUSD(earning ? displayValue : userBalance)}
        </h2>

        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-2">
            <span className="text-green-400 font-semibold">
              +{formatUSD(earning?.earnedSoFar ?? 0)}
            </span>
            <span className="text-gray-500 text-sm">Total Profit</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm ${isUp ? "text-green-400" : "text-red-400"}`}>
              {isUp ? "▲" : "▼"} ${Math.abs(priceChange).toFixed(2)}
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
            <p className="text-yellow-400 text-xs uppercase tracking-wide">
              Active Trading Session
            </p>
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

      {/* Stats Grid */}
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

      {/* Chart */}
      <div className="bg-[#131A2A] p-4 rounded-2xl mb-5 border border-gray-800">
        <div className="flex justify-between items-center mb-2">
          <p className="text-gray-400 text-sm flex items-center gap-1">
            <TrendingUp size={14} className="text-green-400" /> Performance
          </p>
          <span className="text-[10px] uppercase tracking-wide text-gray-500">
            Live Trading Chart
          </span>
        </div>
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="font-semibold">Market Performance</h3>
            <p className="text-xs text-gray-500">Real-Time Trading Activity</p>
          </div>
          <div className="flex gap-2">
            <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-1 rounded">
              LIVE
            </span>
          </div>
        </div>
        <div className="flex justify-between items-center mb-3">
          <div>
            <p className="text-gray-500 text-xs">Current Portfolio Value</p>
            <h3 className="font-bold text-lg">
              {formatUSD(earning ? displayValue : userBalance)}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 text-xs">LIVE</span>
          </div>
        </div>
        <LiveCandleChart
          value={earning ? displayValue : userBalance}
          active={earning?.status === "active"}
          depositAmount={earning?.depositAmount || 0}
        />
      </div>

      {/* Earn Balance Section */}
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
                  width: `${Math.min(
                    ((userBalance + lockedBalance + (earning?.earnedSoFar || 0)) / 50000) * 100,
                    100
                  )}%`,
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

      <style jsx>{`
        .animate-scroll {
          animation: scroll 25s linear infinite;
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