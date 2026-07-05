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

  // Probe the top of the quality range first: if even the highest quality is
  // already under budget, we're done in one encode (common once the image has
  // been scaled down enough). Otherwise binary-search downward.
  for (let i = 0; i < 6; i += 1) {
    const quality = i === 0 ? maxQuality : (low + high) / 2;
    const blob = await canvasToBlob(canvas, quality);
    const candidate = { blob, quality };
    if (!smallest || blob.size < smallest.blob.size) smallest = candidate;

    if (blob.size <= maxBytes) {
      best = candidate;
      if (i === 0) break; // highest quality already fits — stop early
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

    // Encoded size scales roughly with pixel area (side²), so estimate the side
    // that would land under budget in a single jump instead of nibbling down by
    // a fixed 0.82 each pass. A safety factor undershoots slightly so we don't
    // overshoot the budget; we always shrink by at least a little to guarantee
    // the loop terminates.
    const ratio = options.maxBytes / candidate.blob.size;
    const estimate = Math.floor(maxSide * Math.sqrt(ratio) * 0.92);
    maxSide = Math.min(estimate, maxSide - 1);
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
  const out = new Array(list.length);
  // Compress several files at once (WebP encoding is largely off the main
  // thread), but cap concurrency so a big multi-select doesn't spike memory
  // holding many full-size canvases at the same time.
  const CONCURRENCY = 3;
  let next = 0;
  async function worker() {
    while (next < list.length) {
      const i = next++;
      out[i] = await compressImageToWebP(list[i], opts);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, list.length) }, worker)
  );
  return out;
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${Math.round(bytes / 1024)}KB`;
}
