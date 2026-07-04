"use client";
import { useMemo, useState } from "react";
import ProductCard from "@/app/components/ProductCard";

// Interactive shop grid. Products are server-rendered and passed in, so there's
// no fetch, no skeleton and no loading waterfall — filtering (search + category)
// happens in memory against the already-loaded list, so it's instant.
export default function ShopFilter({ products = [], initialCategory = "All" }) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState(initialCategory || "All");

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(products.map((p) => p.category)))],
    [products]
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return products.filter((p) => {
      const matchCat = category === "All" || p.category === category;
      const matchQ =
        !needle ||
        p.name.toLowerCase().includes(needle) ||
        (p.description || "").toLowerCase().includes(needle) ||
        p.category.toLowerCase().includes(needle);
      return matchCat && matchQ;
    });
  }, [products, q, category]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-5">
        <h1 className="font-display text-3xl font-bold">Shop</h1>
        <p className="mt-1 text-sm text-ash">Every piece, one place.</p>
      </div>

      {/* Search */}
      <div className="sticky top-16 z-30 -mx-4 mb-4 bg-paper/90 px-4 py-3 backdrop-blur-md sm:static sm:mx-0 sm:bg-transparent sm:p-0">
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ash">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
            </svg>
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products…"
            className="input pl-11"
            aria-label="Search products"
          />
        </div>

        {/* Category rail */}
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`chip whitespace-nowrap ${
                category === c ? "border-ink bg-ink text-paper" : "border-line text-ink hover:border-ink"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-line bg-smoke px-4 py-20 text-center text-sm text-ash">
          No products match your search.
        </p>
      ) : (
        <>
          <p className="mb-3 text-xs text-ash">{filtered.length} item{filtered.length !== 1 ? "s" : ""}</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
