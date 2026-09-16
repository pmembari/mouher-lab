import { useEffect, useMemo, useState } from "react";
import { loadCatalog } from "../lib/catalog";

const EMPTY_CATALOG = {
  products: [],
  categories: [],
  collections: [],
  source: "demo",
  featuredImage: "",
  notice: "",
};

export function useCatalog({
  productLabels,
}) {
  const [catalog, setCatalog] = useState(
    EMPTY_CATALOG
  );

  const [
    catalogState,
    setCatalogState,
  ] = useState("loading");

  useEffect(() => {
    let cancelled = false;

    async function hydrateCatalog() {
      setCatalogState("loading");

      try {
        const nextCatalog =
          await loadCatalog();

        if (cancelled) {
          return;
        }

        setCatalog({
          ...EMPTY_CATALOG,
          ...nextCatalog,
          products:
            nextCatalog?.products || [],
          categories:
            nextCatalog?.categories || [],
          collections:
            nextCatalog?.collections || [],
        });

        setCatalogState("ready");
      } catch (error) {
        console.error(
          "Catalog load failed:",
          error
        );

        if (!cancelled) {
          setCatalogState("error");
        }
      }
    }

    hydrateCatalog();

    return () => {
      cancelled = true;
    };
  }, []);

  const heroImage = useMemo(
    () =>
      catalog.featuredImage ||
      catalog.products.find(
        (product) =>
          product.imageUrls?.length
      )?.imageUrls?.[0] ||
      "",
    [
      catalog.featuredImage,
      catalog.products,
    ]
  );

  const sourceLabel = useMemo(() => {
    if (catalogState === "loading") {
      return productLabels.loading;
    }

    if (catalog.source === "medusa") {
      return productLabels.sourceMedusa;
    }

    if (
      catalog.source ===
      "mouher-live-snapshot"
    ) {
      return productLabels.sourceLive;
    }

    return productLabels.sourceDemo;
  }, [
    catalog.source,
    catalogState,
    productLabels,
  ]);

  return {
    catalog,
    catalogState,
    heroImage,
    sourceLabel,
  };
}