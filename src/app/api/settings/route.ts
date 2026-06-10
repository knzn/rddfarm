import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Settings from "@/models/Settings";
import { getAuthUser } from "@/lib/get-auth-user";

// Returns single settings doc (public — used by reservation forms)
export async function GET() {
  try {
    await connectDB();
    const settings = await Settings.findOne().lean();
    // Return defaults if not yet configured
    return NextResponse.json({
      data: settings ?? { messengerUrl: "", facebookUrl: "", phoneNumber: "" },
    });
  } catch (err) {
    console.error("[settings GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const body = await req.json();
    const { messengerUrl, facebookUrl, phoneNumber } = body;

    const settings = await Settings.findOneAndUpdate(
      {},
      { $set: { messengerUrl, facebookUrl, phoneNumber } },
      { upsert: true, new: true }
    );

    return NextResponse.json({ data: settings });
  } catch (err) {
    console.error("[settings PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
