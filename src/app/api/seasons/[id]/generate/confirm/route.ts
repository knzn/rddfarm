import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Season from "@/models/Season";
import Mating from "@/models/Mating";
import MarkingPool from "@/models/MarkingPool";
import { requireAuthUser } from "@/lib/get-auth-user";
import { isValidCombo, MarkingAssignment } from "@/lib/marking-engine";
import mongoose from "mongoose";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuthUser();
    const { id } = await params;
    const body = await req.json();
    const assignments: MarkingAssignment[] = body.assignments;

    await connectDB();
    const uid = new mongoose.Types.ObjectId(user.userId);
    const seasonId = new mongoose.Types.ObjectId(id);

    const season = await Season.findOne({ _id: seasonId, userId: uid });
    if (!season) return NextResponse.json({ error: "Season not found" }, { status: 404 });

    const matings = await Mating.find({ seasonId, userId: uid }).lean();
    const matingIds = new Set(matings.map((m) => m._id.toString()));

    // validate every marking is valid
    const allMarkings: string[] = [];
    for (const a of assignments) {
      if (!matingIds.has(a.matingId))
        return NextResponse.json({ error: `Mating ${a.matingId} not in this season` }, { status: 400 });
      for (const h of a.hens) {
        if (!isValidCombo(h.marking))
          return NextResponse.json({ error: `"${h.marking}" is not a valid combo` }, { status: 400 });
        allMarkings.push(h.marking);
      }
    }

    // check no duplicate combos across different matings
    // (same-marking within same mating is allowed)
    const crossMatingMarkings: string[] = [];
    for (const a of assignments) {
      const unique = [...new Set(a.hens.map((h) => h.marking))];
      for (const m of unique) {
        if (crossMatingMarkings.includes(m))
          return NextResponse.json({ error: `Combo "${m}" is used across multiple matings` }, { status: 400 });
        crossMatingMarkings.push(m);
      }
    }

    // atomic writes
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        for (const a of assignments) {
          await Mating.findByIdAndUpdate(
            a.matingId,
            {
              $set: {
                noseGroup: a.noseGroup,
                hens: matings
                  .find((m) => m._id.toString() === a.matingId)!
                  .hens.map((h, i) => ({
                    ...h,
                    marking: a.hens[i]?.marking ?? h.marking,
                  })),
              },
            },
            { session }
          );
        }

        await MarkingPool.findOneAndUpdate(
          { seasonId },
          {
            $set: {
              seasonId,
              userId: uid,
              assignments: assignments.map((a) => ({
                matingId: a.matingId,
                noseGroup: a.noseGroup,
                combos: a.hens.map((h) => h.marking),
              })),
              usedCombos: [...new Set(allMarkings)],
              generatedAt: new Date(),
            },
          },
          { upsert: true, session }
        );

        season.markingsGenerated = true;
        season.generatedAt = new Date();
        await season.save({ session });
      });
    } finally {
      await session.endSession();
    }

    return NextResponse.json({ message: "Markings confirmed and saved" });
  } catch (err) {
    if ((err as Error).message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[generate/confirm POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
