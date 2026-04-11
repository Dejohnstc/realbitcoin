"use client";

import { useEffect, useState } from "react";

const investors = [
  { name: "John D.", amount: 5000, country: "Kuwait" },
  { name: "Sarah M.", amount: 8200, country: "Canada" },
  { name: "Michael B.", amount: 12000, country: "UK" },
  { name: "David K.", amount: 3500, country: "Dubai" },
  { name: "Chris T.", amount: 9100, country: "USA" },
];

export default function InvestorPopup() {
  const [current, setCurrent] = useState(investors[0]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      const random = investors[Math.floor(Math.random() * investors.length)];
      setCurrent(random);
      setVisible(true);

      setTimeout(() => setVisible(false), 4000);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-4 z-50 bg-[#131A2A] border border-gray-700 px-4 py-3 rounded-xl shadow-lg">
      <p className="text-sm text-white">
        <strong>{current.name}</strong> just invested{" "}
        <span className="text-blue-400 font-semibold">
          ${current.amount.toLocaleString()}
        </span>{" "}
        from {current.country}
      </p>
    </div>
  );
}