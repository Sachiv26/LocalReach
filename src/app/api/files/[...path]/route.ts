import { NextResponse } from "next/server";
import path from "node:path";
import { readFile } from "node:fs/promises";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

/** Serves locally-stored (development) uploads. Production uses the object store. */
export async function GET(
  _request: Request,
  { params }: { params: { path: string[] } }
) {
  try {
    const relative = params.path.join("/");
    const safe = path.normalize(relative);
    if (safe.startsWith("..") || path.isAbsolute(safe)) {
      return NextResponse.json({ ok: false, message: "Invalid path." }, { status: 400 });
    }
    const filePath = path.join(UPLOADS_DIR, safe);
    const buffer = await readFile(filePath);
    const mime = MIME_BY_EXT[path.extname(safe).toLowerCase()] ?? "application/octet-stream";
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ ok: false, message: "Not found." }, { status: 404 });
  }
}