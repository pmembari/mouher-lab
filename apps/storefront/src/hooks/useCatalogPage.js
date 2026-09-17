import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  loadCatalogPage,
} from "../lib/catalog";

const INITIAL_STATE = {
  products: [],
  categories: [],
  collections: [],

  featuredImage: "",
  merchandising: {},

  source: "",
  notice: "",

  filters: {},

  pagination: {
    page: 1,
    pageSize: 30,

    offset: 0,

    count: 0,
    total: 0,
    totalPages: 0,

    hasPrevious: false,
    hasNext: false,
  },
};

export function useCatalogPage({
  route,
  enabled = true,
} = {}) {
  const [
    catalogPage,
    setCatalogPage,
  ] = useState(
    INITIAL_STATE
  );

  const [
    state,
    setState,
  ] = useState(
    enabled
      ? "loading"
      : "idle"
  );

  const [
    error,
    setError,
  ] = useState(null);

  const requestIdRef =
    useRef(0);

  const input = useMemo(
    () =>
      buildCatalogPageInput(
        route
      ),
    [route]
  );

  useEffect(() => {
    if (!enabled) {
      setState("idle");
      return undefined;
    }

    let active = true;

    const requestId =
      requestIdRef.current + 1;

    requestIdRef.current =
      requestId;

    setState("loading");
    setError(null);

    loadCatalogPage(input)
      .then((result) => {
        if (
          !active ||
          requestId !==
          requestIdRef.current
        ) {
          return;
        }

        setCatalogPage(
          normalizeCatalogPageResult(
            result,
            input
          )
        );

        setState("ready");
      })
      .catch((nextError) => {
        if (
          !active ||
          requestId !==
          requestIdRef.current
        ) {
          return;
        }

        console.error(
          "Failed to load catalog page:",
          nextError
        );

        setError(
          nextError
        );

        setCatalogPage({
          ...INITIAL_STATE,

          filters: {
            ...input,
          },

          pagination: {
            ...INITIAL_STATE.pagination,

            page:
              input.page,

            pageSize:
              input.pageSize,
          },
        });

        setState("error");
      });

    return () => {
      active = false;
    };
  }, [
    enabled,
    input,
  ]);

  return {
    catalogPage,

    products:
      catalogPage.products,

    categories:
      catalogPage.categories,

    collections:
      catalogPage.collections,

    pagination:
      catalogPage.pagination,

    filters:
      catalogPage.filters,

    source:
      catalogPage.source,

    notice:
      catalogPage.notice,

    state,

    error,

    isLoading:
      state === "loading",

    isReady:
      state === "ready",

    isError:
      state === "error",
  };
}

function buildCatalogPageInput(
  route
) {
  if (!route) {
    return {
      page: 1,
      pageSize: 30,

      query: "",

      category: "all",
      collection: "all",

      minPrice: "",
      maxPrice: "",

      size: "all",
      color: "all",

      inStock: false,
      sale: false,

      sort: "featured",
    };
  }

  const input = {
    page:
      route.page || 1,

    pageSize:
      route.pageSize || 30,

    query:
      route.query || "",

    category:
      route.category || "all",

    collection:
      route.collection || "all",

    minPrice:
      route.minPrice || "",

    maxPrice:
      route.maxPrice || "",

    size:
      route.size || "all",

    color:
      route.color || "all",

    inStock:
      Boolean(
        route.inStock
      ),

    sale:
      Boolean(
        route.sale
      ),

    sort:
      route.sort || "featured",
  };

  if (
    route.type === "category"
  ) {
    input.category =
      route.slug;
  }

  if (
    route.type === "collection"
  ) {
    input.collection =
      route.slug;
  }

  return input;
}

function normalizeCatalogPageResult(
  result,
  input
) {
  return {
    products:
      Array.isArray(
        result?.products
      )
        ? result.products
        : [],

    categories:
      Array.isArray(
        result?.categories
      )
        ? result.categories
        : [],

    collections:
      Array.isArray(
        result?.collections
      )
        ? result.collections
        : [],

    featuredImage:
      result?.featuredImage ||
      "",

    merchandising:
      result?.merchandising ||
      {},

    source:
      result?.source ||
      "",

    notice:
      result?.notice ||
      "",

    filters: {
      ...input,
      ...(result?.filters ||
        {}),
    },

    pagination: {
      page:
        result?.pagination
          ?.page ??
        input.page,

      pageSize:
        result?.pagination
          ?.pageSize ??
        input.pageSize,

      offset:
        result?.pagination
          ?.offset ??
        (
          input.page - 1
        ) *
        input.pageSize,

      count:
        result?.pagination
          ?.count ??
        result?.products
          ?.length ??
        0,

      total:
        result?.pagination
          ?.total ??
        0,

      totalPages:
        result?.pagination
          ?.totalPages ??
        0,

      hasPrevious:
        Boolean(
          result?.pagination
            ?.hasPrevious
        ),

      hasNext:
        Boolean(
          result?.pagination
            ?.hasNext
        ),
    },
  };
}