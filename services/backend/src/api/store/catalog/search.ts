// Search public, fully priced Store API documents, never raw database relations.
export type CatalogFilters = {
  query?: string; category?: string; collection?: string; minPrice?: number; maxPrice?: number
  size?: string; color?: string; inStock?: boolean; sale?: boolean
  sort?: string; limit?: number; offset?: number
}
export type PublicProduct = Record<string, any>
const labels: Record<string, string> = {
  "پیراهن": "shirts", "تیشرت": "t-shirts", "شلوار": "trousers", "کت": "coats",
  "ست": "sets", "اکسسوری": "accessories", "پوشاک": "clothing",
}
const text = (value: unknown) => String(value ?? "").trim().toLowerCase()
const slug = (value: unknown) => text(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "collection"
const number = (value: unknown): number | null => value === null || value === undefined || value === "" || !Number.isFinite(Number(value)) ? null : Number(value)
const optionValues = (product: PublicProduct, names: string[]) => [...new Set<string>((product.variants || []).flatMap((variant: PublicProduct) =>
  (variant.options || []).filter((option: PublicProduct) => names.includes(text(option.option?.title || option.option_title || option.title)))
    .map((option: PublicProduct) => String(option.value || "")).filter(Boolean)))]

function document(product: PublicProduct) {
  const variants: PublicProduct[] = product.variants || []
  const priced = variants.map(variant => ({ variant, amount: number(variant.calculated_price?.calculated_amount_with_tax ?? variant.calculated_price?.calculated_amount ?? variant.calculated_price?.original_amount_with_tax ?? variant.calculated_price?.original_amount ?? variant.prices?.[0]?.amount) }))
    .filter(item => item.amount !== null).sort((a, b) => a.amount! - b.amount!)
  const variant = priced[0]?.variant || variants[0]
  const price = priced[0]?.amount ?? null
  const original = number(variant?.calculated_price?.original_amount_with_tax ?? variant?.calculated_price?.original_amount)
  const categoryName = product.categories?.[0]?.name || product.collection?.title || product.type?.value || product.metadata?.category || "Clothing"
  const category = labels[categoryName] || slug(categoryName)
  const collectionName = product.collection?.title || ""
  const sizes = optionValues(product, ["size", "سایز"])
  const colors = optionValues(product, ["color", "colour", "رنگ"])
  const inStock = !!variant && (!variant.manage_inventory || variant.allow_backorder || Number(variant.inventory_quantity) > 0)
  const sale = price !== null && original !== null && original > price || text(product.tags?.[0]?.value || product.tags?.[0]?.name) === "sale"
  const search = text([product.title, product.handle, product.description, product.metadata?.name_en,
    product.metadata?.name_fa, product.metadata?.description_fa, categoryName, collectionName, ...sizes, ...colors].join(" "))
  return { product, price, category, categoryName, collection: collectionName ? slug(collectionName) : "", collectionName,
    sizes, colors, inStock, sale, search, timestamp: Date.parse(product.created_at || "") || 0 }
}

export function searchCatalog(products: PublicProduct[], filters: CatalogFilters) {
  const documents = products.map(document)
  const selected = (value?: string) => value && text(value) !== "all"
  const matched = documents.filter(item =>
    (!filters.query || item.search.includes(text(filters.query))) &&
    (!selected(filters.category) || item.category === text(filters.category)) &&
    (!selected(filters.collection) || item.collection === text(filters.collection)) &&
    (filters.minPrice === undefined || item.price !== null && item.price >= filters.minPrice) &&
    (filters.maxPrice === undefined || item.price !== null && item.price <= filters.maxPrice) &&
    (!selected(filters.size) || item.sizes.some(size => text(size) === text(filters.size))) &&
    (!selected(filters.color) || item.colors.some(color => text(color) === text(filters.color))) &&
    (!filters.inStock || item.inStock) && (!filters.sale || item.sale))
  const order = filters.sort || "featured"
  if (order === "best-selling") throw new Error("Best-selling sorting requires verified sales data and is not available.")
  matched.sort((left, right) => {
    let difference = 0
    if (order === "price-asc" || order === "price-desc") {
      if (left.price === null && right.price !== null) return 1
      if (right.price === null && left.price !== null) return -1
      difference = ((left.price ?? 0) - (right.price ?? 0)) * (order === "price-desc" ? -1 : 1)
    } else if (order === "newest") difference = right.timestamp - left.timestamp
    else return 0 // Native catalog order is the featured order.
    return difference || String(left.product.id).localeCompare(String(right.product.id))
  })
  const categories = new Map<string, { slug: string; name: string; nameFa: string; count: number }>()
  const collections = new Map<string, { slug: string; name: string; nameFa: string; count: number }>()
  const sizes = new Set<string>(), colors = new Set<string>(), prices: number[] = []
  for (const item of documents) {
    const category = categories.get(item.category)
    categories.set(item.category, { slug: item.category, name: item.categoryName, nameFa: item.categoryName, count: (category?.count || 0) + 1 })
    if (item.collection) {
      const collection = collections.get(item.collection)
      collections.set(item.collection, { slug: item.collection, name: item.collectionName, nameFa: item.collectionName, count: (collection?.count || 0) + 1 })
    }
    item.sizes.forEach(size => sizes.add(size)); item.colors.forEach(color => colors.add(color))
    if (item.price !== null) prices.push(item.price)
  }
  const limit = Math.max(1, Math.min(100, filters.limit || 30))
  const count = matched.length
  const requested = Math.max(0, Math.floor((filters.offset || 0) / limit) * limit)
  const offset = count ? Math.min(requested, Math.floor((count - 1) / limit) * limit) : 0
  return { products: matched.slice(offset, offset + limit).map(item => item.product), count, offset, limit,
    facets: {
      availableCategories: [...categories.values()], availableCollections: [...collections.values()],
      availableSizes: [...sizes].sort(),
      availableColors: [...colors].sort().map(label => ({ value: text(label), label, labelFa: label, hex: "" })),
      priceBounds: { min: prices.length ? Math.min(...prices) : null, max: prices.length ? Math.max(...prices) : null },
      bestSellingAvailable: false, totalCount: documents.length,
    } }
}
