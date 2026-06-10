import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Listing from "@/models/Listing";
import { getAuthUser } from "@/lib/get-auth-user";

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const active = searchParams.get("active");

    const filter: Record<string, unknown> = {};
    if (type) filter.type = type;
    if (active === "true") filter.isDone = false;

    const listings = await Listing.find(filter).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ data: listings });
  } catch (err) {
    console.error("[listings GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const body = await req.json();

    const slug = toSlug(body.name);
    if (!slug) return NextResponse.json({ error: "Invalid listing name" }, { status: 400 });

    const existing = await Listing.findOne({ slug });
    if (existing) return NextResponse.json({ error: "Slug already exists" }, { status: 409 });

    const listing = await Listing.create({ ...body, slug });
    return NextResponse.json({ data: listing }, { status: 201 });
  } catch (err) {
    console.error("[listings POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
