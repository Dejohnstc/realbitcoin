"use client";

import { usePathname } from "next/navigation";
import DashboardHeader from "@/components/DashboardHeader";
import ChatWidget from "@/components/ChatWidget";
import BottomNav from "@/components/BottomNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const getTitle = () => {
    if (pathname === "/dashboard") return "RealBitcoin";
    if (pathname.includes("deposit")) return "Deposit";
    if (pathname.includes("withdraw")) return "Withdraw";
    if (pathname.includes("history")) return "History";
    if (pathname.includes("investments")) return "Investments";
    if (pathname.includes("portfolio")) return "Portfolio";
    if (pathname.includes("settings")) return "Settings";

    return "Dashboard";
  };

  const showBack = pathname !== "/dashboard";

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white">

      {/* HEADER */}
      <DashboardHeader title={getTitle()} showBack={showBack} />

      {/* PAGE CONTENT */}
      <div className="px-3 pb-20">
        {children}
      </div>

      {/* CHAT */}
      <ChatWidget />

      {/* 🔥 FIXED NAVBAR */}
      <BottomNav />
    </div>
  );
}