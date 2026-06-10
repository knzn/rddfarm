import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Listing from "@/models/Listing";
import { getAuthUser } from "@/lib/get-auth-user";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { slug } = await params;

    const listing = await Listing.findOne({ slug }).lean();
    if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Public route — filter out closed bloodlines
    const publicListing = {
      ...listing,
      bloodlines: (listing as { bloodlines: { name: string; closed: boolean }[] }).bloodlines.filter(
        (b) => !b.closed
      ),
    };

    return NextResponse.json({ data: publicListing });
  } catch (err) {
    console.error("[listings/:slug GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { slug } = await params;
    const body = await req.json();

    const listing = await Listing.findOneAndUpdate({ slug }, { $set: body }, { new: true });
    if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ data: listing });
  } catch (err) {
    console.error("[listings/:slug PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { slug } = await params;

    const listing = await Listing.findOneAndDelete({ slug });
    if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ message: "Deleted" });
  } catch (err) {
    console.error("[listings/:slug DELETE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
