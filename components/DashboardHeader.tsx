"use client";

import { useRouter } from "next/navigation";
import NotificationBell from "@/components/NotificationBell";
import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
  title: string;
  showBack: boolean;
}

export default function DashboardHeader({ title, showBack }: Props) {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true); // ✅ only allowed state update
  }, []);

  if (!mounted) return null;

  // ✅ GREETING (no state)
  const hour = new Date().getHours();

  let greeting = "Good Evening";
  if (hour < 12) greeting = "Good Morning";
  else if (hour < 18) greeting = "Good Afternoon";

  // ✅ NAME (no state)
  let name = "User";

  try {
    const userData = localStorage.getItem("user");

    if (userData) {
      const user = JSON.parse(userData);

      name =
        user.name?.split(" ")[0] ||
        user.email?.split("@")[0] ||
        "User";
    }
  } catch {}

  const handleLogout = () => {
    localStorage.removeItem("user_token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    router.push("/auth/login");
  };

  return (
    <div className="w-full flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#0B0F19]">

      {/* LEFT */}
      <div className="flex items-center gap-3">

        {/* {showBack && (
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white"
          >
            ←
          </button>
        )} */}

        <div className="w-8 h-8 rounded-md bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-sm font-bold">
          R
        </div>

        <div className="leading-tight">
          <h1 className="text-blue-400 font-semibold text-lg">
            {title}
          </h1>

          <p className="text-[11px] text-gray-400">
            {greeting}, {name}
          </p>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-5 text-xl">

        <NotificationBell />

        <button
          onClick={handleLogout}
          className="flex flex-col items-center text-gray-400 hover:text-red-400 transition"
        >
          <LogOut size={22} />
          <span className="text-[10px] mt-1">Logout</span>
        </button>

      </div>
    </div>
  );
}