import path from "node:path"

export type ImportIssue = {
  level: "error" | "review"
  code: string
  product_code?: string
  detail?: string
}

export type ImportPlan = {
  products: PlannedProduct[]
  categories: PlannedCategory[]
  collections: PlannedCollection[]
  issues: ImportIssue[]
  summary: {
    products: number
    planned_products: number
    importable_products: number
    skipped_products: number
    variants: number
    categories: number
    collections: number
    errors: number
    reviews: number
  }
}

export type PlannedCategory = {
  slug: string
  name: string
  name_fa?: string
  legacy_id?: string
}

export type PlannedCollection = {
  slug: string
  title: string
  title_fa?: string
  legacy_id?: string
}

export type PlannedVariant = {
  sku: string
  title: string
  options: Record<string, string>
  source_price: number
  source_stock: number
  legacy_variant_ids: string[]
}

export type PlannedProduct = {
  product_code: string
  title: string
  description?: string
  canonical_handle?: string
  import_handle: string
  handle_pending_review: boolean
  status: "published" | "draft"
  category_slugs: string[]
  collection_slug?: string
  collection_slugs: string[]
  options: { title: string; values: string[] }[]
  variants: PlannedVariant[]
  images: string[]
  metadata: Record<string, unknown>
}

type BridgeConfig = {
  mediaBaseUrl?: string
  priceCurrency?: string
  priceMultiplier?: number
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const PRODUCT_CODE_RE = /^MHR-[A-Z]{3}-\d{6}$/

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)]
}

function usableCollection(collection: any): boolean {
  const slug = text(collection?.slug)
  const flags = Array.isArray(collection?.quality_flags) ? collection.quality_flags : []
  return Boolean(slug && SLUG_RE.test(slug) && !flags.includes("collection_needs_review"))
}

function mediaUrl(base: string | undefined, targetPath: string): string | null {
  if (!base || !targetPath) return null
  return `${base.replace(/\/$/, "")}/${targetPath.replace(/^\//, "")}`
}

function normalizeLegacyIds(variant: any): string[] {
  const metadata = variant?.metadata || {}
  const ids = Array.isArray(metadata.legacy_variant_ids)
    ? metadata.legacy_variant_ids.map(String)
    : []
  const active = text(metadata.legacy_variant_id || variant?.legacy_id)
  return unique([...(active ? [active] : []), ...ids.filter(Boolean)])
}

function variantOptions(variant: any): Record<string, string> {
  const size = text(variant?.size?.name)
  const color = text(variant?.color?.name)
  const options: Record<string, string> = {}
  if (size) options.Size = size
  if (color) options.Color = color
  return options
}

function buildOptions(variants: PlannedVariant[]) {
  const values = new Map<string, Set<string>>()
  for (const variant of variants) {
    for (const [title, value] of Object.entries(variant.options)) {
      if (!values.has(title)) values.set(title, new Set())
      values.get(title)!.add(value)
    }
  }
  return [...values.entries()].map(([title, set]) => ({
    title,
    values: [...set],
  }))
}

export function buildImportPlan(rawProducts: any[], config: BridgeConfig = {}): ImportPlan {
  const issues: ImportIssue[] = []
  const categoryMap = new Map<string, PlannedCategory>()
  const collectionMap = new Map<string, PlannedCollection>()
  const products: PlannedProduct[] = []

  for (const raw of rawProducts) {
    const productCode = text(raw.product_code)
    if (!PRODUCT_CODE_RE.test(productCode)) {
      issues.push({ level: "error", code: "invalid_product_code", detail: productCode || "missing" })
      continue
    }

    const title = text(raw.title_fa)
    if (!title) {
      issues.push({ level: "error", code: "missing_title_fa", product_code: productCode })
      continue
    }

    const categories = Array.isArray(raw.categories) ? raw.categories : []
    const categorySlugs: string[] = unique<string>(
      categories
        .map((category: any): string => text(category.slug))
        .filter((slug: string) => SLUG_RE.test(slug))
    )
    for (const category of categories) {
      const slug = text(category.slug)
      if (!SLUG_RE.test(slug)) continue
      categoryMap.set(slug, {
        slug,
        name: text(category.name) || slug,
        name_fa: text(category.name_fa) || undefined,
        legacy_id: text(category.legacy_id) || undefined,
      })
    }

    const collections = Array.isArray(raw.collections) ? raw.collections : []
    const usableCollections: any[] = collections.filter(usableCollection)
    const collectionSlugs: string[] = unique<string>(
      usableCollections.map((collection: any): string => text(collection.slug))
    )
    for (const collection of usableCollections) {
      const slug = text(collection.slug)
      collectionMap.set(slug, {
        slug,
        title: text(collection.title) || slug,
        title_fa: text(collection.title_fa) || undefined,
        legacy_id: text(collection.legacy_id) || undefined,
      })
    }
    if (collectionSlugs.length > 1) {
      issues.push({
        level: "review",
        code: "multiple_collections_not_linked",
        product_code: productCode,
        detail: collectionSlugs.join(","),
      })
    }

    const rawVariants = Array.isArray(raw.variants) ? raw.variants : []
    const visibleRawVariants = rawVariants.filter((variant: any) => variant?.is_visible)

    const variants: PlannedVariant[] = []
    for (const rawVariant of rawVariants) {
      if (!rawVariant?.is_visible) continue
      const sku = text(rawVariant.sku)
      if (!sku) {
        issues.push({
          level: "review",
          code: "visible_variant_without_sku",
          product_code: productCode,
          detail: text(rawVariant.legacy_id),
        })
        continue
      }
      const options = variantOptions(rawVariant)
      if (!Object.keys(options).length) {
        issues.push({ level: "error", code: "variant_without_options", product_code: productCode, detail: sku })
        continue
      }
      variants.push({
        sku,
        title: Object.values(options).join(" / "),
        options,
        source_price: Number(rawVariant.source_price || 0),
        source_stock: Number(rawVariant.stock || 0),
        legacy_variant_ids: normalizeLegacyIds(rawVariant),
      })
    }

    if (!variants.length) {
      issues.push({ level: "review", code: "product_without_importable_variants", product_code: productCode })
      if (!rawVariants.length) {
        issues.push({ level: "review", code: "legacy_product_without_variants", product_code: productCode })
      } else if (!visibleRawVariants.length) {
        issues.push({
          level: "review",
          code: "legacy_visible_without_sellable_variant",
          product_code: productCode,
        })
      }
    }

    const canonicalHandle = text(raw.handle)
    const importHandle = canonicalHandle || productCode.toLowerCase()
    if (!canonicalHandle) {
      issues.push({ level: "review", code: "temporary_product_code_handle", product_code: productCode })
    }

    const images = (raw.media?.images || [])
      .map((image: any) => mediaUrl(config.mediaBaseUrl, text(image.target_path)))
      .filter(Boolean) as string[]

    products.push({
      product_code: productCode,
      title,
      description: text(raw.description_fa) || undefined,
      canonical_handle: canonicalHandle || undefined,
      import_handle: importHandle,
      handle_pending_review: !canonicalHandle,
      status: raw.is_visible === false ? "draft" : "published",
      category_slugs: categorySlugs,
      collection_slug: collectionSlugs.length === 1 ? collectionSlugs[0] : undefined,
      collection_slugs: collectionSlugs,
      options: buildOptions(variants),
      variants,
      images,
      metadata: {
        product_code: productCode,
        legacy_product_id: text(raw.metadata?.legacy_product_id || raw.legacy_id) || undefined,
        legacy_slug: text(raw.metadata?.legacy_slug) || undefined,
        legacy_upc: text(raw.metadata?.legacy_upc || raw.upc) || undefined,
        title_fa: title,
        title_en: text(raw.title_en) || undefined,
        description_fa: text(raw.description_fa) || undefined,
        description_en: text(raw.description_en) || undefined,
        canonical_handle_pending: !canonicalHandle,
        legacy_collection_slugs: collections.map((c: any) => text(c.slug)).filter(Boolean),
      },
    })
  }

  const skuCounts = new Map<string, number>()
  for (const product of products) {
    for (const variant of product.variants) {
      skuCounts.set(variant.sku, (skuCounts.get(variant.sku) || 0) + 1)
    }
  }
  for (const [sku, count] of skuCounts) {
    if (count > 1) issues.push({ level: "error", code: "duplicate_sku", detail: sku })
  }

  const handleCounts = new Map<string, number>()
  for (const product of products) {
    handleCounts.set(product.import_handle, (handleCounts.get(product.import_handle) || 0) + 1)
  }
  for (const [handle, count] of handleCounts) {
    if (count > 1) issues.push({ level: "error", code: "duplicate_import_handle", detail: handle })
  }

  const importableProducts = products.filter(
    (product) => product.variants.length > 0 && product.options.length > 0
  )

  return {
    products,
    categories: [...categoryMap.values()],
    collections: [...collectionMap.values()],
    issues,
    summary: {
      products: products.length,
      planned_products: products.length,
      importable_products: importableProducts.length,
      skipped_products: products.length - importableProducts.length,
      variants: products.reduce((sum, product) => sum + product.variants.length, 0),
      categories: categoryMap.size,
      collections: collectionMap.size,
      errors: issues.filter((issue) => issue.level === "error").length,
      reviews: issues.filter((issue) => issue.level === "review").length,
    },
  }
}

export function resolveCatalogPath(cwd: string, configured?: string) {
  return path.resolve(cwd, configured || "../../data/Mouher_Data/clean/catalog.clean.json")
}
