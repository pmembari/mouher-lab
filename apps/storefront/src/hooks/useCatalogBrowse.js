import { useMemo } from "react";

import { slugify } from "../utils/product";

const DEFAULT_FILTERS = {
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

export function useCatalogBrowse({
  products = [],
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
} = DEFAULT_FILTERS) {
  const normalizedProducts = useMemo(
    () => (Array.isArray(products) ? products : []),
    [products]
  );

  const availableCategories = useMemo(() => {
    const categories = new Map();

    for (const product of normalizedProducts) {
      const slug =
        product.categorySlug ||
        slugify(product.category);

      if (!slug) {
        continue;
      }

      const current = categories.get(slug);

      if (current) {
        current.count += 1;
        continue;
      }

      categories.set(slug, {
        slug,
        name:
          product.category ||
          product.categoryFa ||
          slug,
        nameFa:
          product.categoryFa ||
          product.category ||
          slug,
        count: 1,
      });
    }

    return [...categories.values()].sort(
      (left, right) =>
        right.count - left.count
    );
  }, [normalizedProducts]);

  const availableCollections = useMemo(() => {
    const collections = new Map();

    for (const product of normalizedProducts) {
      if (!product.collection) {
        continue;
      }

      const slug = slugify(
        product.collection
      );

      if (!slug) {
        continue;
      }

      const current = collections.get(slug);

      if (current) {
        current.count += 1;
        continue;
      }

      collections.set(slug, {
        slug,
        name: product.collection,
        nameFa:
          product.collectionFa ||
          product.collection,
        count: 1,
      });
    }

    return [...collections.values()].sort(
      (left, right) =>
        right.count - left.count
    );
  }, [normalizedProducts]);

  const availableSizes = useMemo(() => {
    const values = new Set();

    for (const product of normalizedProducts) {
      for (const productSize of toArray(
        product.sizes
      )) {
        const value = normalizeText(
          productSize
        );

        if (value) {
          values.add(String(productSize));
        }
      }
    }

    return [...values].sort(
      compareNatural
    );
  }, [normalizedProducts]);

  const availableColors = useMemo(() => {
    const colors = new Map();

    for (const product of normalizedProducts) {
      for (const productColor of toArray(
        product.colors
      )) {
        const label =
          typeof productColor === "string"
            ? productColor
            : productColor?.label ||
            productColor?.labelFa ||
            "";

        const labelFa =
          typeof productColor === "string"
            ? productColor
            : productColor?.labelFa ||
            productColor?.label ||
            "";

        const key = normalizeText(label);

        if (!key || colors.has(key)) {
          continue;
        }

        colors.set(key, {
          value: key,
          label,
          labelFa,
          hex:
            typeof productColor === "object"
              ? productColor?.hex || ""
              : "",
        });
      }
    }

    return [...colors.values()].sort(
      (left, right) =>
        compareNatural(
          left.label,
          right.label
        )
    );
  }, [normalizedProducts]);

  const priceBounds = useMemo(() => {
    const prices = normalizedProducts
      .map((product) =>
        toFiniteNumber(
          product.priceAmount
        )
      )
      .filter((value) => value !== null);

    if (!prices.length) {
      return {
        min: null,
        max: null,
      };
    }

    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }, [normalizedProducts]);

  const bestSellingAvailable = useMemo(
    () =>
      normalizedProducts.some(
        hasRealSalesData
      ),
    [normalizedProducts]
  );

  const filteredProducts = useMemo(() => {
    const normalizedQuery =
      normalizeText(query);

    const normalizedCategory =
      normalizeFilterValue(category);

    const normalizedCollection =
      normalizeFilterValue(collection);

    const normalizedSize =
      normalizeFilterValue(size);

    const normalizedColor =
      normalizeFilterValue(color);

    const parsedMinPrice =
      toFiniteNumber(minPrice);

    const parsedMaxPrice =
      toFiniteNumber(maxPrice);

    const filtered =
      normalizedProducts.filter(
        (product) => {
          if (
            normalizedCategory !==
            "all" &&
            getProductCategorySlug(
              product
            ) !== normalizedCategory
          ) {
            return false;
          }

          if (
            normalizedCollection !==
            "all" &&
            getProductCollectionSlug(
              product
            ) !== normalizedCollection
          ) {
            return false;
          }

          if (
            normalizedQuery &&
            !matchesSearch(
              product,
              normalizedQuery
            )
          ) {
            return false;
          }

          const price =
            toFiniteNumber(
              product.priceAmount
            );

          if (
            parsedMinPrice !== null &&
            (price === null ||
              price < parsedMinPrice)
          ) {
            return false;
          }

          if (
            parsedMaxPrice !== null &&
            (price === null ||
              price > parsedMaxPrice)
          ) {
            return false;
          }

          if (
            normalizedSize !== "all" &&
            !matchesSize(
              product,
              normalizedSize
            )
          ) {
            return false;
          }

          if (
            normalizedColor !== "all" &&
            !matchesColor(
              product,
              normalizedColor
            )
          ) {
            return false;
          }

          if (
            inStock &&
            !isProductInStock(product)
          ) {
            return false;
          }

          if (
            sale &&
            !isProductOnSale(product)
          ) {
            return false;
          }

          return true;
        }
      );

    return sortProducts(
      filtered,
      sort,
      {
        bestSellingAvailable,
      }
    );
  }, [
    normalizedProducts,
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
    bestSellingAvailable,
  ]);

  const activeFilterCount = useMemo(
    () =>
      [
        normalizeText(query)
          ? true
          : false,

        normalizeFilterValue(
          category
        ) !== "all",

        normalizeFilterValue(
          collection
        ) !== "all",

        toFiniteNumber(minPrice) !==
        null,

        toFiniteNumber(maxPrice) !==
        null,

        normalizeFilterValue(size) !==
        "all",

        normalizeFilterValue(color) !==
        "all",

        Boolean(inStock),

        Boolean(sale),
      ].filter(Boolean).length,
    [
      query,
      category,
      collection,
      minPrice,
      maxPrice,
      size,
      color,
      inStock,
      sale,
    ]
  );

  return {
    products: filteredProducts,

    totalCount:
      normalizedProducts.length,

    filteredCount:
      filteredProducts.length,

    activeFilterCount,

    availableCategories,
    availableCollections,
    availableSizes,
    availableColors,

    priceBounds,

    bestSellingAvailable,
  };
}

function matchesSearch(
  product,
  normalizedQuery
) {
  const searchable = [
    product.name,
    product.nameFa,
    product.handle,
    product.category,
    product.categoryFa,
    product.collection,
    product.collectionFa,
    product.description,
    product.descriptionFa,

    ...toArray(product.sizes),

    ...toArray(product.colors).flatMap(
      (productColor) => {
        if (
          typeof productColor ===
          "string"
        ) {
          return [productColor];
        }

        return [
          productColor?.label,
          productColor?.labelFa,
        ];
      }
    ),
  ]
    .filter(Boolean)
    .map(normalizeText)
    .join(" ");

  return searchable.includes(
    normalizedQuery
  );
}

function matchesSize(
  product,
  normalizedSize
) {
  return toArray(product.sizes).some(
    (productSize) =>
      normalizeText(productSize) ===
      normalizedSize
  );
}

function matchesColor(
  product,
  normalizedColor
) {
  return toArray(product.colors).some(
    (productColor) => {
      if (
        typeof productColor ===
        "string"
      ) {
        return (
          normalizeText(
            productColor
          ) === normalizedColor
        );
      }

      return [
        productColor?.label,
        productColor?.labelFa,
      ]
        .filter(Boolean)
        .some(
          (value) =>
            normalizeText(value) ===
            normalizedColor
        );
    }
  );
}

function isProductInStock(product) {
  if (
    typeof product.inStock ===
    "boolean"
  ) {
    return product.inStock;
  }

  const stockCount =
    toFiniteNumber(
      product.stockCount
    );

  if (stockCount !== null) {
    return stockCount > 0;
  }

  return false;
}

function isProductOnSale(product) {
  const price =
    toFiniteNumber(
      product.priceAmount
    );

  const compareAt =
    toFiniteNumber(
      product.compareAtAmount
    );

  if (
    price !== null &&
    compareAt !== null &&
    compareAt > price
  ) {
    return true;
  }

  return (
    normalizeText(product.badge) ===
    "sale"
  );
}

function sortProducts(
  products,
  sort,
  {
    bestSellingAvailable,
  }
) {
  const items = [...products];

  switch (sort) {
    case "price-asc":
      return items.sort(
        comparePriceAscending
      );

    case "price-desc":
      return items.sort(
        comparePriceDescending
      );

    case "newest":
      return sortNewest(items);

    case "best-selling":
      if (!bestSellingAvailable) {
        return items;
      }

      return items.sort(
        compareBestSelling
      );

    case "featured":
    default:
      return items;
  }
}

function comparePriceAscending(
  left,
  right
) {
  return compareNullableNumbers(
    toFiniteNumber(
      left.priceAmount
    ),
    toFiniteNumber(
      right.priceAmount
    ),
    "asc"
  );
}

function comparePriceDescending(
  left,
  right
) {
  return compareNullableNumbers(
    toFiniteNumber(
      left.priceAmount
    ),
    toFiniteNumber(
      right.priceAmount
    ),
    "desc"
  );
}

function sortNewest(products) {
  const hasDates = products.some(
    (product) =>
      getProductTimestamp(product) !==
      null
  );

  if (!hasDates) {
    return products;
  }

  return products.sort(
    (left, right) => {
      const leftTime =
        getProductTimestamp(left);

      const rightTime =
        getProductTimestamp(right);

      return compareNullableNumbers(
        leftTime,
        rightTime,
        "desc"
      );
    }
  );
}

function compareBestSelling(
  left,
  right
) {
  const leftSales =
    getSalesScore(left);

  const rightSales =
    getSalesScore(right);

  return compareNullableNumbers(
    leftSales,
    rightSales,
    "desc"
  );
}

function hasRealSalesData(product) {
  return (
    toFiniteNumber(
      product.unitsSold
    ) !== null ||
    toFiniteNumber(
      product.salesCount
    ) !== null ||
    toFiniteNumber(
      product.salesRank
    ) !== null
  );
}

function getSalesScore(product) {
  const unitsSold =
    toFiniteNumber(
      product.unitsSold
    );

  if (unitsSold !== null) {
    return unitsSold;
  }

  const salesCount =
    toFiniteNumber(
      product.salesCount
    );

  if (salesCount !== null) {
    return salesCount;
  }

  const salesRank =
    toFiniteNumber(
      product.salesRank
    );

  if (salesRank !== null) {
    // A lower explicit rank is better.
    // Convert it to a descending score
    // without inventing sales volume.
    return -salesRank;
  }

  return null;
}

function getProductTimestamp(
  product
) {
  const candidates = [
    product.createdAt,
    product.created_at,
    product.publishedAt,
    product.published_at,
    product.updatedAt,
    product.updated_at,
  ];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    const timestamp =
      Date.parse(candidate);

    if (
      Number.isFinite(timestamp)
    ) {
      return timestamp;
    }
  }

  return null;
}

function getProductCategorySlug(
  product
) {
  return normalizeFilterValue(
    product.categorySlug ||
    slugify(product.category)
  );
}

function getProductCollectionSlug(
  product
) {
  return normalizeFilterValue(
    slugify(product.collection)
  );
}

function compareNullableNumbers(
  left,
  right,
  direction
) {
  if (
    left === null &&
    right === null
  ) {
    return 0;
  }

  if (left === null) {
    return 1;
  }

  if (right === null) {
    return -1;
  }

  return direction === "desc"
    ? right - left
    : left - right;
}

function compareNatural(
  left,
  right
) {
  return String(left).localeCompare(
    String(right),
    undefined,
    {
      numeric: true,
      sensitivity: "base",
    }
  );
}

function normalizeFilterValue(
  value
) {
  const normalized =
    normalizeText(value);

  return normalized || "all";
}

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function toFiniteNumber(value) {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

function toArray(value) {
  return Array.isArray(value)
    ? value
    : [];
}