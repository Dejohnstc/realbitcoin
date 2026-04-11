"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    const adminData = localStorage.getItem("admin_data");

    if (!token || !adminData) {
      router.replace("/admin/login");
      return;
    }

    try {
      const admin = JSON.parse(adminData);

      if (admin.role !== "admin") {
        router.replace("/admin/login");
      }
    } catch {
      router.replace("/admin/login");
    }
  }, [router]);

  // 🔥 BLOCK RENDER UNTIL VERIFIED
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("admin_token");
  const adminData = localStorage.getItem("admin_data");

  if (!token || !adminData) return null;

  try {
    const admin = JSON.parse(adminData);

    if (admin.role !== "admin") return null;
  } catch {
    return null;
  }

  return <>{children}</>;
}