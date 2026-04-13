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
  markOneRead: (id: string) => void;
}

const NotificationContext = createContext<ContextType | null>(null);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const getToken = () =>
    localStorage.getItem("user_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("admin_token");

  const fetchNotifications = async () => {
    const token = getToken();
    if (!token || token === "undefined") return;

    try {
      const res = await fetch("/api/notifications", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      const data = await res.json();

      console.log("🔥 API RESPONSE:", data);

      if (!res.ok) return;

      const formatted: Notification[] = (data.notifications || []).map((n: ApiNotification) => ({
        id: n._id,
        message: n.message,
        read: n.read,
        type: n.type,
        createdAt: n.createdAt,
      }));

      setNotifications([...formatted]); // ✅ ONLY ONE SET

      console.log("✅ SET NOTIFICATIONS:", formatted.length);
    } catch (err) {
      console.log("Notification fetch failed", err);
    }
  };

  useEffect(() => {
    const init = () => {
      setTimeout(fetchNotifications, 0);
    };

    init();

    const interval = setInterval(fetchNotifications, 5000);

    return () => clearInterval(interval);
  }, []);

  const markAllRead = async () => {
    const token = getToken();
    if (!token) return;

    try {
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

  const markOneRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, read: true } : n
      )
    );
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, markAllRead, markOneRead }}
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