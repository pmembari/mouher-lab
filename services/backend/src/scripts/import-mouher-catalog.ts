import fs from "node:fs"

import type { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createCollectionsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
} from "@medusajs/medusa/core-flows"

import {
  buildImportPlan,
  resolveCatalogPath,
  type ImportPlan,
  type PlannedProduct,
} from "../lib/catalog-import"

type ExistingRefs = {
  categories: Map<string, string>
  collections: Map<string, string>
  productCodes: Set<string>
}

function argValue(name: string): string | undefined {
  const prefix = `--${name}=`
  const entry = process.argv.find((value) => value.startsWith(prefix))
  return entry?.slice(prefix.length)
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`)
}

function parseMultiplier(value?: string): number | undefined {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

function readCatalog(filePath: string): any[] {
  const payload = JSON.parse(fs.readFileSync(filePath, "utf8"))
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.products)) return payload.products
  throw new Error("Catalog input must be an array or an object with a products array.")
}

function logPlan(logger: any, plan: ImportPlan, catalogPath: string, apply: boolean) {
  logger.info(
    [
      `Mouher catalog bridge: ${apply ? "APPLY" : "DRY RUN"}`,
      `input=${catalogPath}`,
      `products=${plan.summary.products}`,
      `variants=${plan.summary.variants}`,
      `categories=${plan.summary.categories}`,
      `collections=${plan.summary.collections}`,
      `errors=${plan.summary.errors}`,
      `reviews=${plan.summary.reviews}`,
    ].join(" ")
  )

  const grouped = new Map<string, number>()
  for (const issue of plan.issues) {
    grouped.set(issue.code, (grouped.get(issue.code) || 0) + 1)
  }
  for (const [code, count] of [...grouped.entries()].sort()) {
    logger.info(`catalog-import issue ${code}: ${count}`)
  }
}

async function existingRefs(query: any): Promise<ExistingRefs> {
  const [{ data: categories }, { data: collections }, { data: products }] =
    await Promise.all([
      query.graph({
        entity: "product_category",
        fields: ["id", "handle"],
      }),
      query.graph({
        entity: "product_collection",
        fields: ["id", "handle"],
      }),
      query.graph({
        entity: "product",
        fields: ["id", "external_id"],
      }),
    ])

  return {
    categories: new Map(
      categories
        .filter((category: any) => category.handle)
        .map((category: any) => [category.handle, category.id])
    ),
    collections: new Map(
      collections
        .filter((collection: any) => collection.handle)
        .map((collection: any) => [collection.handle, collection.id])
    ),
    productCodes: new Set(
      products.map((product: any) => product.external_id).filter(Boolean)
    ),
  }
}

async function ensureCategories(
  container: any,
  refs: ExistingRefs,
  plan: ImportPlan
) {
  const missing = plan.categories.filter(
    (category) => !refs.categories.has(category.slug)
  )
  if (!missing.length) return

  const { result } = await createProductCategoriesWorkflow(container).run({
    input: {
      product_categories: missing.map((category) => ({
        name: category.name,
        handle: category.slug,
        is_active: true,
        is_internal: false,
        metadata: {
          name_fa: category.name_fa,
          legacy_id: category.legacy_id,
        },
      })),
    },
  })

  for (const category of result) {
    refs.categories.set(category.handle, category.id)
  }
}

async function ensureCollections(
  container: any,
  refs: ExistingRefs,
  plan: ImportPlan
) {
  const missing = plan.collections.filter(
    (collection) => !refs.collections.has(collection.slug)
  )
  if (!missing.length) return

  const { result } = await createCollectionsWorkflow(container).run({
    input: {
      collections: missing.map((collection) => ({
        title: collection.title,
        handle: collection.slug,
        metadata: {
          title_fa: collection.title_fa,
          legacy_id: collection.legacy_id,
        },
      })),
    },
  })

  for (const collection of result) {
    refs.collections.set(collection.handle, collection.id)
  }
}

function productInput(
  product: PlannedProduct,
  refs: ExistingRefs,
  config: {
    currency?: string
    multiplier?: number
    salesChannelId?: string
    shippingProfileId?: string
  }
) {
  const categories = product.category_slugs
    .map((slug) => refs.categories.get(slug))
    .filter(Boolean)
    .map((id) => ({ id: id! }))

  const collectionId = product.collection_slug
    ? refs.collections.get(product.collection_slug)
    : undefined

  return {
    title: product.title,
    handle: product.import_handle,
    description: product.description,
    external_id: product.product_code,
    status:
      product.status === "published"
        ? ProductStatus.PUBLISHED
        : ProductStatus.DRAFT,
    collection_id: collectionId,
    categories,
    metadata: product.metadata,
    images: product.images.map((url) => ({ url })),
    options: product.options,
    variants: product.variants.map((variant) => ({
      title: variant.title,
      sku: variant.sku,
      manage_inventory: false,
      allow_backorder: false,
      options: variant.options,
      prices:
        config.currency && config.multiplier
          ? [
              {
                currency_code: config.currency.toLowerCase(),
                amount: Math.round(variant.source_price * config.multiplier),
              },
            ]
          : [],
      metadata: {
        legacy_variant_ids: variant.legacy_variant_ids,
        source_stock: variant.source_stock,
        source_price: variant.source_price,
      },
    })),
    sales_channels: config.salesChannelId
      ? [{ id: config.salesChannelId }]
      : undefined,
    shipping_profile_id: config.shippingProfileId,
  }
}

async function createMissingProducts(
  container: any,
  logger: any,
  refs: ExistingRefs,
  plan: ImportPlan,
  config: {
    currency?: string
    multiplier?: number
    salesChannelId?: string
    shippingProfileId?: string
  }
) {
  const importable = plan.products.filter(
    (product) => product.variants.length > 0 && product.options.length > 0
  )
  const skippedUnimportable = plan.products.length - importable.length
  const missing = importable.filter(
    (product) => !refs.productCodes.has(product.product_code)
  )
  const skippedExisting = importable.length - missing.length

  logger.info(
    `Mouher catalog apply: create=${missing.length} skip_existing=${skippedExisting} skip_unimportable=${skippedUnimportable}`
  )

  const batchSize = 25
  for (let index = 0; index < missing.length; index += batchSize) {
    const batch = missing.slice(index, index + batchSize)
    const { result } = await createProductsWorkflow(container).run({
      input: {
        products: batch.map((product) => productInput(product, refs, config)),
      },
    })
    for (const product of result) {
      if (product.external_id) refs.productCodes.add(product.external_id)
    }
    logger.info(
      `Mouher catalog apply: created batch ${index + 1}-${index + batch.length}`
    )
  }
}

export default async function importMouherCatalog({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const apply = hasFlag("apply")
  const catalogPath = resolveCatalogPath(
    process.cwd(),
    argValue("input") || process.env.MOUHER_CATALOG_PATH
  )
  const priceCurrency =
    argValue("price-currency") || process.env.MOUHER_PRICE_CURRENCY
  const priceMultiplier = parseMultiplier(
    argValue("price-multiplier") || process.env.MOUHER_PRICE_MULTIPLIER
  )
  const mediaBaseUrl =
    argValue("media-base-url") || process.env.MOUHER_MEDIA_BASE_URL

  const plan = buildImportPlan(readCatalog(catalogPath), {
    mediaBaseUrl,
    priceCurrency,
    priceMultiplier,
  })

  logPlan(logger, plan, catalogPath, apply)

  if (!apply) {
    logger.info("Dry run only. Re-run with --apply to write to Medusa.")
    return
  }

  if (plan.summary.errors) {
    throw new Error(
      `Refusing catalog import with ${plan.summary.errors} structural error(s).`
    )
  }

  if (!priceCurrency || !priceMultiplier) {
    throw new Error(
      "Apply requires explicit price configuration: --price-currency and --price-multiplier (or MOUHER_PRICE_CURRENCY / MOUHER_PRICE_MULTIPLIER)."
    )
  }

  const refs = await existingRefs(query)
  await ensureCategories(container, refs, plan)
  await ensureCollections(container, refs, plan)
  await createMissingProducts(container, logger, refs, plan, {
    currency: priceCurrency,
    multiplier: priceMultiplier,
    salesChannelId:
      argValue("sales-channel-id") || process.env.MOUHER_SALES_CHANNEL_ID,
    shippingProfileId:
      argValue("shipping-profile-id") ||
      process.env.MOUHER_SHIPPING_PROFILE_ID,
  })

  logger.info(
    "Mouher catalog bridge complete. Inventory levels are intentionally not written in this phase; source stock is preserved in variant metadata."
  )
}
