"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import ChatWidget from "./ChatWidget";

export default function ChatWrapper() {
  const [allowed, setAllowed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const check = () => {
      const token =
        localStorage.getItem("user_token") ||
        localStorage.getItem("token");

      const userRaw = localStorage.getItem("user");

      if (!token || !userRaw) {
        setAllowed(false);
        return;
      }

      try {
        const user = JSON.parse(userRaw);

        // 🔥 ONLY ALLOW NORMAL USERS
        if (user.role !== "user") {
          setAllowed(false);
          return;
        }

        // 🔥 BLOCK ADMIN PAGES
        if (pathname.startsWith("/admin")) {
          setAllowed(false);
          return;
        }

        setAllowed(true);
      } catch {
        setAllowed(false);
      }
    };

    check();

    const interval = setInterval(check, 2000);

    return () => clearInterval(interval);
  }, [pathname]);

  if (!allowed) return null;

  return <ChatWidget />;
}