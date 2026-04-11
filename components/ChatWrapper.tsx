"use client";

import { useSyncExternalStore } from "react";
import ChatWidget from "./ChatWidget";

// ✅ subscribe (no-op)
function subscribe() {
  return () => {};
}

// ✅ get snapshot (client only)
function getSnapshot() {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("user_token");
}

// ✅ server snapshot (always false)
function getServerSnapshot() {
  return false;
}

export default function ChatWrapper() {
  const hasToken = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  if (!hasToken) return null;

  return <ChatWidget />;
}