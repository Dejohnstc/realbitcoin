"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  _id: string;
  email: string;
  multiplier: number;
  durationDays: number;
}

export default function ReturnsControlPage() {
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    const token = localStorage.getItem("admin_token");

    if (!token) {
      router.replace("/admin/login");
      return;
    }

    try {
      const res = await fetch("/api/admin/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setUsers(data.users || []);
      }
    } catch {
      
    }

    setLoading(false);
  };

  useEffect(() => {
    setTimeout(fetchUsers, 0); // ✅ avoid React warning
  }, []);

  const updateUser = async (
    userId: string,
    multiplier: number,
    durationDays: number
  ) => {
    const token = localStorage.getItem("admin_token");

    try {
      await fetch("/api/admin/set-investment-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          multiplier,
          durationDays,
        }),
      });

      alert("Updated successfully");
    } catch {
      alert("Update failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white p-6">

      <h1 className="text-2xl font-bold mb-6">
        Returns Control (Admin)
      </h1>

      {loading ? (
        <p>Loading...</p>
      ) : users.length === 0 ? (
        <p>No users found</p>
      ) : (
        <div className="space-y-4">

          {users.map((user) => {
            let newMultiplier = user.multiplier;
            let newDuration = user.durationDays;

            return (
              <div
                key={user._id}
                className="bg-[#131A2A] p-4 rounded-xl"
              >
                <p className="text-sm text-gray-400">
                  {user.email}
                </p>

                <div className="flex gap-2 mt-2">

                  <input
                    type="number"
                    defaultValue={user.multiplier}
                    onChange={(e) =>
                      (newMultiplier = Number(e.target.value))
                    }
                    className="p-2 rounded bg-[#0B0F19]"
                    placeholder="Multiplier"
                  />

                  <input
                    type="number"
                    defaultValue={user.durationDays}
                    onChange={(e) =>
                      (newDuration = Number(e.target.value))
                    }
                    className="p-2 rounded bg-[#0B0F19]"
                    placeholder="Days"
                  />

                  <button
                    onClick={() =>
                      updateUser(
                        user._id,
                        newMultiplier,
                        newDuration
                      )
                    }
                    className="bg-yellow-400 px-3 rounded text-black font-semibold"
                  >
                    Save
                  </button>

                </div>

                <p className="text-xs text-gray-500 mt-1">
                  Current: {user.multiplier}x in {user.durationDays} days
                </p>
              </div>
            );
          })}

        </div>
      )}

    </div>
  );
}