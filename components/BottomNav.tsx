"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  BarChart3,
  ArrowLeftRight,
  Percent,
  Wallet,
} from "lucide-react";
import { useRef } from "react";

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const touchStartX = useRef(0);

  const navItems = [
    { name: "Home", path: "/dashboard", icon: Home },
    { name: "Markets", path: "/dashboard/livemarket", icon: BarChart3 },
    { name: "Trade", path: "/dashboard/investments", icon: ArrowLeftRight },
    { name: "Earn", path: "/dashboard/portfolio", icon: Percent },
    { name: "Assets", path: "/dashboard/assets", icon: Wallet },
  ];

  // 🔥 SWIPE NAVIGATION
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = e.changedTouches[0].clientX - touchStartX.current;

    if (Math.abs(diff) < 50) return;

    const currentIndex = navItems.findIndex(
      (i) => i.path === pathname
    );

    if (diff < 0 && currentIndex < navItems.length - 1) {
      router.push(navItems[currentIndex + 1].path);
    }

    if (diff > 0 && currentIndex > 0) {
      router.push(navItems[currentIndex - 1].path);
    }
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="fixed bottom-4 left-0 w-full flex justify-center z-50"
    >
      <div className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-3 flex justify-between items-center w-[95%] max-w-md shadow-2xl">

        {navItems.map((item, index) => {
          const active = pathname === item.path;
          const Icon = item.icon;

          // 🔥 CENTER BIG BUTTON (TRADE)
          if (item.name === "Trade") {
            return (
              <button
                key={item.name}
                onClick={() => router.push(item.path)}
                className="relative -mt-8"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center shadow-xl border-4 border-[#0B0F19]">
                  <Icon size={24} className="text-black" />
                </div>

                <p className="text-[10px] text-center mt-1 text-white">
                  Trade
                </p>
              </button>
            );
          }

          return (
            <button
              key={item.name}
              onClick={() => router.push(item.path)}
              className="flex flex-col items-center gap-1 relative group"
            >
              {/* ICON */}
              <div
                className={`relative w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-300
                ${
                  active
                    ? "bg-white text-black scale-110 shadow-lg"
                    : "text-gray-500 group-hover:text-white"
                }`}
              >
                <Icon size={20} />

                {/* 🔔 NOTIFICATION BADGE (ASSETS) */}
                {item.name === "Assets" && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}

                {/* 🟢 ACTIVE DOT */}
                {active && (
                  <span className="absolute -bottom-1 w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                )}
              </div>

              <p
                className={`text-[10px] ${
                  active ? "text-white" : "text-gray-500"
                }`}
              >
                {item.name}
              </p>

              {/* ✨ GLOW */}
              {active && (
                <div className="absolute inset-0 rounded-xl blur-xl bg-white/10 -z-10"></div>
              )}
            </button>
          );
        })}

      </div>
    </div>
  );
}