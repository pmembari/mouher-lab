import { describe, expect, it } from "vitest"

import { buildImportPlan, resolveCatalogPath } from "./catalog-import"

function baseProduct() {
  return {
    legacy_id: "2",
    product_code: "MHR-TRS-000002",
    title_fa: "شلوار تک پیله فاستونی",
    title_en: null,
    handle: null,
    description_fa: "توضیحات",
    is_visible: true,
    categories: [
      {
        legacy_id: "2",
        slug: "trousers",
        name: "Trousers",
        name_fa: "شلوار",
      },
    ],
    collections: [
      {
        legacy_id: "7",
        slug: "women",
        title: "Women",
        title_fa: "زنانه",
        quality_flags: [],
      },
    ],
    variants: [
      {
        legacy_id: "10",
        sku: "MHR-TRS-000002-BLK-S1",
        is_visible: true,
        source_price: 1200000,
        stock: 4,
        size: { name: "SIZE 1" },
        color: { name: "مشکی" },
        metadata: {
          legacy_variant_id: "10",
          legacy_variant_ids: ["10", "99"],
        },
      },
    ],
    media: {
      images: [
        {
          target_path: "products/MHR-TRS-000002/images/01.jpg",
        },
      ],
    },
    metadata: {
      legacy_product_id: "2",
      legacy_slug: "ppnngff",
    },
  }
}

describe("Mouher catalog import planner", () => {
  it("builds stable Medusa-ready product identity without inventing a canonical handle", () => {
    const plan = buildImportPlan([baseProduct()], {
      mediaBaseUrl: "https://media.mouher.test",
    })

    expect(plan.summary.errors).toBe(0)
    expect(plan.summary.products).toBe(1)
    expect(plan.summary.variants).toBe(1)

    const product = plan.products[0]
    expect(product.product_code).toBe("MHR-TRS-000002")
    expect(product.canonical_handle).toBeUndefined()
    expect(product.import_handle).toBe("mhr-trs-000002")
    expect(product.handle_pending_review).toBe(true)
    expect(product.category_slugs).toEqual(["trousers"])
    expect(product.collection_slug).toBe("women")
    expect(product.images).toEqual([
      "https://media.mouher.test/products/MHR-TRS-000002/images/01.jpg",
    ])
    expect(product.variants[0]).toMatchObject({
      sku: "MHR-TRS-000002-BLK-S1",
      source_price: 1200000,
      source_stock: 4,
      legacy_variant_ids: ["10", "99"],
    })
    expect(plan.issues).toContainEqual({
      level: "review",
      code: "temporary_product_code_handle",
      product_code: "MHR-TRS-000002",
    })
  })

  it("does not link ambiguous multi-collection products to one arbitrary Medusa collection", () => {
    const product = baseProduct()
    product.collections.push({
      legacy_id: "8",
      slug: "men",
      title: "Men",
      title_fa: "مردانه",
      quality_flags: [],
    })

    const plan = buildImportPlan([product])
    expect(plan.products[0].collection_slug).toBeUndefined()
    expect(plan.products[0].collection_slugs).toEqual(["women", "men"])
    expect(plan.issues).toContainEqual({
      level: "review",
      code: "multiple_collections_not_linked",
      product_code: "MHR-TRS-000002",
      detail: "women,men",
    })
  })

  it("rejects structurally invalid identity and duplicate SKUs", () => {
    const first = baseProduct()
    const second = baseProduct()
    second.legacy_id = "3"
    second.product_code = "MHR-TRS-000003"
    second.metadata.legacy_product_id = "3"

    const plan = buildImportPlan([first, second])
    expect(plan.issues).toContainEqual({
      level: "error",
      code: "duplicate_sku",
      detail: "MHR-TRS-000002-BLK-S1",
    })
  })

  it("keeps media absent until a public media base URL exists", () => {
    const plan = buildImportPlan([baseProduct()])
    expect(plan.products[0].images).toEqual([])
  })

  it("resolves the default generated catalog relative to the backend cwd", () => {
    expect(resolveCatalogPath("/repo/services/backend")).toBe(
      "/repo/data/Mouher_Data/clean/catalog.clean.json"
    )
  })

  it("reports importable and skipped products with specific legacy review reasons", () => {
    const importable = baseProduct()

    const hiddenOnly = baseProduct()
    hiddenOnly.legacy_id = "11"
    hiddenOnly.product_code = "MHR-SHT-000011"
    hiddenOnly.metadata.legacy_product_id = "11"
    hiddenOnly.variants = [
      {
        ...hiddenOnly.variants[0],
        legacy_id: "111",
        sku: "MHR-SHT-000011-BLK-S1",
        is_visible: false,
      },
    ]

    const noVariants = baseProduct()
    noVariants.legacy_id = "113"
    noVariants.product_code = "MHR-TRS-000113"
    noVariants.metadata.legacy_product_id = "113"
    noVariants.variants = []

    const plan = buildImportPlan([importable, hiddenOnly, noVariants])

    expect(plan.summary.planned_products).toBe(3)
    expect(plan.summary.importable_products).toBe(1)
    expect(plan.summary.skipped_products).toBe(2)
    expect(plan.issues).toContainEqual({
      level: "review",
      code: "legacy_visible_without_sellable_variant",
      product_code: "MHR-SHT-000011",
    })
    expect(plan.issues).toContainEqual({
      level: "review",
      code: "legacy_product_without_variants",
      product_code: "MHR-TRS-000113",
    })
  })

})
