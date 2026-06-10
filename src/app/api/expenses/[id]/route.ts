import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import FarmExpense from "@/models/FarmExpense";
import { requireAuthUser } from "@/lib/get-auth-user";
import mongoose from "mongoose";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuthUser();
    const { id } = await params;
    await connectDB();
    const expense = await FarmExpense.findOne({
      _id: id,
      userId: new mongoose.Types.ObjectId(user.userId),
    }).lean();
    if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: expense });
  } catch (err) {
    if ((err as Error).message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuthUser();
    const { id } = await params;
    await connectDB();

    const expense = await FarmExpense.findOne({
      _id: id,
      userId: new mongoose.Types.ObjectId(user.userId),
    });
    if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (expense.locked) return NextResponse.json({ error: "Record is locked" }, { status: 403 });

    const body = await req.json();
    Object.assign(expense, body);
    await expense.save();
    return NextResponse.json({ data: expense });
  } catch (err) {
    if ((err as Error).message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[expenses PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuthUser();
    const { id } = await params;
    await connectDB();

    const expense = await FarmExpense.findOne({
      _id: id,
      userId: new mongoose.Types.ObjectId(user.userId),
    });
    if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (expense.locked) return NextResponse.json({ error: "Record is locked" }, { status: 403 });

    await expense.deleteOne();
    return NextResponse.json({ message: "Deleted" });
  } catch (err) {
    if ((err as Error).message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[expenses DELETE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
