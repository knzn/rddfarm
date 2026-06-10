import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Season from "@/models/Season";
import Mating from "@/models/Mating";
import { requireAuthUser } from "@/lib/get-auth-user";
import mongoose from "mongoose";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  try {
    const user = await requireAuthUser();
    const { id } = await params;
    await connectDB();
    const uid = new mongoose.Types.ObjectId(user.userId);

    const original = await Season.findOne({ _id: id, userId: uid });
    if (!original) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const matings = await Mating.find({ seasonId: original._id, userId: uid }).lean();

    const newSeason = await Season.create({
      userId: uid,
      name: original.name,
      year: new Date().getFullYear(),
      markingsGenerated: false,
      generatedAt: null,
      eggsLaid: null,
      expectedHatchDate: null,
      chicksHatched: null,
      hatchRate: null,
      maleCount: null,
      femaleCount: null,
      sexCountDone: false,
      sexCountUpdatedAt: null,
    });

    // copy matings — move marking → previousMarking, reset marking & mandatoryMarking
    const newMatings = matings.map((m) => ({
      seasonId: newSeason._id,
      userId: uid,
      maleName: m.maleName,
      malePhoto: m.malePhoto ?? null,
      noseGroup: null,
      sameMarking: m.sameMarking,
      mandatoryMarking: null,
      hens: m.hens.map((h) => ({
        henName: h.henName,
        marking: null,
        previousMarking: h.marking ?? null,
        photo: h.photo ?? null,
        eggsLaid: null,
        chicksHatched: null,
        maleCount: null,
        femaleCount: null,
      })),
      useIndividualHenCount: false,
      penEggsLaid: null,
      penChicksHatched: null,
      penMaleCount: null,
      penFemaleCount: null,
    }));

    if (newMatings.length) await Mating.insertMany(newMatings);

    return NextResponse.json({ data: newSeason }, { status: 201 });
  } catch (err) {
    if ((err as Error).message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[seasons/duplicate POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
