"use client";

// Colour-name → CSS mapping so untagged colours still show a real dot. Falls
// back to a neutral gradient for anything we don't recognise.
const COLOUR_CSS = {
  black: "#111111", white: "#ffffff", ivory: "#f8f4ea", cream: "#f3ead6",
  grey: "#8a8a8a", gray: "#8a8a8a", charcoal: "#36393d", ash: "#b8bcc0",
  navy: "#1f2a44", blue: "#2f5bd0", indigo: "#33406b", denim: "#3b5a7a",
  green: "#3f7d54", olive: "#6b6b3a", beige: "#d9c8a9", stone: "#cabfa8",
  brown: "#6b4a30", tan: "#b98d5f", red: "#c23b3b", pink: "#e0a0b4",
  yellow: "#e6c34a", orange: "#d98032", purple: "#6d4a8c",
};

function colourCss(name) {
  const n = String(name || "").toLowerCase();
  for (const key of Object.keys(COLOUR_CSS)) {
    if (n.includes(key)) return COLOUR_CSS[key];
  }
  return null;
}

// Colour picker shown as larger, viewable photo boxes + names. Each colour uses
// the first product photo tagged with it, so patterns/shades are visible. Picks
// are lifted to the parent so the main gallery image follows the selection.
export default function ColourSwatches({
  colours = [],
  imageColours = [],
  images = [],
  soldOutColours = [],
  colour = "",
  onColour,
}) {
  if (!colours.length) return null;
  const gallery = images.length ? images : [""];

  return (
    <div className="mt-6">
      <div className="mb-2 flex items-baseline justify-between">
        <p className="label mb-0">Colour</p>
        {colour && colour !== "-" && (
          <span className="text-xs font-medium text-ink">{colour}</span>
        )}
      </div>
      <div className="flex flex-wrap gap-2.5 sm:gap-3">
        {colours.map((c) => {
          const selected = c === colour;
          const soldOut = soldOutColours.includes(c);
          const css = colourCss(c);
          const imgIdx = imageColours.findIndex((tag) => tag === c);
          const swatchImg = imgIdx >= 0 ? gallery[imgIdx] : null;
          return (
            <button
              key={c}
              type="button"
              onClick={() => onColour && onColour(c)}
              aria-pressed={selected}
              title={soldOut ? `${c} — sold out` : c}
              className="group flex w-[72px] flex-col items-center gap-1.5 sm:w-20"
            >
              <span
                className={`relative block aspect-square w-full overflow-hidden rounded-xl border transition ${
                  selected ? "border-ink ring-2 ring-ink" : "border-line group-hover:border-ash"
                } ${soldOut ? "opacity-60" : ""}`}
              >
                {swatchImg ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={swatchImg}
                    alt={c}
                    className={`h-full w-full object-cover ${soldOut ? "grayscale" : ""}`}
                    loading="lazy"
                  />
                ) : (
                  <span
                    className="block h-full w-full"
                    style={
                      css
                        ? { backgroundColor: css }
                        : { backgroundImage: "linear-gradient(135deg,#e5e5e5,#a3a3a3)" }
                    }
                  />
                )}
                {soldOut && (
                  <span className="absolute inset-x-0 bottom-0 bg-ink/80 py-0.5 text-center text-[8px] font-semibold uppercase tracking-wide text-paper">
                    Sold
                  </span>
                )}
              </span>
              <span
                className={`w-full truncate text-center text-[11px] font-medium leading-tight ${
                  selected ? "text-ink" : "text-ash"
                } ${soldOut ? "line-through" : ""}`}
              >
                {c}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
