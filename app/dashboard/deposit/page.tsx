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
  const [copied, setCopied] = useState(false);

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

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);

  } catch {
    alert("Failed to copy address");
  }
};
  // ✅ DEPOSIT
  const MIN_DEPOSIT = 500;

const handleDeposit = async () => {
  const token = localStorage.getItem("user_token");

  if (!token) {
    alert("Login required");
    return;
  }

  if (
    amount <= 0 ||
    !selectedCoin ||
    !selectedNetwork
  ) {
    alert("Enter a valid amount");
    return;
  }

  if (amount < MIN_DEPOSIT) {
    alert(`Minimum deposit is $${MIN_DEPOSIT}`);
    return;
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
      alert(data.error || "Deposit failed");
      return;
    }

    localStorage.setItem(
      "currentDepositId",
      data.deposit._id
    );

    alert("Deposit submitted, waiting for approval");
  } catch (error) {
    console.error(error);
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

        <div>

  <h1 className="text-3xl font-black">
    Deposit Crypto
  </h1>

  <p className="mt-1 text-sm text-gray-400">
    Securely fund your CoinlyBitora wallet.
  </p>

</div>
      </div>

      {/* COIN SELECT */}
      <div className="mb-4">
        <label className="text-gray-400 text-sm">Select Coin</label>

       <div className="grid grid-cols-3 gap-3 mt-3">

  {coins.map((coin) => (

    <button
      key={coin.symbol}
      onClick={() => {
        setSelectedCoin(coin);
        setSelectedNetwork(coin.networks[0]);
      }}
      className={`rounded-2xl border p-4 transition ${
        selectedCoin?.symbol === coin.symbol
          ? "border-cyan-400 bg-cyan-500/10"
          : "border-white/5 bg-[#131A2A] hover:border-cyan-400/30"
      }`}
    >

      <div className="text-2xl">

        {coin.symbol === "btc"
          ? "₿"
          : coin.symbol === "eth"
          ? "Ξ"
          : "₮"}

      </div>

      <p className="mt-2 font-semibold">
        {coin.symbol.toUpperCase()}
      </p>

      <p className="text-xs text-gray-500">
        {coin.name}
      </p>

    </button>

  ))}

</div>
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
          className="w-full p-3 rounded-2xl bg-[#131A2A] mt-2"
          onChange={(e) => setAmount(Number(e.target.value))}
        />
      </div>

      {/* CONVERSION */}
      {selectedCoin && amount > 0 && (
        <div className="mb-5 rounded-2xl border border-white/5 bg-gradient-to-b from-[#1B2338] to-[#141B2D] p-5">
         <p className="text-xs uppercase tracking-wider text-gray-400">
  Deposit Summary
</p>

<div className="mt-4 flex items-center justify-between">

  <div>

    <p className="text-gray-500">
      You Send
    </p>

    <p className="mt-1 text-xl font-bold">
      ${amount.toLocaleString()}
    </p>

  </div>

  <div className="text-3xl text-cyan-400">
    ↓
  </div>

  <div className="text-right">

    <p className="text-gray-500">
      Transfer
    </p>

    <p className="mt-1 text-xl font-bold text-cyan-400">
      {getConverted().toFixed(6)}{" "}
      {selectedCoin.symbol.toUpperCase()}
    </p>

  </div>

</div>
        </div>
      )}

      {/* WALLET */}
      {selectedNetwork && (
        <div className="rounded-3xl border border-white/5 bg-gradient-to-b from-[#1B2338] to-[#141B2D] p-6"> 

          <p className="text-sm text-gray-400 mb-2">
            Send {selectedCoin?.name}
          </p>

          <div className="inline-flex px-3 py-1 rounded-full bg-yellow-400 text-black text-xs font-semibold mb-3">
  {selectedNetwork.network}
</div>
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
          <div className="mt-4 rounded-xl bg-[#0B0F19] border border-white/5 p-3">

  <p className="break-all font-mono text-sm text-green-400">
    {selectedNetwork.address}
  </p>

</div>
<div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
  <p className="text-xs text-yellow-300">
    Only send {selectedCoin?.symbol.toUpperCase()}
    {" "}via {selectedNetwork.network}.
    Sending other assets may result in permanent loss.
  </p>
</div>
          <button
            onClick={copyAddress}
           className="mt-4 w-full rounded-2xl border border-cyan-500/20 bg-cyan-500/10 py-3 font-semibold text-cyan-300 transition hover:bg-cyan-500/20"
          >
            {copied ? "✓ Copied" : "Copy Wallet"}
          </button>

         
        </div>
      )}

      {/* BUTTON */}
      <div className="mb-5 rounded-2xl border border-white/5 bg-[#131A2A] p-4">

  <div className="flex items-center justify-between">

    <span className="text-gray-400">
      Minimum Deposit
    </span>

    <span className="font-bold text-cyan-400">
      $500
    </span>

  </div>

</div>
      <button
        disabled={loading}
        onClick={handleDeposit}
        className="mt-6 w-full rounded-2xl bg-gradient-to-r from-yellow-400 to-yellow-500 py-4 text-base font-bold text-black shadow-lg transition hover:scale-[1.02] hover:shadow-yellow-500/20 disabled:opacity-40"
      >
        {loading ? "Processing..." : "Deposit Submitted"}
      </button>

    </div>
  );
}
