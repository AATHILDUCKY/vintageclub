"use client";
import { useEffect, useState } from "react";

// Main image + thumbnail strip. Falls back gracefully to a single image.
export default function ProductGallery({ images = [], imageColours = [], name, inStock = true, activeColour = "" }) {
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
      <div className="overflow-hidden rounded-3xl border border-line bg-smoke">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={gallery[active]}
          alt={`${name}${gallery.length > 1 ? ` — view ${active + 1}` : ""}`}
          className={`aspect-[4/5] w-full object-cover ${dim}`}
        />
      </div>

      {gallery.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2 sm:gap-3">
          {gallery.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              aria-current={i === active}
              className={`overflow-hidden rounded-xl border transition ${
                i === active ? "border-ink" : "border-line hover:border-ash"
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
