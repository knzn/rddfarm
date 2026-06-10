import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Reservation from "@/models/Reservation";
import { getAuthUser } from "@/lib/get-auth-user";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(_req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;

    const reservation = await Reservation.findByIdAndUpdate(
      id,
      { $set: { isConfirmed: true } },
      { new: true }
    );
    if (!reservation) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ data: reservation });
  } catch (err) {
    console.error("[admin/reservations/:id/confirm PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
