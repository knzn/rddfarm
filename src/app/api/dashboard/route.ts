import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import FarmExpense from "@/models/FarmExpense";
import Sale from "@/models/Sale";
import Worker from "@/models/Worker";
import Season from "@/models/Season";
import Mating from "@/models/Mating";
import { requireAuthUser } from "@/lib/get-auth-user";
import mongoose from "mongoose";

export async function GET() {
  try {
    const user = await requireAuthUser();
    await connectDB();

    const uid = new mongoose.Types.ObjectId(user.userId);
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Finance — this month
    const [expenses, sales, workers, activeSeason] = await Promise.all([
      FarmExpense.find({ userId: uid, month, year }).lean(),
      Sale.find({ userId: uid, month, year }).lean(),
      Worker.find({ userId: uid }).lean(),
      Season.findOne({ userId: uid, markingsGenerated: true })
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const expensesTotal = expenses.reduce((sum, e) => {
      return sum + (e.type === "unit" ? (e.totalAmount ?? 0) : (e.amount ?? 0));
    }, 0);
    const salesTotal = sales.reduce((sum, s) => sum + s.amount, 0);
    const netIncome = salesTotal - expensesTotal;

    const unpaidWorkers = workers.filter((w) => {
      const hasPaid = w.payments.some((p) => p.month === month && p.year === year);
      return !hasPaid;
    }).length;

    // Breeding — active season
    let breedingData = {
      activeSeason: null as typeof activeSeason,
      totalMatings: 0,
      totalEggsLaid: 0,
      totalChicksHatched: 0,
      hatchRate: null as number | null,
    };

    if (activeSeason) {
      const matings = await Mating.find({ seasonId: activeSeason._id, userId: uid }).lean();
      let totalEggs = 0;
      let totalChicks = 0;

      for (const m of matings) {
        if (m.useIndividualHenCount) {
          totalEggs += m.hens.reduce((s, h) => s + (h.eggsLaid ?? 0), 0);
          totalChicks += m.hens.reduce((s, h) => s + (h.chicksHatched ?? 0), 0);
        } else {
          totalEggs += m.penEggsLaid ?? 0;
          totalChicks += m.penChicksHatched ?? 0;
        }
      }

      breedingData = {
        activeSeason,
        totalMatings: matings.length,
        totalEggsLaid: totalEggs,
        totalChicksHatched: totalChicks,
        hatchRate: totalEggs > 0 ? Math.round((totalChicks / totalEggs) * 100) : null,
      };
    }

    return NextResponse.json({
      data: {
        breeding: breedingData,
        finance: {
          expensesThisMonth: expensesTotal,
          salesThisMonth: salesTotal,
          netIncome,
          unpaidWorkers,
        },
      },
    });
  } catch (err) {
    if ((err as Error).message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[dashboard GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
