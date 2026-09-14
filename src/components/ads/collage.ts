"use client";

/**
 * Pure client-side collage renderer. Draws the provided image URLs onto a
 * canvas and returns a JPEG data URL. Runs entirely in the browser — nothing
 * is uploaded until the single collage image is sent to /api/uploads.
 */
export async function generateCollage(urls: string[], outSize = 900): Promise<string> {
  const canvas = document.createElement("canvas");
  const cols = urls.length > 4 ? 3 : 2;
  const gap = 16;
  const cell = Math.floor((outSize - (cols - 1) * gap) / cols);
  const usable = urls.slice(0, 6);
  const rows = Math.ceil(usable.length / cols);
  canvas.width = outSize;
  canvas.height = 60 + rows * cell + (rows - 1) * gap;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#158258";
  ctx.font = "600 22px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`LocalReach — ${usable.length} products, one advert`, canvas.width / 2, 30);

  const load = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("load failed"));
      img.src = url;
      img.decoding = "async";
    });

  const images = await Promise.allSettled(usable.map(load));
  let index = 0;
  for (const result of images) {
    if (result.status === "rejected") continue;
    const img = result.value;
    const row = Math.floor(index / cols);
    const col = index % cols;
    const scale = Math.max(cell / img.width, cell / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    const x = col * (cell + gap) - (w - cell) / 2;
    const y = 52 + row * (cell + gap) - (h - cell) / 2;
    ctx.save();
    ctx.beginPath();
    ctx.rect(col * (cell + gap), 52 + row * (cell + gap), cell, cell);
    ctx.clip();
    ctx.drawImage(img, x, y, w, h);
    ctx.restore();
    index += 1;
  }
  return canvas.toDataURL("image/jpeg", 0.85);
}