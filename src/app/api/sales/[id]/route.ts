import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Sale from "@/models/Sale";
import { requireAuthUser } from "@/lib/get-auth-user";
import mongoose from "mongoose";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuthUser();
    const { id } = await params;
    await connectDB();
    const body = await req.json();
    const sale = await Sale.findOneAndUpdate(
      { _id: id, userId: new mongoose.Types.ObjectId(user.userId) },
      { $set: body },
      { new: true }
    ).lean();
    if (!sale) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: sale });
  } catch (err) {
    if ((err as Error).message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[sales PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuthUser();
    const { id } = await params;
    await connectDB();
    const sale = await Sale.findOneAndDelete({
      _id: id,
      userId: new mongoose.Types.ObjectId(user.userId),
    });
    if (!sale) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ message: "Deleted" });
  } catch (err) {
    if ((err as Error).message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[sales DELETE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
