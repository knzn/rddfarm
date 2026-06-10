import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Worker from "@/models/Worker";
import { requireAuthUser } from "@/lib/get-auth-user";
import mongoose from "mongoose";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuthUser();
    const { id } = await params;
    await connectDB();
    const body = await req.json();
    // prevent overwriting subdoc arrays via top-level PATCH
    delete body.advances;
    delete body.payments;
    const worker = await Worker.findOneAndUpdate(
      { _id: id, userId: new mongoose.Types.ObjectId(user.userId) },
      { $set: body },
      { new: true }
    ).lean();
    if (!worker) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: worker });
  } catch (err) {
    if ((err as Error).message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[workers PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuthUser();
    const { id } = await params;
    await connectDB();
    const worker = await Worker.findOneAndDelete({
      _id: id,
      userId: new mongoose.Types.ObjectId(user.userId),
    });
    if (!worker) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ message: "Deleted" });
  } catch (err) {
    if ((err as Error).message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[workers DELETE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
