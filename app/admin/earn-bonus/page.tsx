"use client";

import { useState } from "react";
import { Mail, DollarSign, Gift } from "lucide-react";

export default function AddEarnBonusPage() {
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    if (!email || !amount) {
      setMessage("All fields required");
      return;
    }

    if (!email.includes("@")) {
      setMessage("Enter a valid email");
      return;
    }

    if (Number(amount) <= 0) {
      setMessage("Enter a valid amount");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("admin_token");

      const res = await fetch("/api/admin/add-earn-bonus", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email,
          amount: Number(amount),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Failed to add bonus");
      } else {
        setMessage("✅ Bonus added successfully");
        setAmount("");
        setEmail("");
      }
    } catch {
      setMessage("Something went wrong");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white px-4 py-6">

      {/* HEADER */}
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Gift className="text-yellow-400" size={22} />
        Add Trading Bonus
      </h1>

      {/* CARD */}
      <div className="bg-[#131A2A] p-6 rounded-2xl border border-gray-800 max-w-md shadow-xl">

        {/* EMAIL */}
        <div className="mb-5">
          <label className="text-sm text-gray-400 flex items-center gap-1">
            <Mail size={14} /> User Email
          </label>

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter user email"
            className="w-full mt-2 p-3 rounded-xl bg-[#0B0F19] border border-gray-700 outline-none focus:border-yellow-400 transition"
          />
        </div>

        {/* AMOUNT */}
        <div className="mb-5">
          <label className="text-sm text-gray-400 flex items-center gap-1">
            <DollarSign size={14} /> Bonus Amount ($)
          </label>

          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            type="number"
            className="w-full mt-2 p-3 rounded-xl bg-[#0B0F19] border border-gray-700 outline-none focus:border-yellow-400 transition"
          />
        </div>

        {/* BUTTON */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`w-full py-3 rounded-xl font-semibold mt-2 transition ${
            loading
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-gradient-to-r from-yellow-400 to-yellow-500 text-black hover:opacity-90"
          }`}
        >
          {loading ? "Processing..." : "Add Bonus"}
        </button>

        {/* MESSAGE */}
        {message && (
          <p
            className={`mt-4 text-sm text-center ${
              message.includes("✅")
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {message}
          </p>
        )}
      </div>

      {/* INFO */}
      <div className="mt-6 text-sm text-gray-500 max-w-md leading-relaxed">
        Bonus will be added to the user earning balance and a system notification will be sent automatically.
      </div>
    </div>
  );
}