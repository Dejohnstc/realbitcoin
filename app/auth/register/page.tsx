"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { countries } from "@/lib/countries";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    country: "",
    password: "",
    confirm: "",
    agree: false,
  });

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (key: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.password) {
      return alert("Fill all fields");
    }

    if (form.password !== form.confirm) {
      return alert("Passwords do not match");
    }

    if (!form.agree) {
      return alert("Accept terms");
    }

    try {
      setLoading(true);

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          country: form.country,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoading(false);
        return alert(data.error || "Registration failed");
      }

      // ✅ GO TO VERIFY PAGE
      router.push(`/auth/verify?email=${form.email}`);

    } catch {
      setLoading(false);
      alert("Something went wrong");
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        <h1 className="text-xl font-bold mb-6">
          <span className="gradient-text">RealBitcoin</span>
        </h1>

        <h2 className="text-3xl font-bold mb-2">Create Account</h2>
        <p className="text-gray-400 mb-6">
          Start your trading journey today
        </p>

        <div className="space-y-4">

          {/* NAME */}
          <div className="relative">
            <span className="absolute left-3 top-3">👤</span>
            <input
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Full Name"
              className="w-full pl-10 py-3 rounded-xl input-glass"
            />
          </div>

          {/* EMAIL */}
          <div className="relative">
            <span className="absolute left-3 top-3">📧</span>
            <input
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="Email"
              className="w-full pl-10 py-3 rounded-xl input-glass"
            />
          </div>

          {/* COUNTRY */}
          <select
            value={form.country}
            onChange={(e) => handleChange("country", e.target.value)}
            className="w-full p-3 rounded-xl input-glass"
          >
            <option value="">Select country</option>
            {countries.map((c) => (
              <option key={c} value={c} className="text-black">
                {c}
              </option>
            ))}
          </select>

          {/* PASSWORD */}
          <div className="relative">
            <span className="absolute left-3 top-3">🔒</span>
            <input
              type={showPass ? "text" : "password"}
              value={form.password}
              onChange={(e) => handleChange("password", e.target.value)}
              placeholder="Password"
              className="w-full pl-10 pr-10 py-3 rounded-xl input-glass"
            />
            <span
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-3 cursor-pointer"
            >
              👁
            </span>
          </div>

          {/* CONFIRM */}
          <div className="relative">
            <span className="absolute left-3 top-3">🔒</span>
            <input
              type={showConfirm ? "text" : "password"}
              value={form.confirm}
              onChange={(e) => handleChange("confirm", e.target.value)}
              placeholder="Confirm Password"
              className="w-full pl-10 pr-10 py-3 rounded-xl input-glass"
            />
            <span
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-3 cursor-pointer"
            >
              👁
            </span>
          </div>

          {/* TERMS */}
          <div className="flex gap-2 text-sm text-gray-400">
            <input
              type="checkbox"
              checked={form.agree}
              onChange={(e) => handleChange("agree", e.target.checked)}
            />
            <span>I agree to Terms & Privacy</span>
          </div>

          {/* BUTTON */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-yellow-400 text-black font-semibold"
          >
            {loading ? "Creating..." : "Create Account"}
          </button>

          {/* LOGIN LINK */}
          <div className="text-center text-sm text-gray-400">
            Already have an account?{" "}
            <span
              onClick={() => router.push("/auth/login")}
              className="text-blue-400 cursor-pointer"
            >
              Sign In
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}