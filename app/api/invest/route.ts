import { connectDB } from "@/lib/mongodb";
import Investment from "@/models/Investment";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";
import { sendInvestmentStartedEmail } from "@/lib/mail";
import { NextResponse } from "next/server";

type InvestmentResponse = {
  _id: string;
  userId: string;
  amount: number;
  plan: string;
  profit: number;
  status: "active" | "completed";
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
  liveProfit: number;
  progress: number;
};

const PLANS = {
  "Starter Plan": {
    profit: 230,
    durationMonths: 1,
    min: 200,
    max: 1999,
  },
  "Silver Plan": {
    profit: 248,
    durationMonths: 1,
    min:2000,
    max: 9999,
  },
  "Gold Plan": {
    profit: 255,
    durationMonths: 1,
    min: 10000,
    max: 99999,
  },
  "VIP Plan": {
    profit: 280,
    durationMonths: 1,
    min: 100000,
    max: 1000000,
  },
} as const;

/* ================= CREATE ================= */
export async function POST(req: Request) {
  try {
    await connectDB();

    const token = req.headers.get("authorization")?.split(" ")[1];
    const decoded = verifyToken(token || "");

    if (!decoded?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const amount = Number(body.amount);
    const plan = String(body.plan);

    const config = PLANS[plan as keyof typeof PLANS];

    if (!config) {
      return NextResponse.json(
        { error: "Invalid plan" },
        { status: 400 }
      );
    }

    if (amount < config.min || amount > config.max) {
      return NextResponse.json(
        { error: "Amount not allowed for selected plan" },
        { status: 400 }
      );
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (user.balance < amount) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + config.durationMonths);

    // Deduct from balance
    user.balance -= amount;
    user.lockedBalance = (user.lockedBalance || 0) + amount;
    await user.save();

    // ✅ Use startDate instead of createdAt
  // ✅ Create investment
const investment = await Investment.create({
  userId: String(decoded.userId),
  amount,
  plan,
  profit: config.profit,
  startDate,
  endDate,
  status: "active",
});

// ===================================
// SEND INVESTMENT EMAIL
// ===================================

if (user.email) {
  try {
    
    await sendInvestmentStartedEmail(
      user.email,
      amount,
      plan,
      config.profit,
      endDate
    );
  } catch (error) {
    console.error(
      "Investment email failed:",
      error
    );
  }
}

return NextResponse.json({
  investment,
});
  } catch (error) {
    console.error("CREATE INVESTMENT ERROR:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}

/* ================= GET ================= */
export async function GET(req: Request) {
  try {
    await connectDB();

    const token = req.headers.get("authorization")?.split(" ")[1];
    const decoded = verifyToken(token || "");

    if (!decoded?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const investments = await Investment.find({
      userId: decoded.userId,
    }).sort({ createdAt: -1 });

    const now = Date.now();
    const result: InvestmentResponse[] = [];

    for (const inv of investments) {
      // ✅ Use startDate and endDate
      const start = inv.startDate ? new Date(inv.startDate).getTime() : now;
      const end = inv.endDate ? new Date(inv.endDate).getTime() : now + 86400000;

      const totalProfit = inv.amount * (inv.profit / 100);
      let progress = 0;

      // ✅ Calculate progress based on time elapsed
      if (end > start) {
        progress = Math.max(0, Math.min(1, (now - start) / (end - start)));
      }

      const liveProfit = totalProfit * progress;

      // ✅ If investment is completed, ensure full profit is shown
      const finalLiveProfit = inv.status === "completed" ? totalProfit : liveProfit;

      result.push({
        _id: String(inv._id),
        userId: String(inv.userId),
        amount: inv.amount,
        plan: inv.plan,
        profit: inv.profit,
        status: inv.status,
        startDate: inv.startDate || new Date(),
        endDate: inv.endDate || new Date(),
        createdAt: inv.createdAt || new Date(),
        updatedAt: inv.updatedAt || new Date(),
        liveProfit: isNaN(finalLiveProfit) ? 0 : finalLiveProfit,
        progress: isNaN(progress) ? 0 : progress,
      });
    }

    return NextResponse.json({
      investments: result,
    });
  } catch (error) {
    console.error("INVEST ERROR:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}