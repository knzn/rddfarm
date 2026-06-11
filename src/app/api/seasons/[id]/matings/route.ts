import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Mating from "@/models/Mating";
import Season from "@/models/Season";
import { requireAuthUser } from "@/lib/get-auth-user";
import mongoose from "mongoose";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuthUser();
    const { id } = await params;
    await connectDB();
    const uid = new mongoose.Types.ObjectId(user.userId);
    const matings = await Mating.find({
      seasonId: new mongoose.Types.ObjectId(id),
      userId: uid,
    }).sort({ createdAt: 1 }).lean();
    return NextResponse.json({ data: matings });
  } catch (err) {
    if ((err as Error).message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuthUser();
    const { id } = await params;
    const body = await req.json();
    await connectDB();
    const uid = new mongoose.Types.ObjectId(user.userId);
    const seasonId = new mongoose.Types.ObjectId(id);

    const season = await Season.findOne({ _id: seasonId, userId: uid });
    if (!season) return NextResponse.json({ error: "Season not found" }, { status: 404 });

    // validate: henNames.length must equal hens array length
    const henGroups: (string | null)[] = body.henGroups ?? [];
    const hens = (body.henNames as string[])?.map((name: string, idx: number) => ({
      henName: name,
      group: henGroups[idx] || null,
      marking: null,
      previousMarking: null,
      photo: null,
      eggsLaid: null,
      chicksHatched: null,
      maleCount: null,
      femaleCount: null,
    })) ?? [];

    // sameMarking must be null when only 1 hen
    const sameMarking = hens.length === 1 ? null : (body.sameMarking ?? null);

    const mating = await Mating.create({
      seasonId,
      userId: uid,
      maleName: body.maleName,
      malePhoto: body.malePhoto ?? null,
      noseGroup: null,
      sameMarking,
      mandatoryMarking: body.mandatoryMarking ?? null,
      hens,
      useIndividualHenCount: false,
      penEggsLaid: null,
      penChicksHatched: null,
      penMaleCount: null,
      penFemaleCount: null,
    });

    return NextResponse.json({ data: mating }, { status: 201 });
  } catch (err) {
    if ((err as Error).message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[matings POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
