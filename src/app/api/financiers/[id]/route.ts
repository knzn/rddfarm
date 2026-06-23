import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Financier from "@/models/Financier";
import { requireAuthUser } from "@/lib/get-auth-user";
import mongoose from "mongoose";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuthUser();
    const { id } = await params;
    await connectDB();
    const uid = new mongoose.Types.ObjectId(user.userId);
    await Financier.findOneAndDelete({ _id: id, userId: uid });
    return NextResponse.json({ message: "Deleted" });
  } catch (err) {
    if ((err as Error).message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
