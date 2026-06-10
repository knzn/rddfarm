import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Season from "@/models/Season";
import Mating from "@/models/Mating";
import MarkingPool from "@/models/MarkingPool";
import { requireAuthUser } from "@/lib/get-auth-user";
import { generateMarkings } from "@/lib/marking-engine";
import mongoose from "mongoose";

type Params = { params: Promise<{ id: string }> };

// POST — preview (no save)
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuthUser();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    await connectDB();
    const uid = new mongoose.Types.ObjectId(user.userId);

    const season = await Season.findOne({ _id: id, userId: uid });
    if (!season) return NextResponse.json({ error: "Season not found" }, { status: 404 });

    const matings = await Mating.find({ seasonId: season._id, userId: uid }).lean();
    if (!matings.length)
      return NextResponse.json({ error: "No matings in this season" }, { status: 400 });

    const input = matings.map((m) => ({
      id: m._id.toString(),
      maleName: m.maleName,
      henNames: m.hens.map((h) => h.henName),
      sameMarking: m.sameMarking,
      mandatoryMarking: m.mandatoryMarking,
    }));

    const preview = generateMarkings(input, body.overrides ?? []);
    return NextResponse.json({ preview });
  } catch (err) {
    if ((err as Error).message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[generate POST]", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

// DELETE — reset
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuthUser();
    const { id } = await params;
    await connectDB();
    const uid = new mongoose.Types.ObjectId(user.userId);
    const seasonId = new mongoose.Types.ObjectId(id);

    const season = await Season.findOne({ _id: seasonId, userId: uid });
    if (!season) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await Mating.updateMany(
      { seasonId, userId: uid },
      { $set: { noseGroup: null, "hens.$[].marking": null } }
    );
    await MarkingPool.deleteOne({ seasonId });
    season.markingsGenerated = false;
    season.generatedAt = null;
    await season.save();

    return NextResponse.json({ message: "Markings reset" });
  } catch (err) {
    if ((err as Error).message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[generate DELETE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
