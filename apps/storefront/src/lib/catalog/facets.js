import { buildCategories, buildCollections } from "./normalize";
import { hasRealSalesData } from "./filters";

export function catalogFacets(products) {
  const sizes = new Set(), colors = new Map(), prices = [];
  for (const product of products) {
    for (const size of product.sizes || []) sizes.add(String(size));
    for (const color of product.colors || []) {
      const label = typeof color === "string" ? color : color.label || color.labelFa;
      if (label) colors.set(label.toLowerCase(), { value: label.toLowerCase(), label,
        labelFa: color.labelFa || label, hex: color.hex || "" });
    }
    if (typeof product.priceAmount === "number" && Number.isFinite(product.priceAmount)) prices.push(product.priceAmount);
  }
  return { availableCategories: buildCategories(products), availableCollections: buildCollections(products),
    availableSizes: [...sizes].sort(), availableColors: [...colors.values()], totalCount: products.length,
    priceBounds: { min: prices.length ? Math.min(...prices) : null, max: prices.length ? Math.max(...prices) : null },
    bestSellingAvailable: products.some(hasRealSalesData) };
}
