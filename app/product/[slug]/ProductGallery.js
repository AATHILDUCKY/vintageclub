"use client";
import { useEffect, useState } from "react";

// Main image. When the product has colours, the colour picker (ColourSwatches,
// rendered in the purchase panel) drives which photo shows here. When it has no
// colours but several photos, a thumbnail strip provides navigation.
export default function ProductGallery({
  images = [],
  imageColours = [],
  name,
  inStock = true,
  hasColours = false,
  activeColour = "",
}) {
  const gallery = images.length ? images : [""];
  const [active, setActive] = useState(0);
  const dim = inStock ? "" : "opacity-70 grayscale";

  // When the shopper picks a colour, jump to the first photo tagged with it.
  useEffect(() => {
    if (!activeColour || activeColour === "-") return;
    const idx = imageColours.findIndex((c) => c === activeColour);
    if (idx >= 0) setActive(idx);
  }, [activeColour, imageColours]);

  return (
    <div>
      <div className="relative overflow-hidden rounded-3xl border border-line bg-smoke">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={gallery[active]}
          alt={`${name}${gallery.length > 1 ? ` — view ${active + 1}` : ""}`}
          className={`aspect-[4/5] w-full object-cover ${dim}`}
          loading="eager"
          fetchPriority="high"
        />
        {hasColours && activeColour && activeColour !== "-" && (
          <span className="absolute left-3 top-3 rounded-full bg-ink/85 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-paper backdrop-blur-sm">
            {activeColour}
          </span>
        )}
      </div>

      {/* Thumbnail strip — only when there are no colours to pick from (colours
          drive the main image via the picker in the purchase panel). */}
      {gallery.length > 1 && !hasColours && (
        <div className="mt-3 grid grid-cols-5 gap-2 sm:gap-3">
          {gallery.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              aria-current={i === active}
              className={`overflow-hidden rounded-xl border transition ${
                i === active ? "border-ink ring-2 ring-ink" : "border-line hover:border-ash"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className={`aspect-square w-full object-cover ${dim}`} loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
