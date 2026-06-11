import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Reservation from "@/models/Reservation";
import Sale from "@/models/Sale";
import { getAuthUser } from "@/lib/get-auth-user";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;

    const reservation = await Reservation.findByIdAndDelete(id);
    if (!reservation) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Also delete the linked sale record if it exists
    await Sale.deleteOne({ reservationId: reservation._id });

    return NextResponse.json({ data: { deleted: true } });
  } catch (err) {
    console.error("[admin/reservations/:id DELETE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
