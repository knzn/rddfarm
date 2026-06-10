import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/get-auth-user";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import sharp from "sharp";

const client = new S3Client({
  region: process.env.DO_SPACES_REGION ?? "sgp1",
  endpoint: process.env.DO_SPACES_ENDPOINT,
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY!,
    secretAccessKey: process.env.DO_SPACES_SECRET!,
  },
  forcePathStyle: false,
});

const BUCKET = process.env.DO_SPACES_BUCKET!;
const CDN_URL = process.env.DO_SPACES_CDN_URL!;

const ALLOWED = [
  "video/mp4",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folderHint = (formData.get("folder") as string | null) ?? "";

    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const contentType = file.type;
    if (!ALLOWED.includes(contentType)) {
      return NextResponse.json({ error: `Unsupported type: ${contentType}` }, { status: 400 });
    }

    const isImage = contentType.startsWith("image/");
    const folder = folderHint || (contentType.startsWith("video/") ? "portfolio/videos" : "portfolio/photos");
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/\.[^.]+$/, "");

    let buffer = Buffer.from(await file.arrayBuffer());
    let uploadContentType = contentType;
    let ext = contentType === "video/mp4" ? "mp4" : "webp";

    if (isImage) {
      // Resize to max 1920px wide, keep aspect ratio, convert to webp
      buffer = await sharp(buffer)
        .resize(1920, undefined, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();
      uploadContentType = "image/webp";
      ext = "webp";
    }

    const key = `${folder}/${safeName}-${randomUUID()}.${ext}`;

    await client.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: uploadContentType,
        ACL: "public-read",
      })
    );

    const url = `${CDN_URL}/${key}`;
    return NextResponse.json({ url, key });
  } catch (err) {
    console.error("[media/upload POST]", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export const config = { api: { bodyParser: false } };
