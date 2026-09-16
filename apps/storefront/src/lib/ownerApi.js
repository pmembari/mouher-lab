import {
  medusaConfig,
  normalizeMedusaProductsResponse,
} from "./catalog.js";

const DEFAULT_LIMIT = 50;

/**
 * Log in as a Medusa admin user.
 *
 * Flow:
 * 1. POST /auth/user/emailpass with email/password.
 * 2. Receive a short-lived JWT.
 * 3. Exchange that JWT for a cookie session via POST /auth/session.
 *
 * After this succeeds, all admin API calls use only:
 *   credentials: "include"
 *
 * No password or bearer token is passed to dashboard/data loaders.
 */
export async function loginOwner(
  email,
  password,
  config = medusaConfig
) {
  const baseUrl = requireBackendUrl(config);

  const authResponse = await fetch(
    `${baseUrl}/auth/user/emailpass`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: String(email || "").trim(),
        password: String(password || ""),
      }),
    }
  );

  const authPayload = await readJson(authResponse);

  if (!authResponse.ok) {
    throw new Error(
      apiErrorMessage(
        authPayload,
        "Invalid administrator email or password."
      )
    );
  }

  const token = authPayload?.token;

  if (!token) {
    throw new Error(
      "Medusa authentication succeeded but did not return a token."
    );
  }

  const sessionResponse = await fetch(
    `${baseUrl}/auth/session`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const sessionPayload = await readJson(sessionResponse);

  if (!sessionResponse.ok) {
    throw new Error(
      apiErrorMessage(
        sessionPayload,
        "Unable to create administrator session."
      )
    );
  }

  return true;
}

/**
 * End the current Medusa admin cookie session.
 */
export async function logoutOwner(
  config = medusaConfig
) {
  const baseUrl = requireBackendUrl(config);

  const response = await fetch(
    `${baseUrl}/auth/session`,
    {
      method: "DELETE",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    }
  );

  /*
   * We deliberately tolerate 401 here.
   * If the session already expired, the user is effectively logged out.
   */
  if (!response.ok && response.status !== 401) {
    const payload = await readJson(response);

    throw new Error(
      apiErrorMessage(
        payload,
        `Unable to log out: ${response.status}`
      )
    );
  }

  return true;
}

/**
 * Optional lightweight session check.
 *
 * Calling any protected admin route would also prove the session exists,
 * but this helper lets App.jsx ask explicitly.
 */
export async function isOwnerAuthenticated(
  config = medusaConfig
) {
  try {
    await ownerRequest(
      config,
      "/admin/users?limit=1"
    );

    return true;
  } catch {
    return false;
  }
}

/**
 * Convert a Medusa admin-list response into the shape expected by App.jsx.
 */
export function normalizeOwnerList(
  response,
  key = "data"
) {
  let data = [];

  if (Array.isArray(response?.[key])) {
    data = response[key];
  } else if (Array.isArray(response?.data)) {
    data = response.data;
  }

  return {
    data,
    meta: {
      limit:
        Number(response?.limit) ||
        Number(response?.meta?.limit) ||
        DEFAULT_LIMIT,

      offset:
        Number(response?.offset) ||
        Number(response?.meta?.offset) ||
        0,

      count:
        Number(response?.count) ||
        Number(response?.meta?.count) ||
        data.length,
    },
  };
}

/**
 * Turn admin products into the storefront catalog shape already consumed
 * by the owner dashboard UI.
 */
export function ownerCatalogFromProducts(
  products,
  fallbackCurrency = "eur"
) {
  return {
    ...normalizeMedusaProductsResponse(
      {
        products: Array.isArray(products)
          ? products
          : [],
      },
      fallbackCurrency
    ),
    source: "owner-api",
    notice: "",
  };
}

export async function loadOwnerProducts(
  config = medusaConfig
) {
  const payload = await ownerRequest(
    config,
    `/admin/products?limit=${DEFAULT_LIMIT}&offset=0`
  );

  return normalizeMedusaAdminList(
    payload,
    "products"
  );
}

export async function loadOwnerOrders(
  config = medusaConfig
) {
  const payload = await ownerRequest(
    config,
    `/admin/orders?limit=${DEFAULT_LIMIT}&offset=0`
  );

  return normalizeMedusaAdminList(
    payload,
    "orders"
  );
}

export async function loadOwnerCustomers(
  config = medusaConfig
) {
  const payload = await ownerRequest(
    config,
    `/admin/customers?limit=${DEFAULT_LIMIT}&offset=0`
  );

  return normalizeMedusaAdminList(
    payload,
    "customers"
  );
}

export async function loadOwnerInventory(
  config = medusaConfig
) {
  const payload = await ownerRequest(
    config,
    `/admin/inventory-items?limit=${DEFAULT_LIMIT}&offset=0`
  );

  return normalizeMedusaAdminList(
    payload,
    "inventory_items"
  );
}

export async function loadOwnerStockLocations(
  config = medusaConfig
) {
  const payload = await ownerRequest(
    config,
    `/admin/stock-locations?limit=${DEFAULT_LIMIT}&offset=0`
  );

  return normalizeMedusaAdminList(
    payload,
    "stock_locations"
  );
}

export async function loadOwnerAnalytics(
  config = medusaConfig,
  days = 30
) {
  const rangeDays = Math.max(
    1,
    Math.min(Number(days) || 30, 90)
  );

  const payload = await ownerRequest(
    config,
    `/admin/analytics/dashboard?days=${rangeDays}`
  );

  return payload?.data ?? null;
}

/**
 * Load the owner dashboard using the existing authenticated cookie session.
 *
 * No password, JWT, or API key is accepted here.
 */
export async function loadOwnerDashboard(
  config = medusaConfig,
  days = 30
) {
  if (!config.backendUrl) {
    return emptyOwnerDashboard(
      config.currencyCode
    );
  }

  /*
   * Keep the dashboard usable if one secondary resource is unavailable.
   * Products remain the important resource because the catalog depends on it.
   */
  const [
    productsResult,
    ordersResult,
    customersResult,
    inventoryResult,
    stockLocationsResult,
    analyticsResult,
  ] = await Promise.allSettled([
    loadOwnerProducts(config),
    loadOwnerOrders(config),
    loadOwnerCustomers(config),
    loadOwnerInventory(config),
    loadOwnerStockLocations(config),
    loadOwnerAnalytics(config, days),
  ]);

  /*
   * If products itself returns 401, surface it rather than silently rendering
   * a blank admin dashboard. That usually means the cookie session is absent.
   */
  if (
    productsResult.status === "rejected" &&
    isUnauthorizedError(productsResult.reason)
  ) {
    throw productsResult.reason;
  }

  const products = settledValue(
    productsResult,
    emptyList()
  );

  const orders = settledValue(
    ordersResult,
    emptyList()
  );

  const customers = settledValue(
    customersResult,
    emptyList()
  );

  const inventory = settledValue(
    inventoryResult,
    emptyList()
  );

  const stockLocations = settledValue(
    stockLocationsResult,
    emptyList()
  );

  const analytics = settledValue(
    analyticsResult,
    null
  );

  return {
    products,
    orders,
    customers,
    inventory,
    stockLocations,
    analytics,

    catalog: ownerCatalogFromProducts(
      products.data,
      config.currencyCode
    ),

    source: "medusa-admin",
  };
}

function normalizeMedusaAdminList(
  payload,
  key
) {
  const data =
    Array.isArray(payload?.[key])
      ? payload[key]
      : [];

  return {
    data,

    meta: {
      limit:
        Number(payload?.limit) ||
        DEFAULT_LIMIT,

      offset:
        Number(payload?.offset) ||
        0,

      count:
        Number(payload?.count) ||
        data.length,
    },
  };
}

/**
 * Shared Medusa admin request helper.
 *
 * Authentication is entirely cookie-based here.
 */
async function ownerRequest(
  config,
  path
) {
  const baseUrl = requireBackendUrl(config);

  const response = await fetch(
    `${baseUrl}${path}`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    }
  );

  const payload = await readJson(response);

  if (!response.ok) {
    const error = new Error(
      apiErrorMessage(
        payload,
        `Owner API request failed: ${response.status}`
      )
    );

    error.status = response.status;

    throw error;
  }

  return payload;
}

function requireBackendUrl(config) {
  const baseUrl = String(
    config?.backendUrl || ""
  ).replace(/\/$/, "");

  if (!baseUrl) {
    throw new Error(
      "Medusa backend is not configured."
    );
  }

  return baseUrl;
}

async function readJson(response) {
  return response
    .json()
    .catch(() => ({}));
}

function apiErrorMessage(
  payload,
  fallback
) {
  return (
    payload?.message ||
    payload?.error?.message ||
    (typeof payload?.error === "string"
      ? payload.error
      : "") ||
    fallback
  );
}

function isUnauthorizedError(error) {
  return (
    error?.status === 401 ||
    error?.status === 403
  );
}

function settledValue(
  result,
  fallback
) {
  return result.status === "fulfilled"
    ? result.value
    : fallback;
}

function emptyList() {
  return {
    data: [],
    meta: {
      limit: DEFAULT_LIMIT,
      offset: 0,
      count: 0,
    },
  };
}

function emptyOwnerDashboard(
  currencyCode = "eur"
) {
  const products = emptyList();

  return {
    products,
    orders: emptyList(),
    customers: emptyList(),
    inventory: emptyList(),
    stockLocations: emptyList(),
    analytics: null,

    catalog: ownerCatalogFromProducts(
      [],
      currencyCode
    ),

    source: "local-preview",
  };
}