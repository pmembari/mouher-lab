import {
  FALLBACK_CATALOG,
} from "./constants";

import {
  applyClientFilters,
  sortProducts,
} from "./filters";

import {
  buildCategories,
  buildCollections,
} from "./normalize";

import {
  paginateItems,
} from "./pagination";
import { catalogFacets } from "./facets";

export function loadStaticFallbackCatalog(
  notice = ""
) {
  return {
    ...FALLBACK_CATALOG,
    notice,
  };
}

export function loadStaticFallbackPage({
  page,
  pageSize,
  filters,
  notice = "",
}) {
  const allProducts =
    Array.isArray(
      FALLBACK_CATALOG.products
    )
      ? FALLBACK_CATALOG.products
      : [];

  const filteredProducts =
    applyClientFilters(
      allProducts,
      filters
    );

  const sortedProducts =
    sortProducts(
      filteredProducts,
      filters?.sort
    );

  const {
    items: products,
    pagination,
  } = paginateItems(
    sortedProducts,
    {
      page,
      pageSize,
    }
  );

  return {
    ...FALLBACK_CATALOG,

    products,
    facets: catalogFacets(allProducts),

    categories:
      buildCategories(
        filteredProducts
      ),

    collections:
      buildCollections(
        filteredProducts
      ),

    source:
      FALLBACK_CATALOG.source ||
      "snapshot",

    notice,

    pagination,

    filters: {
      ...filters,
    },
  };
}
