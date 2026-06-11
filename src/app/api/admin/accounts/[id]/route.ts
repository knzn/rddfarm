import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { verifyAccessToken } from "@/lib/auth";

function getUser(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  if (!token) return null;
  try { return verifyAccessToken(token); } catch { return null; }
}

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  if (!getUser(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { password } = await req.json();
  if (!password || password.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  await connectDB();
  const hash = await bcrypt.hash(password, 10);
  await User.findByIdAndUpdate(id, { passwordHash: hash });
  return NextResponse.json({ data: { updated: true } });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  if (!getUser(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await connectDB();
  const count = await User.countDocuments({ role: "admin" });
  if (count <= 1) return NextResponse.json({ error: "Cannot delete the last admin account" }, { status: 400 });
  await User.findByIdAndDelete(id);
  return NextResponse.json({ data: { deleted: true } });
}
