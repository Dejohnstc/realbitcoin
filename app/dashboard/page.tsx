"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Market {
  id: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
}

export default function DashboardPage() {
  const [balance, setBalance] = useState<number>(0);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [btcPrice, setBtcPrice] = useState<number>(0);
  const [tradeAmount, setTradeAmount] = useState<number>(0);

  const [loadingMarkets, setLoadingMarkets] = useState(true);
  const [marketError, setMarketError] = useState(false);
  const [toast, setToast] = useState("");

  const router = useRouter();

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const fetchBalance = async () => {
    const token = localStorage.getItem("user_token");
    if (!token) return;

    try {
      const res = await fetch("/api/user", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      const data = await res.json();

      if (res.ok && data.balance !== undefined) {
        setBalance(data.balance);
      }
    } catch {}
  };

  const fetchMarkets = async () => {
    try {
      setLoadingMarkets(true);
      setMarketError(false);

      const res = await fetch("/api/markets", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) throw new Error();

      setMarkets(Array.isArray(data.markets) ? data.markets : []);

      const btc = data.markets?.find((c: Market) => c.id === "bitcoin");
      if (btc) setBtcPrice(btc.current_price);
    } catch {
      setMarketError(true);
    } finally {
      setLoadingMarkets(false);
    }
  };

  const handleTrade = (type: "buy" | "sell") => {
    if (tradeAmount <= 0) {
      return showToast("Enter valid amount");
    }

    if (type === "buy") {
      if (tradeAmount > balance) {
        return showToast("Insufficient balance");
      }

      setBalance((prev) => prev - tradeAmount);
      showToast("Buy order placed");
    } else {
      setBalance((prev) => prev + tradeAmount * 1.02);
      showToast("Sell order executed");
    }

    setTradeAmount(0);
  };

  useEffect(() => {
    fetchBalance();
    fetchMarkets();

    const interval = setInterval(() => {
      fetchBalance();
      fetchMarkets();
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  const handleNavigation = (item: string) => {
    switch (item) {
      case "Deposit Funds":
        router.push("/dashboard/deposit");
        break;
      case "Withdraw Funds":
        router.push("/dashboard/withdraw");
        break;
      case "Investment Plans":
        router.push("/dashboard/investments");
        break;
      case "My Portfolio":
        router.push("/dashboard/portfolio");
        break;
      case "Live Markets":
        router.push("/dashboard/livemarket");
        break;
      case "Settings":
        router.push("/dashboard/settings");
        break;
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white px-4 pb-24">

      {/* 🔔 TOAST */}
      {toast && (
        <div className="fixed top-6 right-6 bg-black px-4 py-2 rounded shadow z-50">
          {toast}
        </div>
      )}

      {/* ACTIONS */}
      <div className="flex items-center gap-3 my-4">
        <button className="p-3 rounded-xl bg-[#131A2A]">👁‍🗨</button>

        <button
          onClick={() => router.push("/dashboard/deposit")}
          className="p-3 rounded-xl bg-[#131A2A]"
        >
          💳
        </button>

        <button
          onClick={() => router.push("/dashboard/investments")}
          className="flex-1 py-3 rounded-xl bg-green-500 text-black font-semibold"
        >
          🚀 Start Investment
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 gap-4">
        <Card title="💰 Total Balance" value={`$${balance.toFixed(2)}`} />
        <Card title="₿ BTC Price" value={`$${btcPrice.toLocaleString()}`} />
        <Card title="📊 Active Trades" value="Live" green />
        <Card title="🟢 Market Status" value="Open" green />
      </div>

      {/* CHART */}
      <div className="mt-6 bg-[#131A2A] p-2 rounded-xl">
        <iframe
          src="https://s.tradingview.com/widgetembed/?symbol=BINANCE:BTCUSDT&interval=60&theme=dark"
          className="w-full h-64 rounded-lg"
        />
      </div>

      {/* MARKETS */}
      <div className="mt-6 bg-[#131A2A] p-4 rounded-xl">
        <h2 className="mb-3 font-semibold">📈 Live Markets</h2>

        {loadingMarkets && <p className="text-gray-400">Loading...</p>}
        {marketError && <p className="text-red-400">Error loading markets</p>}

        {!loadingMarkets &&
          (Array.isArray(markets) ? markets : [])
  .slice(0, 5)
  .map((m) => (
            <div
              key={m.id}
              onClick={() =>
                router.push(`/dashboard/livemarket/${m.symbol}`)
              }
              className="flex justify-between py-2 cursor-pointer hover:text-yellow-400"
            >
              <span>{m.symbol.toUpperCase()}</span>
              <span>${m.current_price.toLocaleString()}</span>
              <span
                className={
                  m.price_change_percentage_24h > 0
                    ? "text-green-400"
                    : "text-red-400"
                }
              >
                {m.price_change_percentage_24h.toFixed(2)}%
              </span>
            </div>
          ))}
      </div>

      {/* TRADE */}
      <div className="mt-6 bg-[#131A2A] p-4 rounded-xl">
        <h2 className="mb-3 font-semibold">⚡ Quick Trade</h2>

        <input
          type="number"
          value={tradeAmount}
          onChange={(e) => setTradeAmount(Number(e.target.value))}
          className="w-full p-3 mb-3 bg-[#0B0F19] rounded"
          placeholder="Enter amount"
        />

        <div className="flex gap-3">
          <button
            onClick={() => handleTrade("buy")}
            className="flex-1 py-3 bg-green-500 text-black rounded"
          >
            Buy
          </button>

          <button
            onClick={() => handleTrade("sell")}
            className="flex-1 py-3 bg-red-500 text-white rounded"
          >
            Sell
          </button>
        </div>
      </div>

      {/* MENU */}
      <div className="mt-6 space-y-3">
        {[
          ["💳", "Deposit Funds"],
          ["💸", "Withdraw Funds"],
          ["📊", "Investment Plans"],
          ["📁", "My Portfolio"],
          ["📈", "Live Markets"],
          ["⚙️", "Settings"],
        ].map(([icon, item]) => (
          <div
            key={item}
            onClick={() => handleNavigation(item)}
            className="flex justify-between p-4 bg-[#131A2A] rounded-xl cursor-pointer hover:bg-[#1A2235]"
          >
            <span>{icon} {item}</span>
            <span>›</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* COMPONENT */
type CardProps = {
  title: string;
  value: string | number;
  green?: boolean;
};

function Card({ title, value, green = false }: CardProps) {
  return (
    <div className="bg-[#131A2A] p-4 rounded-xl">
      <p className="text-gray-400 text-sm">{title}</p>

      <h2
        className={`text-xl font-bold ${
          green ? "text-green-400" : ""
        }`}
      >
        {value}
      </h2>
    </div>
  );
}