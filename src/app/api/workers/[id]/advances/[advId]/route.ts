import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Worker from "@/models/Worker";
import { requireAuthUser } from "@/lib/get-auth-user";
import mongoose from "mongoose";

type Params = { params: Promise<{ id: string; advId: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuthUser();
    const { id, advId } = await params;
    await connectDB();

    const worker = await Worker.findOneAndUpdate(
      { _id: id, userId: new mongoose.Types.ObjectId(user.userId) },
      { $pull: { advances: { _id: new mongoose.Types.ObjectId(advId) } } },
      { new: true }
    );
    if (!worker) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: worker });
  } catch (err) {
    if ((err as Error).message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[workers advances DELETE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
