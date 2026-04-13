"use client";

import { useRouter } from "next/navigation";
import { useNotifications } from "@/context/NotificationContext";
import { Bell } from "lucide-react";

export default function NotificationBell() {
  const router = useRouter();
  const { notifications } = useNotifications();

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <button
      onClick={() => router.push("/dashboard/notifications")}
      className="relative w-8 h-8 flex items-center justify-center hover:scale-110 transition"
    >
      <Bell size={20} />

      {unread > 0 && (
        <span className="
          absolute top-2 right-0
          translate-x-1/4 -translate-y-1/4
          bg-red-500 text-[10px]
          min-w-[16px] h-4 px-1
          flex items-center justify-center
          rounded-full font-semibold
          animate-pulse
        ">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </button>
  );
}