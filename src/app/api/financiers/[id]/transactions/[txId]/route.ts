import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Financier from "@/models/Financier";
import { requireAuthUser } from "@/lib/get-auth-user";
import mongoose from "mongoose";

type Params = { params: Promise<{ id: string; txId: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuthUser();
    const { id, txId } = await params;
    await connectDB();
    const uid = new mongoose.Types.ObjectId(user.userId);

    const financier = await Financier.findOne({ _id: id, userId: uid });
    if (!financier) return NextResponse.json({ error: "Not found" }, { status: 404 });

    financier.transactions = financier.transactions.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (t: any) => t._id.toString() !== txId
    ) as never;
    await financier.save();

    return NextResponse.json({ data: financier });
  } catch (err) {
    if ((err as Error).message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
