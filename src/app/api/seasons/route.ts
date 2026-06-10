import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Season from "@/models/Season";
import { requireAuthUser } from "@/lib/get-auth-user";
import mongoose from "mongoose";

export async function GET() {
  try {
    const user = await requireAuthUser();
    await connectDB();
    const seasons = await Season.find({
      userId: new mongoose.Types.ObjectId(user.userId),
    }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ data: seasons });
  } catch (err) {
    if ((err as Error).message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[seasons GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuthUser();
    const body = await req.json();
    await connectDB();
    const season = await Season.create({
      ...body,
      userId: new mongoose.Types.ObjectId(user.userId),
    });
    return NextResponse.json({ data: season }, { status: 201 });
  } catch (err) {
    if ((err as Error).message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[seasons POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
