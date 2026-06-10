import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import FarmExpense from "@/models/FarmExpense";
import { requireAuthUser } from "@/lib/get-auth-user";
import mongoose from "mongoose";

export async function GET() {
  try {
    const user = await requireAuthUser();
    await connectDB();

    const summary = await FarmExpense.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(user.userId) } },
      {
        $group: {
          _id: { year: "$year", month: "$month" },
          total: {
            $sum: {
              $cond: [
                { $eq: ["$type", "unit"] },
                { $ifNull: ["$totalAmount", 0] },
                { $ifNull: ["$amount", 0] },
              ],
            },
          },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
    ]);

    return NextResponse.json({ data: summary });
  } catch (err) {
    if ((err as Error).message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[expenses/summary GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
