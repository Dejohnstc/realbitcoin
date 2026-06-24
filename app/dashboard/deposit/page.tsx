"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";

interface Coin {
  name: string;
  symbol: string;
  networks: {
    network: string;
    address: string;
  }[];
}

interface Market {
  symbol: string;
  current_price: number;
}

export default function DepositPage() {
  const router = useRouter();

  // ✅ STATIC DATA (no useState needed)
  const coins: Coin[] = [
    {
      name: "Tether (USDT)",
      symbol: "usdt",
      networks: [
        { network: "TRC20", address: "TCR1wfohbRjb9V2deMReGD74UWhAeUt8pd" },
        { network: "ERC20", address: "0xf44dcb2a914dd6b5a782ca0dfd23c2d06813c853" },
        { network: "BEP20", address: "0xf44dcb2a914dd6b5a782ca0dfd23c2d06813c853" },
      ],
    },
    {
      name: "Bitcoin (BTC)",
      symbol: "btc",
      networks: [{ network: "BTC", address: "16Dcw9DXiMb3i3cMDTKUvC8esEy6VGi5bi" }],
    },
    {
      name: "Ethereum (ETH)",
      symbol: "eth",
      networks: [
        { network: "ERC20", address: "0xf44dcb2a914dd6b5a782ca0dfd23c2d06813c853" },
      ],
    },
  ];

  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<{
    network: string;
    address: string;
  } | null>(null);

  const [amount, setAmount] = useState<number>(0);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  // ✅ FETCH MARKET
  useEffect(() => {
    const loadMarket = async () => {
      try {
        const res = await fetch("/api/markets", {
  cache: "no-store",
});
        const data = await res.json();

        const map: Record<string, number> = {};

        data.markets.forEach((c: Market) => {
          map[c.symbol.toLowerCase()] = c.current_price;
        });

        setPrices(map);
      } catch {
        console.log("Market failed");
      }
    };

    loadMarket();
  }, []);

  // ✅ CONVERSION
  const getConverted = () => {
  if (!selectedCoin || !amount) return 0;

  // USDT = 1:1
  if (selectedCoin.symbol === "usdt") {
    return amount;
  }

  const price = prices[selectedCoin.symbol];

  if (!price || price <= 0) return 0;

  return amount / price;
};

  // ✅ COPY ADDRESS
  const copyAddress = async () => {
  if (!selectedNetwork) return;

  try {
    await navigator.clipboard.writeText(
      selectedNetwork.address
    );

    alert("Address copied successfully");
  } catch {
    alert("Failed to copy address");
  }
};
  // ✅ DEPOSIT
  const MIN_DEPOSIT = 200;
  const handleDeposit = async () => {
    const token = localStorage.getItem("user_token");

    if (!token) return alert("Login required");

    if (
  amount <= 0 ||
  !selectedCoin ||
  !selectedNetwork
) {
  return alert("Enter a valid amount");
}{
  
    if (amount < MIN_DEPOSIT) {
  return alert(
    `Minimum deposit is $${MIN_DEPOSIT}`
  );
}

    try {
      setLoading(true);

      const res = await fetch("/api/deposit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount,
          coin: selectedCoin.symbol.toUpperCase(),
          network: selectedNetwork.network,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        return alert(data.error || "Deposit failed");
      }

      localStorage.setItem("currentDepositId", data.deposit._id);

      alert("Deposit submitted, waiting for approval");
    } catch {
      alert("Deposit failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white p-6">

      {/* 🔙 BACK BUTTON */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white transition"
        >
          <ArrowLeft size={20} />
        </button>

        <h1 className="text-xl font-bold">Deposit Funds</h1>
      </div>

      {/* COIN SELECT */}
      <div className="mb-4">
        <label className="text-gray-400 text-sm">Select Coin</label>

        <select
          className="w-full p-3 rounded-xl bg-[#131A2A] mt-2"
          onChange={(e) => {
            const coin =
              coins.find((c) => c.symbol === e.target.value) || null;

            setSelectedCoin(coin);
            setSelectedNetwork(coin ? coin.networks[0] : null);
          }}
        >
          <option value="">Choose coin</option>

          {coins.map((coin) => (
            <option key={coin.symbol} value={coin.symbol}>
              {coin.name}
            </option>
          ))}
        </select>
      </div>

      {/* NETWORK */}
      {selectedCoin && (
        <div className="mb-4">
          <label className="text-gray-400 text-sm">Select Network</label>

          <div className="flex gap-2 mt-2 flex-wrap">
            {selectedCoin.networks.map((net) => (
              <button
                key={net.network}
                onClick={() => setSelectedNetwork(net)}
                className={`px-3 py-2 rounded-lg text-sm ${
                  selectedNetwork?.network === net.network
                    ? "bg-yellow-400 text-black"
                    : "bg-[#131A2A]"
                }`}
              >
                {net.network}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* AMOUNT */}
      <div className="mb-4">
        <label className="text-gray-400 text-sm">Amount (USD)</label>

        <input
          type="number"
          placeholder="Enter amount"
          className="w-full p-3 rounded-xl bg-[#131A2A] mt-2"
          onChange={(e) => setAmount(Number(e.target.value))}
        />
      </div>

      {/* CONVERSION */}
      {selectedCoin && amount > 0 && (
        <div className="bg-[#131A2A] p-4 rounded-xl mb-4 text-sm">
          <p className="text-gray-400 mb-2">You will send</p>

          <div className="flex justify-between">
            <span>{selectedCoin.symbol.toUpperCase()}</span>
            <span>{getConverted().toFixed(6)}</span>
          </div>
        </div>
      )}

      {/* WALLET */}
      {selectedNetwork && (
        <div className="bg-[#131A2A] p-4 rounded-xl mb-4">

          <p className="text-sm text-gray-400 mb-2">
            Send {selectedCoin?.name}
          </p>

          <div className="inline-flex px-3 py-1 rounded-full bg-yellow-400 text-black text-xs font-semibold mb-3">
  {selectedNetwork.network}
</div>

          <p className="text-green-400 break-all text-sm mb-3">
            {selectedNetwork.address}
          </p>
<div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
  <p className="text-xs text-red-300">
    Only send {selectedCoin?.symbol.toUpperCase()}
    {" "}via {selectedNetwork.network}.
    Sending other assets may result in permanent loss.
  </p>
</div>
          <button
            onClick={copyAddress}
            className="w-full py-2 bg-blue-500 rounded-lg text-sm"
          >
            Copy Address
          </button>

          <div className="mt-4 flex justify-center">
            <Image
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
  selectedNetwork.address
)}`}
              alt="QR"
              width={150}
              height={150}
              className="rounded-lg"
            />
          </div>
        </div>
      )}

      {/* BUTTON */}
      <button
        disabled={loading}
        onClick={handleDeposit}
        className="w-full py-3 bg-yellow-400 text-black rounded-xl font-semibold disabled:opacity-50"
      >
        {loading ? "Processing..." : "I Have Paid"}
      </button>

    </div>
  );
}
}