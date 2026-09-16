import { currentMouherCatalog } from "../data/currentMouherCatalog.js";
import { demoCatalog } from "../data/demoCatalog.js";

const CATEGORY_LABELS = {
  "پیراهن": { name: "Shirts", nameFa: "پیراهن", slug: "shirts" },
  "تیشرت": { name: "T-shirts", nameFa: "تیشرت", slug: "t-shirts" },
  "شلوار": { name: "Trousers", nameFa: "شلوار", slug: "trousers" },
  "کت": { name: "Coats", nameFa: "کت", slug: "coats" },
  "ست": { name: "Sets", nameFa: "ست", slug: "sets" },
  "اکسسوری": { name: "Accessories", nameFa: "اکسسوری", slug: "accessories" },
  "پوشاک": { name: "Clothing", nameFa: "پوشاک", slug: "clothing" },
};

const fallbackCatalog = currentMouherCatalog || demoCatalog;
function loadStaticFallbackCatalog(notice = "") {
  return {
    ...fallbackCatalog,
    notice,
  };
}
const EMPTY_CATALOG = {
  products: [],
  categories: [],
  collections: [],
  source: "api",
  featuredImage: "",
  merchandising: {},
  notice: "",
};

const viteEnv = import.meta.env || {};

export const medusaConfig = {
  mouherApiUrl: stripTrailingSlash(viteEnv.VITE_MOUHER_API_URL || ""),
  backendUrl: stripTrailingSlash(viteEnv.VITE_MEDUSA_BACKEND_URL || ""),
  publishableKey: viteEnv.VITE_MEDUSA_PUBLISHABLE_KEY || "",
  regionId: viteEnv.VITE_MEDUSA_REGION_ID || "",
  countryCode: viteEnv.VITE_MEDUSA_COUNTRY_CODE || "",
  currencyCode: viteEnv.VITE_MEDUSA_CURRENCY_CODE || "",
  productFields: viteEnv.VITE_MEDUSA_PRODUCT_FIELDS || "",
  productLimit: optionalNumber(viteEnv.VITE_MEDUSA_PRODUCT_LIMIT),
  allowStaticCatalogFallback: truthy(viteEnv.VITE_ALLOW_STATIC_CATALOG_FALLBACK),
};



export function isMedusaConfigured(config = medusaConfig) {
  return Boolean(config.backendUrl && config.publishableKey);
}

export async function loadCatalog(config = medusaConfig) {
  if (isMedusaConfigured(config)) {
    try {
      const response = await fetchMedusaProducts(config);

      return {
        ...normalizeMedusaProductsResponse(
          response,
          response.currency_code || config.currencyCode
        ),
        source: "medusa",
        notice: "",
      };
    } catch (error) {
      console.error("Failed to load Medusa:", error);
    }
  }

  if (config.allowStaticCatalogFallback) {
    return loadStaticFallbackCatalog(
      "Unable to reach Medusa. Showing catalog snapshot."
    );
  }

  return {
    ...EMPTY_CATALOG,
    notice: "Unable to load the catalog.",
  };
}

export async function addProductToCart(product, config = medusaConfig) {
  if (!isMedusaConfigured(config)) {
    throw new Error("Medusa backend URL and publishable key are required.");
  }

  if (!product?.variantId) {
    throw new Error("This product does not have a purchasable variant.");
  }

  let cartId = getStoredCartId();

  if (!cartId) {
    const body = config.regionId ? { region_id: config.regionId } : {};
    const { cart } = await medusaRequest("/store/carts", {
      method: "POST",
      body,
      config,
    });

    cartId = cart?.id;

    if (!cartId) {
      throw new Error("Medusa did not return a cart id.");
    }

    setStoredCartId(cartId);
  }

  const { cart } = await medusaRequest(`/store/carts/${cartId}/line-items`, {
    method: "POST",
    body: {
      variant_id: product.variantId,
      quantity: 1,
    },
    config,
  });

  return cart;
}

export function normalizeMedusaProductsResponse(response, fallbackCurrency) {
  const products = Array.isArray(response?.products) ? response.products : [];
  const normalizedProducts = products
    .map((product) => normalizeMedusaProduct(product, fallbackCurrency))
    .filter(Boolean);

  return {
    products: normalizedProducts,
    categories: buildCategories(normalizedProducts),
    collections: buildCollections(normalizedProducts),
    featuredImage:
      normalizedProducts.find((product) => product.imageUrls.length)
        ?.imageUrls[0] || fallbackCatalog.featuredImage,
    merchandising: fallbackCatalog.merchandising,
  };
}

export function normalizeMedusaProduct(product, fallbackCurrency = "eur") {
  if (!product?.id || !product?.title) return null;

  const variants = Array.isArray(product.variants) ? product.variants : [];
  const pricedVariants = variants
    .map((variant) => ({
      variant,
      price: extractVariantPrice(variant, fallbackCurrency),
    }))
    .filter(({ price }) => price);
  const selectedVariant =
    pricedVariants.sort((left, right) => left.price.amount - right.price.amount)[0]
      ?.variant || variants[0];
  const selectedPrice = extractVariantPrice(selectedVariant, fallbackCurrency);
  const compareAtPrice = extractCompareAtPrice(selectedVariant, fallbackCurrency);
  const categoryValue =
    firstValue(product.categories)?.name ||
    product.collection?.title ||
    product.type?.value ||
    product.metadata?.category ||
    "Clothing";
  const category = normalizeCategoryLabel(categoryValue);
  const imageUrls = [
    product.thumbnail,
    ...toArray(product.images).map((image) => image?.url),
  ].filter(Boolean);

  return {
    id: product.id,
    handle: product.handle || product.id,
    name: product.metadata?.name_en || product.title,
    nameFa: product.metadata?.name_fa || product.title,
    category: category.name,
    categoryFa: category.nameFa,
    categorySlug: category.slug,
    collection: product.collection?.title || "",
    collectionFa: product.collection?.metadata?.title_fa || product.collection?.title || "",
    price: selectedPrice
      ? formatPrice(selectedPrice.amount, selectedPrice.currencyCode)
      : "Price on request",
    priceAmount: selectedPrice?.amount ?? null,
    compareAtPrice:
      compareAtPrice && selectedPrice && compareAtPrice.amount > selectedPrice.amount
        ? formatPrice(compareAtPrice.amount, compareAtPrice.currencyCode)
        : "",
    compareAtAmount:
      compareAtPrice && selectedPrice && compareAtPrice.amount > selectedPrice.amount
        ? compareAtPrice.amount
        : null,
    installment: selectedPrice
      ? `4 payments of ${formatPrice(selectedPrice.amount / 4, selectedPrice.currencyCode)}`
      : "",
    imageUrls,
    description: product.description || "",
    descriptionFa: product.metadata?.description_fa || product.description || "",
    badge: product.tags?.length ? product.tags[0].value || product.tags[0].name : "",
    variantId: selectedVariant?.id || null,
    inStock: isVariantPurchasable(selectedVariant),
    stockCount: getVariantStock(selectedVariant),
    colors: extractColors(variants, product.options),
    sizes: extractOptionValues(variants, ["Size", "size", "سایز"]),
    source: "medusa",
  };
}

export function formatPrice(amount, currencyCode = "eur", locale = "en-US") {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount)) return "";

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode.toUpperCase(),
      maximumFractionDigits: numericAmount % 1 === 0 ? 0 : 2,
    }).format(numericAmount);
  } catch {
    return `${numericAmount.toLocaleString(locale)} ${currencyCode.toUpperCase()}`;
  }
}

function buildCategories(products) {
  const bySlug = new Map();

  for (const product of products) {
    const slug = product.categorySlug || slugify(product.category);
    const current = bySlug.get(slug) || {
      id: slug,
      slug,
      name: product.category,
      nameFa: product.categoryFa,
      count: 0,
      imageUrl: product.imageUrls[0] || fallbackCatalog.featuredImage,
    };

    current.count += 1;
    bySlug.set(slug, current);
  }

  return [...bySlug.values()].sort((left, right) => right.count - left.count);
}

function buildCollections(products) {
  const bySlug = new Map();

  for (const product of products) {
    if (!product.collection) continue;

    const slug = slugify(product.collection);
    const current = bySlug.get(slug) || {
      id: slug,
      slug,
      name: product.collection,
      nameFa: product.collectionFa || product.collection,
      count: 0,
    };

    current.count += 1;
    bySlug.set(slug, current);
  }

  return [...bySlug.values()].sort((left, right) => right.count - left.count);
}

async function fetchMedusaProducts(config) {
  const params = new URLSearchParams({
    limit: String(config.productLimit || 24),
    fields:
      "id,title,handle,description,thumbnail,*images,*variants,*variants.calculated_price,*variants.prices,*categories,*collection,*tags",
  });

  if (config.regionId) params.set("region_id", config.regionId);
  if (config.countryCode) params.set("country_code", config.countryCode);

  return medusaRequest(`/store/products?${params.toString()}`, {
    method: "GET",
    config,
  });
}

async function medusaRequest(path, { method = "GET", body, config }) {
  const response = await fetch(`${config.backendUrl}${path}`, {
    method,
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-publishable-api-key": config.publishableKey,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`Medusa request failed: ${response.status}`);
  }

  return response.json();
}

function extractVariantPrice(variant, fallbackCurrency) {
  if (!variant) return null;

  const calculated = variant.calculated_price;
  const calculatedAmount =
    calculated?.calculated_amount_with_tax ??
    calculated?.calculated_amount ??
    calculated?.original_amount_with_tax ??
    calculated?.original_amount;

  if (calculatedAmount !== undefined && calculatedAmount !== null) {
    return {
      amount: Number(calculatedAmount),
      currencyCode: calculated.currency_code || fallbackCurrency,
    };
  }

  const price = firstValue(variant.prices);

  if (price?.amount !== undefined && price?.amount !== null) {
    return {
      amount: Number(price.amount),
      currencyCode: price.currency_code || fallbackCurrency,
    };
  }

  return null;
}

function extractCompareAtPrice(variant, fallbackCurrency) {
  if (!variant) return null;

  const calculated = variant.calculated_price;
  const originalAmount =
    calculated?.original_amount_with_tax ??
    calculated?.original_amount;

  if (originalAmount !== undefined && originalAmount !== null) {
    return {
      amount: Number(originalAmount),
      currencyCode: calculated.currency_code || fallbackCurrency,
    };
  }

  return null;
}

function isVariantPurchasable(variant) {
  if (!variant) return false;
  if (variant.allow_backorder) return true;
  if (variant.manage_inventory === false) return true;
  if (Number(variant.inventory_quantity) > 0) return true;

  return variant.manage_inventory === undefined;
}

function getVariantStock(variant) {
  if (!variant) return null;
  if (variant.inventory_quantity === undefined || variant.inventory_quantity === null) {
    return null;
  }

  const stock = Number(variant.inventory_quantity);

  return Number.isFinite(stock) ? stock : null;
}

function extractColors(variants, productOptions) {
  const colorValues = extractOptionValues(variants, ["Color", "color", "رنگ"]);

  if (colorValues.length) {
    return colorValues.map((value) => ({
      label: value,
      labelFa: value,
      hex: colorHex(value),
    }));
  }

  return toArray(productOptions)
    .filter((option) => ["Color", "color", "رنگ"].includes(option?.title))
    .flatMap((option) => toArray(option.values))
    .map((value) => {
      const label = value?.value || value?.title || "";

      return {
        label,
        labelFa: label,
        hex: colorHex(label),
      };
    })
    .filter((color) => color.label);
}

function extractOptionValues(variants, optionNames) {
  const values = new Set();

  for (const variant of variants) {
    for (const option of toArray(variant.options)) {
      const optionTitle = option?.option?.title || option?.title || "";
      const value = option?.value || "";

      if (optionNames.includes(optionTitle) && value) {
        values.add(value);
      }
    }
  }

  return [...values];
}

function colorHex(label) {
  const normalized = String(label || "").trim().toLowerCase();
  const colors = {
    black: "#111111",
    "مشکی": "#111111",
    white: "#ffffff",
    "سفید": "#ffffff",
    gray: "#9a9a9a",
    grey: "#9a9a9a",
    "طوسی": "#9a9a9a",
    brown: "#5b4038",
    "قهوه‌ای": "#5b4038",
    "قهوه ای": "#5b4038",
    cream: "#e7dcc8",
    "کرم": "#e7dcc8",
    green: "#71816d",
    "سبز": "#71816d",
    blue: "#667f99",
    "آبی": "#667f99",
  };

  return colors[normalized] || "#b9b5aa";
}

function normalizeCategoryLabel(value) {
  const label = String(value || "Clothing").trim();
  const known = CATEGORY_LABELS[label];

  if (known) return known;

  return {
    name: label,
    nameFa: label,
    slug: slugify(label),
  };
}

function slugify(value) {
  const slug = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "collection";
}

function firstValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}
function optionalNumber(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : undefined;
}

function truthy(value) {
  if (typeof value === "boolean") return value;

  return ["1", "true", "yes", "on"].includes(
    String(value || "").trim().toLowerCase()
  );
}
function stripTrailingSlash(value) {
  return String(value || "").replace(/\/$/, "");
}

function getStoredCartId() {
  if (typeof window === "undefined") return "";

  return window.localStorage.getItem("mouher_medusa_cart_id") || "";
}

function setStoredCartId(cartId) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem("mouher_medusa_cart_id", cartId);
}
