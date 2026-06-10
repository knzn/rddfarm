import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Worker from "@/models/Worker";
import { requireAuthUser } from "@/lib/get-auth-user";
import mongoose from "mongoose";

export async function GET() {
  try {
    const user = await requireAuthUser();
    await connectDB();
    const workers = await Worker.find({
      userId: new mongoose.Types.ObjectId(user.userId),
    }).sort({ name: 1 }).lean();
    return NextResponse.json({ data: workers });
  } catch (err) {
    if ((err as Error).message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[workers GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuthUser();
    const body = await req.json();
    await connectDB();
    const worker = await Worker.create({
      ...body,
      userId: new mongoose.Types.ObjectId(user.userId),
      advances: [],
      payments: [],
    });
    return NextResponse.json({ data: worker }, { status: 201 });
  } catch (err) {
    if ((err as Error).message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[workers POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
