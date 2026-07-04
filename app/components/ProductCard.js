"use client";
import Link from "next/link";
import { useStore, formatMoney } from "@/app/context/StoreProvider";
import { variantPricingSummary } from "@/lib/variants";

export default function ProductCard({ product }) {
  const { settings } = useStore();
  const soldOut = !product.inStock;
  const pricing = variantPricingSummary(product);

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex flex-col overflow-hidden border border-line bg-white transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-smoke">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt={product.name}
          className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${soldOut ? "opacity-60 grayscale" : ""}`}
          loading="lazy"
        />
        {product.featured && !soldOut && (
          <span className="absolute left-3 top-3 rounded-full bg-ink px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-paper">
            Featured
          </span>
        )}
        {soldOut && (
          <span className="absolute inset-x-0 bottom-0 bg-ink/90 py-2 text-center text-[11px] font-semibold uppercase tracking-widest text-paper">
            Sold out
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3.5">
        <span className="text-[11px] uppercase tracking-wide text-ash">{product.category}</span>
        <h3 className="mt-0.5 line-clamp-1 text-sm font-medium">{product.name}</h3>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-semibold">{formatPriceRange(pricing.priceMin, pricing.priceMax, settings.currency)}</span>
          {pricing.hasDiscount && (
            <span className="text-xs text-ash line-through">{formatPriceRange(pricing.compareAtMin, pricing.compareAtMax, settings.currency)}</span>
          )}
        </div>
        {pricing.hasDiscount && (
          <span className="mt-1 w-fit rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-600">
            Save {pricing.discountPercent}%
          </span>
        )}
      </div>
    </Link>
  );
}

function formatPriceRange(min, max, currency) {
  if (!max || min === max) return formatMoney(min, currency);
  return `${formatMoney(min, currency)} - ${formatMoney(max, currency)}`;
}
