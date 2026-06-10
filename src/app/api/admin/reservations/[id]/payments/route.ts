import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Reservation from "@/models/Reservation";

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  if (!token) return null;
  try { return verifyAccessToken(token); } catch { return null; }
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

  return NextResponse.json({ data: reservation });
}
