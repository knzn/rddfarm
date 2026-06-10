import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Mating from "@/models/Mating";
import Season from "@/models/Season";
import { requireAuthUser } from "@/lib/get-auth-user";
import mongoose from "mongoose";

type Params = { params: Promise<{ id: string; matingId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuthUser();
    const { id, matingId } = await params;
    const body = await req.json();
    await connectDB();
    const uid = new mongoose.Types.ObjectId(user.userId);

    const mating = await Mating.findOne({
      _id: matingId,
      seasonId: new mongoose.Types.ObjectId(id),
      userId: uid,
    });
    if (!mating) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // lifecycle validations
    if (body.penChicksHatched != null && body.penEggsLaid != null) {
      if (body.penChicksHatched > body.penEggsLaid)
        return NextResponse.json({ error: "Chicks hatched cannot exceed eggs laid" }, { status: 400 });
    }
    if (body.penMaleCount != null && body.penFemaleCount != null && body.penChicksHatched != null) {
      if (body.penMaleCount + body.penFemaleCount > body.penChicksHatched)
        return NextResponse.json({ error: "Male + female count exceeds chicks hatched" }, { status: 400 });
    }

    // auto-set expectedHatchDate on season when first eggs recorded
    if (
      body.penEggsLaid != null &&
      body.penEggsLaid > 0
    ) {
      const season = await Season.findById(id);
      if (season && !season.expectedHatchDate) {
        const hatchDate = new Date();
        hatchDate.setDate(hatchDate.getDate() + 21);
        season.expectedHatchDate = hatchDate;
        await season.save();
      }
    }

    Object.assign(mating, body);
    await mating.save();
    return NextResponse.json({ data: mating });
  } catch (err) {
    if ((err as Error).message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[matings PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuthUser();
    const { id, matingId } = await params;
    await connectDB();
    const mating = await Mating.findOneAndDelete({
      _id: matingId,
      seasonId: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(user.userId),
    });
    if (!mating) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ message: "Deleted" });
  } catch (err) {
    if ((err as Error).message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[matings DELETE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
