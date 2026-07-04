import { siteUrl } from "@/lib/seo";

// Auto-generated /robots.txt. Blocks private/functional routes from indexing,
// allows the public storefront, and points crawlers at the sitemap.
export default function robots() {
  const base = siteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api/", "/cart", "/checkout", "/order-sent"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
