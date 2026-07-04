// Central SEO helpers.
export function siteUrl() {
  return (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

// Absolute URL for a path.
export function abs(path = "/") {
  const base = siteUrl();
  if (/^https?:\/\//.test(path)) return path;
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

// An OG-safe image URL: crawlers can't fetch data: URIs, so fall back to a
// self-hosted default when a product only has an inline/base64 image. Served
// /api/img/ URLs are real fetchable images, so they're allowed through.
export function ogImage(src) {
  if (src && (src.startsWith("http") || src.startsWith("/images/") || src.startsWith("/api/img/")))
    return abs(src);
  return abs("/images/hero-men.jpg");
}
