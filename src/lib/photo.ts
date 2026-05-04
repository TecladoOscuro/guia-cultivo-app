// Comprime foto a ~200KB y strips EXIF (re-encode via canvas)

export async function compressPhoto(file: File, maxDim = 1200, quality = 0.7): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(maxDim / bitmap.width, maxDim / bitmap.height, 1);
  const w = Math.round(bitmap.width * ratio);
  const h = Math.round(bitmap.height * ratio);

  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2d context not available");
  ctx.drawImage(bitmap, 0, 0, w, h);

  const blob = await canvas.convertToBlob({ type: "image/jpeg", quality });
  bitmap.close();
  return blob;
}

export function blobToObjectURL(blob: Blob): string {
  return URL.createObjectURL(blob);
}
