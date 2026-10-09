import { useEffect, useMemo, useState } from "react";
import { loadCatalog } from "../lib/catalog";
import { readPrerenderData } from "../lib/seo.js";

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
  // The build's curated hero remains stable while the live catalog refreshes.
  const [initialHeroImage] = useState(() => readPrerenderData()?.heroImage || "");
  const [catalog, setCatalog] = useState(
    () => {
      const initial = readPrerenderData();
      if (initial?.catalog) return { ...EMPTY_CATALOG, ...initial.catalog };
      const product = initial?.product;
      return product ? { ...EMPTY_CATALOG, products: [product], source: product.source } : EMPTY_CATALOG;
    }
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
      initialHeroImage ||
      catalog.merchandising?.heroImage ||
      catalog.featuredImage ||
      catalog.products.find(
        (product) =>
          product.imageUrls?.length
      )?.imageUrls?.[0] ||
      "",
    [
      initialHeroImage,
      catalog.merchandising?.heroImage,
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
