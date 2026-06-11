import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Reservation from "@/models/Reservation";
import Sale from "@/models/Sale";

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  if (!token) return null;
  try { return verifyAccessToken(token); } catch { return null; }
}

function computeStatus(balance: number, totalPaid: number): "paid" | "partial" | "unpaid" {
  if (balance <= 0) return "paid";
  if (totalPaid > 0) return "partial";
  return "unpaid";
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const amount = Number(body.amount);
  if (!amount || amount <= 0) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });

  await connectDB();

  const reservation = await Reservation.findByIdAndUpdate(
    id,
    { $push: { payments: { amount, note: body.note ?? "", paidAt: body.paidAt ? new Date(body.paidAt) : new Date() } } },
    { new: true }
  );
  if (!reservation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Recalculate balance — downPayment + all recorded payments
  const totalPaid = reservation.downPayment + reservation.payments.reduce((s, p) => s + p.amount, 0);
  const newBalance = Math.max(0, reservation.totalAmount - totalPaid);
  const newStatus = computeStatus(newBalance, totalPaid);

  // Persist updated balance on reservation
  reservation.balance = newBalance;
  await reservation.save();

  // Sync the linked Sale record if it exists
  await Sale.findOneAndUpdate(
    { reservationId: reservation._id },
    { $set: { balance: newBalance, paymentStatus: newStatus } }
  );

  return NextResponse.json({ data: reservation });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { paymentId } = await req.json();

  await connectDB();

  const reservation = await Reservation.findByIdAndUpdate(
    id,
    { $pull: { payments: { _id: paymentId } } },
    { new: true }
  );
  if (!reservation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Recalculate after removal
  const totalPaid = reservation.downPayment + reservation.payments.reduce((s, p) => s + p.amount, 0);
  const newBalance = Math.max(0, reservation.totalAmount - totalPaid);
  const newStatus = computeStatus(newBalance, totalPaid);

  reservation.balance = newBalance;
  await reservation.save();

  await Sale.findOneAndUpdate(
    { reservationId: reservation._id },
    { $set: { balance: newBalance, paymentStatus: newStatus } }
  );

  return NextResponse.json({ data: reservation });
}
