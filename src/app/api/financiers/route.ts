import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Financier from "@/models/Financier";
import { requireAuthUser } from "@/lib/get-auth-user";
import mongoose from "mongoose";

export async function GET() {
  try {
    const user = await requireAuthUser();
    await connectDB();
    const uid = new mongoose.Types.ObjectId(user.userId);
    const financiers = await Financier.find({ userId: uid }).sort({ createdAt: 1 }).lean();
    return NextResponse.json({ data: financiers });
  } catch (err) {
    if ((err as Error).message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuthUser();
    const body = await req.json();
    await connectDB();
    const uid = new mongoose.Types.ObjectId(user.userId);
    const financier = await Financier.create({ userId: uid, name: body.name, transactions: [] });
    return NextResponse.json({ data: financier }, { status: 201 });
  } catch (err) {
    if ((err as Error).message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
