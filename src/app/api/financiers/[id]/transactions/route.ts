import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Financier from "@/models/Financier";
import { requireAuthUser } from "@/lib/get-auth-user";
import mongoose from "mongoose";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuthUser();
    const { id } = await params;
    const body = await req.json();
    await connectDB();
    const uid = new mongoose.Types.ObjectId(user.userId);

    const financier = await Financier.findOne({ _id: id, userId: uid });
    if (!financier) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isPayment = body.type === "payment";
    const amount = isPayment
      ? Number(body.volume) * Number(body.priceEach)
      : Number(body.amount);

    const tx = {
      type: body.type,
      date: new Date(body.date),
      amount,
      chickenType: isPayment ? body.chickenType : null,
      volume: isPayment ? Number(body.volume) : null,
      priceEach: isPayment ? Number(body.priceEach) : null,
      notes: body.notes ?? null,
    };

    financier.transactions.unshift(tx as never);
    await financier.save();

    return NextResponse.json({ data: financier }, { status: 201 });
  } catch (err) {
    if ((err as Error).message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[financier tx POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
