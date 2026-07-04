"use client";

const DEFAULT_MAX_BYTES = 64 * 1024;

function blobToDataUri(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read compressed image."));
    reader.readAsDataURL(blob);
  });
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`"${file.name}" could not be loaded as an image.`));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob || blob.type !== "image/webp") {
          reject(new Error("This browser could not create a WebP image."));
          return;
        }
        resolve(blob);
      },
      "image/webp",
      quality
    );
  });
}

function drawToCanvas(source, width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, width, height);
  return canvas;
}

function dimensionsFor(source, maxSide) {
  const width = source.naturalWidth || source.width;
  const height = source.naturalHeight || source.height;
  const scale = Math.min(1, maxSide / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

async function bestBlobForCanvas(canvas, options) {
  const { minQuality, maxQuality, maxBytes } = options;
  let low = minQuality;
  let high = maxQuality;
  let best = null;
  let smallest = null;

  for (let i = 0; i < 7; i += 1) {
    const quality = (low + high) / 2;
    const blob = await canvasToBlob(canvas, quality);
    const candidate = { blob, quality };
    if (!smallest || blob.size < smallest.blob.size) smallest = candidate;

    if (blob.size <= maxBytes) {
      best = candidate;
      low = quality;
    } else {
      high = quality;
    }
  }

  return best || smallest;
}

export async function compressImageToWebP(file, opts = {}) {
  if (!file) return null;
  if (!file.type?.startsWith("image/")) {
    throw new Error(`"${file.name}" is not an image.`);
  }

  const options = {
    maxBytes: opts.maxBytes || DEFAULT_MAX_BYTES,
    maxDimension: opts.maxDimension || 1400,
    minDimension: opts.minDimension || 360,
    minQuality: opts.minQuality || 0.42,
    maxQuality: opts.maxQuality || 0.82,
  };

  const source = await loadImage(file);
  let maxSide = Math.min(
    options.maxDimension,
    Math.max(source.naturalWidth || source.width, source.naturalHeight || source.height)
  );
  let best = null;

  while (maxSide >= options.minDimension) {
    const { width, height } = dimensionsFor(source, maxSide);
    const canvas = drawToCanvas(source, width, height);
    const candidate = await bestBlobForCanvas(canvas, options);

    if (!best || candidate.blob.size < best.blob.size) {
      best = { ...candidate, width, height };
    }
    if (candidate.blob.size <= options.maxBytes) {
      const dataUri = await blobToDataUri(candidate.blob);
      return {
        dataUri,
        bytes: candidate.blob.size,
        width,
        height,
        quality: candidate.quality,
        originalBytes: file.size,
      };
    }

    maxSide = Math.floor(maxSide * 0.82);
  }

  if (best?.blob.size <= options.maxBytes) {
    return {
      dataUri: await blobToDataUri(best.blob),
      bytes: best.blob.size,
      width: best.width,
      height: best.height,
      quality: best.quality,
      originalBytes: file.size,
    };
  }

  throw new Error(`"${file.name}" could not be compressed under ${formatBytes(options.maxBytes)}.`);
}

export async function compressImagesToWebP(files, opts = {}) {
  const list = Array.from(files || []);
  const out = [];
  for (const file of list) out.push(await compressImageToWebP(file, opts));
  return out;
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${Math.round(bytes / 1024)}KB`;
}
