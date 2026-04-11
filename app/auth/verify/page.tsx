"use client";

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

function VerifyContent() {
  const params = useSearchParams();
  const router = useRouter();

  const email = params.get("email") || "";

  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [redirectTime, setRedirectTime] = useState<number>(5);

  // 🔔 TOAST STATE
  const [toast, setToast] = useState<string>("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  // ⏱ RESEND TIMER
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // ⏳ REDIRECT AFTER SUCCESS
  useEffect(() => {
    if (!success) return;

    const timer = setInterval(() => {
      setRedirectTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/auth/login");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [success]);

  const handleVerify = async (code: string) => {
    if (code.length < 6) return;

    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        body: JSON.stringify({ email, otp: code }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || "Invalid OTP");
      } else {
        setSuccess(true);
        showToast("Account verified successfully 🎉");
      }
    } catch {
      showToast("Network error");
    }

    setLoading(false);
  };

  const handleChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }

    const code = newOtp.join("");
    if (code.length === 6 && !newOtp.includes("")) {
      handleVerify(code);
    }
  };

  const handleBackspace = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const paste = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(paste)) return;

    const newOtp = paste.split("");
    while (newOtp.length < 6) newOtp.push("");

    setOtp(newOtp);
    handleVerify(newOtp.join(""));
  };

  // 🔥 FIXED RESEND
  const handleResend = async () => {
    if (timeLeft > 0) return;

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password: "temp123",
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setTimeLeft(60);
        showToast("New OTP sent successfully");
      } else {
        showToast(data.error || "Failed to resend");
      }
    } catch {
      showToast("Failed to resend OTP");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0F19] px-4 text-white">

      {/* 🔔 TOAST */}
      {toast && (
        <div className="fixed top-6 right-6 bg-[#131A2A] border border-gray-700 px-4 py-2 rounded-lg shadow-lg text-sm">
          {toast}
        </div>
      )}

      <div className="bg-[#131A2A] p-6 rounded-xl w-full max-w-md border border-gray-800">

        {success ? (
          <div className="text-center animate-fade-in">

            <div className="text-5xl mb-4 animate-bounce">🎉</div>

            <h2 className="text-2xl font-bold mb-2">
              Account Verified
            </h2>

            <p className="text-gray-400 mb-4">
              Redirecting in {redirectTime}s...
            </p>

            <button
              onClick={() => router.push("/auth/login")}
              className="w-full bg-yellow-400 text-black py-3 rounded-lg font-semibold"
            >
              Go to Login
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-4 text-center">
              Enter Verification Code
            </h2>

            <p className="text-gray-400 text-center mb-6 text-sm">
              Code sent to <span className="text-white">{email}</span>
            </p>

            <div onPaste={handlePaste} className="flex justify-between gap-2 mb-6">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputs.current[i] = el;
                  }}
                  value={digit}
                  onChange={(e) => handleChange(e.target.value, i)}
                  onKeyDown={(e) => handleBackspace(e, i)}
                  maxLength={1}
                  className="w-12 h-12 text-center text-lg rounded-lg bg-[#0B0F19] border border-gray-700 focus:border-yellow-400 outline-none"
                />
              ))}
            </div>

            <button
              onClick={() => handleVerify(otp.join(""))}
              disabled={loading}
              className="w-full bg-yellow-400 text-black py-3 rounded-lg font-semibold"
            >
              {loading ? "Verifying..." : "Verify"}
            </button>

            <div className="text-center mt-4 text-sm text-gray-400">
              {timeLeft > 0 ? (
                <span>Resend available in {timeLeft}s</span>
              ) : (
                <button
                  onClick={handleResend}
                  className="text-yellow-400 font-medium"
                >
                  Resend Code
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyContent />
    </Suspense>
  );
}