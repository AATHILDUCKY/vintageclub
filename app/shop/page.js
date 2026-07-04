"use client";
import { useEffect, useMemo, useState } from "react";
import ProductCard from "@/app/components/ProductCard";

export default function ShopPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    // Honor ?category= from the home-page category tiles.
    const param = new URLSearchParams(window.location.search).get("category");
    if (param) setCategory(param);
    setLoading(true);
    fetch("/api/products", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    return ["All", ...Array.from(new Set(products.map((p) => p.category)))];
  }, [products]);

  const filtered = products.filter((p) => {
    const matchCat = category === "All" || p.category === category;
    const needle = q.trim().toLowerCase();
    const matchQ =
      !needle ||
      p.name.toLowerCase().includes(needle) ||
      p.description.toLowerCase().includes(needle) ||
      p.category.toLowerCase().includes(needle);
    return matchCat && matchQ;
  });

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

      {loading ? (
        <SkeletonGrid />
      ) : filtered.length === 0 ? (
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

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-line">
          <div className="aspect-[4/5] animate-pulse bg-smoke" />
          <div className="space-y-2 p-3.5">
            <div className="h-3 w-1/3 animate-pulse rounded bg-smoke" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-smoke" />
          </div>
        </div>
      ))}
    </div>
  );
}
