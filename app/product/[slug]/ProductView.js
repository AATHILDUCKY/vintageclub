"use client";
import { useState } from "react";
import ProductGallery from "./ProductGallery";
import AddToCartPanel from "./AddToCartPanel";

// Shares the selected colour between the purchase panel and the gallery. The
// colour is picked from the swatches under the gallery (clicking a photo picks
// its colour too); the panel reacts to that choice for price, stock and buy.
export default function ProductView({ product }) {
  const hasColours = product.colours?.length > 0;
  const [colour, setColour] = useState(hasColours ? "" : "-");

  return (
    <div className="grid gap-6 sm:grid-cols-2 sm:gap-10">
      <ProductGallery
        images={product.images}
        imageColours={product.imageColours}
        name={product.name}
        inStock={product.inStock}
        hasColours={hasColours}
        activeColour={colour}
      />
      <AddToCartPanel product={product} colour={colour} setColour={setColour} />
    </div>
  );
}
