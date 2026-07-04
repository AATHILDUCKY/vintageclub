import { listProductCards } from "@/lib/models";
import ShopFilter from "./ShopFilter";

export const dynamic = "force-dynamic"; // always reflect latest stock

// Metadata lives in app/shop/layout.js.
// Server-rendered: products ship in the initial HTML (no client fetch/skeleton
// waterfall). listProductCards is a light query that never reads image blobs.
export default async function ShopPage({ searchParams }) {
  const sp = (await searchParams) || {};
  const initialCategory = typeof sp.category === "string" ? sp.category : "All";
  const products = listProductCards({ publicOnly: true });

  return <ShopFilter products={products} initialCategory={initialCategory} />;
}
