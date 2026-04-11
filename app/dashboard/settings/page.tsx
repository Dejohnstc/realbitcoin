"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User as UserIcon, Bell, Shield, Camera } from "lucide-react";
import { ReactNode } from "react";

type Tab = "profile" | "alerts" | "security";

interface Notifications {
  email: boolean;
  trade: boolean;
  deposit: boolean;
  withdrawal: boolean;
  market: boolean;
  promo: boolean;
}

interface User {
  email: string;
  name?: string;
  country?: string;
  profileImage?: string;
  notifications?: Notifications;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [user, setUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [twoFA, setTwoFA] = useState(false);

  const router = useRouter();

  // 🔥 TOAST
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  // ================= LOAD USER =================
  useEffect(() => {
    let ignore = false;

    (async () => {
      const token = localStorage.getItem("user_token");

    try {
  const res = await fetch("/api/user", {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!ignore) setUser(data);
} catch {
  console.log("User load failed");
}
    })();

    return () => {
      ignore = true;
    };
  }, []);

  // ================= IMAGE =================
const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  if (file.size > 2 * 1024 * 1024) {
    alert("Image too large");
    return;
  }

  const reader = new FileReader();

  reader.onloadend = async () => {
    const base64 = reader.result;

    if (!base64 || typeof base64 !== "string") return;

    try {
      // 🔥 1. Upload to Cloudinary
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: base64 }),
      });

      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) {
        return alert(uploadData.error || "Upload failed");
      }

      // 🔥 2. SAVE TO DATABASE
      const token = localStorage.getItem("user_token");

      const saveRes = await fetch("/api/user/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          profileImage: uploadData.url,
        }),
      });

      const saveData = await saveRes.json();

      if (!saveRes.ok) {
        return alert(saveData.error || "Save failed");
      }

      // 🔥 3. UPDATE UI
      setUser((prev) =>
        prev
          ? { ...prev, profileImage: uploadData.url }
          : prev
      );

    } catch (err) {
      console.log("UPLOAD ERROR:", err);
    }
  };

  reader.readAsDataURL(file);
};

  // ================= PROFILE =================
  const saveProfile = async () => {
    if (!user) return;

    setLoading(true);

    const token = localStorage.getItem("user_token");

    await fetch("/api/user/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(user),
    });

    setLoading(false);
    showToast("Profile updated");
  };

  // ================= ALERTS =================
  const saveAlerts = async () => {
    setLoading(true);

    const token = localStorage.getItem("user_token");

    await fetch("/api/user/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(user?.notifications),
    });

    setLoading(false);
    showToast("Preferences saved");
  };

  // ================= PASSWORD =================
  const changePassword = async () => {
    if (password !== confirmPassword) {
      return showToast("Passwords do not match");
    }

    setLoading(true);

    const token = localStorage.getItem("user_token");

    await fetch("/api/user/change-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ password }),
    });

    setLoading(false);
    showToast("Password updated");
  };

  // ================= LOGOUT =================
  const logout = () => {
    localStorage.removeItem("user_token");
    router.push("/auth/login");
  };

  const logoutAll = async () => {
    setLoading(true);

    const token = localStorage.getItem("user_token");

    try {
      await fetch("/api/user/logout-all", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}

    localStorage.removeItem("token");
    router.push("/auth/login");
  };

  if (!user) return <div className="text-white p-6">Loading...</div>;

  const notifications =
    user.notifications ?? {
      email: true,
      trade: true,
      deposit: true,
      withdrawal: true,
      market: false,
      promo: false,
    };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white p-6">

      {/* 🔔 TOAST */}
      {toast && (
        <div className="fixed top-6 right-6 bg-black px-4 py-2 rounded shadow z-50">
          {toast}
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => router.back()} className="text-gray-400">
          ← Back
        </button>

        <h1 className="font-bold text-lg">Settings</h1>

        <button onClick={logout} className="text-red-400 text-sm">
          Logout
        </button>
      </div>

      {/* TABS */}
      <div className="flex bg-[#131A2A] p-1 rounded-xl mb-6">
        <TabBtn icon={<UserIcon size={16} />} active={activeTab==="profile"} onClick={()=>setActiveTab("profile")} label="Profile"/>
        <TabBtn icon={<Bell size={16} />} active={activeTab==="alerts"} onClick={()=>setActiveTab("alerts")} label="Alerts"/>
        <TabBtn icon={<Shield size={16} />} active={activeTab==="security"} onClick={()=>setActiveTab("security")} label="Security"/>
      </div>

      {/* PROFILE */}
      {activeTab === "profile" && (
        <div className="bg-[#131A2A] p-6 rounded-2xl">

          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <img
                src={user.profileImage || "https://ui-avatars.com/api/?name=User"}
                className="w-20 h-20 rounded-full"
              />
              <label className="absolute bottom-0 right-0 bg-blue-500 p-2 rounded-full cursor-pointer">
                <Camera size={14}/>
                <input type="file" hidden onChange={handleImage}/>
              </label>
            </div>

            <div>
              <p className="font-semibold">{user.name || "No Name"}</p>
              <p className="text-gray-400 text-sm">{user.email}</p>
            </div>
          </div>

          <Input
  label="Full Name"
  value={user.name || ""}
  onChange={(v) =>
    setUser((prev) =>
      prev ? { ...prev, name: v } : prev
    )
  }
/>

<Input
  label="Country"
  value={user.country || ""}
  onChange={(v) =>
    setUser((prev) =>
      prev ? { ...prev, country: v } : prev
    )
  }
/>

          <button
            disabled={loading}
            onClick={saveProfile}
            className="w-full mt-4 py-3 bg-yellow-400 text-black rounded-xl"
          >
            {loading ? "Saving..." : "Save Profile"}
          </button>
        </div>
      )}

      {/* ALERTS */}
      {activeTab === "alerts" && (
        <div className="bg-[#131A2A] p-6 rounded-2xl">

         {Object.entries(notifications).map(([key, value]) => (
  <Toggle
    key={key}
    label={key}
    checked={value}
    onChange={() =>
      setUser((prev) =>
        prev
          ? {
              ...prev,
              notifications: {
                ...notifications,
                [key]: !value,
              },
            }
          : prev
      )
    }
  />
))}

          <button
            disabled={loading}
            onClick={saveAlerts}
            className="w-full mt-4 py-3 bg-yellow-400 text-black rounded-xl"
          >
            {loading ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      )}

      {/* SECURITY */}
      {activeTab === "security" && (
        <div className="space-y-6">

          <div className="bg-[#131A2A] p-6 rounded-xl">
            <input type="password" placeholder="New Password"
              onChange={(e)=>setPassword(e.target.value)}
              className="w-full p-3 mb-3 bg-[#0B0F19] rounded-xl"/>

            <input type="password" placeholder="Confirm Password"
              onChange={(e)=>setConfirmPassword(e.target.value)}
              className="w-full p-3 mb-3 bg-[#0B0F19] rounded-xl"/>

            <button
              disabled={loading}
              onClick={changePassword}
              className="w-full py-3 bg-yellow-400 text-black rounded-xl"
            >
              {loading ? "Updating..." : "Change Password"}
            </button>
          </div>

          <div className="bg-[#131A2A] p-6 rounded-xl flex justify-between items-center">
            <span>Two-Factor Authentication</span>
            <input type="checkbox" checked={twoFA} onChange={()=>setTwoFA(!twoFA)}/>
          </div>

          <button
            onClick={logoutAll}
            className="w-full py-3 bg-red-500 rounded-xl"
          >
            Log Out All Devices
          </button>

        </div>
      )}

    </div>
  );
}

/* COMPONENTS */

function TabBtn({icon,label,active,onClick}:{icon:ReactNode,label:string,active:boolean,onClick:()=>void}) {
  return (
    <button onClick={onClick}
      className={`flex-1 py-2 ${active ? "bg-black rounded-xl" : ""}`}>
      {icon} {label}
    </button>
  );
}

function Input({label,value,onChange}:{label:string,value:string,onChange:(v:string)=>void}) {
  return (
    <div className="mb-3">
      <p className="text-sm text-gray-400">{label}</p>
      <input value={value} onChange={(e)=>onChange(e.target.value)}
        className="w-full p-3 bg-[#0B0F19] rounded-xl"/>
    </div>
  );
}

function Toggle({label,checked,onChange}:{label:string,checked:boolean,onChange:()=>void}) {
  return (
    <div className="flex justify-between py-3 border-b border-gray-700">
      <span className="capitalize">{label}</span>
      <input type="checkbox" checked={checked} onChange={onChange}/>
    </div>
  );
}