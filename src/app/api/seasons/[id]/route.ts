import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Season from "@/models/Season";
import Mating from "@/models/Mating";
import { requireAuthUser } from "@/lib/get-auth-user";
import mongoose from "mongoose";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuthUser();
    const { id } = await params;
    await connectDB();
    const season = await Season.findOne({
      _id: id,
      userId: new mongoose.Types.ObjectId(user.userId),
    }).lean();
    if (!season) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: season });
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
    const body = await req.json();
    await connectDB();
    const season = await Season.findOneAndUpdate(
      { _id: id, userId: new mongoose.Types.ObjectId(user.userId) },
      { $set: body },
      { new: true }
    ).lean();
    if (!season) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: season });
  } catch (err) {
    if ((err as Error).message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[seasons PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuthUser();
    const { id } = await params;
    await connectDB();
    const uid = new mongoose.Types.ObjectId(user.userId);
    const season = await Season.findOneAndDelete({ _id: id, userId: uid });
    if (!season) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await Mating.deleteMany({ seasonId: season._id, userId: uid });
    return NextResponse.json({ message: "Deleted" });
  } catch (err) {
    if ((err as Error).message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[seasons DELETE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
