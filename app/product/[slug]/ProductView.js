"use client";
import { useState } from "react";
import ProductGallery from "./ProductGallery";
import AddToCartPanel from "./AddToCartPanel";
import { comboKey } from "@/lib/variants";

// Shares the selected colour between the purchase panel and the gallery. The
// colour is picked from the swatches under the gallery (clicking a photo picks
// its colour too); the panel reacts to that choice for price, stock and buy.
export default function ProductView({ product }) {
  const hasColours = product.colours?.length > 0;
  const [colour, setColour] = useState(hasColours ? "" : "-");

  // Colours with every size combination sold out — shown crossed-out.
  const variantStock = product.variantStock || {};
  const sizePool = product.sizes?.length ? product.sizes : [""];
  const soldOutColours = (product.colours || []).filter((c) =>
    sizePool.every((s) => variantStock[comboKey(s, c)] === false)
  );

  return (
    <div className="grid gap-6 sm:grid-cols-2 sm:gap-10">
      <ProductGallery
        images={product.images}
        imageColours={product.imageColours}
        name={product.name}
        inStock={product.inStock}
        colours={product.colours || []}
        soldOutColours={soldOutColours}
        activeColour={colour}
        onColour={setColour}
      />
      <AddToCartPanel product={product} colour={colour} setColour={setColour} />
    </div>
  );
}
