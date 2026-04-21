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

export const NotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
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

      // 🔥 stop if unauthorized (no loop)
      if (res.status === 401) return;

      const data = await res.json();

      if (!res.ok) return;

      const formatted: Notification[] = (data.notifications || []).map(
        (n: ApiNotification) => ({
          id: n._id,
          message: n.message,
          read: n.read,
          type: n.type,
          createdAt: n.createdAt,
        })
      );

      setNotifications(formatted);
    } catch (err) {
      console.log("Notification fetch failed", err);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    const startPolling = () => {
      const token = getToken();

      // 🔥 if no token → stop everything
      if (!token || token === "undefined") {
        setNotifications([]);
        if (interval) clearInterval(interval);
        return;
      }

      // 🔥 first fetch (deferred)
      setTimeout(() => {
        fetchNotifications();
      }, 0);

      // 🔥 polling
      interval = setInterval(() => {
        const currentToken = getToken();

        if (!currentToken || currentToken === "undefined") {
          if (interval) clearInterval(interval);
          setNotifications([]);
          return;
        }

        fetchNotifications();
      }, 5000);
    };

    startPolling();

    // 🔥 watch token changes (logout/login)
    const watcher = setInterval(() => {
      const token = getToken();

      if (!token || token === "undefined") {
        if (interval) clearInterval(interval);
        setNotifications([]);
      }
    }, 2000);

    return () => {
      if (interval) clearInterval(interval);
      clearInterval(watcher);
    };
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