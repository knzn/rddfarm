import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { verifyAccessToken } from "@/lib/auth";

function getUser(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  if (!token) return null;
  try { return verifyAccessToken(token); } catch { return null; }
}

export async function GET(req: NextRequest) {
  if (!getUser(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await dbConnect();
  const users = await User.find({}, { passwordHash: 0 }).sort({ createdAt: 1 });
  return NextResponse.json({ data: users });
}

export async function POST(req: NextRequest) {
  if (!getUser(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { email, password } = await req.json();
  if (!email || !password) return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  if (password.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  await dbConnect();
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ email: email.toLowerCase(), passwordHash, role: "admin" });
  return NextResponse.json({ data: { _id: user._id, email: user.email, role: user.role, createdAt: user.createdAt } }, { status: 201 });
}
