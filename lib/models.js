// Data-access helpers built on top of the shared SQLite connection.
const db = require("./db");
const { normalizeWhatsAppNumber } = require("./phone");
const { comboKey, normalizeVariantPrices } = require("./variants");
const { servedProductImageUrl } = require("./img");

// ---------- settings (key/value) ----------
function getSetting(key, fallback = "") {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key);
  return row ? row.value : fallback;
}

function setSetting(key, value) {
  db.prepare(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run(key, String(value ?? ""));
}

function getPublicSettings() {
  const whatsappNumber = normalizeWhatsAppNumber(getSetting("whatsapp_number", process.env.WHATSAPP_NUMBER || ""));
  return {
    storeName: getSetting("store_name", process.env.STORE_NAME || "Vintage Club"),
    whatsappNumber,
    currency: getSetting("currency", process.env.CURRENCY || "Rs."),
    logo: getSetting("store_logo", ""), // uploaded brand logo (data-URI) or ""
    paymentOptions: getPaymentOptions(),
  };
}

const PAYMENT_OPTIONS_DEFAULT = [
  { id: "koko", name: "KOKO", icon: "", enabled: true },
  { id: "mintpay", name: "mintpay", icon: "", enabled: true },
  { id: "payzy", name: "Payzy", icon: "", enabled: true },
];

function normalizePaymentOptions(options = []) {
  const byId = new Map(
    (Array.isArray(options) ? options : [])
      .map((o) => {
        const name = String(o?.name || "").trim().slice(0, 40);
        const id =
          String(o?.id || name)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "")
            .slice(0, 40) || "";
        if (!id || !name) return null;
        return [
          id,
          {
            id,
            name,
            icon: String(o?.icon || "").slice(0, 1_500_000),
            enabled: o?.enabled !== false,
          },
        ];
      })
      .filter(Boolean)
  );

  const merged = PAYMENT_OPTIONS_DEFAULT.map((d) => ({
    ...d,
    ...(byId.get(d.id) || {}),
  }));
  for (const option of byId.values()) {
    if (!merged.some((o) => o.id === option.id)) merged.push(option);
  }
  return merged.slice(0, 12);
}

function getPaymentOptions() {
  return normalizePaymentOptions(safeJson(getSetting("payment_options", "[]"), []));
}

function setPaymentOptions(options = []) {
  const normalized = normalizePaymentOptions(options);
  setSetting("payment_options", JSON.stringify(normalized));
  return normalized;
}

// ---------- master variant option lists (sizes / colours) ----------
// The pool of sizes & colours the product form offers as toggle chips. Admin
// can edit these in Settings; sensible defaults are used until they do.
const SIZE_OPTIONS_DEFAULT = ["XS", "S", "M", "L", "XL", "XXL"];
const COLOUR_OPTIONS_DEFAULT = ["Black", "White", "Grey", "Navy", "Beige", "Cream", "Green", "Brown"];

function getVariantOptions() {
  const sizes = safeJson(getSetting("sizes_master", "[]"), []);
  const colours = safeJson(getSetting("colours_master", "[]"), []);
  return {
    sizes: sizes.length ? sizes : SIZE_OPTIONS_DEFAULT,
    colours: colours.length ? colours : COLOUR_OPTIONS_DEFAULT,
  };
}

function setVariantOptions({ sizes, colours } = {}) {
  const clean = (arr) => [...new Set((arr || []).map((s) => String(s).trim()).filter(Boolean))];
  if (sizes !== undefined) setSetting("sizes_master", JSON.stringify(clean(sizes)));
  if (colours !== undefined) setSetting("colours_master", JSON.stringify(clean(colours)));
  return getVariantOptions();
}

// ---------- editable home-page content (admin CMS) ----------
const HOME_CONTENT_DEFAULTS = {
  hero_heading: "Timeless menswear, built to last.",
  hero_sub:
    "Monochrome staples and vintage-inspired tailoring. Add to bag and order in seconds — straight to WhatsApp, no account needed.",
  hero_image: "/images/hero-men.jpg",
  meta_left: "Menswear Label",
  meta_right: "Est. Vintage · Modern Classics",
  ticker:
    "Free islandwide delivery\nNew season drop\nOrder on WhatsApp\nMembers get first look\nModern vintage, every day",
  values_eyebrow: "Why Vintage Club",
  values_heading: "A better way to shop your next fit",
  values_intro:
    "Keep this section short and clear. These four cards explain what makes your store feel personal, trustworthy, and easy to order from.",
  value1_image: "",
  value1_icon: "",
  value1_title: "Free style advice",
  value1_text: "Message us anytime",
  value2_image: "",
  value2_icon: "",
  value2_title: "Order on WhatsApp",
  value2_text: "Fast, personal checkout",
  value3_image: "",
  value3_icon: "",
  value3_title: "Quality first",
  value3_text: "Built to last",
  value4_image: "",
  value4_icon: "",
  value4_title: "Islandwide delivery",
  value4_text: "Right to your door",
  quote: "Style isn’t bought by the season. It’s collected, worn, and remembered.",
  editorial_image: "/images/editorial.jpg",
  cta_heading: "Checkout in seconds",
  cta_text: "Add your favourites to the bag and order straight to our WhatsApp — no account needed.",

  // Lookbook section
  lookbook_label: "Lookbook",
  lookbook_heading: "Worn by the Club",
  look1_image: "/images/look-1.jpg",
  look1_tag: "Street",
  look1_label: "Denim, done right",
  look2_image: "/images/look-2.jpg",
  look2_tag: "Weekend",
  look2_label: "Everyday minimal",
  look3_image: "/images/look-3.jpg",
  look3_tag: "Basics",
  look3_label: "The essentials",

  // Footer statement block
  footer_eyebrow: "Vintage Club / Menswear store",
  footer_heading: "Let’s style",
  footer_tagline: "Sharp essentials for modern vintage dressing",
  footer_text: "Vintage-inspired staples, clean tailoring, and fast WhatsApp ordering with product links.",

  // About page — hero
  about_eyebrow: "About Vintage Club",
  about_since: "1999",
  about_heading: "Old fashion, made for right now.",
  about_intro:
    "Vintage Club is a Sri Lankan fashion label built on one belief — real style never goes out of fashion. What began as a family business in 1999 has grown into a premium, vintage-inspired brand loved by thousands.",
  about_image: "/images/editorial.jpg",
  about_image_alt: "Vintage Club store",

  // About page — founder's note
  about_founder_eyebrow: "Founder's Note",
  about_founder_heading: "From my father's shop to Vintage Club",
  about_founder_text:
    "Our story begins with my father, who opened his first clothing business in 1999 — I practically grew up inside it.\n\nAfter my A/Ls I studied fashion designing, and that is when I decided to build a brand of my own. I spent a long time searching for the right name. I almost went with \"Vintage Store\", but \"Vintage Club\" felt right — today's biggest trend is old fashion coming back, and I wanted a name that felt like a community built around it. That is how Vintage Club was born.",
  about_founder_name: "The Founder",
  about_founder_role: "Founder · Vintage Club",
  about_founder_image: "/images/look-1.jpg",

  // About page — journey timeline (six milestones, in order)
  about_timeline_eyebrow: "Our Journey",
  about_timeline_heading: "How Vintage Club grew",
  about_t1_year: "1999",
  about_t1_title: "A family beginning",
  about_t1_text: "My father opens his first clothing business, planting the seed for everything that comes next.",
  about_t2_year: "After A/L",
  about_t2_title: "Learning the craft",
  about_t2_text: "I study fashion designing and start shaping the idea of a brand of my own.",
  about_t3_year: "The name",
  about_t3_title: "Vintage Club is born",
  about_t3_text: "Inspired by the revival of old fashion, I choose the name Vintage Club over \"Vintage Store\".",
  about_t4_year: "2022",
  about_t4_title: "We go online",
  about_t4_text: "Vintage Club starts selling online and quickly builds a loyal following.",
  about_t5_year: "2024",
  about_t5_title: "Our first store",
  about_t5_text: "We open our very first physical store in Kinniya.",
  about_t6_year: "2025",
  about_t6_title: "Growing further",
  about_t6_text: "We open our second branch in Trincomalee.",

  // About page — stats band
  about_stat1_value: "9000+",
  about_stat1_label: "Online customers",
  about_stat2_value: "2",
  about_stat2_label: "Retail stores",
  about_stat3_value: "3",
  about_stat3_label: "Import countries",
  about_stat4_value: "1999",
  about_stat4_label: "Family roots",

  // About page — sourcing / quality
  about_story_heading: "Premium quality, carefully sourced",
  about_story:
    "We import premium-quality clothing from India, Dubai, and China — chosen for fabric, feel, and finish. Every piece is picked to look vintage but wear like new, so your wardrobe stays timeless season after season.",
  about_sourcing_countries: "India · Dubai · China",
  about_second_image: "/images/look-2.jpg",
  about_second_image_alt: "Premium imported clothing",

  // About page — values
  about_value1_title: "Premium imports",
  about_value1_text: "Handpicked pieces from India, Dubai, and China.",
  about_value2_title: "Vintage at heart",
  about_value2_text: "Old-fashion style, made for the way you dress today.",
  about_value3_title: "Still growing",
  about_value3_text: "9000+ customers online and two stores — and we're only getting started.",

  // About page — closing call to action
  about_cta_heading: "Be part of the Club",
  about_cta_text: "Three years in and still improving every day. Explore the latest arrivals and find your next piece.",
};

// Every editable value is stored under the `home_<key>` settings key.
function getHomeContent() {
  const out = {};
  for (const [k, def] of Object.entries(HOME_CONTENT_DEFAULTS)) {
    out[k] = getSetting(`home_${k}`, def);
  }
  return out;
}

function setHomeContent(patch = {}) {
  for (const k of Object.keys(HOME_CONTENT_DEFAULTS)) {
    if (patch[k] !== undefined) setSetting(`home_${k}`, patch[k]);
  }
  return getHomeContent();
}

// ---------- products ----------
function serializeProduct(row) {
  if (!row) return null;
  // Gallery: prefer the `images` array; fall back to the single `image` for
  // products created before multi-image support.
  let images = safeJson(row.images, []);
  if (!images.length && row.image) images = [row.image];
  const primary = images[0] || row.image || "";

  // Colour tag per image, aligned 1:1 with `images` ("" = untagged).
  const rawImageColours = safeJson(row.image_colours, []);
  const imageColours = images.map((_, i) => rawImageColours[i] || "");

  const sizes = safeJson(row.sizes, []);
  const colours = safeJson(row.colours, []);

  // Per-combination stock: a map of the combos that are SOLD OUT ("S::Black" →
  // false). A missing key means that combination is in stock.
  let variantStock = safeObj(row.variant_stock, {});
  // Legacy fallback: older rows stored independent size/colour sold-out flags.
  // Synthesize combos from them so nothing silently comes back in stock.
  if (Object.keys(variantStock).length === 0) {
    const legacySize = safeObj(row.size_stock, {});
    const legacyColour = safeObj(row.colour_stock, {});
    const hasLegacy =
      Object.values(legacySize).includes(false) || Object.values(legacyColour).includes(false);
    if (hasLegacy) {
      const rows = sizes.length ? sizes : [""];
      const cols = colours.length ? colours : [""];
      for (const s of rows)
        for (const c of cols)
          if (legacySize[s] === false || legacyColour[c] === false) variantStock[comboKey(s, c)] = false;
    }
  }

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    category: row.category,
    price: row.price,
    compareAtPrice: row.compare_at_price || 0,
    image: primary,   // primary image (cards, thumbnails, OG)
    images,           // full gallery
    imageColours,     // colour tag per image, aligned to `images`
    sizes,
    colours,
    variantStock,     // sold-out combos: { "S::Black": false, ... }  (missing = in stock)
    variantPrices: normalizeVariantPrices(safeObj(row.variant_prices, {}), sizes, colours),
    inStock: !!row.in_stock,
    featured: !!row.featured,
    newDrop: !!row.new_drop,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function safeJson(str, fallback) {
  try {
    const v = JSON.parse(str);
    return Array.isArray(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

// Parse a JSON object (non-array). Used for the per-variant stock maps.
function safeObj(str, fallback) {
  try {
    const v = JSON.parse(str);
    return v && typeof v === "object" && !Array.isArray(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

function listProducts({ publicOnly = false, category, search } = {}) {
  const clauses = [];
  const params = [];
  if (publicOnly) clauses.push("in_stock = 1");
  if (category && category !== "All") {
    clauses.push("category = ?");
    params.push(category);
  }
  if (search) {
    clauses.push("(name LIKE ? OR description LIKE ? OR category LIKE ?)");
    const q = `%${search}%`;
    params.push(q, q, q);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = db
    .prepare(`SELECT * FROM products ${where} ORDER BY featured DESC, created_at DESC`)
    .all(...params);
  return rows.map(serializeProduct);
}

// Lightweight card serializer — only the fields a ProductCard renders. Never
// includes image blobs: the primary image URL is derived from id + updatedAt.
function serializeCard(row) {
  const sizes = safeJson(row.sizes, []);
  const colours = safeJson(row.colours, []);
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    category: row.category,
    price: row.price,
    compareAtPrice: row.compare_at_price || 0,
    image: row.image_is_data ? servedProductImageUrl(row.id, row.updated_at) : row.image_ref || "",
    sizes,
    colours,
    variantPrices: normalizeVariantPrices(safeObj(row.variant_prices, {}), sizes, colours),
    inStock: !!row.in_stock,
    featured: !!row.featured,
    newDrop: !!row.new_drop,
  };
}

// Product list optimised for card grids (shop). Selects only card columns and
// avoids reading the (base64) image blobs — the CASE checks just the prefix, so
// a whole catalogue load stays tiny in memory. Description is kept for search.
function listProductCards({ publicOnly = false, category, search } = {}) {
  const clauses = [];
  const params = [];
  if (publicOnly) clauses.push("in_stock = 1");
  if (category && category !== "All") {
    clauses.push("category = ?");
    params.push(category);
  }
  if (search) {
    clauses.push("(name LIKE ? OR description LIKE ? OR category LIKE ?)");
    const q = `%${search}%`;
    params.push(q, q, q);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = db
    .prepare(
      `SELECT id, name, slug, description, category, price, compare_at_price,
              variant_prices, sizes, colours, in_stock, featured, new_drop, updated_at,
              CASE WHEN image LIKE 'data:%' THEN 1 ELSE 0 END AS image_is_data,
              CASE WHEN image LIKE 'data:%' THEN '' ELSE image END AS image_ref
       FROM products ${where}
       ORDER BY featured DESC, created_at DESC`
    )
    .all(...params);
  return rows.map(serializeCard);
}

function getProduct(idOrSlug) {
  const row = db
    .prepare("SELECT * FROM products WHERE id = ? OR slug = ?")
    .get(idOrSlug, String(idOrSlug));
  return serializeProduct(row);
}

// Headline product counts for dashboard/analytics. A single aggregate query so
// we never read the (base64) image blobs just to count rows.
function productStats() {
  const row = db
    .prepare(
      `SELECT COUNT(*) AS total,
              COALESCE(SUM(in_stock), 0) AS inStock,
              COALESCE(SUM(featured), 0) AS featured
       FROM products`
    )
    .get();
  return {
    total: row.total,
    inStock: row.inStock,
    outStock: row.total - row.inStock,
    featured: row.featured,
  };
}

// Read a single gallery image without pulling the whole row (used by the image
// route). Selects only the two image columns so serving a thumbnail never loads
// the entire base64 gallery for that product.
function getProductImage(id, index = 0) {
  const row = db
    .prepare("SELECT image, images FROM products WHERE id = ?")
    .get(Number(id));
  if (!row) return "";
  let images = safeJson(row.images, []);
  if (!images.length && row.image) images = [row.image];
  return images[index] || row.image || "";
}

function slugify(name) {
  const base = String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "item";
  let slug = base;
  let n = 1;
  while (db.prepare("SELECT 1 FROM products WHERE slug = ?").get(slug)) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

function categories() {
  const rows = db
    .prepare("SELECT DISTINCT category FROM products WHERE in_stock = 1 ORDER BY category")
    .all();
  return rows.map((r) => r.category);
}

// ---------- managed category tags (admin-curated master list) ----------
function listCategoryTags() {
  return db
    .prepare("SELECT id, name, image FROM categories ORDER BY name COLLATE NOCASE")
    .all();
}

function addCategoryTag(name) {
  const clean = String(name || "").trim();
  if (!clean) throw new Error("Category name is required.");
  db.prepare("INSERT INTO categories (name) VALUES (?)").run(clean);
  return db.prepare("SELECT id, name, image FROM categories WHERE name = ? COLLATE NOCASE").get(clean);
}

function setCategoryImage(id, image) {
  db.prepare("UPDATE categories SET image = ? WHERE id = ?").run(String(image || ""), Number(id));
  return db.prepare("SELECT id, name, image FROM categories WHERE id = ?").get(Number(id));
}

function deleteCategoryTag(id) {
  return db.prepare("DELETE FROM categories WHERE id = ?").run(Number(id)).changes > 0;
}

// ---------- leads / analytics ----------
// Record a lead (checkout handed to WhatsApp). Atomic: one leads row + N items.
function recordLead({ items = [], total = 0, customerName = "", customerPhone = "" }) {
  const clean = items
    .map((i) => ({
      productId: Number(i.productId) || null,
      name: String(i.name || "").slice(0, 120),
      size: String(i.size || "").slice(0, 40),
      colour: String(i.colour || "").slice(0, 40),
      qty: Math.max(1, Math.min(999, Math.floor(Number(i.qty) || 1))),
      price: Math.max(0, Number(i.price) || 0),
    }))
    .filter((i) => i.name);
  if (!clean.length) throw new Error("Cannot record an empty lead.");

  const itemCount = clean.reduce((n, i) => n + i.qty, 0);
  const computedTotal = clean.reduce((n, i) => n + i.qty * i.price, 0);
  const finalTotal = Number(total) > 0 ? Number(total) : computedTotal;

  const tx = db.transaction(() => {
    const info = db
      .prepare(
        `INSERT INTO leads (total, item_count, customer_name, customer_phone)
         VALUES (?, ?, ?, ?)`
      )
      .run(finalTotal, itemCount, String(customerName).slice(0, 120), String(customerPhone).slice(0, 40));
    const leadId = info.lastInsertRowid;
    const insItem = db.prepare(
      `INSERT INTO lead_items (lead_id, product_id, name, size, colour, qty, price)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    for (const i of clean) {
      insItem.run(leadId, i.productId, i.name, i.size, i.colour, i.qty, i.price);
    }
    return leadId;
  });
  return tx();
}

// Top-selling products, optionally within the last `days`. Single grouped query.
function bestSellers({ limit = 5, days = null } = {}) {
  const where = days ? "WHERE l.created_at >= datetime('now', ?)" : "";
  const params = days ? [`-${Number(days)} days`] : [];
  return db
    .prepare(
      `SELECT li.product_id AS productId,
              li.name       AS name,
              SUM(li.qty)                 AS units,
              SUM(li.qty * li.price)      AS revenue,
              COUNT(DISTINCT li.lead_id)  AS orders
       FROM lead_items li
       JOIN leads l ON l.id = li.lead_id
       ${where}
       GROUP BY COALESCE(li.product_id, li.name)
       ORDER BY units DESC, revenue DESC
       LIMIT ?`
    )
    .all(...params, Number(limit));
}

// Headline analytics for the dashboard.
function getLeadAnalytics() {
  const one = (sql, ...p) => db.prepare(sql).get(...p);

  const totals = one(
    `SELECT COUNT(*) AS leads, COALESCE(SUM(total), 0) AS revenue, COALESCE(SUM(item_count), 0) AS units FROM leads`
  );
  const today = one(`SELECT COUNT(*) AS c FROM leads WHERE created_at >= date('now', 'localtime')`).c;
  const last7 = one(`SELECT COUNT(*) AS c, COALESCE(SUM(total),0) AS rev FROM leads WHERE created_at >= datetime('now', '-7 days')`);
  const last30 = one(`SELECT COUNT(*) AS c, COALESCE(SUM(total),0) AS rev FROM leads WHERE created_at >= datetime('now', '-30 days')`);

  const totalLeads = totals.leads;
  return {
    totalLeads,
    leadsToday: today,
    leads7d: last7.c,
    leads30d: last30.c,
    intendedRevenue: totals.revenue,
    revenue7d: last7.rev,
    revenue30d: last30.rev,
    unitsSold: totals.units,
    avgOrderValue: totalLeads ? totals.revenue / totalLeads : 0,
  };
}

// Daily leads + revenue for the last `days` (zero-filled, oldest → newest).
function leadsDaily(days = 14) {
  return db
    .prepare(
      `WITH RECURSIVE days(day, idx) AS (
         SELECT date('now', ?), 0
         UNION ALL
         SELECT date(day, '+1 day'), idx + 1
         FROM days
         WHERE idx + 1 < ?
       ),
       totals AS (
         SELECT date(created_at) AS day, COUNT(*) AS leads, COALESCE(SUM(total), 0) AS revenue
         FROM leads
         WHERE created_at >= datetime('now', ?)
         GROUP BY date(created_at)
       )
       SELECT
         days.day AS date,
         CAST(strftime('%m', days.day) AS INTEGER) || '/' || CAST(strftime('%d', days.day) AS INTEGER) AS label,
         COALESCE(totals.leads, 0) AS leads,
         COALESCE(totals.revenue, 0) AS revenue
       FROM days
       LEFT JOIN totals ON totals.day = days.day
       ORDER BY days.day`
    )
    .all(`-${days - 1} days`, days, `-${days - 1} days`);
}

// Units + revenue grouped by the product's category (deleted products → "Other").
function salesByCategory() {
  return db
    .prepare(
      `SELECT COALESCE(p.category, 'Other') AS category,
              SUM(li.qty)             AS units,
              SUM(li.qty * li.price)  AS revenue
       FROM lead_items li
       LEFT JOIN products p ON p.id = li.product_id
       GROUP BY COALESCE(p.category, 'Other')
       ORDER BY units DESC`
    )
    .all();
}

// Recent leads (lightweight list for follow-up).
function recentLeads(limit = 8) {
  return db
    .prepare(
      `SELECT id, total, item_count AS itemCount, customer_name AS customerName,
              customer_phone AS customerPhone, created_at AS createdAt
       FROM leads ORDER BY created_at DESC LIMIT ?`
    )
    .all(Number(limit));
}

// ---------- users ----------
function serializeUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    role: row.role,
    active: !!row.active,
    createdAt: row.created_at,
  };
}

module.exports = {
  db,
  getSetting,
  setSetting,
  getPublicSettings,
  getPaymentOptions,
  setPaymentOptions,
  getVariantOptions,
  setVariantOptions,
  getHomeContent,
  setHomeContent,
  HOME_CONTENT_DEFAULTS,
  serializeProduct,
  serializeUser,
  listProducts,
  listProductCards,
  getProduct,
  getProductImage,
  productStats,
  slugify,
  categories,
  listCategoryTags,
  addCategoryTag,
  setCategoryImage,
  deleteCategoryTag,
  recordLead,
  bestSellers,
  getLeadAnalytics,
  recentLeads,
  leadsDaily,
  salesByCategory,
};
