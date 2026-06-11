import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Reservation from "@/models/Reservation";
import Listing from "@/models/Listing";
import Sale from "@/models/Sale";
import { getAuthUser } from "@/lib/get-auth-user";
import mongoose from "mongoose";

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

    // Auto-create sale record if not already created for this reservation
    const existing = await Sale.findOne({ reservationId: reservation._id });
    if (!existing) {
      const listing = await Listing.findById(reservation.listingId).lean();
      const confirmedAt = new Date();
      const paymentStatus =
        reservation.balance <= 0 ? "paid"
        : reservation.downPayment > 0 ? "partial"
        : "unpaid";

      const itemLines = reservation.items
        .map((it) => `${it.quantity}x ${it.bloodline}${it.category ? ` (${it.category})` : ""}`)
        .join(", ");

      await Sale.create({
        userId: new mongoose.Types.ObjectId(user.userId),
        source: "reservation",
        reservationId: reservation._id,
        listingType: reservation.listingType,
        listingName: listing?.name ?? reservation.listingSlug,
        listingSlug: reservation.listingSlug,
        buyerName: reservation.buyerName,
        buyerFacebook: reservation.buyerFacebook,
        buyerNumber: reservation.buyerNumber,
        items: reservation.items.map((it) => ({
          bloodline: it.bloodline,
          category: it.category ?? null,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
        })),
        downPayment: reservation.downPayment,
        balance: reservation.balance,
        paymentPlan: reservation.paymentPlan,
        description: `${reservation.buyerName} — ${listing?.name ?? reservation.listingSlug} (${itemLines})`,
        amount: reservation.totalAmount,
        date: confirmedAt,
        month: confirmedAt.getMonth() + 1,
        year: confirmedAt.getFullYear(),
        paymentStatus,
      });
    }

    return NextResponse.json({ data: reservation });
  } catch (err) {
    console.error("[admin/reservations/:id/confirm PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
