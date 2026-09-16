import { useMemo, useState } from "react";
import { slugify } from "../utils/product";

export function useStorefrontFilters({
  catalog,
  categoriesLabel,
  collectionsLabel,
}) {
  const [
    activeCategory,
    setActiveCategory,
  ] = useState("all");

  const [
    activeCollection,
    setActiveCollection,
  ] = useState("all");

  const [query, setQuery] =
    useState("");

  const categoryOptions = useMemo(
    () => [
      {
        id: "all",
        slug: "all",
        name: categoriesLabel,
        nameFa: categoriesLabel,
        count:
          catalog.products?.length || 0,
      },

      ...(catalog.categories || []),
    ],
    [
      catalog.categories,
      catalog.products?.length,
      categoriesLabel,
    ]
  );

  const collectionOptions = useMemo(
    () => [
      {
        id: "all",
        slug: "all",
        name: collectionsLabel,
        nameFa: collectionsLabel,
        count:
          catalog.products?.length || 0,
      },

      ...(catalog.collections || []),
    ],
    [
      catalog.collections,
      catalog.products?.length,
      collectionsLabel,
    ]
  );

  const filteredProducts = useMemo(() => {
    const normalizedQuery =
      query.trim().toLowerCase();

    return (catalog.products || []).filter(
      (product) => {
        const matchesCategory =
          activeCategory === "all" ||
          product.categorySlug ===
          activeCategory;

        const matchesCollection =
          activeCollection === "all" ||
          slugify(
            product.collection
          ) === activeCollection;

        const searchable = [
          product.name,
          product.nameFa,
          product.category,
          product.categoryFa,
          product.collection,
          product.description,
          product.descriptionFa,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesQuery =
          !normalizedQuery ||
          searchable.includes(
            normalizedQuery
          );

        return (
          matchesCategory &&
          matchesCollection &&
          matchesQuery
        );
      }
    );
  }, [
    activeCategory,
    activeCollection,
    catalog.products,
    query,
  ]);

  function resetFilters() {
    setActiveCategory("all");
    setActiveCollection("all");
    setQuery("");
  }

  return {
    activeCategory,
    setActiveCategory,

    activeCollection,
    setActiveCollection,

    query,
    setQuery,

    categoryOptions,
    collectionOptions,
    filteredProducts,

    resetFilters,
  };
}