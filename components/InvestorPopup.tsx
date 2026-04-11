"use client";

import { useEffect, useState } from "react";

const investors = [
  { name: "John D.", amount: 5000, country: "Kuwait" },
  { name: "Sarah M.", amount: 8200, country: "Canada" },
  { name: "Michael B.", amount: 12000, country: "UK" },
  { name: "David K.", amount: 3500, country: "Dubai" },
  { name: "Chris T.", amount: 9100, country: "USA" },
  { name: "Alvaro D.", amount: 50000, country: "Kuwait" },
  { name: "Winnet M.", amount: 82000, country: "Spain" },
  { name: "Lori B.", amount: 1200, country: "Zimbabwe" },
  { name: "Endrick K.", amount: 330500, country: "Brazil" },
  { name: "Deborah B.", amount: 25000, country: "USA" },
  { name: "Mitoma D.", amount: 5000, country: "Japan" },
  { name: "Mark R.", amount: 8200, country: "Mexico" },
  { name: "Marie H.", amount: 72000, country: "UAE" },
  { name: "Matthew F.", amount: 3500, country: "South Africa" },
  { name: "Lisa T.", amount: 9100, country: "Norway" },
  { name: "Henry D.", amount: 50000, country: "Berlin" },
  { name: "Anna S.", amount: 8200, country: "Sweden" },
  { name: "Judith B.", amount: 17500, country: "Australia" },
  { name: "Phil K.", amount: 3500, country: "London" },
  { name: "Linda T.", amount: 91000, country: "USA" },
];

export default function InvestorPopup() {
  const [current, setCurrent] = useState(investors[0]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showPopup = () => {
      const random =
        investors[Math.floor(Math.random() * investors.length)];

      setCurrent(random);
      setVisible(true);

      // 👇 stays visible longer (better UX)
      setTimeout(() => {
        setVisible(false);
      }, 5000);
    };

    // 👇 initial delay (not instant spam)
    const initialTimeout = setTimeout(showPopup, 4000);

    // 👇 slower interval (more realistic)
    const interval = setInterval(showPopup, 10000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  return (
    <div
      className={`fixed bottom-6 left-4 z-50 transition-all duration-500 ease-in-out
      ${
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-10 pointer-events-none"
      }`}
    >
      <div className="bg-[#131A2A] border border-gray-700 px-4 py-3 rounded-xl shadow-lg backdrop-blur-md">
        <p className="text-sm text-white">
          <strong>{current.name}</strong> just invested{" "}
          <span className="text-blue-400 font-semibold">
            ${current.amount.toLocaleString()}
          </span>{" "}
          from {current.country}
        </p>
      </div>
    </div>
  );
}