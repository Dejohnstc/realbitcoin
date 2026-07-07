"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TransferPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(false);

  async function transfer() {
    const token = localStorage.getItem("user_token");

    if (!token) {
      alert("Please login.");
      return;
    }

    if (!email || !amount) {
      alert("Please complete all required fields.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/transfer", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          email,
          amount: Number(amount),
          note,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        return;
      }

      alert("Transfer completed successfully.");

      router.push("/dashboard/assets");

    } catch {
      alert("Transfer failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">

      <div className="rounded-3xl bg-[#131A2A] border border-gray-800 p-6">

        <h1 className="text-2xl font-bold mb-2">
          Internal Transfer
        </h1>

        <p className="text-gray-400 mb-8">
          Send funds instantly to another CoinlyBitora user.
        </p>

        <div className="space-y-5">

          <div>
            <label className="block mb-2 text-sm text-gray-400">
              Recipient Email
            </label>

            <input
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              className="w-full rounded-xl bg-[#0B0F19] border border-gray-700 p-4"
              placeholder="john@email.com"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm text-gray-400">
              Amount (USD)
            </label>

            <input
              type="number"
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value)
              }
              className="w-full rounded-xl bg-[#0B0F19] border border-gray-700 p-4"
              placeholder="100"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm text-gray-400">
              Note (Optional)
            </label>

            <textarea
              rows={3}
              value={note}
              onChange={(e) =>
                setNote(e.target.value)
              }
              className="w-full rounded-xl bg-[#0B0F19] border border-gray-700 p-4"
              placeholder="Payment for..."
            />
          </div>

          <button
            onClick={transfer}
            disabled={loading}
            className="w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 py-4 font-bold text-black"
          >
            {loading
              ? "Processing..."
              : "Send Transfer"}
          </button>

        </div>

      </div>

    </div>
  );
}