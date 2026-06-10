import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Media from "@/models/Media";
import { getAuthUser } from "@/lib/get-auth-user";
import { deleteObject, cdnUrlToKey } from "@/lib/spaces";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const allowedFields = ["title", "description", "page", "categories", "thumbnail", "duration", "featured", "cropPosition"];
    const update: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) update[field] = body[field];
    }

    await connectDB();
    const media = await Media.findByIdAndUpdate(id, { $set: update }, { new: true })
      .populate("categories", "slug label")
      .lean();

    if (!media) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: media });
  } catch (err) {
    console.error("[media PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await connectDB();

    const media = await Media.findById(id);
    if (!media) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // delete from DO Spaces
    try {
      await deleteObject(cdnUrlToKey(media.url));
    } catch (spaceErr) {
      console.warn("[media DELETE] Spaces delete failed:", spaceErr);
    }

    if (media.thumbnail) {
      try {
        await deleteObject(cdnUrlToKey(media.thumbnail));
      } catch {}
    }

    await media.deleteOne();
    return NextResponse.json({ message: "Deleted" });
  } catch (err) {
    console.error("[media DELETE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
