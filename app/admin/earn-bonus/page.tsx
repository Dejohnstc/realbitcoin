"use client";

import { useState } from "react";

export default function AddEarnBonusPage() {
  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    if (!userId || !amount) {
      setMessage("All fields required");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("user_token");

      const res = await fetch("/api/admin/add-earn-bonus", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          amount: Number(amount),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Failed");
      } else {
        setMessage("✅ Bonus added successfully");
        setAmount("");
      }
    } catch {
      setMessage("Something went wrong");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white px-4 py-6">

      {/* HEADER */}
      <h1 className="text-2xl font-bold mb-6">
        🎁 Add Trading Bonus
      </h1>

      {/* CARD */}
      <div className="bg-[#131A2A] p-5 rounded-2xl border border-gray-800 max-w-md">

        {/* USER ID */}
        <div className="mb-4">
          <label className="text-sm text-gray-400">
            User ID
          </label>

          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Enter user ID"
            className="w-full mt-1 p-3 rounded-lg bg-[#0B0F19] border border-gray-700 outline-none"
          />
        </div>

        {/* AMOUNT */}
        <div className="mb-4">
          <label className="text-sm text-gray-400">
            Bonus Amount ($)
          </label>

          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            type="number"
            className="w-full mt-1 p-3 rounded-lg bg-[#0B0F19] border border-gray-700 outline-none"
          />
        </div>

        {/* BUTTON */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-yellow-400 text-black py-3 rounded-xl font-semibold mt-2 hover:opacity-90"
        >
          {loading ? "Processing..." : "Add Bonus"}
        </button>

        {/* MESSAGE */}
        {message && (
          <p className="mt-4 text-sm text-center text-gray-300">
            {message}
          </p>
        )}
      </div>

      {/* INFO */}
      <div className="mt-6 text-sm text-gray-500 max-w-md">
       Bonus will be added to the user earning balance and a system notification will be sent.
      </div>
    </div>
  );
}