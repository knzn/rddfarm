import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/get-auth-user";
import { getPresignedUploadUrl } from "@/lib/spaces";
import { randomUUID } from "crypto";

const ALLOWED_VIDEO_TYPES = ["video/mp4"];
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

function getFolder(contentType: string): string {
  if (contentType.startsWith("video/")) return "portfolio/videos";
  return "portfolio/photos";
}

function getExtension(contentType: string): string {
  const map: Record<string, string> = {
    "video/mp4": "mp4",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  return map[contentType] ?? "bin";
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { filename, contentType, folder } = await req.json();

    if (!contentType) {
      return NextResponse.json({ error: "contentType is required" }, { status: 400 });
    }

    const allowed = [...ALLOWED_VIDEO_TYPES, ...ALLOWED_IMAGE_TYPES];
    if (!allowed.includes(contentType)) {
      return NextResponse.json(
        { error: `Unsupported file type. Allowed: ${allowed.join(", ")}` },
        { status: 400 }
      );
    }

    const ext = getExtension(contentType);
    const baseFolder = folder ?? getFolder(contentType);
    const safeFilename = filename
      ? filename.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/\.[^.]+$/, "")
      : randomUUID();
    const key = `${baseFolder}/${safeFilename}-${randomUUID()}.${ext}`;

    const { presignedUrl, finalCdnUrl } = await getPresignedUploadUrl(key, contentType, 300);

    return NextResponse.json({ presignedUrl, finalCdnUrl, key });
  } catch (err) {
    console.error("[media/presign POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
