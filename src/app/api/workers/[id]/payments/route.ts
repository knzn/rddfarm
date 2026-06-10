import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Worker from "@/models/Worker";
import { requireAuthUser } from "@/lib/get-auth-user";
import mongoose from "mongoose";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuthUser();
    const { id } = await params;
    const body = await req.json();
    await connectDB();

    const worker = await Worker.findOne({
      _id: id,
      userId: new mongoose.Types.ObjectId(user.userId),
    });
    if (!worker) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { month, year } = body;
    const totalAdvances = worker.advances
      .filter((a) => a.month === month && a.year === year)
      .reduce((sum, a) => sum + a.amount, 0);

    const grossSalary = worker.monthlySalary;
    const netPay = grossSalary - totalAdvances;

    worker.payments.push({
      ...body,
      grossSalary,
      totalAdvances,
      netPay,
      paidAt: new Date(),
    } as never);
    await worker.save();
    return NextResponse.json({ data: worker }, { status: 201 });
  } catch (err) {
    if ((err as Error).message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[workers payments POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
