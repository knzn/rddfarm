import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import FarmExpense from "@/models/FarmExpense";
import { requireAuthUser } from "@/lib/get-auth-user";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuthUser();
    await connectDB();
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    const filter: Record<string, unknown> = {
      userId: new mongoose.Types.ObjectId(user.userId),
    };
    if (month) filter.month = parseInt(month);
    if (year) filter.year = parseInt(year);

    const raw = await FarmExpense.find(filter).sort({ date: -1 }).lean();
    // normalize: always expose effective amount regardless of type
    const expenses = raw.map((e) => ({
      ...e,
      effectiveAmount: e.type === "unit" ? (e.totalAmount ?? 0) : (e.amount ?? 0),
    }));
    return NextResponse.json({ data: expenses });
  } catch (err) {
    if ((err as Error).message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[expenses GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuthUser();
    const body = await req.json();
    await connectDB();

    const expense = await FarmExpense.create({
      ...body,
      userId: new mongoose.Types.ObjectId(user.userId),
    });
    return NextResponse.json({ data: expense }, { status: 201 });
  } catch (err) {
    if ((err as Error).message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[expenses POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
