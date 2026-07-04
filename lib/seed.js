// Idempotent seeder. Run with `npm run seed`.
// - Creates the initial admin from .env (only if it doesn't already exist).
// - Seeds store settings from .env (only if unset).
// - Adds sample products the first time (only if the table is empty).
try {
  // Load .env manually (no dotenv dependency needed).
  const fs = require("fs");
  const path = require("path");
  const envPath = path.join(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
      const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
      if (m && !line.trim().startsWith("#")) {
        const key = m[1];
        let val = m[2].replace(/^["']|["']$/g, "");
        if (process.env[key] === undefined) process.env[key] = val;
      }
    }
  }
} catch {}

const bcrypt = require("bcryptjs");
const db = require("./db");
const { setSetting, getSetting, slugify } = require("./models");

function seedCategories() {
  const count = db.prepare("SELECT COUNT(*) AS c FROM categories").get().c;
  if (count > 0) {
    console.log(`✓ Categories already present (${count}) — skipping.`);
    return;
  }
  const defaults = ["Tees", "Outerwear", "Bottoms", "Knitwear", "Accessories"];
  const insert = db.prepare("INSERT OR IGNORE INTO categories (name) VALUES (?)");
  const tx = db.transaction((names) => names.forEach((n) => insert.run(n)));
  tx(defaults);
  console.log(`✓ Inserted ${defaults.length} default categories.`);
}

function seedAdmin() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const name = process.env.ADMIN_NAME || "Store Owner";
  const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
  if (existing) {
    console.log(`✓ Admin "${username}" already exists — left unchanged.`);
    return;
  }
  const hash = bcrypt.hashSync(password, 10);
  db.prepare(
    "INSERT INTO users (username, name, password, role, active) VALUES (?, ?, ?, 'admin', 1)"
  ).run(username, name, hash);
  console.log(`✓ Created admin "${username}" (change the password after first login).`);
}

function seedSettings() {
  const defaults = {
    store_name: process.env.STORE_NAME || "Vintage Club",
    whatsapp_number: process.env.WHATSAPP_NUMBER || "",
    currency: process.env.CURRENCY || "Rs.",
  };
  for (const [k, v] of Object.entries(defaults)) {
    if (getSetting(k, null) === null) {
      setSetting(k, v);
      console.log(`✓ Setting "${k}" = "${v}"`);
    }
  }
}

function seedProducts() {
  const count = db.prepare("SELECT COUNT(*) AS c FROM products").get().c;
  if (count > 0) {
    console.log(`✓ Products already present (${count}) — skipping samples.`);
    return;
  }
  const samples = [
    {
      name: "Heritage Oversized Tee",
      category: "Tees",
      price: 3200,
      description: "Heavyweight 240gsm cotton with a relaxed vintage drape. Garment-dyed for a lived-in feel.",
      sizes: ["S", "M", "L", "XL"],
      colours: ["Black", "White", "Washed Grey"],
      featured: 1,
      image: placeholder("HERITAGE TEE"),
    },
    {
      name: "Faded Denim Jacket",
      category: "Outerwear",
      price: 8900,
      description: "Classic trucker cut in rigid denim with authentic stone-wash fading and antique buttons.",
      sizes: ["S", "M", "L", "XL"],
      colours: ["Indigo", "Black"],
      featured: 1,
      image: placeholder("DENIM JACKET"),
    },
    {
      name: "Retro Corduroy Cap",
      category: "Accessories",
      price: 2100,
      description: "6-panel corduroy cap with an embroidered club crest and adjustable strap.",
      sizes: ["One Size"],
      colours: ["Cream", "Black", "Olive"],
      featured: 0,
      image: placeholder("CORD CAP"),
    },
    {
      name: "Washed Cargo Trousers",
      category: "Bottoms",
      price: 6400,
      description: "Utility cargo with a tapered leg, six pockets and a soft enzyme wash.",
      sizes: ["28", "30", "32", "34", "36"],
      colours: ["Stone", "Black"],
      featured: 1,
      image: placeholder("CARGO PANTS"),
    },
    {
      name: "Club Knit Sweater",
      category: "Knitwear",
      price: 7200,
      description: "Chunky ribbed knit in a boxy fit. Warm, breathable lambswool blend.",
      sizes: ["S", "M", "L"],
      colours: ["Charcoal", "Ivory"],
      featured: 0,
      image: placeholder("KNIT SWEATER"),
    },
    {
      name: "Vintage Graphic Hoodie",
      category: "Outerwear",
      price: 5600,
      description: "Brushed-back fleece hoodie with a screen-printed retro club graphic.",
      sizes: ["S", "M", "L", "XL"],
      colours: ["Black", "Ash Grey"],
      featured: 1,
      image: placeholder("HOODIE"),
    },
  ];

  const insert = db.prepare(
    `INSERT INTO products (name, slug, description, category, price, image, sizes, colours, in_stock, featured)
     VALUES (@name, @slug, @description, @category, @price, @image, @sizes, @colours, 1, @featured)`
  );
  const tx = db.transaction((items) => {
    for (const p of items) {
      insert.run({
        ...p,
        slug: slugify(p.name),
        sizes: JSON.stringify(p.sizes),
        colours: JSON.stringify(p.colours),
      });
    }
  });
  tx(samples);
  console.log(`✓ Inserted ${samples.length} sample products.`);
}

// Inline SVG placeholder (monochrome) so the app has imagery with zero external assets.
function placeholder(label) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='1000'>
    <rect width='100%' height='100%' fill='#0a0a0a'/>
    <rect x='24' y='24' width='752' height='952' fill='none' stroke='#3f3f46' stroke-width='2'/>
    <text x='50%' y='47%' fill='#ffffff' font-family='Georgia, serif' font-size='30' letter-spacing='8' text-anchor='middle'>VINTAGE CLUB</text>
    <text x='50%' y='53%' fill='#a1a1aa' font-family='Arial' font-size='22' letter-spacing='4' text-anchor='middle'>${label}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const { recordLead } = require("./models");

function seedLeads() {
  const count = db.prepare("SELECT COUNT(*) AS c FROM leads").get().c;
  if (count > 0) {
    console.log(`✓ Leads already present (${count}) — skipping demo leads.`);
    return;
  }
  const prods = db.prepare("SELECT id, name, price FROM products").all();
  if (!prods.length) return;
  const pick = (n) => prods[n % prods.length];
  const demo = [
    { name: "Nimal Perera", phone: "94771234567", lines: [[0, 2], [3, 1]] },
    { name: "Ayesha F.", phone: "94761112223", lines: [[0, 1], [5, 1]] },
    { name: "Kasun R.", phone: "94701234567", lines: [[3, 2]] },
    { name: "Tharindu", phone: "94759876543", lines: [[0, 1], [1, 1], [5, 2]] },
    { name: "Sanduni", phone: "94778889990", lines: [[5, 1]] },
  ];
  for (const d of demo) {
    const items = d.lines.map(([idx, qty]) => {
      const p = pick(idx);
      return { productId: p.id, name: p.name, qty, price: p.price };
    });
    recordLead({ items, customerName: d.name, customerPhone: d.phone });
  }
  console.log(`✓ Inserted ${demo.length} demo leads (remove real ones any time).`);
}

function main() {
  seedAdmin();
  seedSettings();
  seedCategories();
  seedProducts();
  seedLeads();
  console.log("\nSeed complete.");
}

module.exports = {
  main,
  seedAdmin,
  seedSettings,
  seedCategories,
  seedProducts,
  seedLeads,
};

// Only run the full demo seed when invoked directly (`npm run seed`),
// not when required by scripts/init-db.js.
if (require.main === module) {
  main();
}
