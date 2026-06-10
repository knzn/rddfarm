import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Category from "@/models/Category";
import Media from "@/models/Media";
import { getAuthUser } from "@/lib/get-auth-user";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await connectDB();

    await Category.findByIdAndDelete(id);
    // Remove this category from all media that reference it
    await Media.updateMany({ categories: id }, { $pull: { categories: id } });

    return NextResponse.json({ message: "Deleted" });
  } catch (err) {
    console.error("[categories DELETE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
