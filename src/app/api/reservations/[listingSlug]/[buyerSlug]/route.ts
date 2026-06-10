import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Reservation from "@/models/Reservation";

type Params = { params: Promise<{ listingSlug: string; buyerSlug: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { listingSlug, buyerSlug } = await params;

    const reservation = await Reservation.findOne({ listingSlug, slug: buyerSlug }).lean();

    if (!reservation || !reservation.isConfirmed) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data: reservation });
  } catch (err) {
    console.error("[reservations/:listingSlug/:buyerSlug GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
