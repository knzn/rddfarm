import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Media from "@/models/Media";
import Category from "@/models/Category";
import { getAuthUser } from "@/lib/get-auth-user";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page");
    const category = searchParams.get("category");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);
    const cursor = searchParams.get("cursor");

    const featured = searchParams.get("featured");
    const filter: Record<string, unknown> = {};
    if (page) filter.page = page;
    if (category) filter.categories = { $in: [category] };
    if (featured === "true") filter.featured = true;
    if (cursor) filter._id = { $lt: new mongoose.Types.ObjectId(cursor) };

    const items = await Media.find(filter)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .populate("categories", "slug label")
      .lean();

    const hasMore = items.length > limit;
    const data = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore ? data[data.length - 1]._id.toString() : null;

    return NextResponse.json({ data, nextCursor, hasMore });
  } catch (err) {
    console.error("[media GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { type, page, title, description, url, thumbnail, categoryIds, duration, featured } = body;

    if (!type || !page || !title || !url) {
      return NextResponse.json({ error: "type, page, title, and url are required" }, { status: 400 });
    }

    await connectDB();

    // update category mediaTypes
    if (categoryIds?.length) {
      await Category.updateMany(
        { _id: { $in: categoryIds } },
        { $addToSet: { mediaTypes: type } }
      );
    }

    const media = await Media.create({
      type,
      page,
      title: title.trim(),
      description: description ?? null,
      url,
      thumbnail: thumbnail ?? null,
      categories: categoryIds ?? [],
      duration: duration ?? null,
      featured: featured ?? false,
    });

    const populated = await media.populate("categories", "slug label");
    return NextResponse.json({ data: populated }, { status: 201 });
  } catch (err) {
    console.error("[media POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
