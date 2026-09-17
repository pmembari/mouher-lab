import {
  CATEGORY_LABELS,
  FALLBACK_CATALOG,
} from "./constants";

import {
  firstValue,
  slugify,
  toArray,
} from "./helpers";

export function normalizeMedusaProductsResponse(
  response,
  fallbackCurrency
) {
  const products =
    Array.isArray(response?.products)
      ? response.products
      : [];

  const normalizedProducts = products
    .map((product) =>
      normalizeMedusaProduct(
        product,
        fallbackCurrency
      )
    )
    .filter(Boolean);

  return {
    products: normalizedProducts,

    categories:
      buildCategories(
        normalizedProducts
      ),

    collections:
      buildCollections(
        normalizedProducts
      ),

    featuredImage:
      normalizedProducts.find(
        (product) =>
          product.imageUrls.length
      )?.imageUrls[0] ||
      FALLBACK_CATALOG.featuredImage,

    merchandising:
      FALLBACK_CATALOG.merchandising,
  };
}

export function normalizeMedusaProduct(
  product,
  fallbackCurrency = "eur"
) {
  if (
    !product?.id ||
    !product?.title
  ) {
    return null;
  }

  const variants =
    Array.isArray(product.variants)
      ? product.variants
      : [];

  const pricedVariants = variants
    .map((variant) => ({
      variant,

      price:
        extractVariantPrice(
          variant,
          fallbackCurrency
        ),
    }))
    .filter(
      ({ price }) =>
        price
    );

  const selectedVariant =
    pricedVariants.sort(
      (left, right) =>
        left.price.amount -
        right.price.amount
    )[0]?.variant ||
    variants[0];

  const selectedPrice =
    extractVariantPrice(
      selectedVariant,
      fallbackCurrency
    );

  const compareAtPrice =
    extractCompareAtPrice(
      selectedVariant,
      fallbackCurrency
    );

  const categoryValue =
    firstValue(
      product.categories
    )?.name ||
    product.collection?.title ||
    product.type?.value ||
    product.metadata?.category ||
    "Clothing";

  const category =
    normalizeCategoryLabel(
      categoryValue
    );

  const imageUrls = [
    product.thumbnail,

    ...toArray(
      product.images
    ).map(
      (image) =>
        image?.url
    ),
  ].filter(Boolean);

  return {
    id:
      product.id,

    handle:
      product.handle ||
      product.id,

    name:
      product.metadata
        ?.name_en ||
      product.title,

    nameFa:
      product.metadata
        ?.name_fa ||
      product.title,

    category:
      category.name,

    categoryFa:
      category.nameFa,

    categorySlug:
      category.slug,

    collection:
      product.collection?.title ||
      "",

    collectionFa:
      product.collection?.metadata
        ?.title_fa ||
      product.collection?.title ||
      "",

    price:
      selectedPrice
        ? formatPrice(
          selectedPrice.amount,
          selectedPrice.currencyCode
        )
        : "Price on request",

    priceAmount:
      selectedPrice?.amount ??
      null,

    compareAtPrice:
      compareAtPrice &&
        selectedPrice &&
        compareAtPrice.amount >
        selectedPrice.amount
        ? formatPrice(
          compareAtPrice.amount,
          compareAtPrice.currencyCode
        )
        : "",

    compareAtAmount:
      compareAtPrice &&
        selectedPrice &&
        compareAtPrice.amount >
        selectedPrice.amount
        ? compareAtPrice.amount
        : null,

    installment:
      selectedPrice
        ? `4 payments of ${formatPrice(
          selectedPrice.amount / 4,
          selectedPrice.currencyCode
        )}`
        : "",

    imageUrls,

    description:
      product.description || "",

    descriptionFa:
      product.metadata
        ?.description_fa ||
      product.description ||
      "",

    badge:
      product.tags?.length
        ? product.tags[0].value ||
        product.tags[0].name
        : "",

    variantId:
      selectedVariant?.id ||
      null,

    inStock:
      isVariantPurchasable(
        selectedVariant
      ),

    stockCount:
      getVariantStock(
        selectedVariant
      ),

    colors:
      extractColors(
        variants,
        product.options
      ),

    sizes:
      extractOptionValues(
        variants,
        [
          "Size",
          "size",
          "سایز",
        ]
      ),

    createdAt:
      product.created_at ||
      product.createdAt ||
      "",

    updatedAt:
      product.updated_at ||
      product.updatedAt ||
      "",

    source: "medusa",
  };
}

export function formatPrice(
  amount,
  currencyCode = "eur",
  locale = "en-US"
) {
  const numericAmount =
    Number(amount);

  if (
    !Number.isFinite(
      numericAmount
    )
  ) {
    return "";
  }

  try {
    return new Intl.NumberFormat(
      locale,
      {
        style: "currency",

        currency:
          currencyCode.toUpperCase(),

        maximumFractionDigits:
          numericAmount % 1 === 0
            ? 0
            : 2,
      }
    ).format(
      numericAmount
    );
  } catch {
    return `${numericAmount.toLocaleString(
      locale
    )} ${currencyCode.toUpperCase()}`;
  }
}

export function buildCategories(
  products
) {
  const bySlug =
    new Map();

  for (
    const product
    of products
  ) {
    const slug =
      product.categorySlug ||
      slugify(
        product.category
      );

    const current =
      bySlug.get(slug) || {
        id: slug,
        slug,

        name:
          product.category,

        nameFa:
          product.categoryFa,

        count: 0,

        imageUrl:
          product.imageUrls?.[0] ||
          FALLBACK_CATALOG.featuredImage,
      };

    current.count += 1;

    bySlug.set(
      slug,
      current
    );
  }

  return [
    ...bySlug.values(),
  ].sort(
    (left, right) =>
      right.count -
      left.count
  );
}

export function buildCollections(
  products
) {
  const bySlug =
    new Map();

  for (
    const product
    of products
  ) {
    if (
      !product.collection
    ) {
      continue;
    }

    const slug =
      slugify(
        product.collection
      );

    const current =
      bySlug.get(slug) || {
        id: slug,
        slug,

        name:
          product.collection,

        nameFa:
          product.collectionFa ||
          product.collection,

        count: 0,
      };

    current.count += 1;

    bySlug.set(
      slug,
      current
    );
  }

  return [
    ...bySlug.values(),
  ].sort(
    (left, right) =>
      right.count -
      left.count
  );
}

function extractVariantPrice(
  variant,
  fallbackCurrency
) {
  if (!variant) {
    return null;
  }

  const calculated =
    variant.calculated_price;

  const calculatedAmount =
    calculated
      ?.calculated_amount_with_tax ??
    calculated
      ?.calculated_amount ??
    calculated
      ?.original_amount_with_tax ??
    calculated
      ?.original_amount;

  if (
    calculatedAmount !==
    undefined &&
    calculatedAmount !==
    null
  ) {
    return {
      amount:
        Number(
          calculatedAmount
        ),

      currencyCode:
        calculated.currency_code ||
        fallbackCurrency,
    };
  }

  const price =
    firstValue(
      variant.prices
    );

  if (
    price?.amount !==
    undefined &&
    price?.amount !==
    null
  ) {
    return {
      amount:
        Number(
          price.amount
        ),

      currencyCode:
        price.currency_code ||
        fallbackCurrency,
    };
  }

  return null;
}

function extractCompareAtPrice(
  variant,
  fallbackCurrency
) {
  if (!variant) {
    return null;
  }

  const calculated =
    variant.calculated_price;

  const originalAmount =
    calculated
      ?.original_amount_with_tax ??
    calculated
      ?.original_amount;

  if (
    originalAmount !==
    undefined &&
    originalAmount !==
    null
  ) {
    return {
      amount:
        Number(
          originalAmount
        ),

      currencyCode:
        calculated.currency_code ||
        fallbackCurrency,
    };
  }

  return null;
}

function isVariantPurchasable(
  variant
) {
  if (!variant) {
    return false;
  }

  if (
    variant.allow_backorder
  ) {
    return true;
  }

  if (
    variant.manage_inventory ===
    false
  ) {
    return true;
  }

  if (
    Number(
      variant.inventory_quantity
    ) > 0
  ) {
    return true;
  }

  return (
    variant.manage_inventory ===
    undefined
  );
}

function getVariantStock(
  variant
) {
  if (!variant) {
    return null;
  }

  if (
    variant.inventory_quantity ===
    undefined ||
    variant.inventory_quantity ===
    null
  ) {
    return null;
  }

  const stock =
    Number(
      variant.inventory_quantity
    );

  return Number.isFinite(
    stock
  )
    ? stock
    : null;
}

function extractColors(
  variants,
  productOptions
) {
  const colorValues =
    extractOptionValues(
      variants,
      [
        "Color",
        "color",
        "رنگ",
      ]
    );

  if (
    colorValues.length
  ) {
    return colorValues.map(
      (value) => ({
        label: value,
        labelFa: value,
        hex:
          colorHex(
            value
          ),
      })
    );
  }

  return toArray(
    productOptions
  )
    .filter((option) =>
      [
        "Color",
        "color",
        "رنگ",
      ].includes(
        option?.title
      )
    )

    .flatMap(
      (option) =>
        toArray(
          option.values
        )
    )

    .map((value) => {
      const label =
        value?.value ||
        value?.title ||
        "";

      return {
        label,
        labelFa: label,

        hex:
          colorHex(
            label
          ),
      };
    })

    .filter(
      (item) =>
        item.label
    );
}

function extractOptionValues(
  variants,
  optionNames
) {
  const values =
    new Set();

  for (
    const variant
    of variants
  ) {
    for (
      const option
      of toArray(
        variant.options
      )
    ) {
      const optionTitle =
        option?.option?.title ||
        option?.title ||
        "";

      const value =
        option?.value ||
        "";

      if (
        optionNames.includes(
          optionTitle
        ) &&
        value
      ) {
        values.add(
          value
        );
      }
    }
  }

  return [
    ...values,
  ];
}

function colorHex(
  label
) {
  const normalized =
    String(
      label || ""
    )
      .trim()
      .toLowerCase();

  const colors = {
    black:
      "#111111",

    "مشکی":
      "#111111",

    white:
      "#ffffff",

    "سفید":
      "#ffffff",

    gray:
      "#9a9a9a",

    grey:
      "#9a9a9a",

    "طوسی":
      "#9a9a9a",

    brown:
      "#5b4038",

    "قهوه‌ای":
      "#5b4038",

    "قهوه ای":
      "#5b4038",

    cream:
      "#e7dcc8",

    "کرم":
      "#e7dcc8",

    green:
      "#71816d",

    "سبز":
      "#71816d",

    blue:
      "#667f99",

    "آبی":
      "#667f99",
  };

  return (
    colors[normalized] ||
    "#b9b5aa"
  );
}

function normalizeCategoryLabel(
  value
) {
  const label =
    String(
      value ||
      "Clothing"
    ).trim();

  const known =
    CATEGORY_LABELS[
    label
    ];

  if (known) {
    return known;
  }

  return {
    name:
      label,

    nameFa:
      label,

    slug:
      slugify(
        label
      ),
  };
}