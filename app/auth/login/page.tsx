"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const handleLogin = async () => {
    setError("");

    if (!form.email || !form.password) {
      setError("Enter email & password");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      // ✅ 🔥 FIX: USE USER-SPECIFIC STORAGE
      localStorage.setItem("user_token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setToast("Login successful 🚀");

      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);

    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white flex">

      {/* 🔥 TOAST */}
      {toast && (
        <div className="fixed top-5 right-5 bg-green-500 text-black px-4 py-2 rounded-lg shadow-lg z-50">
          {toast}
        </div>
      )}

      {/* LEFT */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md">

          <h1 className="text-xl font-bold mb-6 text-blue-400">
            RealBitcoin <span className="text-sm text-gray-400">TRADING</span>
          </h1>

          <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
          <p className="text-gray-400 mb-6">
            Sign in to access your trading dashboard
          </p>

          {/* EMAIL */}
          <div className="mb-4">
            <label className="text-sm text-gray-300">Email Address</label>
            <div className={`relative mt-1 ${error ? "shake" : ""}`}>
              <span className="absolute left-3 top-3">📧</span>
              <input
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                placeholder="Enter your email"
                className="w-full pl-10 py-3 rounded-xl bg-[#131A2A] border border-gray-700"
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div className="mb-4">
            <label className="text-sm text-gray-300">Password</label>
            <div className={`relative mt-1 ${error ? "shake" : ""}`}>
              <span className="absolute left-3 top-3">🔒</span>
              <input
                type={showPass ? "text" : "password"}
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                placeholder="Enter your password"
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#131A2A] border border-blue-500"
              />
              <span
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-3 cursor-pointer"
              >
                👁
              </span>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm mb-3">{error}</p>
          )}

          <div className="flex justify-between items-center mb-6 text-sm">
            <label className="flex items-center gap-2 text-gray-400">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Remember me
            </label>

            <span className="text-blue-400 cursor-pointer">
              Forgot Password?
            </span>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            )}
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <div className="text-center mt-6 text-gray-400">
            Don’t have an account?{" "}
            <span
              onClick={() => router.push("/auth/register")}
              className="text-blue-400 cursor-pointer"
            >
              Register Now
            </span>
          </div>
        </div>
      </div>

      <div className="hidden md:flex flex-1 items-center justify-center bg-gradient-to-br from-[#0B0F19] to-[#1A2235]">
        <div className="text-center max-w-md px-6">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-3xl">
            📊
          </div>

          <h2 className="text-3xl font-bold mb-4">
            Trade with <span className="text-blue-400">Confidence</span>
          </h2>

          <p className="text-gray-400">
            Access real-time markets, advanced analytics, and AI-powered trading tools all in one platform.
          </p>
        </div>
      </div>
    </div>
  );
}