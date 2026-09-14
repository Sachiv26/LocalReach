"use client";

import { useState, useEffect } from "react";
import { UploadCloud, X, LayoutGrid } from "lucide-react";

export type UploadedImage = {
  url: string;
  width?: number;
  height?: number;
  sizeBytes?: number;
  mimeType?: string;
  alt?: string;
};

export async function uploadOne(file: File): Promise<UploadedImage> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/uploads", { method: "POST", body: fd });
  const json = (await res.json()) as { ok: boolean; data?: UploadedImage; message?: string };
  if (!res.ok || !json.ok || !json.data) throw new Error(json.message ?? "Upload failed.");
  return json.data;
}

type CollageImage = { url: string; src?: string };

/** Generates a single JPEG collage from the provided image URLs. */
export async function makeCollage(
  urls: string[],
  done: (img: UploadedImage) => void
): Promise<void> {
  try {
    const { generateCollage } = await import("@/components/ads/collage");
    const dataUrl = await generateCollage(urls);
    const blob = await (await fetch(dataUrl)).blob();
    const result = await uploadOne(new File([blob], "collage.jpg", { type: "image/jpeg" }));
    done(result);
  } catch {
    // Collage failed — keep existing state and surface no crash.
  }
}

export function CollageImg({ src, alt, className }: { src: string; alt: string; className: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} decoding="async" />;
}

export function ImageUploader({
  max,
  value,
  onChange,
  allowCollage,
}: {
  max: number;
  value: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  allowCollage: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collage, setCollage] = useState(false);
  const [collageImages, setCollageImages] = useState<CollageImage[]>([]);

  const collageEnabled = () => allowCollage && max <= 2;

  function addImage(img: UploadedImage) {
    if (value.length >= max) {
      setError(`Maximum ${max} photo${max === 1 ? "" : "s"} per advert — more products must go into a collage.`);
      return;
    }
    setError(null);
    onChange([...value, img]);
  }

  async function onFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of list.slice(0, 6)) {
        const img = await uploadOne(file);
        if (collage && collageEnabled()) setCollageImages([...collageImages, { url: img.url }]);
        else addImage(img);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        {value.map((img, i) => (
          <span key={img.url} className="relative">
            <CollageImg src={img.url} alt={img.alt ?? `Photo ${i + 1}`} className="h-20 w-24 rounded border border-gray-200 object-cover" />
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Remove photo" className="absolute -right-1.5 -top-1.5 rounded-full bg-red-600 p-0.5 text-white"><X className="h-3 w-3" /></button>
          </span>
        ))}
      </div>
      <label className="flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 text-sm font-medium text-gray-600 hover:border-brand-300">
        <UploadCloud className="h-5 w-5" aria-hidden />
        {collage && collageEnabled()
          ? `Add product photos (${collageImages.length} added)`
          : `Upload photos (${value.length}/${max})`}
        <input type="file" accept="image/*" multiple hidden onChange={(e) => { if (e.target.files) void onFiles(e.target.files); }} />
      </label>
      {uploading ? <p className="text-sm text-gray-500">Uploading…</p> : null}
      {collage && collageEnabled() ? (
        <div className="rounded-lg border border-brand-200 bg-brand-50 p-3">
          <p className="text-sm text-brand-900">
            Collage mode: multiple products are combined into <strong>one</strong> image
            so the advert still counts as one post.
          </p>
          {collageImages.length >= 2 ? (
            <button
              type="button"
              onClick={() => void makeCollage(collageImages.map((c) => c.url), (img) => { setCollageImages([]); setCollage(false); onChange([img]); })}
              className="mt-2 inline-flex h-10 items-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white"
            >
              <LayoutGrid className="h-4 w-4" /> Generate collage (1 image)
            </button>
          ) : (
            <p className="mt-1 text-xs text-brand-800">Add at least 2 photos to build a collage.</p>
          )}
        </div>
      ) : null}
      {collageEnabled() ? (
        <button type="button" onClick={() => setCollage(!collage)} className={`text-xs underline ${collage ? "text-gray-500" : "text-brand-700"}`}>
          {collage ? "Cancel collage mode" : "Multiple products? Combine into one collage →"}
        </button>
      ) : null}
    </div>
  );
}