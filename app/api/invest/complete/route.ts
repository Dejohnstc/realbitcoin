import { connectDB } from "@/lib/mongodb";
import Investment from "@/models/Investment";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function POST(): Promise<NextResponse> {
  await connectDB();

  const now = new Date();

  const investments = await Investment.find({
    status: "active",
    endDate: { $lte: now },
  });

  for (const inv of investments) {
    const profitAmount = inv.amount * (inv.profit / 100);

    await User.findByIdAndUpdate(inv.userId, {
      $inc: { balance: inv.amount + profitAmount },
    });

    inv.status = "completed";
    await inv.save();
  }

  return NextResponse.json({ message: "Processed" });
}