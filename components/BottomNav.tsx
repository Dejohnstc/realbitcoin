"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  BarChart3,
  ArrowLeftRight,
  Percent,
  Wallet,
} from "lucide-react";

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { name: "Home", path: "/dashboard", icon: Home },
    { name: "Markets", path: "/dashboard/livemarket", icon: BarChart3 },
    { name: "Trade", path: "/dashboard/investments", icon: ArrowLeftRight },
    { name: "Earn", path: "/dashboard/portfolio", icon: Percent },
    { name: "Assets", path: "/dashboard/assets", icon: Wallet },
  ];

  return (
    <div className="fixed bottom-4 left-0 w-full flex justify-center z-50">

      {/* 🔥 FLOATING NAV CONTAINER */}
      <div className="bg-[#0B0F19]/95 backdrop-blur-md border border-gray-800 rounded-2xl px-6 py-2 flex justify-between items-center w-[95%] max-w-md shadow-xl">

        {navItems.map((item) => {
          const active = pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.name}
              onClick={() => router.push(item.path)}
              className="flex flex-col items-center gap-1"
            >
              {/* ICON BOX */}
              <div
                className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200
                ${
                  active
                    ? "bg-white text-black shadow-md"
                    : "text-gray-500"
                }`}
              >
                <Icon size={20} />
              </div>

              {/* LABEL */}
              <p
                className={`text-[10px] ${
                  active ? "text-white" : "text-gray-500"
                }`}
              >
                {item.name}
              </p>
            </button>
          );
        })}

      </div>
    </div>
  );
}