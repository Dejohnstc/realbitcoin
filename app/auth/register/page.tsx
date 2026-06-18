"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Select from "react-select";
import { countryOptions } from "@/lib/countryOptions";
import type { CountryOption } from "@/lib/countryOptions";

/* ---------- types ---------- */
interface RegisterForm {
  name: string;
  email: string;
  country: string;
  phone: string;
  password: string;
  confirm: string;
  agree: boolean;
}

type FormErrors = Partial<Record<keyof RegisterForm, string>>;

interface RegisterResponse {
  error?: string;
  message?: string;
}

/* ---------- validation helpers ---------- */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getPasswordStrength(pw: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ["Too weak", "Weak", "Fair", "Good", "Strong"];
  const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#16a34a"];
  return { score, label: labels[score], color: colors[score] };
}

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState<RegisterForm>({
    name: "",
    email: "",
    country: "",
    phone: "",
    password: "",
    confirm: "",
    agree: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (key: keyof RegisterForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    // clear that field's error as the user fixes it
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setServerError(null);
  };

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    const name = form.name.trim();
    const email = form.email.trim();
    const phoneDigits = form.phone.replace(/[^\d]/g, "");

    if (!name) e.name = "Full name is required";
    else if (name.length < 2) e.name = "Name is too short";

    if (!email) e.email = "Email is required";
    else if (!EMAIL_RE.test(email)) e.email = "Enter a valid email address";

    if (!form.country) e.country = "Please select your country";

    if (!form.phone.trim()) e.phone = "Phone number is required";
    else if (phoneDigits.length < 7 || phoneDigits.length > 15)
      e.phone = "Enter a valid phone number";

    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 8)
      e.password = "Password must be at least 8 characters";

    if (!form.confirm) e.confirm = "Please confirm your password";
    else if (form.password !== form.confirm)
      e.confirm = "Passwords do not match";

    if (!form.agree) e.agree = "You must accept the Terms & Privacy";

    return e;
  };

  const handleSubmit = async (ev?: React.FormEvent) => {
    ev?.preventDefault();
    setServerError(null);

    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const email = form.email.trim().toLowerCase();
    // keep a leading + if present, strip everything else to digits
    const phone =
      (form.phone.trim().startsWith("+") ? "+" : "") +
      form.phone.replace(/[^\d]/g, "");

    try {
      setLoading(true);
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email,
          country: form.country,
          phone,
          password: form.password,
        }),
      });

      const data: RegisterResponse = await res.json();

      if (!res.ok) {
        setServerError(data.error || "Registration failed. Please try again.");
        return;
      }

      router.push(`/auth/verify?email=${encodeURIComponent(email)}`);
    } catch (err) {
      console.error("Registration error:", err);
      setServerError("Something went wrong. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength(form.password);

  const errorText = (field: keyof RegisterForm) =>
    errors[field] ? (
      <p className="mt-1 text-xs text-red-400" role="alert">
        {errors[field]}
      </p>
    ) : null;

  const inputClass = (field: keyof RegisterForm) =>
    `w-full pl-10 py-3 rounded-xl input-glass ${
      errors[field] ? "ring-1 ring-red-500" : ""
    }`;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* LOGO */}
        <div className="flex items-center gap-3 mb-6">
          <Image
            src="/icon.png"
            alt="CoinlyBitora"
            width={40}
            height={40}
            className="rounded-lg object-cover"
            priority
          />
          <div>
            <h1 className="text-xl font-bold gradient-text">CoinlyBitora</h1>
            <p className="text-sm text-gray-400">TRADING</p>
          </div>
        </div>

        <h2 className="text-3xl font-bold mb-2">Create Account</h2>
        <p className="text-gray-400 mb-6">Start your trading journey today</p>

        {serverError && (
          <div
            className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2"
            role="alert"
          >
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* NAME */}
          <div>
            <label htmlFor="name" className="sr-only">
              Full Name
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3" aria-hidden="true">
                👤
              </span>
              <input
                id="name"
                name="name"
                autoComplete="name"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Full Name"
                aria-invalid={!!errors.name}
                className={inputClass("name")}
              />
            </div>
            {errorText("name")}
          </div>

          {/* EMAIL */}
          <div>
            <label htmlFor="email" className="sr-only">
              Email
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3" aria-hidden="true">
                📧
              </span>
              <input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="Email"
                aria-invalid={!!errors.email}
                className={inputClass("email")}
              />
            </div>
            {errorText("email")}
          </div>

          {/* COUNTRY */}
          <div>
            <Select
              inputId="country"
              options={countryOptions}
              placeholder="Select country"
              onChange={(selected: CountryOption | null) =>
                handleChange("country", selected?.value || "")
              }
              className="text-black"
              styles={{
                control: (base: Record<string, unknown>) => ({
                  ...base,
                  backgroundColor: "#0B0F19",
                  borderRadius: "12px",
                  border: errors.country
                    ? "1px solid #ef4444"
                    : "1px solid transparent",
                  padding: "4px",
                  boxShadow: "none",
                }),
                menu: (base: Record<string, unknown>) => ({
                  ...base,
                  backgroundColor: "#131A2A",
                  color: "white",
                }),
                singleValue: (base: Record<string, unknown>) => ({
                  ...base,
                  color: "white",
                }),
                input: (base: Record<string, unknown>) => ({
                  ...base,
                  color: "white",
                }),
              }}
              formatOptionLabel={(option: CountryOption) => (
                <div className="flex items-center gap-2">
                  <span>{option.flag}</span>
                  <span>{option.label}</span>
                </div>
              )}
            />
            {errorText("country")}
          </div>

          {/* PHONE */}
          <div>
            <label htmlFor="phone" className="sr-only">
              Phone Number
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3" aria-hidden="true">
                📱
              </span>
              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="Phone Number (e.g. +234...)"
                aria-invalid={!!errors.phone}
                className={inputClass("phone")}
              />
            </div>
            {errorText("phone")}
          </div>

          {/* PASSWORD */}
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3" aria-hidden="true">
                🔒
              </span>
              <input
                id="password"
                name="password"
                type={showPass ? "text" : "password"}
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder="Password"
                aria-invalid={!!errors.password}
                className={`w-full pl-10 pr-10 py-3 rounded-xl input-glass ${
                  errors.password ? "ring-1 ring-red-500" : ""
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                className="absolute right-3 top-3 cursor-pointer bg-transparent border-0 p-0"
                aria-label={showPass ? "Hide password" : "Show password"}
              >
                👁
              </button>
            </div>

            {form.password && (
              <div className="mt-2">
                <div className="h-1 w-full bg-gray-700 rounded">
                  <div
                    className="h-1 rounded transition-all"
                    style={{
                      width: `${(strength.score / 4) * 100}%`,
                      backgroundColor: strength.color,
                    }}
                  />
                </div>
                <p className="mt-1 text-xs" style={{ color: strength.color }}>
                  {strength.label}
                </p>
              </div>
            )}
            {errorText("password")}
          </div>

          {/* CONFIRM */}
          <div>
            <label htmlFor="confirm" className="sr-only">
              Confirm Password
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3" aria-hidden="true">
                🔒
              </span>
              <input
                id="confirm"
                name="confirm"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                value={form.confirm}
                onChange={(e) => handleChange("confirm", e.target.value)}
                placeholder="Confirm Password"
                aria-invalid={!!errors.confirm}
                className={`w-full pl-10 pr-10 py-3 rounded-xl input-glass ${
                  errors.confirm ? "ring-1 ring-red-500" : ""
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((s) => !s)}
                className="absolute right-3 top-3 cursor-pointer bg-transparent border-0 p-0"
                aria-label={
                  showConfirm ? "Hide confirm password" : "Show confirm password"
                }
              >
                👁
              </button>
            </div>
            {errorText("confirm")}
          </div>

          {/* TERMS */}
          <div>
            <label className="flex gap-2 text-sm text-gray-400 items-start cursor-pointer">
              <input
                type="checkbox"
                checked={form.agree}
                onChange={(e) => handleChange("agree", e.target.checked)}
                className="mt-0.5"
              />
              <span>I agree to Terms &amp; Privacy</span>
            </label>
            {errorText("agree")}
          </div>

          {/* BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-yellow-400 text-black font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Create Account"}
          </button>

          {/* LOGIN */}
          <div className="text-center text-sm text-gray-400">
            Already have an account?{" "}
            <span
              onClick={() => router.push("/auth/login")}
              className="text-blue-400 cursor-pointer"
            >
              Sign In
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
