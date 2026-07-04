import { z } from "zod";
import db from "@/lib/db";
import { route, ok, fail } from "@/lib/api";
import { requireStockAccess } from "@/lib/auth";
import { getProduct } from "@/lib/models";
import { pruneVariantStock, normalizeVariantPrices, normalizeGallery } from "@/lib/variants";

export const runtime = "nodejs";

async function getRouteId(params) {
  const resolved = await params;
  return resolved?.id;
}

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.string().min(1).optional(),
  price: z.coerce.number().min(0).optional(),
  compareAtPrice: z.coerce.number().min(0).optional(),
  image: z.string().optional(),
  images: z.array(z.string()).max(20, "Up to 20 images per product.").optional(),
  imageColours: z.array(z.string()).optional(),
  sizes: z.array(z.string()).optional(),
  colours: z.array(z.string()).optional(),
  variantStock: z.record(z.boolean()).optional(),
  variantPrices: z.record(z.object({
    price: z.coerce.number().min(0).default(0),
    compareAtPrice: z.coerce.number().min(0).default(0),
  })).optional(),
  inStock: z.boolean().optional(),
  featured: z.boolean().optional(),
  newDrop: z.boolean().optional(),
});

export const GET = route(async (_req, { params }) => {
  const product = getProduct(await getRouteId(params));
  if (!product) return fail(404, "Product not found.");
  return ok({ product });
});

// Update a product, including the one-tap in-stock toggle (admin / stock_updater).
export const PUT = route(async (req, { params }) => {
  await requireStockAccess();
  const id = Number(await getRouteId(params));
  const existing = db.prepare("SELECT id FROM products WHERE id = ?").get(id);
  if (!existing) return fail(404, "Product not found.");

  const b = updateSchema.parse(await req.json());
  // When the gallery changes, keep the primary `image` and the per-image colour
  // tags in sync with images[0] / the surviving images.
  if (b.images !== undefined) {
    const { gallery, galleryColours } = normalizeGallery(b.images, b.imageColours ?? []);
    b.images = gallery;
    b.imageColours = galleryColours;
    b.image = gallery[0] || "";
  } else if (b.imageColours !== undefined) {
    // Colour tags sent without images — align to the current gallery length.
    const current = getProduct(id);
    b.imageColours = current.images.map((_, i) => b.imageColours[i] || "");
  }
  // Prune the combination stock map against the effective size/colour lists
  // (from this request if present, otherwise the product's current lists).
  if (b.variantStock !== undefined) {
    const current = getProduct(id);
    b.variantStock = pruneVariantStock(
      b.variantStock,
      b.sizes ?? current.sizes,
      b.colours ?? current.colours
    );
  }
  if (b.variantPrices !== undefined) {
    const current = getProduct(id);
    b.variantPrices = normalizeVariantPrices(
      b.variantPrices,
      b.sizes ?? current.sizes,
      b.colours ?? current.colours
    );
  }
  const map = {
    name: (v) => ["name = ?", v],
    description: (v) => ["description = ?", v],
    category: (v) => ["category = ?", v],
    price: (v) => ["price = ?", v],
    compareAtPrice: (v) => ["compare_at_price = ?", v],
    image: (v) => ["image = ?", v],
    images: (v) => ["images = ?", JSON.stringify(v)],
    imageColours: (v) => ["image_colours = ?", JSON.stringify(v)],
    sizes: (v) => ["sizes = ?", JSON.stringify(v)],
    colours: (v) => ["colours = ?", JSON.stringify(v)],
    variantStock: (v) => ["variant_stock = ?", JSON.stringify(v)],
    variantPrices: (v) => ["variant_prices = ?", JSON.stringify(v)],
    inStock: (v) => ["in_stock = ?", v ? 1 : 0],
    featured: (v) => ["featured = ?", v ? 1 : 0],
    newDrop: (v) => ["new_drop = ?", v ? 1 : 0],
  };
  const fields = [];
  const p = [];
  for (const [key, val] of Object.entries(b)) {
    if (val === undefined) continue;
    const [frag, param] = map[key](val);
    fields.push(frag);
    p.push(param);
  }
  if (fields.length) {
    fields.push("updated_at = datetime('now')");
    p.push(id);
    db.prepare(`UPDATE products SET ${fields.join(", ")} WHERE id = ?`).run(...p);
  }
  return ok({ product: getProduct(id) });
});

export const DELETE = route(async (_req, { params }) => {
  await requireStockAccess();
  const id = Number(await getRouteId(params));
  const info = db.prepare("DELETE FROM products WHERE id = ?").run(id);
  if (!info.changes) return fail(404, "Product not found.");
  return ok();
});
