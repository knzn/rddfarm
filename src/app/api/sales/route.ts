import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Sale from "@/models/Sale";
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

    const sales = await Sale.find(filter).sort({ date: -1 }).lean();
    return NextResponse.json({ data: sales });
  } catch (err) {
    if ((err as Error).message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[sales GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuthUser();
    const body = await req.json();
    await connectDB();
    const sale = await Sale.create({
      ...body,
      userId: new mongoose.Types.ObjectId(user.userId),
    });
    return NextResponse.json({ data: sale }, { status: 201 });
  } catch (err) {
    if ((err as Error).message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[sales POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
