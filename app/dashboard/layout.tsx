"use client";

import { usePathname } from "next/navigation";
import DashboardHeader from "@/components/DashboardHeader";
import ChatWidget from "@/components/ChatWidget";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // ✅ DETECT PAGE TITLE
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

  // ✅ SHOW BACK BUTTON ON ALL EXCEPT MAIN DASHBOARD
  const showBack = pathname !== "/dashboard";

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white px-2 pb-12">

      {/* 🔥 AUTO HEADER */}
      <DashboardHeader title={getTitle()} showBack={showBack} />
      <ChatWidget/>

      {/* PAGE CONTENT */}
      {children}
    </div>
  );
}