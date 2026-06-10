import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Reservation from "@/models/Reservation";
import { getAuthUser } from "@/lib/get-auth-user";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(req.url);

    const filter: Record<string, unknown> = {};
    const type = searchParams.get("type");
    const confirmed = searchParams.get("confirmed");
    const listingSlug = searchParams.get("listingSlug");

    if (type) filter.listingType = type;
    if (confirmed === "true") filter.isConfirmed = true;
    if (confirmed === "false") filter.isConfirmed = false;
    if (listingSlug) filter.listingSlug = listingSlug;

    const reservations = await Reservation.find(filter).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ data: reservations });
  } catch (err) {
    console.error("[admin/reservations GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
