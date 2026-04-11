import { connectDB } from "@/lib/mongodb";
import Investment from "@/models/Investment";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";

/* ================= CLEAN TYPE (NO MONGOOSE METHODS) ================= */
type InvestmentResponse = {
  _id: string;
  userId: string;
  amount: number;
  plan: string;
  profit: number;
  status: "active" | "completed";
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
  liveProfit: number;
};

/* ================= CREATE ================= */
export async function POST(req: Request): Promise<NextResponse> {
  await connectDB();

  const token = req.headers.get("authorization")?.split(" ")[1];
  const decoded = verifyToken(token || "");

  if (!decoded) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { amount, plan, profit, durationHours } = await req.json();

  const endDate = new Date(Date.now() + durationHours * 60 * 60 * 1000);

  const investment = await Investment.create({
    userId: decoded.userId,
    amount,
    plan,
    profit,
    endDate,
    status: "active",
  });

  return NextResponse.json({ investment });
}

/* ================= GET ================= */
export async function GET(req: Request): Promise<NextResponse> {
  try {
    await connectDB();

    const token = req.headers.get("authorization")?.split(" ")[1];
    const decoded = verifyToken(token || "");

    if (!decoded?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const investments = await Investment.find({
      userId: decoded.userId,
    });

    const now = Date.now();

    const result: InvestmentResponse[] = [];

    for (const inv of investments) {
      if (!inv.endDate) continue;

      const start = new Date(inv.createdAt).getTime();
      const end = new Date(inv.endDate).getTime();

      const totalProfit = inv.amount * (inv.profit / 100);

      let progress = (now - start) / (end - start);
      progress = Math.max(0, Math.min(1, progress));

      let liveProfit = totalProfit * progress;

      // 🔥 AUTO COMPLETE
      if (progress >= 1 && inv.status === "active") {
        inv.status = "completed";
        await inv.save();

        await User.findByIdAndUpdate(inv.userId, {
          $inc: {
            balance: inv.amount + totalProfit,
          },
        });

        liveProfit = totalProfit;
      }

      result.push({
        _id: String(inv._id),
        userId: inv.userId,
        amount: inv.amount,
        plan: inv.plan,
        profit: inv.profit,
        status: inv.status,
        endDate: inv.endDate,
        createdAt: inv.createdAt,
        updatedAt: inv.updatedAt,
        liveProfit,
      });
    }

    return NextResponse.json({ investments: result });

  } catch (error) {
    console.error("INVEST ERROR:", error);

    return NextResponse.json(
      { error: "Failed" },
      { status: 500 }
    );
  }
}