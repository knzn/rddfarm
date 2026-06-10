import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function POST() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      return NextResponse.json({ error: "ADMIN_EMAIL and ADMIN_PASSWORD env vars required" }, { status: 400 });
    }

    await connectDB();

    const existing = await User.findOne({ email: adminEmail.toLowerCase() });
    if (existing) {
      return NextResponse.json({ message: "Admin already exists" }, { status: 200 });
    }

    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await User.create({ email: adminEmail.toLowerCase(), passwordHash, role: "admin" });

    return NextResponse.json({ message: "Admin created successfully" }, { status: 201 });
  } catch (err) {
    console.error("[auth/seed]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
