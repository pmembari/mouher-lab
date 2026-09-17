import {
  compareNullableNumbers,
  finiteNumber,
  getProductTimestamp,
  normalizeFilterValue,
  normalizeText,
  slugify,
  toArray,
} from "./helpers";

export function applyClientFilters(
  products,
  {
    query = "",
    category = "all",
    collection = "all",

    minPrice = "",
    maxPrice = "",

    size = "all",
    color = "all",

    inStock = false,
    sale = false,
  } = {}
) {
  const normalizedQuery =
    normalizeText(query);

  const normalizedCategory =
    normalizeFilterValue(
      category
    );

  const normalizedCollection =
    normalizeFilterValue(
      collection
    );

  const normalizedSize =
    normalizeFilterValue(
      size
    );

  const normalizedColor =
    normalizeFilterValue(
      color
    );

  const parsedMinPrice =
    finiteNumber(
      minPrice
    );

  const parsedMaxPrice =
    finiteNumber(
      maxPrice
    );

  return (
    Array.isArray(products)
      ? products
      : []
  ).filter((product) => {
    if (
      normalizedCategory !==
      "all" &&
      getProductCategorySlug(
        product
      ) !==
      normalizedCategory
    ) {
      return false;
    }

    if (
      normalizedCollection !==
      "all" &&
      getProductCollectionSlug(
        product
      ) !==
      normalizedCollection
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
      finiteNumber(
        product.priceAmount
      );

    if (
      parsedMinPrice !== null &&
      (
        price === null ||
        price <
        parsedMinPrice
      )
    ) {
      return false;
    }

    if (
      parsedMaxPrice !== null &&
      (
        price === null ||
        price >
        parsedMaxPrice
      )
    ) {
      return false;
    }

    if (
      normalizedSize !==
      "all" &&
      !matchesSize(
        product,
        normalizedSize
      )
    ) {
      return false;
    }

    if (
      normalizedColor !==
      "all" &&
      !matchesColor(
        product,
        normalizedColor
      )
    ) {
      return false;
    }

    if (
      inStock &&
      !isProductInStock(
        product
      )
    ) {
      return false;
    }

    if (
      sale &&
      !isProductOnSale(
        product
      )
    ) {
      return false;
    }

    return true;
  });
}

export function sortProducts(
  products,
  sort
) {
  const items = [
    ...(
      Array.isArray(products)
        ? products
        : []
    ),
  ];

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
      return sortNewest(
        items
      );

    case "best-selling":
      if (
        !items.some(
          hasRealSalesData
        )
      ) {
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

export function hasRealSalesData(
  product
) {
  return (
    finiteNumber(
      product?.unitsSold
    ) !== null ||
    finiteNumber(
      product?.salesCount
    ) !== null ||
    finiteNumber(
      product?.salesRank
    ) !== null
  );
}

export function getSalesScore(
  product
) {
  const unitsSold =
    finiteNumber(
      product?.unitsSold
    );

  if (unitsSold !== null) {
    return unitsSold;
  }

  const salesCount =
    finiteNumber(
      product?.salesCount
    );

  if (salesCount !== null) {
    return salesCount;
  }

  const salesRank =
    finiteNumber(
      product?.salesRank
    );

  if (salesRank !== null) {
    return -salesRank;
  }

  return null;
}

export function isProductInStock(
  product
) {
  if (
    typeof product?.inStock ===
    "boolean"
  ) {
    return product.inStock;
  }

  const stock =
    finiteNumber(
      product?.stockCount
    );

  return stock !== null
    ? stock > 0
    : false;
}

export function isProductOnSale(
  product
) {
  const price =
    finiteNumber(
      product?.priceAmount
    );

  const compareAt =
    finiteNumber(
      product?.compareAtAmount
    );

  if (
    price !== null &&
    compareAt !== null &&
    compareAt > price
  ) {
    return true;
  }

  return (
    normalizeText(
      product?.badge
    ) === "sale"
  );
}

export function getProductCategorySlug(
  product
) {
  return normalizeFilterValue(
    product?.categorySlug ||
    slugify(
      product?.category
    )
  );
}

export function getProductCollectionSlug(
  product
) {
  return normalizeFilterValue(
    slugify(
      product?.collection
    )
  );
}

function matchesSearch(
  product,
  query
) {
  const searchable = [
    product?.name,
    product?.nameFa,
    product?.handle,

    product?.category,
    product?.categoryFa,

    product?.collection,
    product?.collectionFa,

    product?.description,
    product?.descriptionFa,

    ...toArray(
      product?.sizes
    ),

    ...toArray(
      product?.colors
    ).flatMap(
      (item) => {
        if (
          typeof item ===
          "string"
        ) {
          return [item];
        }

        return [
          item?.label,
          item?.labelFa,
        ];
      }
    ),
  ]
    .filter(Boolean)
    .map(normalizeText)
    .join(" ");

  return searchable.includes(
    query
  );
}

function matchesSize(
  product,
  normalizedSize
) {
  return toArray(
    product?.sizes
  ).some(
    (value) =>
      normalizeText(value) ===
      normalizedSize
  );
}

function matchesColor(
  product,
  normalizedColor
) {
  return toArray(
    product?.colors
  ).some((item) => {
    if (
      typeof item ===
      "string"
    ) {
      return (
        normalizeText(item) ===
        normalizedColor
      );
    }

    return [
      item?.label,
      item?.labelFa,
    ]
      .filter(Boolean)
      .some(
        (value) =>
          normalizeText(
            value
          ) ===
          normalizedColor
      );
  });
}

function comparePriceAscending(
  left,
  right
) {
  return compareNullableNumbers(
    finiteNumber(
      left?.priceAmount
    ),
    finiteNumber(
      right?.priceAmount
    ),
    "asc"
  );
}

function comparePriceDescending(
  left,
  right
) {
  return compareNullableNumbers(
    finiteNumber(
      left?.priceAmount
    ),
    finiteNumber(
      right?.priceAmount
    ),
    "desc"
  );
}

function sortNewest(
  products
) {
  const hasDates =
    products.some(
      (product) =>
        getProductTimestamp(
          product
        ) !== null
    );

  if (!hasDates) {
    return products;
  }

  return products.sort(
    (left, right) =>
      compareNullableNumbers(
        getProductTimestamp(
          left
        ),

        getProductTimestamp(
          right
        ),

        "desc"
      )
  );
}

function compareBestSelling(
  left,
  right
) {
  return compareNullableNumbers(
    getSalesScore(left),
    getSalesScore(right),
    "desc"
  );
}