import { medusaConfig, normalizeMedusaProductsResponse } from "./catalog.js";

const DEFAULT_LIMIT = 50;

export function normalizeOwnerList(response) {
  const data = Array.isArray(response?.data) ? response.data : [];
  const meta = response?.meta && typeof response.meta === "object"
    ? response.meta
    : {};

  return {
    data,
    meta: {
      limit: Number(meta.limit) || DEFAULT_LIMIT,
      offset: Number(meta.offset) || 0,
      count: Number(meta.count) || data.length,
    },
  };
}

export function ownerCatalogFromProducts(products, fallbackCurrency = "eur") {
  return {
    ...normalizeMedusaProductsResponse(
      { products: Array.isArray(products) ? products : [] },
      fallbackCurrency
    ),
    source: "owner-api",
    notice: "",
  };
}

export async function loadOwnerDashboard(token, config = medusaConfig) {
  if (!config.mouherApiUrl) {
    throw new Error("Mouher API is not configured.");
  }

  const headers = {
    Accept: "application/json",
    "X-Mouher-Internal-Token": token,
  };

  const [products, orders, customers, inventory, stockLocations, analytics] = await Promise.all([
    ownerRequest(config.mouherApiUrl, "/admin/products/?limit=50", headers),
    ownerRequest(config.mouherApiUrl, "/admin/orders/?limit=50", headers),
    ownerRequest(config.mouherApiUrl, "/admin/customers/?limit=50", headers),
    ownerRequest(config.mouherApiUrl, "/warehouse/inventory/?limit=50", headers),
    ownerRequest(config.mouherApiUrl, "/warehouse/stock-locations/?limit=50", headers),
    ownerRequest(config.mouherApiUrl, "/analytics/dashboard/?days=30", headers),
  ]);

  const productList = normalizeOwnerList(products);

  return {
    products: productList,
    orders: normalizeOwnerList(orders),
    customers: normalizeOwnerList(customers),
    inventory: normalizeOwnerList(inventory),
    stockLocations: normalizeOwnerList(stockLocations),
    analytics: analytics?.data || null,
    catalog: ownerCatalogFromProducts(productList.data, config.currencyCode),
  };
}

async function ownerRequest(baseUrl, path, headers) {
  const response = await fetch(`${baseUrl}${path}`, { headers });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = payload?.error?.message || `Owner API request failed: ${response.status}`;
    throw new Error(message);
  }

  return payload;
}
