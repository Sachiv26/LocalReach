/**
 * Storage abstraction for advert images.
 *
 * - S3 adapter: any S3-compatible service (Cloudflare R2, AWS S3, Supabase
 *   Storage) configured through environment variables. Files are uploaded
 *   server-side with size/type validation.
 * - Local adapter (development): writes to ./uploads, served through
 *   /api/files/[...path]. Never used in production.
 *
 * Large images are NEVER stored in PostgreSQL — only metadata and URLs.
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"] as const;

export type UploadResult = {
  url: string;
  key: string;
  mimeType: string;
  sizeBytes: number;
  width: number;
  height: number;
};

function safeName(originalName: string, mimeType: string): string {
  const extFromName = path.extname(originalName).toLowerCase();
  const ext =
    ALLOWED_EXTENSIONS.includes(extFromName as never)
      ? extFromName
      : mimeType === "image/png"
        ? ".png"
        : mimeType === "image/webp"
          ? ".webp"
          : mimeType === "image/gif"
            ? ".gif"
            : ".jpg";
  return `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
}

export type ImageValidationResult = {
  ok: boolean;
  reason?: string;
  width?: number;
  height?: number;
};

/**
 * Validates an uploaded image buffer:
 * MIME type allowlist, magic-byte sniffing, extension, size and dimensions.
 */
export async function validateImage(
  buffer: Buffer,
  mimeType: string,
  originalName: string
): Promise<ImageValidationResult> {
  if (!ALLOWED_MIME_TYPES.includes(mimeType as never)) {
    return { ok: false, reason: "Unsupported file type. Use JPG, PNG, WEBP or GIF." };
  }
  if (buffer.byteLength > MAX_IMAGE_BYTES) {
    return { ok: false, reason: "Image exceeds the 5MB limit." };
  }
  if (buffer.byteLength === 0) return { ok: false, reason: "File is empty." };

  const ext = path.extname(originalName).toLowerCase();
  if (ext && !ALLOWED_EXTENSIONS.includes(ext as never)) {
    return { ok: false, reason: "Unsupported file extension." };
  }

  // Magic-byte sniffing — never trust the declared MIME type alone.
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8;
  const isPng =
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  const isGif = buffer.slice(0, 3).toString("ascii") === "GIF";
  const isWebp =
    buffer.slice(0, 4).toString("ascii") === "RIFF" &&
    buffer.slice(8, 12).toString("ascii") === "WEBP";
  if (!isJpeg && !isPng && !isGif && !isWebp) {
    return { ok: false, reason: "File is not a valid image." };
  }

  // Dimensions (guard against decompression bombs via pixel count)
  let width = 0;
  let height = 0;
  try {
    const { imageSize } = await import("image-size");
            const dims = imageSize(buffer);
    width = dims.width ?? 0;
    height = dims.height ?? 0;
  } catch {
    return { ok: false, reason: "Could not read image dimensions." };
  }
  if (!width || !height) return { ok: false, reason: "Invalid image." };
  if (width * height > 40_000_000) {
    return { ok: false, reason: "Image dimensions are too large." };
  }

  return { ok: true, width, height };
}

/** Uploads a validated image; returns a public URL. */
export async function uploadImage(
  buffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<UploadResult> {
  const validation = await validateImage(buffer, mimeType, originalName);
  if (!validation.ok) {
    throw new AppError("VALIDATION", validation.reason ?? "Invalid image.");
  }
  const key = `adverts/${new Date().getFullYear()}/${safeName(originalName, mimeType)}`;

  if (env.storageEnabled) {
    return uploadToS3(buffer, key, mimeType, validation);
  }
  if (env.isProd) {
    throw new AppError(
      "INTERNAL",
      "Image storage is not configured. Set STORAGE_* environment variables."
    );
  }
  return uploadToLocal(buffer, key, mimeType, validation);
}

async function uploadToLocal(
  buffer: Buffer,
  key: string,
  mimeType: string,
  validation: ImageValidationResult
): Promise<UploadResult> {
  const full = path.join(process.cwd(), "uploads", key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, buffer);
  return {
    url: `/api/files/${key}`,
    key,
    mimeType,
    sizeBytes: buffer.byteLength,
    width: validation.width ?? 0,
    height: validation.height ?? 0,
  };
}

async function uploadToS3(
  buffer: Buffer,
  key: string,
  mimeType: string,
  validation: ImageValidationResult
): Promise<UploadResult> {
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  const client = new S3Client({
    region: env.STORAGE_REGION || "auto",
    endpoint: env.STORAGE_ENDPOINT,
    credentials: {
      accessKeyId: env.STORAGE_ACCESS_KEY as string,
      secretAccessKey: env.STORAGE_SECRET_KEY as string,
    },
  });
  const bucket = env.STORAGE_BUCKET as string;
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
  const base = env.STORAGE_PUBLIC_BASE_URL
    ? `${env.STORAGE_PUBLIC_BASE_URL.replace(/\/$/, "")}`
    : `${env.STORAGE_ENDPOINT?.replace(/\/$/, "")}/${bucket}`;
  return {
    url: `${base}/${key}`,
    key,
    mimeType,
    sizeBytes: buffer.byteLength,
    width: validation.width ?? 0,
    height: validation.height ?? 0,
  };
}
