import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Category from "@/models/Category";
import { getAuthUser } from "@/lib/get-auth-user";

function toSlug(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const mediaType = searchParams.get("mediaType");

    const filter = mediaType
      ? { mediaTypes: { $in: [mediaType as "video" | "photo"] } }
      : {};
    const categories = await Category.find(filter).sort({ label: 1 }).lean();

    return NextResponse.json({ data: categories });
  } catch (err) {
    console.error("[categories GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { label } = await req.json();
    if (!label?.trim()) {
      return NextResponse.json({ error: "Label is required" }, { status: 400 });
    }

    await connectDB();
    const slug = toSlug(label);

    const existing = await Category.findOne({ slug });
    if (existing) {
      return NextResponse.json({ data: existing }, { status: 200 });
    }

    const category = await Category.create({ slug, label: label.trim(), mediaTypes: [] });
    return NextResponse.json({ data: category }, { status: 201 });
  } catch (err) {
    console.error("[categories POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
