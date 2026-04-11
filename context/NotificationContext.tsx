"use client";

import { createContext, useContext, useEffect, useState } from "react";

type NotificationType = "deposit" | "withdraw" | "system";

interface Notification {
  id: string;
  message: string;
  read: boolean;
  type: NotificationType;
  createdAt: string;
}

interface ApiNotification {
  _id: string;
  message: string;
  read: boolean;
  type: NotificationType;
  createdAt: string;
}

interface ContextType {
  notifications: Notification[];
  markAllRead: () => void;
  markOneRead: (id: string) => void; // ✅ ADD THIS
}

const NotificationContext = createContext<ContextType | null>(null);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch("/api/notifications", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      const data: { notifications?: ApiNotification[] } = await res.json();

      if (res.ok) {
        const formatted: Notification[] = (data.notifications || []).map((n) => ({
          id: n._id,
          message: n.message,
          read: n.read,
          type: n.type,
          createdAt: n.createdAt,
        }));

        setNotifications(formatted);
      }
    } catch {
      console.log("Notification fetch failed");
    }
  };

  useEffect(() => {
    const load = async () => {
      await fetchNotifications();
    };

    const timeout = setTimeout(load, 100);

    const interval = setInterval(() => {
      fetchNotifications();
    }, 5000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  // ✅ MARK ALL
  const markAllRead = async () => {
    try {
      const token = localStorage.getItem("token");

      await fetch("/api/notifications/read", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true }))
      );
    } catch {
      console.log("Mark read failed");
    }
  };

  // ✅ MARK ONE (🔥 THIS IS WHAT YOU WERE MISSING)
  const markOneRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, read: true } : n
      )
    );
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, markAllRead, markOneRead }} // ✅ INCLUDE IT
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("NotificationProvider missing");
  return ctx;
};