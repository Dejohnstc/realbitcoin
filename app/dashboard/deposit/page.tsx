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
        { network: "TRC20", address: "TX9ExampleWalletAddress123456" },
        { network: "ERC20", address: "0xExampleWalletAddress123456" },
        { network: "BEP20", address: "0xe09ExampleWalletAddress123456" },
      ],
    },
    {
      name: "Bitcoin (BTC)",
      symbol: "btc",
      networks: [{ network: "BTC", address: "bc1examplewalletaddress" }],
    },
    {
      name: "Ethereum (ETH)",
      symbol: "eth",
      networks: [
        { network: "ERC20", address: "0xExampleWalletAddress123456" },
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
        const res = await fetch("/api/market");
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

    const price = prices[selectedCoin.symbol];
    if (!price) return 0;

    return amount / price;
  };

  // ✅ COPY ADDRESS
  const copyAddress = () => {
    if (!selectedNetwork) return;

    navigator.clipboard.writeText(selectedNetwork.address);
    alert("Address copied");
  };

  // ✅ DEPOSIT
  const handleDeposit = async () => {
    const token = localStorage.getItem("user_token");

    if (!token) return alert("Login required");

    if (!amount || !selectedCoin || !selectedNetwork) {
      return alert("Fill all fields");
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

          <p className="text-xs text-gray-500 mb-2">
            Network: {selectedNetwork.network}
          </p>

          <p className="text-green-400 break-all text-sm mb-3">
            {selectedNetwork.address}
          </p>

          <button
            onClick={copyAddress}
            className="w-full py-2 bg-blue-500 rounded-lg text-sm"
          >
            Copy Address
          </button>

          <div className="mt-4 flex justify-center">
            <Image
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${selectedNetwork.address}`}
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