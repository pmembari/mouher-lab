export function slugify(value) {
  const slug = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "collection";
}

export function productPageHref(product) {
  return `#/products/${encodeURIComponent(
    product.handle || product.id
  )}`;
}

export function productDisplayName(product, isFarsi) {
  return isFarsi
    ? product.nameFa || product.name
    : product.name || product.nameFa;
}

export function productCategoryName(product, isFarsi) {
  return isFarsi
    ? product.categoryFa || product.category
    : product.category || product.categoryFa;
}

export function productCollectionName(product, isFarsi) {
  return isFarsi
    ? product.collectionFa || product.collection
    : product.collection || product.collectionFa;
}

export function productStockLabel(product, labels) {
  const stock = Number(product.stockCount);

  if (product.inStock === false || stock <= 0) {
    return labels.outOfStock;
  }

  if (Number.isFinite(stock) && stock <= 5) {
    return labels.lowStock;
  }

  return labels.inStock;
}

export function uniqueProducts(products) {
  const seen = new Set();

  return products.filter((product) => {
    if (seen.has(product.id)) {
      return false;
    }

    seen.add(product.id);
    return true;
  });
}