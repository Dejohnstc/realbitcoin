"use client";

import { useEffect, useState } from "react";
import ChatWidget from "./ChatWidget";

export default function ChatWrapper() {
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem("user_token");
      setHasToken(!!token);
    };

    // 🔥 initial check
    checkToken();

    // 🔥 listen for login/logout changes
    window.addEventListener("storage", checkToken);

    // 🔥 fallback polling (important for same-tab updates)
    const interval = setInterval(checkToken, 2000);

    return () => {
      window.removeEventListener("storage", checkToken);
      clearInterval(interval);
    };
  }, []);

  // 🔥 ONLY SHOW FOR LOGGED-IN USERS
  if (!hasToken) return null;

  return <ChatWidget />;
}