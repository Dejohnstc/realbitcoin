import { connectDB } from "@/lib/mongodb";
import Investment from "@/models/Investment";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function POST() {
try {
await connectDB();


const now = new Date();

const investments = await Investment.find({
  status: "active",
  endDate: { $lte: now },
});

let completedCount = 0;

for (const inv of investments) {
  const profitAmount =
    inv.amount * (inv.profit / 100);

  await User.findByIdAndUpdate(
    inv.userId,
    {
      $inc: {
        balance:
          inv.amount + profitAmount,

        // 🔥 unlock investment funds
        lockedBalance: -inv.amount,
      },
    }
  );

  inv.status = "completed";

  await inv.save();

  completedCount++;
}

return NextResponse.json({
  success: true,
  completed: completedCount,
  message:
    "Completed investments processed successfully",
});


} catch (error) {
console.error(
"INVEST COMPLETE ERROR:",
error
);

return NextResponse.json(
  {
    success: false,
    error: "Failed",
  },
  {
    status: 500,
  }
);


}
}
