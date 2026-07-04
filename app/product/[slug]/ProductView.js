"use client";
import { useState } from "react";
import ProductGallery from "./ProductGallery";
import AddToCartPanel from "./AddToCartPanel";

// Shares the selected colour between the purchase panel and the gallery, so
// choosing a colour scrolls the gallery to the photo tagged with that colour.
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
        activeColour={colour}
      />
      <AddToCartPanel product={product} colour={colour} setColour={setColour} />
    </div>
  );
}
