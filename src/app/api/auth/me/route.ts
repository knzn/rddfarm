import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("access_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const payload = verifyAccessToken(token);
    return NextResponse.json({ user: { userId: payload.userId, email: payload.email, role: payload.role } });
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
