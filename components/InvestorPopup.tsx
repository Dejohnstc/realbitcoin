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

// ✅ SAFE COUNTRY → FLAG MAP (no errors)
const countryFlags: Record<string, string> = {
  Kuwait: "kw",
  Canada: "ca",
  UK: "gb",
  Dubai: "ae",
  USA: "us",
  Spain: "es",
  Zimbabwe: "zw",
  Brazil: "br",
  Japan: "jp",
  Mexico: "mx",
  UAE: "ae",
  "South Africa": "za",
  Norway: "no",
  Berlin: "de",
  Sweden: "se",
  Australia: "au",
  London: "gb",
};

export default function InvestorPopup() {
  const [current, setCurrent] = useState(investors[0]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 🔊 OPTIONAL SOUND (safe)
    const audio = new Audio("/notify.mp3");

    const showPopup = () => {
      const random =
        investors[Math.floor(Math.random() * investors.length)];

      setCurrent(random);
      setVisible(true);

      // 🔊 play sound safely
      audio.volume = 0.25;
      audio.play().catch(() => {});

      setTimeout(() => {
        setVisible(false);
      }, 5000);
    };

    const initialTimeout = setTimeout(showPopup, 4000);
    const interval = setInterval(showPopup, 15000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  const firstLetter = current.name.charAt(0);
  const flagCode = countryFlags[current.country];

  return (
    <div
      className={`fixed bottom-24 left-4 z-50 transition-all duration-500 ease-in-out
      ${
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-12 pointer-events-none"
      }`}
    >
      <div className="flex items-center gap-3 bg-[#131A2A]/90 backdrop-blur-md border border-gray-700 px-4 py-3 rounded-xl shadow-lg w-[300px]">

        {/* 👤 AVATAR */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center font-bold text-white">
          {firstLetter}
        </div>

        {/* TEXT */}
        <div className="flex-1">
          <p className="text-sm text-white leading-tight">
            <strong>{current.name}</strong>{" "}
            <span className="text-gray-400">just invested</span>
          </p>

          <p className="text-blue-400 font-semibold text-sm">
            ${current.amount.toLocaleString()}
          </p>

          <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
            {/* 🌍 FLAG (safe render) */}
            {flagCode && (
              <img
                src={`https://flagcdn.com/16x12/${flagCode}.png`}
                alt="flag"
                className="w-4 h-3 rounded-sm"
              />
            )}
            {current.country} • Just now
          </p>
        </div>
      </div>
    </div>
  );
}