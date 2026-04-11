"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false); // ✅ added

  const router = useRouter();

  const handleLogin = async () => {
    if (loading) return; // ✅ prevent spam clicks

    try {
      setLoading(true);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Login failed");
        return;
      }

      // ✅ STRICT CHECK BEFORE SAVING
      if (!data.user || data.user.role !== "admin") {
        alert("Not an admin account");
        return;
      }

      // ✅ SAVE ADMIN DATA (ONLY AFTER VALIDATION)
      localStorage.setItem("admin_token", data.token);
      localStorage.setItem("admin_data", JSON.stringify(data.user));

      // 🔥 REDIRECT
      router.replace("/admin/dashboard");

    } catch {
      alert("Login failed");
    } finally {
      setLoading(false); // ✅ reset loading
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0F19] text-white">
      <div className="bg-[#131A2A] p-6 rounded-xl w-80 space-y-4">
        <h1 className="text-xl font-bold text-center">
          Admin Login
        </h1>

        <input
          placeholder="Email"
          className="w-full p-2 rounded bg-[#0B0F19]"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          placeholder="Password"
          type="password"
          className="w-full p-2 rounded bg-[#0B0F19]"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-yellow-400 text-black p-2 rounded disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </div>
    </div>
  );
}