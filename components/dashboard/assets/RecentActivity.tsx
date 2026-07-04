"use client";

interface Activity {
  type: string;
  title: string;
  amount: number;
  date: string;
}

export default function RecentActivity({
  items,
}: {
  items: Activity[];
}) {
  return (
    <div className="bg-[#131A2A] rounded-2xl p-5 mt-8">

      <h2 className="text-xl font-bold mb-5">
        Recent Activity
      </h2>

      {items.length === 0 && (
        <p className="text-gray-500">
          No recent activity.
        </p>
      )}

      <div className="space-y-4">

        {items.map((item, index) => (

          <div
            key={index}
            className="flex justify-between border-b border-gray-800 pb-3"
          >

            <div>

              <p className="font-medium">
                {item.title}
              </p>

              <p className="text-xs text-gray-500">
                {item.type}
              </p>

            </div>

            <div className="text-right">

              <p className="font-semibold">
                ${item.amount.toLocaleString()}
              </p>

              <p className="text-xs text-gray-500">
                {new Date(item.date).toLocaleDateString()}
              </p>

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}