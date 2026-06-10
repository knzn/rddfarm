import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Listing from "@/models/Listing";
import Reservation from "@/models/Reservation";
import { calcWeeklySchedule, calcMonthlySchedule } from "@/lib/payment-schedule";

function toBuyerSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const { listingSlug, buyerName, buyerFacebook, buyerNumber, items, paymentPlan } = body;

    if (!listingSlug || !buyerName || !buyerFacebook || !buyerNumber || !items?.length || !paymentPlan) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const listing = await Listing.findOne({ slug: listingSlug });
    if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    if (listing.isDone) return NextResponse.json({ error: "Listing is closed" }, { status: 400 });

    // validate bloodlines are open
    const openBloodlines = new Set(listing.bloodlines.filter((b) => !b.closed).map((b) => b.name));
    for (const item of items) {
      if (!openBloodlines.has(item.bloodline)) {
        return NextResponse.json({ error: `Bloodline "${item.bloodline}" is closed or not found` }, { status: 400 });
      }
    }

    // compute totals
    const totalAmount: number = items.reduce(
      (sum: number, i: { quantity: number; unitPrice: number }) => sum + i.quantity * i.unitPrice,
      0
    );
    const downPaymentRate = listing.type === "pahulugan" ? 0.3 : 0.5;
    const downPayment = Math.ceil(totalAmount * downPaymentRate);
    const balance = totalAmount - downPayment;

    const today = new Date();
    const releaseDate = new Date(listing.releaseDate);

    let weeklyAmount: number | null = null;
    let monthlyAmount: number | null = null;
    let paymentSchedule = null;

    if (paymentPlan === "weekly") {
      const schedule = calcWeeklySchedule(balance, today, releaseDate);
      paymentSchedule = schedule;
      weeklyAmount = schedule[0]?.amount ?? null;
    } else if (paymentPlan === "monthly") {
      const schedule = calcMonthlySchedule(balance, today, releaseDate);
      paymentSchedule = schedule;
      monthlyAmount = schedule[0]?.amount ?? null;
    }

    const buyerSlug = toBuyerSlug(buyerName);
    const typeSlug =
      listing.type === "pahulugan" ? "pahulugan" : listing.type === "months-old" ? "months-old" : "day-old";
    const publicUrl = `/${typeSlug}/${listingSlug}/${buyerSlug}`;

    const existing = await Reservation.findOne({ listingSlug, slug: buyerSlug });
    if (existing) {
      return NextResponse.json(
        { error: "A reservation with this name already exists for this listing" },
        { status: 409 }
      );
    }

    const reservation = await Reservation.create({
      listingId: listing._id,
      listingType: listing.type,
      listingSlug,
      buyerName,
      buyerFacebook,
      buyerNumber,
      slug: buyerSlug,
      items,
      totalAmount,
      downPayment,
      balance,
      paymentPlan,
      weeklyAmount,
      monthlyAmount,
      paymentSchedule,
      isConfirmed: false,
      publicUrl,
      messengerUrl: process.env.NEXT_PUBLIC_MESSENGER_URL ?? "",
    });

    return NextResponse.json(
      {
        data: {
          publicUrl,
          messengerUrl: reservation.messengerUrl,
          totalAmount,
          downPayment,
          balance,
          paymentPlan,
          weeklyAmount,
          monthlyAmount,
          paymentSchedule,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[reservations POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
