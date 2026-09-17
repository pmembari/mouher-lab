import {
  useEffect,
  useMemo,
  useState,
} from "react";

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

  const [
    filtersOpen,
    setFiltersOpen,
  ] = useState(false);

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

  useEffect(() => {
    if (!filtersOpen) {
      return undefined;
    }

    function handleKeyDown(
      event
    ) {
      if (
        event.key === "Escape"
      ) {
        setFiltersOpen(false);
      }
    }

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );

      document.body.style.overflow =
        previousOverflow;
    };
  }, [
    filtersOpen,
  ]);

  function updateRoute(
    changes
  ) {
    window.location.hash =
      buildNextRoute({
        route,
        changes,
      });
  }

  function resetFilters() {
    if (
      route.type === "category"
    ) {
      window.location.hash =
        `#/categories/${encodeURIComponent(
          route.slug
        )}`;

      return;
    }

    if (
      route.type === "collection"
    ) {
      window.location.hash =
        `#/collections/${encodeURIComponent(
          route.slug
        )}`;

      return;
    }

    if (
      route.type === "search"
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
            : `${browse.filteredCount} ${browse.filteredCount === 1
              ? "product"
              : "products"
            }`}
        </div>
      </header>

      <div className="shop-toolbar">
        <div className="shop-toolbar-left">
          <button
            type="button"
            className="shop-filter-trigger"
            onClick={() =>
              setFiltersOpen(true)
            }
          >
            <span>
              {isFarsi
                ? "فیلترها"
                : "Filters"}
            </span>

            {browse.activeFilterCount >
              0 && (
                <span className="shop-filter-count">
                  {
                    browse.activeFilterCount
                  }
                </span>
              )}
          </button>

          {browseInput.category !==
            "all" && (
              <ActiveFilterChip
                label={
                  findCategoryLabel(
                    browse,
                    browseInput.category,
                    isFarsi
                  )
                }
                onRemove={() =>
                  updateRoute({
                    category: "all",
                  })
                }
              />
            )}

          {browseInput.collection !==
            "all" && (
              <ActiveFilterChip
                label={
                  findCollectionLabel(
                    browse,
                    browseInput.collection,
                    isFarsi
                  )
                }
                onRemove={() =>
                  updateRoute({
                    collection: "all",
                  })
                }
              />
            )}

          {browseInput.sale && (
            <ActiveFilterChip
              label={
                isFarsi
                  ? "تخفیف"
                  : "Sale"
              }
              onRemove={() =>
                updateRoute({
                  sale: false,
                })
              }
            />
          )}

          {browseInput.inStock && (
            <ActiveFilterChip
              label={
                isFarsi
                  ? "موجود"
                  : "In stock"
              }
              onRemove={() =>
                updateRoute({
                  inStock: false,
                })
              }
            />
          )}
        </div>

        <label className="shop-sort">
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
                  event.target.value,
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
      ) : browse.products.length >
        0 ? (
        <div className="shop-product-grid products-grid">
          {browse.products.map(
            (product) => (
              <ProductCard
                key={product.id}
                product={product}
                language={language}
                labels={t.cart}
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
              ? "فیلترها را تغییر دهید یا پاک کنید."
              : "Try changing or clearing the filters."}
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

      {filtersOpen && (
        <div
          className="shop-filter-backdrop"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setFiltersOpen(false);
            }
          }}
        >
          <aside
            className="shop-filter-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={
              isFarsi
                ? "فیلتر محصولات"
                : "Product filters"
            }
          >
            <div className="shop-filter-drawer-header">
              <div>
                <span className="eyebrow">
                  {isFarsi
                    ? "فروشگاه"
                    : "Shop"}
                </span>

                <h2>
                  {isFarsi
                    ? "فیلترها"
                    : "Filters"}
                </h2>
              </div>

              <button
                type="button"
                className="shop-filter-close"
                onClick={() =>
                  setFiltersOpen(false)
                }
                aria-label={
                  isFarsi
                    ? "بستن فیلترها"
                    : "Close filters"
                }
              >
                ×
              </button>
            </div>

            <div className="shop-filter-drawer-body">
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
                  disabled={
                    route.type ===
                    "category"
                  }
                  onChange={(event) =>
                    updateRoute({
                      category:
                        event.target
                          .value,
                    })
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
                  disabled={
                    route.type ===
                    "collection"
                  }
                  onChange={(event) =>
                    updateRoute({
                      collection:
                        event.target
                          .value,
                    })
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
                    value={
                      browseInput.minPrice
                    }
                    placeholder={
                      isFarsi
                        ? "حداقل"
                        : "Minimum"
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
                    value={
                      browseInput.maxPrice
                    }
                    placeholder={
                      isFarsi
                        ? "حداکثر"
                        : "Maximum"
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

              {browse.availableSizes.length >
                0 && (
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

              {browse.availableColors.length >
                0 && (
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
            </div>

            <div className="shop-filter-drawer-footer">
              <button
                type="button"
                className="shop-filter-reset"
                onClick={
                  resetFilters
                }
              >
                {isFarsi
                  ? "پاک کردن"
                  : "Clear"}
              </button>

              <button
                type="button"
                className="shop-filter-apply"
                onClick={() =>
                  setFiltersOpen(false)
                }
              >
                {isFarsi
                  ? `نمایش ${browse.filteredCount} محصول`
                  : `Show ${browse.filteredCount} products`}
              </button>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}

function FilterGroup({
  title,
  children,
}) {
  return (
    <div className="filter-group">
      <h3>
        {title}
      </h3>

      <div className="filter-group-content">
        {children}
      </div>
    </div>
  );
}

function ActiveFilterChip({
  label,
  onRemove,
}) {
  if (!label) {
    return null;
  }

  return (
    <button
      type="button"
      className="active-filter-chip"
      onClick={onRemove}
    >
      <span>
        {label}
      </span>

      <span aria-hidden="true">
        ×
      </span>
    </button>
  );
}

function findCategoryLabel(
  browse,
  slug,
  isFarsi
) {
  const category =
    browse.availableCategories.find(
      (item) =>
        item.slug === slug
    );

  return isFarsi
    ? category?.nameFa
    : category?.name;
}

function findCollectionLabel(
  browse,
  slug,
  isFarsi
) {
  const collection =
    browse.availableCollections.find(
      (item) =>
        item.slug === slug
    );

  return isFarsi
    ? collection?.nameFa
    : collection?.name;
}

function getPageTitle({
  route,
  browse,
  isFarsi,
}) {
  if (
    route.type === "category"
  ) {
    return (
      findCategoryLabel(
        browse,
        route.slug,
        isFarsi
      ) ||
      formatSlug(route.slug)
    );
  }

  if (
    route.type === "collection"
  ) {
    return (
      findCollectionLabel(
        browse,
        route.slug,
        isFarsi
      ) ||
      formatSlug(route.slug)
    );
  }

  if (
    route.type === "search"
  ) {
    return route.query
      ? isFarsi
        ? `نتایج «${route.query}»`
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
    route.type === "category"
  ) {
    return isFarsi
      ? "محصولات این دسته‌بندی را مرور کنید."
      : "Explore this category and refine the selection when needed.";
  }

  if (
    route.type === "collection"
  ) {
    return isFarsi
      ? "محصولات این کالکشن را مرور کنید."
      : "Explore this Mouher collection.";
  }

  if (
    route.type === "search"
  ) {
    return isFarsi
      ? `${browse.filteredCount} نتیجه`
      : `${browse.filteredCount} matching products`;
  }

  return isFarsi
    ? "کاتالوگ کامل موهر"
    : "Explore the full Mouher catalog.";
}

function buildNextRoute({
  route,
  changes,
}) {
  const current = {
    query:
      route.query || "",

    category:
      route.category ||
      "all",

    collection:
      route.collection ||
      "all",

    minPrice:
      route.minPrice ||
      "",

    maxPrice:
      route.maxPrice ||
      "",

    size:
      route.size ||
      "all",

    color:
      route.color ||
      "all",

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

  const params =
    new URLSearchParams();

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
    current.size !== "all"
  ) {
    params.set(
      "size",
      current.size
    );
  }

  if (
    current.color !== "all"
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