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

type Candle = {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  time: number;
};

type ChartType = "candles" | "line" | "area";
type Timeframe = "1m" | "5m" | "15m";

/* ---------- helpers ---------- */
const formatUSD = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);

const COL = {
  up: "#22c55e",
  down: "#ef4444",
  ma7: "#38bdf8",
  ma25: "#f59e0b",
  grid: "rgba(255,255,255,0.045)",
  axis: "rgba(255,255,255,0.32)",
  cross: "rgba(255,255,255,0.18)",
  bgCard: "#0B0F19",
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function smaAt(view: Candle[], period: number, idx: number): number | null {
  if (idx < period - 1) return null;
  let s = 0;
  for (let k = 0; k < period; k++) s += view[idx - k].close;
  return s / period;
}

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
   SOPHISTICATED LIVE CHART
   - candles / line / area
   - volume, MA(7)/MA(25), crosshair + OHLC tooltip
   - time + price axes, live pulse, 24h stats
   - reads simulator.price ONLY (stays in sync with the card)
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
  const lastSeenPriceRef = useRef<number>(value);
  const rafRef = useRef<number | null>(null);
  const peakPriceRef = useRef(value);
  const hoverRef = useRef<{ x: number; y: number } | null>(null);

  // stats readouts (updated via DOM to avoid re-renders)
  const hiRef = useRef<HTMLSpanElement | null>(null);
  const loRef = useRef<HTMLSpanElement | null>(null);
  const chgRef = useRef<HTMLSpanElement | null>(null);

  const [chartType, setChartType] = useState<ChartType>("candles");
  const [timeframe, setTimeframe] = useState<Timeframe>("1m");
  const [showMA, setShowMA] = useState(true);
  const [showVolume, setShowVolume] = useState(true);

  // read live options inside the rAF loop without tearing it down on toggle
  const optsRef = useRef({ chartType, timeframe, showMA, showVolume });
  useEffect(() => {
    optsRef.current = { chartType, timeframe, showMA, showVolume };
  }, [chartType, timeframe, showMA, showVolume]);

  const ticksPerCandle = (tf: Timeframe) => (tf === "1m" ? 8 : tf === "5m" ? 20 : 40);
  const candleMs = (tf: Timeframe) => (tf === "1m" ? 60000 : tf === "5m" ? 300000 : 900000);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const MAX_CANDLES = 80;
    const VISIBLE = 70;

    // ---- seed history once ----
    if (candlesRef.current.length === 0) {
      const now = Date.now();
      const durMs = candleMs(optsRef.current.timeframe);
      let seed = value || 1000;
      const tempSim = new PriceSimulator(seed);

      for (let i = 0; i < MAX_CANDLES; i++) {
        const open = seed;
        let close = seed;
        let high = seed;
        let low = seed;
        for (let t = 0; t < 40; t++) {
          close = tempSim.nextPrice();
          high = Math.max(high, close);
          low = Math.min(low, close);
        }
        const range = Math.abs(close - open) / Math.max(open, 0.01);
        const volume = (0.6 + Math.random() * 0.8) * (1 + range * 25);
        const time = now - (MAX_CANDLES - i) * durMs;
        candlesRef.current.push({ open, high, low, close, volume, time });
        seed = close;
      }

      currentRef.current = { open: value, high: value, low: value, close: value, volume: 0, time: now };
      peakPriceRef.current = value;
      lastSeenPriceRef.current = value;
    }

    // ---- crisp DPR sizing ----
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // ---- draw ----
    const draw = () => {
      const opts = optsRef.current;
      const rect = canvas.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height;
      ctx.clearRect(0, 0, W, H);

      const cur = currentRef.current;
      const allData = cur ? [...candlesRef.current, cur] : candlesRef.current.slice();
      if (allData.length === 0) return;

      const view = allData.slice(Math.max(0, allData.length - VISIBLE));

      const padRight = 62;
      const axisH = 16;
      const volH = opts.showVolume ? Math.round(H * 0.18) : 0;
      const priceTop = 6;
      const priceBottom = H - axisH - volH;
      const priceH = Math.max(20, priceBottom - priceTop);
      const plotW = W - padRight;
      const slot = plotW / view.length;
      const bodyW = Math.max(1.5, slot * 0.62);

      // price scale
      let min = Infinity;
      let max = -Infinity;
      let rawHi = -Infinity;
      let rawLo = Infinity;
      for (const c of view) {
        if (c.low < min) min = c.low;
        if (c.high > max) max = c.high;
        if (c.high > rawHi) rawHi = c.high;
        if (c.low < rawLo) rawLo = c.low;
      }
      const padV = (max - min) * 0.12 || max * 0.01 || 1;
      min -= padV;
      max += padV;
      const range = max - min || 1;
      const y = (p: number) => priceTop + (1 - (p - min) / range) * priceH;

      // volume scale
      let volMax = 0;
      if (opts.showVolume) {
        for (const c of view) if (c.volume > volMax) volMax = c.volume;
        volMax = volMax || 1;
      }
      const yVol = (v: number) => priceBottom + volH - (v / volMax) * (volH * 0.85);

      // background gradient
      const bg = ctx.createLinearGradient(0, priceTop, 0, priceBottom);
      bg.addColorStop(0, "rgba(34,197,94,0.035)");
      bg.addColorStop(1, "rgba(11,15,25,0)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, priceTop, plotW, priceH);

      // horizontal grid + price labels
      ctx.font = "9px Inter, Arial";
      ctx.textBaseline = "middle";
      for (let i = 0; i <= 4; i++) {
        const gp = min + (range / 4) * i;
        const gy = y(gp);
        ctx.strokeStyle = COL.grid;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(plotW, gy);
        ctx.stroke();
        ctx.fillStyle = COL.axis;
        ctx.textAlign = "left";
        ctx.fillText(gp.toFixed(2), plotW + 6, gy);
      }

      // time labels
      ctx.fillStyle = "rgba(255,255,255,0.28)";
      ctx.textAlign = "center";
      const labelEvery = Math.max(1, Math.ceil(view.length / 6));
      view.forEach((c, i) => {
        if (i % labelEvery === 0) {
          const cx = slot * i + slot / 2;
          const d = new Date(c.time);
          const hh = String(d.getHours()).padStart(2, "0");
          const mm = String(d.getMinutes()).padStart(2, "0");
          ctx.fillText(`${hh}:${mm}`, cx, H - axisH / 2);
        }
      });

      // volume bars
      if (opts.showVolume) {
        view.forEach((c, i) => {
          const cx = slot * i + slot / 2;
          const up = c.close >= c.open;
          ctx.fillStyle = up ? "rgba(34,197,94,0.26)" : "rgba(239,68,68,0.26)";
          const vy = yVol(c.volume);
          ctx.fillRect(cx - bodyW / 2, vy, bodyW, priceBottom + volH - vy);
        });
      }

      // price series
      if (opts.chartType === "candles") {
        view.forEach((c, i) => {
          const cx = slot * i + slot / 2;
          const up = c.close >= c.open;
          const col = up ? COL.up : COL.down;
          ctx.strokeStyle = col;
          ctx.fillStyle = col;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(cx, y(c.high));
          ctx.lineTo(cx, y(c.low));
          ctx.stroke();
          const top = Math.min(y(c.open), y(c.close));
          const h = Math.max(1, Math.abs(y(c.close) - y(c.open)));
          ctx.fillRect(cx - bodyW / 2, top, bodyW, h);
        });
      } else {
        const linePath = () => {
          ctx.beginPath();
          view.forEach((c, i) => {
            const cx = slot * i + slot / 2;
            const yy = y(c.close);
            if (i === 0) ctx.moveTo(cx, yy);
            else ctx.lineTo(cx, yy);
          });
        };
        if (opts.chartType === "area") {
          linePath();
          ctx.lineTo(slot * (view.length - 1) + slot / 2, priceBottom);
          ctx.lineTo(slot / 2, priceBottom);
          ctx.closePath();
          const grad = ctx.createLinearGradient(0, priceTop, 0, priceBottom);
          grad.addColorStop(0, "rgba(34,197,94,0.35)");
          grad.addColorStop(1, "rgba(34,197,94,0)");
          ctx.fillStyle = grad;
          ctx.fill();
        }
        linePath();
        ctx.strokeStyle = COL.up;
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }

      // moving averages
      if (opts.showMA) {
        const drawMA = (period: number, color: string) => {
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          let started = false;
          view.forEach((c, i) => {
            const s = smaAt(view, period, i);
            if (s == null) return;
            const cx = slot * i + slot / 2;
            const yy = y(s);
            if (!started) {
              ctx.moveTo(cx, yy);
              started = true;
            } else {
              ctx.lineTo(cx, yy);
            }
          });
          ctx.stroke();
        };
        drawMA(7, COL.ma7);
        drawMA(25, COL.ma25);
      }

      // current price line + tag + pulsing dot
      const last = view[view.length - 1];
      const ly = y(last.close);
      const upNow = last.close >= last.open;
      const liveCol = upNow ? COL.up : COL.down;

      ctx.strokeStyle = upNow ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.35)";
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, ly);
      ctx.lineTo(plotW, ly);
      ctx.stroke();
      ctx.setLineDash([]);

      const tagText = last.close.toFixed(2);
      ctx.font = "bold 9px Inter, Arial";
      const tw = ctx.measureText(tagText).width + 12;
      ctx.fillStyle = liveCol;
      roundRect(ctx, plotW, ly - 9, Math.min(tw, padRight - 2), 18, 3);
      ctx.fill();
      ctx.fillStyle = COL.bgCard;
      ctx.textAlign = "center";
      ctx.fillText(tagText, plotW + Math.min(tw, padRight - 2) / 2, ly);

      const lcx = slot * (view.length - 1) + slot / 2;
      const pulse = (Math.sin(Date.now() / 600) + 1) / 2;
      ctx.beginPath();
      ctx.arc(lcx, ly, 3 + pulse * 3, 0, Math.PI * 2);
      ctx.fillStyle = upNow
        ? `rgba(34,197,94,${0.12 + pulse * 0.18})`
        : `rgba(239,68,68,${0.12 + pulse * 0.18})`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(lcx, ly, 2.6, 0, Math.PI * 2);
      ctx.fillStyle = liveCol;
      ctx.fill();

      // crosshair + OHLC tooltip
      const hov = hoverRef.current;
      if (hov && hov.x <= plotW && hov.x >= 0) {
        let idx = Math.round(hov.x / slot - 0.5);
        idx = Math.max(0, Math.min(view.length - 1, idx));
        const c = view[idx];
        const cx = slot * idx + slot / 2;

        ctx.strokeStyle = COL.cross;
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, priceTop);
        ctx.lineTo(cx, priceBottom + volH);
        ctx.stroke();

        const hy = Math.max(priceTop, Math.min(priceBottom, hov.y));
        ctx.beginPath();
        ctx.moveTo(0, hy);
        ctx.lineTo(plotW, hy);
        ctx.stroke();
        ctx.setLineDash([]);

        // axis price readout at cursor
        const hp = min + (1 - (hy - priceTop) / priceH) * range;
        ctx.fillStyle = "#e5e7eb";
        roundRect(ctx, plotW, hy - 9, padRight - 2, 18, 3);
        ctx.fill();
        ctx.fillStyle = COL.bgCard;
        ctx.font = "bold 9px Inter, Arial";
        ctx.textAlign = "center";
        ctx.fillText(hp.toFixed(2), plotW + (padRight - 2) / 2, hy);

        // OHLC tooltip box
        const up = c.close >= c.open;
        const d = new Date(c.time);
        const tstr = `${String(d.getHours()).padStart(2, "0")}:${String(
          d.getMinutes()
        ).padStart(2, "0")}`;
        const rows = [
          ["O", c.open.toFixed(2)],
          ["H", c.high.toFixed(2)],
          ["L", c.low.toFixed(2)],
          ["C", c.close.toFixed(2)],
        ];
        const boxW = 92;
        const boxH = 78;
        let bx = cx + 10;
        if (bx + boxW > plotW) bx = cx - boxW - 10;
        bx = Math.max(2, bx);
        const by = priceTop + 4;

        ctx.fillStyle = "rgba(19,26,42,0.96)";
        roundRect(ctx, bx, by, boxW, boxH, 6);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.1)";
        ctx.lineWidth = 1;
        roundRect(ctx, bx, by, boxW, boxH, 6);
        ctx.stroke();

        ctx.textAlign = "left";
        ctx.fillStyle = "rgba(255,255,255,0.45)";
        ctx.font = "8px Inter, Arial";
        ctx.fillText(tstr, bx + 8, by + 12);
        ctx.font = "9px Inter, Arial";
        rows.forEach((r, i) => {
          const ry = by + 26 + i * 13;
          ctx.fillStyle = "rgba(255,255,255,0.5)";
          ctx.fillText(r[0], bx + 8, ry);
          ctx.fillStyle = up ? COL.up : COL.down;
          ctx.textAlign = "right";
          ctx.fillText(r[1], bx + boxW - 8, ry);
          ctx.textAlign = "left";
        });
      }

      // 24h-style stats (use unpadded highs/lows)
      const first = view[0];
      const chg = first.open > 0 ? ((last.close - first.open) / first.open) * 100 : 0;
      if (hiRef.current) hiRef.current.innerText = rawHi.toFixed(2);
      if (loRef.current) loRef.current.innerText = rawLo.toFixed(2);
      if (chgRef.current) {
        chgRef.current.innerText = `${chg >= 0 ? "+" : ""}${chg.toFixed(2)}%`;
        chgRef.current.style.color = chg >= 0 ? COL.up : COL.down;
      }
    };

    // ---- loop: read simulator.price (single source of truth) ----
    const loop = () => {
      if (document.hidden) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const price = simulator.price;
      if (price > peakPriceRef.current) peakPriceRef.current = price;

      const cur = currentRef.current;
      if (cur) {
        cur.close = price;
        cur.high = Math.max(cur.high, price);
        cur.low = Math.min(cur.low, price);
      }

      if (active && price !== lastSeenPriceRef.current) {
        lastSeenPriceRef.current = price;
        if (cur) cur.volume += 0.2 + Math.random() * 0.6;
        tickCountRef.current++;

        if (tickCountRef.current >= ticksPerCandle(optsRef.current.timeframe) && cur) {
          candlesRef.current.push({ ...cur });
          if (candlesRef.current.length > MAX_CANDLES) candlesRef.current.shift();
          currentRef.current = {
            open: price,
            high: price,
            low: price,
            close: price,
            volume: 0,
            time: Date.now(),
          };
          tickCountRef.current = 0;
        }
      }

      draw();
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    // ---- pointer interaction ----
    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      hoverRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onLeave = () => {
      hoverRef.current = null;
    };
    const onTouch = (e: TouchEvent) => {
      if (!e.touches.length) return;
      const r = canvas.getBoundingClientRect();
      hoverRef.current = {
        x: e.touches[0].clientX - r.left,
        y: e.touches[0].clientY - r.top,
      };
    };
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);
    canvas.addEventListener("touchstart", onTouch, { passive: true });
    canvas.addEventListener("touchmove", onTouch, { passive: true });
    canvas.addEventListener("touchend", onLeave);

    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
      canvas.removeEventListener("touchstart", onTouch);
      canvas.removeEventListener("touchmove", onTouch);
      canvas.removeEventListener("touchend", onLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, simulator, value]);

  const segBtn = (selected: boolean) =>
    `px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
      selected
        ? "bg-white/10 text-white"
        : "text-gray-500 hover:text-gray-300"
    }`;

  return (
    <div className="w-full">
      {/* stats row */}
      <div className="flex items-center gap-4 mb-2 text-[11px]">
        <div className="flex items-center gap-1">
          <span className="text-gray-500">24h H</span>
          <span ref={hiRef} className="text-gray-200 font-mono">—</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-500">24h L</span>
          <span ref={loRef} className="text-gray-200 font-mono">—</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-500">Chg</span>
          <span ref={chgRef} className="font-mono text-green-400">—</span>
        </div>
      </div>

      {/* controls */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
        <div className="flex items-center gap-1 bg-[#0B0F19] rounded-lg p-0.5 border border-white/5">
          {(["candles", "line", "area"] as ChartType[]).map((t) => (
            <button key={t} onClick={() => setChartType(t)} className={segBtn(chartType === t)}>
              {t === "candles" ? "Candles" : t === "line" ? "Line" : "Area"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#0B0F19] rounded-lg p-0.5 border border-white/5">
            {(["1m", "5m", "15m"] as Timeframe[]).map((t) => (
              <button key={t} onClick={() => setTimeframe(t)} className={segBtn(timeframe === t)}>
                {t}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowMA((v) => !v)}
            className={segBtn(showMA)}
            title="Moving averages"
          >
            MA
          </button>
          <button
            onClick={() => setShowVolume((v) => !v)}
            className={segBtn(showVolume)}
            title="Volume"
          >
            Vol
          </button>
        </div>
      </div>

      {/* legend */}
      {showMA && (
        <div className="flex items-center gap-3 mb-2 text-[10px] text-gray-500">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-[2px]" style={{ background: COL.ma7 }} /> MA 7
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-[2px]" style={{ background: COL.ma25 }} /> MA 25
          </span>
        </div>
      )}

      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "260px", display: "block", cursor: "crosshair" }}
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
  const [lockedBalance, setLockedBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maxDrawdown, setMaxDrawdown] = useState(0);
  const [ticker, setTicker] = useState<string[]>([]);
  const [countdown, setCountdown] = useState("");

  const router = useRouter();
  const frameRef = useRef<number | null>(null);
  const loopInstanceIdRef = useRef<string | null>(null);
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

  // Single price driver.
  // This effect is the ONLY place that advances simulator.price. It writes that
  // exact value to the Total Net Worth card, and the chart reads the same
  // simulator.price — so the card balance and the live chart price are always
  // identical (e.g. chart shows 5,017.32 -> card shows $5,017.32).
  useEffect(() => {
    if (loading || !simulatorRef.current) return;
    const sim = simulatorRef.current;

    if (!earning || earning.status !== "active") {
      loopInstanceIdRef.current = null;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      sim.price = realTotal;
      const t = setTimeout(() => {
        if (domBalanceRef.current) {
          domBalanceRef.current.innerText = formatUSD(realTotal);
          domBalanceRef.current.className = "text-4xl font-bold text-white";
        }
        if (domChartBalanceRef.current) domChartBalanceRef.current.innerText = formatUSD(realTotal);
        if (domPercentRef.current) {
          domPercentRef.current.innerText = "0.00%";
          domPercentRef.current.className = "text-xs font-semibold text-gray-300";
        }
        if (domChangeRef.current) {
          domChangeRef.current.innerText = "$0.00";
          domChangeRef.current.className = "text-sm text-gray-400";
        }
      }, 50);
      return () => clearTimeout(t);
    }

    const instanceId = Math.random().toString(36).substring(2, 9);
    loopInstanceIdRef.current = instanceId;
    if (frameRef.current) cancelAnimationFrame(frameRef.current);

    const TICK_MS = 800;   // how often a new price prints (consumed by card + chart)
    const BAND = 0.08;     // keep the wander within ±8% of the real total

    let previous = sim.price || realTotal;
    let maxValue = previous;
    let lastTick = 0;

    const animate = (ts: number) => {
      if (loopInstanceIdRef.current !== instanceId) return;
      if (document.hidden) {
        frameRef.current = requestAnimationFrame(animate);
        return;
      }
      if (!lastTick) lastTick = ts;

      if (ts - lastTick >= TICK_MS) {
        lastTick = ts;

        const raw = sim.nextPrice();
        const anchored = raw + (realTotal - raw) * 0.03;
        const lo = realTotal * (1 - BAND);
        const hi = realTotal * (1 + BAND);
        const price = Math.min(Math.max(anchored, lo), hi);
        sim.price = price; // single source of truth; the chart reads this

        if (price > maxValue) maxValue = price;
        const drawdown = maxValue > 0 ? (maxValue - price) / maxValue : 0;
        if (drawdown > maxDrawdown) setMaxDrawdown(drawdown);

        const changeAmount = price - previous;
        const changePercent = previous > 0 ? (changeAmount / previous) * 100 : 0;
        const isUpNow = price >= previous;

        if (domBalanceRef.current) {
          domBalanceRef.current.innerText = formatUSD(price);
          domBalanceRef.current.className = `text-4xl font-bold transition-all duration-300 ${isUpNow ? "text-green-400" : "text-red-400"}`;
        }
        if (domChartBalanceRef.current) {
          domChartBalanceRef.current.innerText = formatUSD(price);
        }
        if (domPercentRef.current) {
          domPercentRef.current.innerText = `${isUpNow ? "+" : ""}${changePercent.toFixed(2)}%`;
          domPercentRef.current.className = `text-xs font-semibold ${isUpNow ? "text-green-400" : "text-red-400"}`;
        }
        if (domChangeRef.current) {
          domChangeRef.current.innerText = `${isUpNow ? "▲" : "▼"} $${Math.abs(changeAmount).toFixed(2)}`;
          domChangeRef.current.className = `text-sm ${isUpNow ? "text-green-400" : "text-red-400"}`;
        }

        previous = price;
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      loopInstanceIdRef.current = null;
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
