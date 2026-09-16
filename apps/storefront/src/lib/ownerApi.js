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

export function isOwnerCredentialsValid(username, password) {
  return username === "pmembari" && password === "1234";
}

export function getOwnerSession() {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem("mouher_owner_session");

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setOwnerSession(username) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    "mouher_owner_session",
    JSON.stringify({ username, authenticatedAt: new Date().toISOString() })
  );
}

export function clearOwnerSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("mouher_owner_session");
}

export async function loadOwnerProducts(token, config = medusaConfig) {
  return ownerRequest(config.mouherApiUrl, "/admin/products/?limit=50&offset=0", ownerHeaders(token));
}

export async function loadOwnerOrders(token, config = medusaConfig) {
  return ownerRequest(config.mouherApiUrl, "/admin/orders/?limit=50&offset=0", ownerHeaders(token));
}

export async function loadOwnerCustomers(token, config = medusaConfig) {
  return ownerRequest(config.mouherApiUrl, "/admin/customers/?limit=50&offset=0", ownerHeaders(token));
}

export async function loadOwnerInventory(token, config = medusaConfig) {
  return ownerRequest(config.mouherApiUrl, "/warehouse/inventory/?limit=50&offset=0", ownerHeaders(token));
}

export async function loadOwnerStockLocations(token, config = medusaConfig) {
  return ownerRequest(config.mouherApiUrl, "/warehouse/stock-locations/?limit=50&offset=0", ownerHeaders(token));
}

export async function loadOwnerAnalytics(token, config = medusaConfig, days = 30) {
  const rangeDays = Math.max(1, Math.min(Number(days) || 30, 90));
  return ownerRequest(config.mouherApiUrl, `/analytics/dashboard/?days=${rangeDays}`, ownerHeaders(token));
}

export async function loadOwnerDashboard(token, config = medusaConfig, days = 30) {
  if (!config.mouherApiUrl) {
    return {
      products: normalizeOwnerList({ data: [] }),
      orders: normalizeOwnerList({ data: [] }),
      customers: normalizeOwnerList({ data: [] }),
      inventory: normalizeOwnerList({ data: [] }),
      stockLocations: normalizeOwnerList({ data: [] }),
      analytics: null,
      catalog: ownerCatalogFromProducts([], config.currencyCode),
      source: "local-preview",
    };
  }

  const [products, orders, customers, inventory, stockLocations, analytics] = await Promise.all([
    loadOwnerProducts(token, config),
    loadOwnerOrders(token, config),
    loadOwnerCustomers(token, config),
    loadOwnerInventory(token, config),
    loadOwnerStockLocations(token, config),
    loadOwnerAnalytics(token, config, days),
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

function ownerHeaders(token) {
  return {
    Accept: "application/json",
    "X-Mouher-Internal-Token": token,
  };
}

async function ownerRequest(baseUrl, path, headers) {
  if (!baseUrl) {
    throw new Error("Mouher API is not configured.");
  }

  const response = await fetch(`${baseUrl}${path}`, { headers });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = payload?.error?.message || `Owner API request failed: ${response.status}`;
    throw new Error(message);
  }

  return payload;
}
