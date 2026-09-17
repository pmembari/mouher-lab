import { useMemo } from "react";

import ProductCard from "../components/storefront/ProductCard";
import { useCatalogBrowse } from "../hooks/useCatalogBrowse";

export default function ShopPage({
  route,
  catalog,
  catalogState,
  language,
  t,
  addingProductId,
  onAddToCart,
}) {
  const isFarsi =
    language === "farsi";

  const browseInput = useMemo(() => {
    if (route.type === "category") {
      return {
        products:
          catalog.products || [],

        category:
          route.slug,

        collection: "all",

        query: "",

        minPrice:
          route.minPrice || "",

        maxPrice:
          route.maxPrice || "",

        size:
          route.size || "all",

        color:
          route.color || "all",

        inStock:
          Boolean(route.inStock),

        sale:
          Boolean(route.sale),

        sort:
          route.sort || "featured",
      };
    }

    if (route.type === "collection") {
      return {
        products:
          catalog.products || [],

        category: "all",

        collection:
          route.slug,

        query: "",

        minPrice:
          route.minPrice || "",

        maxPrice:
          route.maxPrice || "",

        size:
          route.size || "all",

        color:
          route.color || "all",

        inStock:
          Boolean(route.inStock),

        sale:
          Boolean(route.sale),

        sort:
          route.sort || "featured",
      };
    }

    return {
      products:
        catalog.products || [],

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
        Boolean(route.inStock),

      sale:
        Boolean(route.sale),

      sort:
        route.sort || "featured",
    };
  }, [
    route,
    catalog.products,
  ]);

  const browse =
    useCatalogBrowse(
      browseInput
    );

  const pageTitle =
    getPageTitle({
      route,
      browse,
      isFarsi,
    });

  const pageDescription =
    getPageDescription({
      route,
      browse,
      isFarsi,
    });

  function updateRoute(
    changes
  ) {
    const next =
      buildNextRoute({
        route,
        changes,
      });

    window.location.hash =
      next;
  }

  function resetFilters() {
    if (
      route.type ===
      "category"
    ) {
      window.location.hash =
        `#/categories/${encodeURIComponent(
          route.slug
        )}`;

      return;
    }

    if (
      route.type ===
      "collection"
    ) {
      window.location.hash =
        `#/collections/${encodeURIComponent(
          route.slug
        )}`;

      return;
    }

    if (
      route.type ===
      "search"
    ) {
      const params =
        new URLSearchParams();

      if (route.query) {
        params.set(
          "q",
          route.query
        );
      }

      const queryString =
        params.toString();

      window.location.hash =
        `#/search${queryString
          ? `?${queryString}`
          : ""
        }`;

      return;
    }

    window.location.hash =
      "#/shop";
  }

  return (
    <section
      className="shop-page section"
      aria-labelledby="shop-title"
    >
      <header className="shop-page-header">
        <div>
          <span className="eyebrow">
            {isFarsi
              ? "فروشگاه موهر"
              : "Mouher Store"}
          </span>

          <h1 id="shop-title">
            {pageTitle}
          </h1>

          <p className="shop-page-description">
            {pageDescription}
          </p>
        </div>

        <div className="shop-result-count">
          {isFarsi
            ? `${browse.filteredCount} محصول`
            : `${browse.filteredCount} ${browse.filteredCount ===
              1
              ? "product"
              : "products"
            }`}
        </div>
      </header>

      <div className="catalog-browser">
        <aside
          className="catalog-filters"
          aria-label={
            isFarsi
              ? "فیلتر محصولات"
              : "Product filters"
          }
        >
          <FilterGroup
            title={
              isFarsi
                ? "دسته‌بندی"
                : "Category"
            }
          >
            <select
              value={
                browseInput.category
              }
              onChange={(event) =>
                updateRoute({
                  category:
                    event.target
                      .value,
                })
              }
              disabled={
                route.type ===
                "category"
              }
            >
              <option value="all">
                {isFarsi
                  ? "همه"
                  : "All"}
              </option>

              {browse.availableCategories.map(
                (category) => (
                  <option
                    key={
                      category.slug
                    }
                    value={
                      category.slug
                    }
                  >
                    {isFarsi
                      ? category.nameFa
                      : category.name}
                    {" "}
                    ({category.count})
                  </option>
                )
              )}
            </select>
          </FilterGroup>

          <FilterGroup
            title={
              isFarsi
                ? "کالکشن"
                : "Collection"
            }
          >
            <select
              value={
                browseInput.collection
              }
              onChange={(event) =>
                updateRoute({
                  collection:
                    event.target
                      .value,
                })
              }
              disabled={
                route.type ===
                "collection"
              }
            >
              <option value="all">
                {isFarsi
                  ? "همه"
                  : "All"}
              </option>

              {browse.availableCollections.map(
                (collection) => (
                  <option
                    key={
                      collection.slug
                    }
                    value={
                      collection.slug
                    }
                  >
                    {isFarsi
                      ? collection.nameFa
                      : collection.name}
                    {" "}
                    ({collection.count})
                  </option>
                )
              )}
            </select>
          </FilterGroup>

          <FilterGroup
            title={
              isFarsi
                ? "قیمت"
                : "Price"
            }
          >
            <div className="price-filter-row">
              <input
                type="number"
                inputMode="numeric"
                min={
                  browse
                    .priceBounds
                    .min ??
                  undefined
                }
                max={
                  browse
                    .priceBounds
                    .max ??
                  undefined
                }
                value={
                  browseInput.minPrice
                }
                placeholder={
                  isFarsi
                    ? "حداقل"
                    : "Min"
                }
                onChange={(event) =>
                  updateRoute({
                    minPrice:
                      event.target
                        .value,
                  })
                }
              />

              <input
                type="number"
                inputMode="numeric"
                min={
                  browse
                    .priceBounds
                    .min ??
                  undefined
                }
                max={
                  browse
                    .priceBounds
                    .max ??
                  undefined
                }
                value={
                  browseInput.maxPrice
                }
                placeholder={
                  isFarsi
                    ? "حداکثر"
                    : "Max"
                }
                onChange={(event) =>
                  updateRoute({
                    maxPrice:
                      event.target
                        .value,
                  })
                }
              />
            </div>
          </FilterGroup>

          {browse
            .availableSizes
            .length > 0 && (
              <FilterGroup
                title={
                  isFarsi
                    ? "سایز"
                    : "Size"
                }
              >
                <select
                  value={
                    browseInput.size
                  }
                  onChange={(event) =>
                    updateRoute({
                      size:
                        event.target
                          .value,
                    })
                  }
                >
                  <option value="all">
                    {isFarsi
                      ? "همه سایزها"
                      : "All sizes"}
                  </option>

                  {browse.availableSizes.map(
                    (size) => (
                      <option
                        key={size}
                        value={String(
                          size
                        ).toLowerCase()}
                      >
                        {size}
                      </option>
                    )
                  )}
                </select>
              </FilterGroup>
            )}

          {browse
            .availableColors
            .length > 0 && (
              <FilterGroup
                title={
                  isFarsi
                    ? "رنگ"
                    : "Color"
                }
              >
                <select
                  value={
                    browseInput.color
                  }
                  onChange={(event) =>
                    updateRoute({
                      color:
                        event.target
                          .value,
                    })
                  }
                >
                  <option value="all">
                    {isFarsi
                      ? "همه رنگ‌ها"
                      : "All colors"}
                  </option>

                  {browse.availableColors.map(
                    (color) => (
                      <option
                        key={
                          color.value
                        }
                        value={
                          color.value
                        }
                      >
                        {isFarsi
                          ? color.labelFa
                          : color.label}
                      </option>
                    )
                  )}
                </select>
              </FilterGroup>
            )}

          <FilterGroup
            title={
              isFarsi
                ? "وضعیت"
                : "Availability"
            }
          >
            <label className="filter-check">
              <input
                type="checkbox"
                checked={
                  browseInput.inStock
                }
                onChange={(event) =>
                  updateRoute({
                    inStock:
                      event.target
                        .checked,
                  })
                }
              />

              <span>
                {isFarsi
                  ? "فقط موجود"
                  : "In stock only"}
              </span>
            </label>

            <label className="filter-check">
              <input
                type="checkbox"
                checked={
                  browseInput.sale
                }
                onChange={(event) =>
                  updateRoute({
                    sale:
                      event.target
                        .checked,
                  })
                }
              />

              <span>
                {isFarsi
                  ? "فقط تخفیف‌دار"
                  : "Sale only"}
              </span>
            </label>
          </FilterGroup>

          {browse.activeFilterCount >
            0 && (
              <button
                type="button"
                className="filter-reset"
                onClick={
                  resetFilters
                }
              >
                {isFarsi
                  ? "پاک کردن فیلترها"
                  : "Clear filters"}
              </button>
            )}
        </aside>

        <div className="catalog-results">
          <div className="catalog-toolbar">
            <div>
              {browse.activeFilterCount >
                0 && (
                  <span className="active-filter-count">
                    {isFarsi
                      ? `${browse.activeFilterCount} فیلتر فعال`
                      : `${browse.activeFilterCount} active ${browse.activeFilterCount ===
                        1
                        ? "filter"
                        : "filters"
                      }`}
                  </span>
                )}
            </div>

            <label className="catalog-sort">
              <span>
                {isFarsi
                  ? "مرتب‌سازی"
                  : "Sort"}
              </span>

              <select
                value={
                  browseInput.sort
                }
                onChange={(event) =>
                  updateRoute({
                    sort:
                      event.target
                        .value,
                  })
                }
              >
                <option value="featured">
                  {isFarsi
                    ? "پیشنهادی"
                    : "Featured"}
                </option>

                <option value="newest">
                  {isFarsi
                    ? "جدیدترین"
                    : "Newest"}
                </option>

                <option value="price-asc">
                  {isFarsi
                    ? "قیمت: کم به زیاد"
                    : "Price: Low to High"}
                </option>

                <option value="price-desc">
                  {isFarsi
                    ? "قیمت: زیاد به کم"
                    : "Price: High to Low"}
                </option>

                {browse.bestSellingAvailable && (
                  <option value="best-selling">
                    {isFarsi
                      ? "پرفروش‌ترین"
                      : "Best Selling"}
                  </option>
                )}
              </select>
            </label>
          </div>

          {catalogState ===
            "loading" ? (
            <p className="empty-state">
              {t.products.loading}
            </p>
          ) : browse.products
            .length > 0 ? (
            <div className="products-grid">
              {browse.products.map(
                (product) => (
                  <ProductCard
                    key={
                      product.id
                    }
                    product={
                      product
                    }
                    language={
                      language
                    }
                    labels={
                      t.cart
                    }
                    onAdd={
                      onAddToCart
                    }
                    isAdding={
                      addingProductId ===
                      product.id
                    }
                  />
                )
              )}
            </div>
          ) : (
            <div className="catalog-empty">
              <h2>
                {isFarsi
                  ? "محصولی پیدا نشد"
                  : "No products found"}
              </h2>

              <p>
                {isFarsi
                  ? "فیلترها را تغییر دهید یا همه فیلترها را پاک کنید."
                  : "Try changing the filters or clear them to see more products."}
              </p>

              <button
                type="button"
                className="button button-dark"
                onClick={
                  resetFilters
                }
              >
                {isFarsi
                  ? "پاک کردن فیلترها"
                  : "Clear filters"}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function FilterGroup({
  title,
  children,
}) {
  return (
    <div className="filter-group">
      <h2>
        {title}
      </h2>

      <div className="filter-group-content">
        {children}
      </div>
    </div>
  );
}

function getPageTitle({
  route,
  browse,
  isFarsi,
}) {
  if (
    route.type ===
    "category"
  ) {
    const category =
      browse.availableCategories.find(
        (item) =>
          item.slug ===
          route.slug
      );

    return (
      (isFarsi
        ? category?.nameFa
        : category?.name) ||
      formatSlug(route.slug)
    );
  }

  if (
    route.type ===
    "collection"
  ) {
    const collection =
      browse.availableCollections.find(
        (item) =>
          item.slug ===
          route.slug
      );

    return (
      (isFarsi
        ? collection?.nameFa
        : collection?.name) ||
      formatSlug(route.slug)
    );
  }

  if (
    route.type ===
    "search"
  ) {
    return route.query
      ? isFarsi
        ? `نتایج برای «${route.query}»`
        : `Results for “${route.query}”`
      : isFarsi
        ? "جستجو"
        : "Search";
  }

  return isFarsi
    ? "همه محصولات"
    : "Shop All";
}

function getPageDescription({
  route,
  browse,
  isFarsi,
}) {
  if (
    route.type ===
    "category"
  ) {
    return isFarsi
      ? "محصولات این دسته‌بندی را ببینید و با فیلترهای بیشتر انتخاب خود را محدود کنید."
      : "Explore this category and refine the selection with additional filters.";
  }

  if (
    route.type ===
    "collection"
  ) {
    return isFarsi
      ? "محصولات این کالکشن و ادیت را مرور کنید."
      : "Explore products from this Mouher collection.";
  }

  if (
    route.type ===
    "search"
  ) {
    return isFarsi
      ? `${browse.filteredCount} نتیجه از کاتالوگ موهر`
      : `${browse.filteredCount} results from the Mouher catalog`;
  }

  return isFarsi
    ? "کاتالوگ کامل موهر با امکان فیلتر بر اساس دسته، کالکشن، قیمت، سایز و رنگ."
    : "Explore the full Mouher catalog with category, collection, price, size and color filters.";
}

function buildNextRoute({
  route,
  changes,
}) {
  const params =
    new URLSearchParams();

  const current = {
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
      route.sort ||
      "featured",

    ...changes,
  };

  if (
    route.type ===
    "category"
  ) {
    current.category =
      route.slug;
  }

  if (
    route.type ===
    "collection"
  ) {
    current.collection =
      route.slug;
  }

  if (current.query) {
    params.set(
      "q",
      current.query
    );
  }

  if (
    current.category !==
    "all" &&
    route.type !==
    "category"
  ) {
    params.set(
      "category",
      current.category
    );
  }

  if (
    current.collection !==
    "all" &&
    route.type !==
    "collection"
  ) {
    params.set(
      "collection",
      current.collection
    );
  }

  if (current.minPrice) {
    params.set(
      "minPrice",
      current.minPrice
    );
  }

  if (current.maxPrice) {
    params.set(
      "maxPrice",
      current.maxPrice
    );
  }

  if (
    current.size !==
    "all"
  ) {
    params.set(
      "size",
      current.size
    );
  }

  if (
    current.color !==
    "all"
  ) {
    params.set(
      "color",
      current.color
    );
  }

  if (
    current.inStock
  ) {
    params.set(
      "inStock",
      "true"
    );
  }

  if (current.sale) {
    params.set(
      "sale",
      "true"
    );
  }

  if (
    current.sort !==
    "featured"
  ) {
    params.set(
      "sort",
      current.sort
    );
  }

  let path = "shop";

  if (
    route.type ===
    "category"
  ) {
    path =
      `categories/${encodeURIComponent(
        route.slug
      )}`;
  }

  if (
    route.type ===
    "collection"
  ) {
    path =
      `collections/${encodeURIComponent(
        route.slug
      )}`;
  }

  if (
    route.type ===
    "search"
  ) {
    path = "search";
  }

  const queryString =
    params.toString();

  return `#/${path}${queryString
      ? `?${queryString}`
      : ""
    }`;
}

function formatSlug(value) {
  return String(value || "")
    .split("-")
    .filter(Boolean)
    .map(
      (part) =>
        part.charAt(0)
          .toUpperCase() +
        part.slice(1)
    )
    .join(" ");
}