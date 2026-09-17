import {
  medusaConfig,
  isMedusaConfigured,
} from "./catalog/config";

import {
  EMPTY_CATALOG,
} from "./catalog/constants";

import {
  loadStaticFallbackCatalog,
  loadStaticFallbackPage,
} from "./catalog/fallback";

import {
  applyClientFilters,
  sortProducts,
} from "./catalog/filters";

import {
  fetchMedusaProducts,
  fetchMedusaProductsPage,
} from "./catalog/medusa";

import {
  normalizeMedusaProductsResponse,
} from "./catalog/normalize";

import {
  getPaginationInput,
  buildPagination,
} from "./catalog/pagination";

import {
  finiteNumber,
} from "./catalog/helpers";

import {
  addProductToCart as addProductToCartInternal,
} from "./catalog/cart";

export {
  medusaConfig,
  isMedusaConfigured,
};

export {
  normalizeMedusaProduct,
  normalizeMedusaProductsResponse,
  formatPrice,
} from "./catalog/normalize";

export async function loadCatalog(
  config = medusaConfig
) {
  const shouldUseStaticFallback =
    config.allowStaticCatalogFallback ||
    import.meta.env.DEV;

  if (isMedusaConfigured(config)) {
    try {
      const response =
        await fetchMedusaProducts(
          config
        );

      const normalizedCatalog =
        normalizeMedusaProductsResponse(
          response,
          response?.currency_code ||
          config.currencyCode
        );

      if (
        normalizedCatalog.products.length >
        0
      ) {
        return {
          ...normalizedCatalog,
          source: "medusa",
          notice: "",
        };
      }

      console.warn(
        "Medusa returned an empty catalog."
      );
    } catch (error) {
      console.error(
        "Failed to load Medusa:",
        error
      );
    }
  }

  if (shouldUseStaticFallback) {
    return loadStaticFallbackCatalog(
      isMedusaConfigured(config)
        ? "Unable to reach Medusa. Showing catalog snapshot."
        : "Showing local catalog snapshot."
    );
  }

  return {
    ...EMPTY_CATALOG,
    notice:
      "Unable to load the catalog.",
  };
}

export async function loadCatalogPage(
  {
    page = 1,
    pageSize = 30,

    query = "",
    category = "all",
    collection = "all",

    minPrice = "",
    maxPrice = "",

    size = "all",
    color = "all",

    inStock = false,
    sale = false,

    sort = "featured",
  } = {},
  config = medusaConfig
) {
  const {
    page: normalizedPage,
    pageSize:
    normalizedPageSize,
    offset,
    limit,
  } = getPaginationInput({
    page,
    pageSize,
  });

  const filters = {
    query,
    category,
    collection,
    minPrice,
    maxPrice,
    size,
    color,
    inStock,
    sale,
    sort,
  };

  const shouldUseStaticFallback =
    config.allowStaticCatalogFallback ||
    import.meta.env.DEV;

  if (isMedusaConfigured(config)) {
    try {
      const response =
        await fetchMedusaProductsPage({
          config,
          limit,
          offset,
          query,
          sort,
        });

      const normalized =
        normalizeMedusaProductsResponse(
          response,
          response?.currency_code ||
          config.currencyCode
        );

      const filteredProducts =
        applyClientFilters(
          normalized.products,
          filters
        );

      const products =
        sortProducts(
          filteredProducts,
          sort
        );

      const responseCount =
        finiteNumber(
          response?.count
        );

      const total =
        responseCount !== null
          ? responseCount
          : offset +
          normalized.products.length;

      const pagination =
        buildPagination({
          page:
            normalizedPage,

          pageSize:
            normalizedPageSize,

          total,

          count:
            products.length,
        });

      return {
        ...normalized,

        products,

        source: "medusa",

        notice: "",

        pagination,

        filters: {
          ...filters,
        },
      };
    } catch (error) {
      console.error(
        "Failed to load paginated Medusa catalog:",
        error
      );
    }
  }

  if (shouldUseStaticFallback) {
    return loadStaticFallbackPage({
      page:
        normalizedPage,

      pageSize:
        normalizedPageSize,

      filters,

      notice:
        isMedusaConfigured(config)
          ? "Unable to reach Medusa. Showing catalog snapshot."
          : "Showing local catalog snapshot.",
    });
  }

  return {
    ...EMPTY_CATALOG,

    notice:
      "Unable to load the catalog.",

    pagination:
      buildPagination({
        page:
          normalizedPage,

        pageSize:
          normalizedPageSize,

        total: 0,
        count: 0,
      }),

    filters: {
      ...filters,
    },
  };
}

export function addProductToCart(
  product,
  config = medusaConfig
) {
  return addProductToCartInternal(
    product,
    config
  );
}