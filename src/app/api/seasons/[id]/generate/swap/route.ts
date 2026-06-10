import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Season from "@/models/Season";
import Mating from "@/models/Mating";
import { requireAuthUser } from "@/lib/get-auth-user";
import { generateMarkings, isValidCombo, MarkingAssignment } from "@/lib/marking-engine";
import mongoose from "mongoose";

type Params = { params: Promise<{ id: string }> };

// POST — apply a swap to the current preview (stateless — client holds the preview)
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuthUser();
    const { id } = await params;
    const body = await req.json();
    // body: { currentPreview: MarkingAssignment[], matingId, henName, newMarking }
    const { currentPreview, matingId, henName, newMarking } = body;

    if (!isValidCombo(newMarking))
      return NextResponse.json({ error: `"${newMarking}" is not a valid combo` }, { status: 400 });

    await connectDB();
    const uid = new mongoose.Types.ObjectId(user.userId);

    const season = await Season.findOne({ _id: id, userId: uid });
    if (!season) return NextResponse.json({ error: "Season not found" }, { status: 404 });

    // check no duplicate across other matings
    const allCurrentMarkings = (currentPreview as MarkingAssignment[]).flatMap((m) =>
      m.matingId === matingId ? [] : m.hens.map((h) => h.marking)
    );
    if (allCurrentMarkings.includes(newMarking))
      return NextResponse.json({ error: "Marking already used by another mating" }, { status: 400 });

    // apply swap to preview
    const updated: MarkingAssignment[] = (currentPreview as MarkingAssignment[]).map((m) => {
      if (m.matingId !== matingId) return m;
      return {
        ...m,
        hens: m.hens.map((h) =>
          h.henName === henName ? { ...h, marking: newMarking } : h
        ),
      };
    });

    return NextResponse.json({ preview: updated });
  } catch (err) {
    if ((err as Error).message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[generate/swap POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
