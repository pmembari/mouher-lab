import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BagIcon,
  CloseIcon,
  MenuIcon,
  SearchIcon,
  UserIcon,
} from "./components/icons";
import { ProductImage } from "./components/ProductImage";
import { content } from "./content/siteContent";
import { getAnalyticsConsent, getAnalyticsSummary, setAnalyticsConsent, trackEvent } from "./lib/analytics";
import {
  addProductToCart,
  isMedusaConfigured,
  loadCatalog,
  medusaConfig,
} from "./lib/catalog";
import { mouherApiConfig } from "./lib/notifications";
import {
  loginOwner,
  logoutOwner,
  loadOwnerDashboard,
} from "./lib/ownerApi";
import { AccountWorkspacePage } from "./pages/AccountWorkspacePage";

function ColorSwatches({ colors, language }) {
  const visibleColors = Array.isArray(colors) ? colors.slice(0, 5) : [];
  const isFarsi = language === "farsi";

  if (!visibleColors.length) return null;

  return (
    <div className="color-swatches" aria-label={isFarsi ? "رنگ‌ها" : "Colors"}>
      {visibleColors.map((color) => (
        <span
          key={`${color.label}-${color.hex}`}
          className="color-swatch"
          title={isFarsi ? color.labelFa || color.label : color.label}
          style={{ background: color.hex || "#b9b5aa" }}
        />
      ))}
    </div>
  );
}

function ProductCard({ product, language, labels, onAdd, isAdding }) {
  const isFarsi = language === "farsi";
  const name = productDisplayName(product, isFarsi);
  const category = productCategoryName(product, isFarsi);
  const canAdd = product.source !== "medusa" || product.variantId;
  const href = productPageHref(product);

  const stockCount = Number(product.stockCount);

  const lowStock =
    Number.isFinite(stockCount) &&
    stockCount > 0 &&
    stockCount <= 5;

  function openProductPage(interaction = "mouse") {
    trackEvent("product_click", {
      product_id: product.id,
      product_handle: product.handle,
      product_name: product.name,
      product_name_fa: product.nameFa,
      category: product.category,
      category_fa: product.categoryFa,
      collection: product.collection,
      price: product.priceAmount,
      stock_count: Number.isFinite(stockCount) ? stockCount : null,
      source: product.source,
      interaction,
    });

    window.location.hash = href.replace(/^#/, "");
  }

  return (
    <article
      className="product-card product-card-clickable"
      onClick={() => {
        openProductPage("mouse");
      }}
      role="link"
      tabIndex={0}
      aria-label={name}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openProductPage("keyboard");
        }
      }}
    >
      <div className="product-image-wrap">
        {product.badge && (
          <span className="product-badge">
            {product.badge}
          </span>
        )}

        <button
          type="button"
          className="wishlist-button"
          aria-label={labels.wishlist}
          onClick={(event) => {
            event.stopPropagation();

            trackEvent("wishlist_click", {
              product_id: product.id,
              product_handle: product.handle,
              product_name: product.name,
              category: product.category,
              price: product.priceAmount,
            });
          }}
        >
          <span aria-hidden="true">♡</span>
        </button>

        <ProductImage
          image={product.imageUrls}
          alt={name}
          className="product-image"
        />

        <button
          type="button"
          className="quick-add"
          onClick={(event) => {
            event.stopPropagation();

            trackEvent("quick_add_click", {
              product_id: product.id,
              product_handle: product.handle,
              product_name: product.name,
              category: product.category,
              price: product.priceAmount,
            });

            onAdd(product);
          }}
          disabled={!canAdd || isAdding}
        >
          <span>
            {isAdding
              ? labels.adding
              : canAdd
                ? labels.quickAdd
                : labels.noVariant}
          </span>

          <ArrowRight />
        </button>
      </div>

      <div className="product-info">
        <div>
          <h3>{name}</h3>

          {category && (
            <p>
              {category}
            </p>
          )}

          <ColorSwatches
            colors={product.colors}
            language={language}
          />
        </div>

        <div className="product-commerce">
          {product.compareAtPrice && (
            <span className="compare-price">
              {product.compareAtPrice}
            </span>
          )}

          <span className="product-price">
            {product.price}
          </span>
        </div>
      </div>

      <div className="product-card-footer">
        <span>
          {lowStock
            ? labels.stockLow
            : labels.inStock}
        </span>

        <span className="product-card-view">
          {labels.viewDetails}
        </span>
      </div>

      {product.installment && (
        <p className="installment-note">
          {product.installment}
        </p>
      )}
    </article>
  );
}

function CategoryCard({ category, language, labels, active, onSelect }) {
  const isFarsi = language === "farsi";

  return (
    <button
      type="button"
      className={`category-card ${active ? "category-card-active" : ""}`}
      onClick={() => onSelect(category.slug)}
    >
      <div className="category-image-wrap">
        <ProductImage
          image={category.imageUrl}
          alt={isFarsi ? category.nameFa : category.name}
          className="category-image"
        />
        <div className="category-overlay" />

        <div className="category-content">
          <h3>{isFarsi ? category.nameFa : category.name}</h3>

          <span>
            {labels.shop}
            <ArrowUpRight />
          </span>
        </div>
      </div>
    </button>
  );
}

function sumCartItems(items) {
  return items.reduce((total, item) => total + item.quantity, 0);
}

function sumCartSubtotal(items) {
  return items.reduce(
    (total, item) => total + (Number(item.product.priceAmount) || 0) * item.quantity,
    0
  );
}

function formatDemoMoney(amount) {
  if (!Number.isFinite(Number(amount))) return "Preview";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getRouteFromHash() {
  const hash = typeof window === "undefined" ? "" : window.location.hash;
  const value = hash.replace(/^#\/?/, "");

  if (value.startsWith("products/")) {
    return {
      type: "product",
      handle: decodeRoutePart(value.replace(/^products\//, "").split(/[?#]/)[0]),
    };
  }

  if (value === "owner") return { type: "owner" };
  if (value === "developer") return { type: "developer" };
  if (value === "assist") return { type: "assist" };
  if (value === "account") return { type: "account" };

  return { type: "home", section: value.replace(/^#/, "") || "new" };
}

function decodeRoutePart(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function productPageHref(product) {
  return `#/products/${encodeURIComponent(product.handle || product.id)}`;
}

function productDisplayName(product, isFarsi) {
  return isFarsi ? product.nameFa || product.name : product.name || product.nameFa;
}

function productCategoryName(product, isFarsi) {
  return isFarsi
    ? product.categoryFa || product.category
    : product.category || product.categoryFa;
}

function productCollectionName(product, isFarsi) {
  return isFarsi
    ? product.collectionFa || product.collection
    : product.collection || product.collectionFa;
}

function productStockLabel(product, labels) {
  const stock = Number(product.stockCount);

  if (product.inStock === false || stock <= 0) return labels.outOfStock;
  if (Number.isFinite(stock) && stock <= 5) return labels.lowStock;
  return labels.inStock;
}

function formatCompactAmount(amount) {
  const value = Number(amount);

  if (!Number.isFinite(value) || value <= 0) return "Preview";
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B IRR`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M IRR`;

  return `${Math.round(value).toLocaleString("en-US")} IRR`;
}

function catalogMetrics(catalog) {
  const products = catalog.products || [];
  const lowStockProducts = products.filter((product) => {
    const stock = Number(product.stockCount);
    return Number.isFinite(stock) && stock > 0 && stock <= 5;
  });
  const saleProducts = products.filter(
    (product) => Number(product.compareAtAmount) > Number(product.priceAmount)
  );
  const inventoryUnits = products.reduce((total, product) => {
    const stock = Number(product.stockCount);
    return Number.isFinite(stock) && stock > 0 ? total + stock : total;
  }, 0);
  const inventoryValue = products.reduce((total, product) => {
    const stock = Number(product.stockCount);
    const price = Number(product.priceAmount);
    return Number.isFinite(stock) && stock > 0 && Number.isFinite(price)
      ? total + stock * price
      : total;
  }, 0);

  return {
    products,
    totalProducts: products.length,
    inStockProducts: products.filter((product) => product.inStock !== false).length,
    lowStockProducts,
    saleProducts,
    inventoryUnits,
    inventoryValue,
  };
}

function medusaFeatureRows(metrics, labels) {
  return [
    {
      id: "orders",
      title: "Orders",
      titleFa: "سفارش‌ها",
      metric: "0",
      detail: "Payment, fulfillment, returns, exchanges",
      detailFa: "پرداخت، ارسال، مرجوعی و تعویض",
    },
    {
      id: "products",
      title: "Products",
      titleFa: "محصولات",
      metric: String(metrics.totalProducts),
      detail: "Variants, categories, collections, product options",
      detailFa: "وریانت، دسته‌بندی، کالکشن و گزینه‌های محصول",
    },
    {
      id: "inventory",
      title: "Inventory",
      titleFa: "موجودی",
      metric: String(metrics.inventoryUnits),
      detail: "Stock locations, availability, reservations",
      detailFa: "مکان‌های انبار، دسترسی و رزرو موجودی",
    },
    {
      id: "customers",
      title: "Customers",
      titleFa: "مشتریان",
      metric: "0",
      detail: "Accounts, guest customers, customer groups",
      detailFa: "حساب‌ها، مشتری مهمان و گروه‌های مشتری",
    },
    {
      id: "promotions",
      title: "Promotions",
      titleFa: "پروموشن‌ها",
      metric: String(metrics.saleProducts.length),
      detail: "Coupons, automatic discounts, campaign budgets",
      detailFa: "کد تخفیف، تخفیف خودکار و بودجه کمپین",
    },
    {
      id: "price-lists",
      title: "Price Lists",
      titleFa: "لیست قیمت",
      metric: "1",
      detail: "Sale prices and group-specific price overrides",
      detailFa: "قیمت تخفیفی و قیمت اختصاصی گروه مشتری",
    },
    {
      id: "loyalty",
      title: "Loyalty",
      titleFa: "وفاداری",
      metric: "Web Push",
      detail: "Reward notices sent through opted-in Chrome and Safari browsers",
      detailFa: "اعلان پاداش از طریق مرورگرهای کروم و سافاری با اجازه مشتری",
    },
  ].map((feature) => ({
    ...feature,
    status: feature.metric === "0" ? labels.needsApi : labels.ready,
  }));
}

function uniqueProducts(products) {
  const seen = new Set();

  return products.filter((product) => {
    if (seen.has(product.id)) return false;

    seen.add(product.id);
    return true;
  });
}

function QuickView({
  product,
  language,
  labels,
  productLabels,
  onAdd,
  onClose,
  isAdding,
}) {
  if (!product) return null;

  const isFarsi = language === "farsi";
  const name = isFarsi ? product.nameFa : product.name;
  const description = isFarsi
    ? product.descriptionFa || product.description
    : product.description;
  const canAdd = product.source !== "medusa" || product.variantId;

  return (
    <div className="quick-view-overlay" role="dialog" aria-modal="true">
      <div className="quick-view">
        <button
          type="button"
          className="icon-button quick-view-close"
          onClick={onClose}
          aria-label={isFarsi ? "بستن" : "Close"}
        >
          <CloseIcon />
        </button>

        <div className="quick-view-media">
          <ProductImage image={product.imageUrls} alt={name} className="product-image" />
        </div>

        <div className="quick-view-content">
          <span className="eyebrow">{isFarsi ? product.categoryFa : product.category}</span>
          <h2>{name}</h2>
          <p>{description}</p>

          <div className="detail-price-row">
            {product.compareAtPrice && (
              <span className="compare-price">{product.compareAtPrice}</span>
            )}
            <span className="product-price">{product.price}</span>
          </div>

          <ColorSwatches colors={product.colors} language={language} />

          {Array.isArray(product.sizes) && product.sizes.length > 0 && (
            <div className="size-list">
              {product.sizes.map((size) => (
                <span key={size}>{size}</span>
              ))}
            </div>
          )}

          {product.installment && (
            <p className="installment-note strong">{product.installment}</p>
          )}

          <div className="quick-view-actions">
            <button
              type="button"
              className="button button-dark"
              onClick={() => onAdd(product)}
              disabled={!canAdd || isAdding}
            >
              {isAdding ? labels.adding : canAdd ? labels.quickAdd : labels.noVariant}
              <ArrowRight />
            </button>

            {product.externalUrl && (
              <a
                href={product.externalUrl}
                className="button button-outline"
                target="_blank"
                rel="noreferrer"
              >
                {productLabels.viewLive}
                <ArrowUpRight />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CartDrawer({
  open,
  items,
  labels,
  checkoutLabels,
  language,
  onClose,
  onCheckout,
  onIncrease,
  onDecrease,
  onRemove,
}) {
  const subtotal = sumCartSubtotal(items);
  const isFarsi = language === "farsi";

  if (!open) return null;

  return (
    <div className="cart-overlay">
      <button
        type="button"
        className="cart-backdrop"
        onClick={onClose}
        aria-label={labels.close}
      />

      <aside className="cart-drawer" role="dialog" aria-modal="true" aria-label={labels.bag}>
        <div className="cart-drawer-header">
          <h2>{labels.bag}</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label={labels.close}>
            <CloseIcon />
          </button>
        </div>

        {items.length ? (
          <div className="cart-items">
            {items.map((item) => {
              const productName = isFarsi
                ? item.product.nameFa || item.product.name
                : item.product.name || item.product.nameFa;
              const categoryName = isFarsi
                ? item.product.categoryFa || item.product.category
                : item.product.category || item.product.categoryFa;
              const lineAmount = Number(item.product.priceAmount) * item.quantity;
              const lineTotal =
                Number.isFinite(lineAmount) && lineAmount > 0
                  ? formatDemoMoney(lineAmount)
                  : item.product.price;

              return (
                <div className="cart-line" key={item.product.id}>
                  <ProductImage
                    image={item.product.imageUrls}
                    alt={productName}
                    className="cart-line-image"
                  />

                  <div className="cart-line-main">
                    <div className="cart-line-heading">
                      <div>
                        <h3>{productName}</h3>
                        {categoryName && <p>{categoryName}</p>}
                      </div>

                      <strong>{lineTotal}</strong>
                    </div>

                    <div className="cart-line-actions">
                      <div className="quantity-control" aria-label={`${labels.quantity}: ${productName}`}>
                        <button
                          type="button"
                          onClick={() => onDecrease(item.product.id)}
                          aria-label={`${labels.decrease}: ${productName}`}
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => onIncrease(item.product.id)}
                          aria-label={`${labels.increase}: ${productName}`}
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        className="cart-remove"
                        onClick={() => onRemove(item.product.id)}
                      >
                        {labels.remove}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="empty-cart">{labels.empty}</p>
        )}

        <div className="checkout-card">
          <div className="subtotal-row">
            <span>{labels.subtotal}</span>
            <strong>{subtotal ? formatDemoMoney(subtotal) : "Preview"}</strong>
          </div>

          <div className="checkout-steps">
            <span>{checkoutLabels.customer}</span>
            <span>{checkoutLabels.delivery}</span>
            <span>{checkoutLabels.payment}</span>
          </div>

          <label className="payment-choice">
            <input type="radio" name="payment" defaultChecked />
            <span>{checkoutLabels.snapPay}</span>
          </label>
          <label className="payment-choice">
            <input type="radio" name="payment" />
            <span>{checkoutLabels.card}</span>
          </label>

          <p>{labels.snapPay}</p>

          <button type="button" className="button button-dark" onClick={onCheckout}>
            {checkoutLabels.continue}
            <ArrowRight />
          </button>
        </div>
      </aside>
    </div>
  );
}

function ProductPage({
  product,
  catalog,
  catalogState,
  language,
  labels,
  cartLabels,
  onAdd,
  isAdding,
}) {
  const isFarsi = language === "farsi";

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");

  useEffect(() => {
    setSelectedImage(0);
    setSelectedSize(product?.sizes?.[0] || "");
    setSelectedColor(product?.colors?.[0]?.label || "");
  }, [product?.id]);

  if (!product) {
    return (
      <div className="product-page product-page-empty">
        <a href="#products" className="text-link product-back-link">
          <ArrowRight />
          {labels.back}
        </a>

        <section className="product-not-found">
          <h1>
            {catalogState === "loading"
              ? labels.loading
              : labels.notFoundTitle}
          </h1>

          <p>{labels.notFoundDescription}</p>
        </section>
      </div>
    );
  }

  const name = productDisplayName(product, isFarsi);

  const category = productCategoryName(product, isFarsi);

  const description = isFarsi
    ? product.descriptionFa || product.description
    : product.description;

  const canAdd =
    product.source !== "medusa" || product.variantId;

  const images = Array.isArray(product.imageUrls)
    ? product.imageUrls.filter(Boolean)
    : [];

  const relatedProducts = catalog.products
    .filter(
      (item) =>
        item.id !== product.id &&
        item.categorySlug === product.categorySlug
    )
    .slice(0, 4);

  return (
    <div className="product-page">

      <div className="product-page-topbar">
        <a
          href="#products"
          className="product-back-link"
        >
          <ArrowRight />
          {labels.back}
        </a>

        {category && (
          <span className="product-breadcrumb-category">
            {category}
          </span>
        )}
      </div>

      <section className="pdp-layout">

        <div className="pdp-gallery">

          <div className="pdp-main-image-wrap">

            {product.badge && (
              <span className="pdp-badge">
                {product.badge}
              </span>
            )}

            <ProductImage
              image={
                images[selectedImage] ||
                images[0]
              }
              alt={name}
              className="pdp-main-image"
            />

            <button
              type="button"
              className="pdp-wishlist"
              aria-label={cartLabels.wishlist}
            >
              ♡
            </button>
          </div>

          {images.length > 1 && (
            <div className="pdp-thumbnail-list">
              {images.map((image, index) => (
                <button
                  type="button"
                  key={`${image}-${index}`}
                  className={`pdp-thumbnail ${selectedImage === index
                      ? "is-selected"
                      : ""
                    }`}
                  onClick={() =>
                    setSelectedImage(index)
                  }
                >
                  <ProductImage
                    image={image}
                    alt={`${name} ${index + 1}`}
                    className="pdp-thumbnail-image"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <aside className="pdp-info">

          <div className="pdp-title-block">

            <h1>{name}</h1>

            <div className="pdp-price-row">

              <span className="pdp-price">
                {product.price}
              </span>

              {product.compareAtPrice && (
                <span className="pdp-compare-price">
                  {product.compareAtPrice}
                </span>
              )}

              {product.badge && (
                <span className="pdp-sale-label">
                  {product.badge}
                </span>
              )}
            </div>
          </div>

          {description && (
            <p className="pdp-description">
              {description}
            </p>
          )}

          {Array.isArray(product.colors) &&
            product.colors.length > 0 && (
              <div className="pdp-option">

                <div className="pdp-option-heading">
                  <strong>
                    {labels.colors}
                  </strong>

                  {selectedColor && (
                    <span>
                      {selectedColor}
                    </span>
                  )}
                </div>

                <div className="pdp-color-list">

                  {product.colors.map((color) => {

                    const colorName = isFarsi
                      ? color.labelFa ||
                      color.label
                      : color.label;

                    return (
                      <button
                        type="button"
                        key={`${color.label}-${color.hex}`}
                        className={`pdp-color-button ${selectedColor ===
                            color.label
                            ? "is-selected"
                            : ""
                          }`}
                        onClick={() =>
                          setSelectedColor(
                            color.label
                          )
                        }
                        aria-label={colorName}
                        title={colorName}
                      >
                        <span
                          style={{
                            background:
                              color.hex ||
                              "#b9b5aa",
                          }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          {Array.isArray(product.sizes) &&
            product.sizes.length > 0 && (
              <div className="pdp-option">

                <div className="pdp-option-heading">
                  <strong>
                    {labels.sizes}
                  </strong>

                  <button
                    type="button"
                    className="pdp-size-guide"
                  >
                    {isFarsi
                      ? "راهنمای سایز"
                      : "Size guide"}
                  </button>
                </div>

                <div className="pdp-size-list">
                  {product.sizes.map((size) => (
                    <button
                      type="button"
                      key={size}
                      className={`pdp-size-button ${selectedSize === size
                          ? "is-selected"
                          : ""
                        }`}
                      onClick={() =>
                        setSelectedSize(size)
                      }
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

          <button
            type="button"
            className="pdp-add-button"
            onClick={() => onAdd(product)}
            disabled={!canAdd || isAdding}
          >
            <span>
              {isAdding
                ? cartLabels.adding
                : canAdd
                  ? isFarsi
                    ? "افزودن به سبد خرید"
                    : "Add to bag"
                  : cartLabels.noVariant}
            </span>

            <BagIcon />
          </button>

          <div className="pdp-stock">
            <span
              className={`pdp-stock-dot ${product.inStock === false
                  ? "is-out"
                  : ""
                }`}
            />

            <span>
              {productStockLabel(
                product,
                cartLabels
              )}
            </span>
          </div>

          {product.installment && (
            <div className="pdp-installment">
              {product.installment}
            </div>
          )}

          <div className="pdp-benefits">

            <div>
              <strong>
                {isFarsi
                  ? "ارسال"
                  : "Delivery"}
              </strong>

              <span>
                {isFarsi
                  ? "اطلاعات ارسال هنگام پرداخت نمایش داده می‌شود"
                  : "Delivery options shown at checkout"}
              </span>
            </div>

            <div>
              <strong>
                {isFarsi
                  ? "مرجوعی"
                  : "Returns"}
              </strong>

              <span>
                {isFarsi
                  ? "شرایط مرجوعی را پیش از خرید بررسی کنید"
                  : "Review return conditions before ordering"}
              </span>
            </div>
          </div>

          <div className="pdp-accordions">

            <details open>
              <summary>
                {isFarsi
                  ? "جزئیات محصول"
                  : "Product details"}
              </summary>

              <div className="pdp-accordion-content">
                <p>{description}</p>

                {category && (
                  <p>
                    <strong>
                      {labels.category}:
                    </strong>{" "}
                    {category}
                  </p>
                )}
              </div>
            </details>

            <details>
              <summary>
                {isFarsi
                  ? "راهنمای سایز"
                  : "Size & fit"}
              </summary>

              <div className="pdp-accordion-content">
                <p>
                  {isFarsi
                    ? "اطلاعات دقیق سایزبندی این محصول در این بخش قرار می‌گیرد."
                    : "Detailed size and fit information will appear here."}
                </p>
              </div>
            </details>

            <details>
              <summary>
                {isFarsi
                  ? "ارسال و مرجوعی"
                  : "Delivery & returns"}
              </summary>

              <div className="pdp-accordion-content">
                <p>
                  {isFarsi
                    ? "زمان و هزینه ارسال بر اساس آدرس سفارش محاسبه می‌شود."
                    : "Delivery timing and pricing depend on the order destination."}
                </p>
              </div>
            </details>
          </div>

        </aside>
      </section>

      {relatedProducts.length > 0 && (
        <section className="product-related">

          <div className="product-related-heading">
            <span>{category}</span>

            <h2>
              {labels.related}
            </h2>
          </div>

          <div className="products-grid">
            {relatedProducts.map(
              (relatedProduct) => (
                <ProductCard
                  key={relatedProduct.id}
                  product={relatedProduct}
                  language={language}
                  labels={cartLabels}
                  onAdd={onAdd}
                  isAdding={
                    isAdding &&
                    relatedProduct.id ===
                    product.id
                  }
                />
              )
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function OwnerDashboardPage({ catalog, language, labels }) {
  const [ownerUser, setOwnerUser] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [reportRange, setReportRange] = useState(30);
  const [ownerSection, setOwnerSection] = useState("overview");
  const [resourceQuery, setResourceQuery] = useState("");
  const [resourcePage, setResourcePage] = useState(1);
  const dashboardCatalog = ownerDashboard?.catalog?.products?.length
    ? ownerDashboard.catalog
    : catalog;
  const metrics = catalogMetrics(dashboardCatalog);
  const analytics = getAnalyticsSummary();
  
  async function handleAnalyticsLogin(event) {
    event.preventDefault();
    setOwnerError("");

    const email = ownerUser.trim();

    if (!email || !ownerPassword) {
      setOwnerError(
        isFarsi
          ? "ایمیل و رمز عبور مدیر الزامی است."
          : "Admin email and password are required."
      );
      return;
    }

    setOwnerLoading(true);

    try {
      await loginOwner(email, ownerPassword);

      setOwnerDashboard(
        await loadOwnerDashboard(undefined, reportRange)
      );

      setOwnerPassword("");
    } catch (error) {
      setOwnerDashboard(null);

      setOwnerError(
        error?.message ||
        (isFarsi
          ? "ورود مدیر یا اتصال به سرور ناموفق بود."
          : "Admin login or backend connection failed.")
      );
    } finally {
      setOwnerLoading(false);
    }
  }

  async function handleReportRangeChange(event) {
    const nextRange = Number(event.target.value);
    setReportRange(nextRange);

    if (!ownerDashboard) return;

    setOwnerLoading(true);
    setOwnerError("");

    try {
      setOwnerDashboard(
        await loadOwnerDashboard(
          undefined,
          nextRange
        )
      );
    } catch (error) {
      setOwnerError(error?.message || (isFarsi ? "گزارش بارگذاری نشد." : "The report could not be loaded."));
    } finally {
      setOwnerLoading(false);
    }
  }

  async function handleLogoutOwner(event) {
    event.preventDefault();

    setOwnerLoading(true);
    setOwnerError("");

    try {
      await logoutOwner();
    } catch (error) {
      console.error("Owner logout failed:", error);
    } finally {
      setOwnerDashboard(null);
      setOwnerUser("");
      setOwnerPassword("");
      setOwnerLoading(false);
    }
  }

  const products = metrics.products || [];
  const serverAnalytics = ownerDashboard?.analytics;
  const reportDaily = Array.isArray(serverAnalytics?.daily) && serverAnalytics.daily.length
    ? serverAnalytics.daily
    : analytics.daily;
  const reportFunnel = serverAnalytics?.funnel
    ? [
      { label: isFarsi ? "بازدید محصول" : "Product views", value: serverAnalytics.funnel.product_views || 0 },
      { label: isFarsi ? "افزودن به سبد" : "Added to cart", value: serverAnalytics.funnel.adds || 0 },
      { label: isFarsi ? "شروع پرداخت" : "Checkout", value: serverAnalytics.funnel.checkouts || 0 },
      { label: isFarsi ? "خرید" : "Purchase", value: serverAnalytics.funnel.purchases || 0 },
    ]
    : analytics.funnel;
  const recentOrders = ownerDashboard?.orders?.data?.slice(0, 5) ?? [];
  const recentCustomers = ownerDashboard?.customers?.data?.slice(0, 5) ?? [];
  const topProducts = ownerDashboard?.products?.data?.slice(0, 6) ?? products.slice(0, 6);
  const inventoryItems = ownerDashboard?.inventory?.data?.slice(0, 8) ?? [];
  const resourceRows = getOwnerResourceRows(ownerSection, ownerDashboard, dashboardCatalog);
  const filteredResourceRows = resourceRows.filter((row) => ownerResourceSearchText(row).includes(resourceQuery.trim().toLowerCase()));
  const resourcePageSize = 8;
  const resourcePageCount = Math.max(1, Math.ceil(filteredResourceRows.length / resourcePageSize));
  const visibleResourceRows = filteredResourceRows.slice((resourcePage - 1) * resourcePageSize, resourcePage * resourcePageSize);
  const ownerCounts = {
    products: ownerDashboard?.products?.meta?.count ?? metrics.totalProducts,
    orders: ownerDashboard?.orders?.meta?.count ?? 0,
    customers: ownerDashboard?.customers?.meta?.count ?? 0,
    inventory: ownerDashboard?.inventory?.meta?.count ?? products.length,
    stockLocations: ownerDashboard?.stockLocations?.meta?.count ?? 0,
  };

  function selectOwnerSection(section) {
    setOwnerSection(section);
    setResourceQuery("");
    setResourcePage(1);
  }

  const outOfStockProducts = products.filter((product) => {
    const stock = Number(product.stockCount);
    return product.inStock === false || stock <= 0;
  });

  const criticalStockProducts = products
    .filter((product) => {
      const stock = Number(product.stockCount);

      return (
        Number.isFinite(stock) &&
        stock > 0 &&
        stock <= 3
      );
    })
    .sort(
      (a, b) =>
        Number(a.stockCount) -
        Number(b.stockCount)
    );

  const lowStockProducts = products
    .filter((product) => {
      const stock = Number(product.stockCount);

      return (
        Number.isFinite(stock) &&
        stock > 3 &&
        stock <= 8
      );
    })
    .sort(
      (a, b) =>
        Number(a.stockCount) -
        Number(b.stockCount)
    );

  const highestValueProducts = [...products]
    .filter((product) => {
      const stock = Number(product.stockCount);
      const price = Number(product.priceAmount);

      return (
        Number.isFinite(stock) &&
        Number.isFinite(price) &&
        stock > 0
      );
    })
    .sort((a, b) => {
      const aValue =
        Number(a.stockCount) *
        Number(a.priceAmount);

      const bValue =
        Number(b.stockCount) *
        Number(b.priceAmount);

      return bValue - aValue;
    })
    .slice(0, 8);

  const priorityProducts = uniqueProducts([
    ...outOfStockProducts,
    ...criticalStockProducts,
    ...lowStockProducts,
    ...metrics.saleProducts,
    ...products,
  ]).slice(0, 12);

  const inventoryHealth = products.length
    ? Math.round(
      ((products.length -
        outOfStockProducts.length -
        criticalStockProducts.length) /
        products.length) *
      100
    )
    : 100;

  if (!ownerDashboard && !ownerLoading) {
    return (
      <div className="dashboard-page owner-dashboard-page">
        <section className="dashboard-shell">
          <div className="dashboard-heading">
            <div>
              <span className="eyebrow">{labels.ownerEyebrow}</span>
              <h1>{isFarsi ? "مرکز کنترل موهر" : "Mouher control center"}</h1>
              <p>
                {isFarsi
                  ? "برای مشاهده داشبورد، با حساب مدیر مدوسا وارد شوید."
                  : "Sign in with your Medusa administrator account to view the dashboard."}
              </p>
            </div>
          </div>

          <form className="analytics-owner-access" onSubmit={handleAnalyticsLogin}>
            
            <label htmlFor="owner-email">
              {isFarsi ? "ایمیل مدیر" : "Admin email"}
            </label>

            <input
              id="owner-email"
              type="email"
              autoComplete="username"
              value={ownerUser}
              onChange={(event) => setOwnerUser(event.target.value)}
              placeholder="admin@example.com"
              required
            />
           

            <label htmlFor="owner-password">{isFarsi ? "رمز عبور مالک" : "Owner password"}</label>
            <input
              id="owner-password"
              type="password"
              autoComplete="current-password"
              value={ownerPassword}
              onChange={(event) => setOwnerPassword(event.target.value)}
              placeholder={isFarsi ? "رمز عبور" : "Password"}
              required
            />

            <button className="button button-dark" type="submit" disabled={ownerLoading}>
              {ownerLoading ? (isFarsi ? "در حال بارگذاری..." : "Loading...") : (isFarsi ? "ورود به داشبورد" : "Open dashboard")}
            </button>
            {ownerError && <p role="alert">{ownerError}</p>}
          </form>
        </section>
      </div>
    );
  }

  if (ownerLoading) {
    return (
      <div className="dashboard-page owner-dashboard-page">
        <section className="dashboard-shell">
          <div className="dashboard-heading">
            <div>
              <span className="eyebrow">{labels.ownerEyebrow}</span>
              <h1>{isFarsi ? "در حال بارگذاری داشبورد" : "Loading dashboard"}</h1>
              <p>{isFarsi ? "در حال دریافت داده‌های فروش، مشتریان و موجودی..." : "Loading products, orders, customers, and inventory..."}</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="dashboard-page owner-dashboard-page">
      <section className="dashboard-shell">

        <div className="dashboard-heading">
          <div>
            <span className="eyebrow">
              {labels.ownerEyebrow}
            </span>

            <h1>
              {isFarsi
                ? "مرکز کنترل موهر"
                : "Mouher control center"}
            </h1>

            <p>
              {isFarsi
                ? "نمایش وضعیت موجودی، ارزش کالا، محصولات کم‌موجود و هشدارهای عملیاتی."
                : "Monitor inventory health, stock value, low-stock products and operational alerts."}
            </p>
          </div>

          <div className="dashboard-heading-actions">
            <a
              href="#products"
              className="button button-outline"
            >
              {labels.viewStore}
              <ArrowRight />
            </a>

            <a
              href="#/assist"
              className="button button-dark"
            >
              {labels.websiteAssist}
              <ArrowRight />
            </a>

            <button
              type="button"
              className="button button-outline"
              onClick={handleLogoutOwner}
            >
              {isFarsi ? "خروج" : "Logout"}
            </button>
          </div>
        </div>

        <nav className="owner-section-nav" aria-label={isFarsi ? "بخش‌های مالک" : "Owner sections"}>
          {["overview", "products", "categories", "orders", "users"].map((section) => (
            <button key={section} type="button" className={ownerSection === section ? "active" : ""} onClick={() => selectOwnerSection(section)}>
              {ownerSectionLabel(section, isFarsi)}
            </button>
          ))}
        </nav>

        {ownerSection !== "overview" && (
          <section className="dashboard-panel dashboard-panel-wide owner-resource-panel">
            <div className="dashboard-panel-header">
              <div>
                <h2>{ownerSectionLabel(ownerSection, isFarsi)}</h2>
                <span>{filteredResourceRows.length} {isFarsi ? "رکورد" : "records"}</span>
              </div>
              <label className="owner-resource-search">
                <span className="sr-only">{isFarsi ? "جستجو" : "Search"}</span>
                <input type="search" value={resourceQuery} onChange={(event) => { setResourceQuery(event.target.value); setResourcePage(1); }} placeholder={isFarsi ? "جستجوی رکوردها" : `Search ${ownerSection}...`} />
              </label>
            </div>
            <OwnerResourceTable section={ownerSection} rows={visibleResourceRows} isFarsi={isFarsi} />
            <div className="owner-pagination">
              <button type="button" disabled={resourcePage <= 1} onClick={() => setResourcePage((page) => page - 1)}>{isFarsi ? "قبلی" : "Previous"}</button>
              <span>{resourcePage} / {resourcePageCount}</span>
              <button type="button" disabled={resourcePage >= resourcePageCount} onClick={() => setResourcePage((page) => page + 1)}>{isFarsi ? "بعدی" : "Next"}</button>
            </div>
            <OwnerResourceInsights section={ownerSection} rows={resourceRows} catalog={dashboardCatalog} dashboard={ownerDashboard} isFarsi={isFarsi} />
          </section>
        )}

        <div className="owner-kpi-grid">

          <MetricCard
            label={
              isFarsi
                ? "ارزش موجودی"
                : "Inventory value"
            }
            value={formatCompactAmount(
              metrics.inventoryValue
            )}
          />

          <MetricCard
            label={
              isFarsi
                ? "واحد موجود"
                : "Units in stock"
            }
            value={metrics.inventoryUnits}
          />

          <MetricCard
            label={
              isFarsi
                ? "موجودی بحرانی"
                : "Critical stock"
            }
            value={
              criticalStockProducts.length
            }
          />

          <MetricCard
            label={
              isFarsi
                ? "ناموجود"
                : "Out of stock"
            }
            value={
              outOfStockProducts.length
            }
          />

          <MetricCard
            label={
              isFarsi
                ? "سلامت موجودی"
                : "Inventory health"
            }
            value={`${inventoryHealth}%`}
          />

        </div>

        {ownerSection === "overview" && (
          <section className="dashboard-panel dashboard-panel-wide owner-today-panel">
            <div className="dashboard-panel-header">
              <h2>{isFarsi ? "گزارش عملیاتی امروز" : "Today at a glance"}</h2>
              <span>{isFarsi ? "بر پایه داده‌های واقعی API" : "From live API analytics"}</span>
            </div>
            <div className="owner-today-grid">
              <MetricCard label={isFarsi ? "بازدیدکننده امروز" : "Today's visitors"} value={serverAnalytics?.visitors || 0} />
              <MetricCard label={isFarsi ? "شروع پرداخت بدون خرید" : "Checkout drop-off"} value={Math.max(0, (serverAnalytics?.funnel?.checkouts || 0) - (serverAnalytics?.funnel?.purchases || 0))} />
              <MetricCard label={isFarsi ? "محصولات پرفروش/پرتعامل" : "Top products"} value={serverAnalytics?.top_products?.length || analytics.topProducts.length} />
              <MetricCard label={isFarsi ? "موارد نیازمند توجه" : "Needs attention"} value={outOfStockProducts.length + criticalStockProducts.length} />
            </div>
          </section>
        )}

        {ownerSection === "overview" && (
        <section className="dashboard-panel dashboard-panel-wide analytics-panel">
          <div className="dashboard-panel-header">
            <h2>{isFarsi ? "تحلیل رفتار فروشگاه" : "Store analytics"}</h2>
            <div className="dashboard-report-controls">
              <label htmlFor="owner-report-range">{isFarsi ? "گزارش" : "Report"}</label>
              <select id="owner-report-range" value={reportRange} onChange={handleReportRangeChange}>
                <option value="7">{isFarsi ? "۷ روز" : "7 days"}</option>
                <option value="30">{isFarsi ? "۳۰ روز" : "30 days"}</option>
                <option value="90">{isFarsi ? "۹۰ روز" : "90 days"}</option>
              </select>
              <button type="button" className="report-export-button" onClick={() => exportOwnerReport({ reportDaily, reportFunnel, serverAnalytics })}>
                {isFarsi ? "خروجی CSV" : "Export CSV"}
              </button>
            </div>
          </div>

          <div className="analytics-kpi-grid">
            <MetricCard label={isFarsi ? "کلیک محصول" : "Product clicks"} value={analytics.productClicks} />
            <MetricCard label={isFarsi ? "افزودن سریع" : "Quick adds"} value={analytics.quickAdds} />
            <MetricCard label={isFarsi ? "علاقه‌مندی" : "Wishlists"} value={analytics.wishlists} />
            <MetricCard label={isFarsi ? "نرخ تبدیل" : "Click-to-add rate"} value={`${analytics.conversionRate}%`} />
          </div>

          <div className="analytics-products">
            <h3>{isFarsi ? "محصولات پربازدید" : "Top engaged products"}</h3>
            {analytics.topProducts.length ? analytics.topProducts.map((product) => (
              <div className="analytics-product-row" key={product.id}>
                <strong>{product.name}</strong>
                <span>{product.clicks} {isFarsi ? "کلیک" : "clicks"}</span>
                <span>{product.quickAdds} {isFarsi ? "افزودن" : "adds"}</span>
                <span>{product.wishlists} {isFarsi ? "علاقه‌مندی" : "wishlists"}</span>
              </div>
            )) : (
              <p className="analytics-empty">
                {isFarsi ? "پس از تعامل بازدیدکنندگان، داده‌ها اینجا نمایش داده می‌شوند." : "Analytics will appear after visitors interact with products."}
              </p>
            )}
          </div>

          <div className="analytics-report-grid">
            <OwnerAnalyticsReport
              title={isFarsi ? "پرفروش‌ترین محصولات" : "Top sold products"}
              rows={serverAnalytics?.top_sold_products || []}
              valueKey="sold_units"
              valueLabel={isFarsi ? "فروش" : "sold"}
              isFarsi={isFarsi}
            />
            <OwnerAnalyticsReport
              title={isFarsi ? "محبوب‌ترین علاقه‌مندی‌ها" : "Top wishlisted products"}
              rows={serverAnalytics?.top_wishlisted_products || []}
              valueKey="wishlists"
              valueLabel={isFarsi ? "علاقه‌مندی" : "wishlists"}
              isFarsi={isFarsi}
            />
          </div>

          <div className="analytics-visual-grid">
            <AnalyticsLine title={isFarsi ? "روند تعامل" : "Engagement trend"} rows={reportDaily.map((row) => ({ label: (row.date || "").slice(5), value: row.events ?? row.total }))} />
            <AnalyticsFunnel title={isFarsi ? "قیف خرید" : "Commerce funnel"} rows={reportFunnel} />
          </div>

          {!serverAnalytics ? (
            null
          ) : (
            <div className="analytics-visual-grid">
              <AnalyticsBars title={isFarsi ? "موقعیت بازدیدکنندگان" : "Visitor locations"} rows={(serverAnalytics.locations || []).slice(0, 8).map((row) => ({ label: [row.city, row.country_code].filter(Boolean).join(", "), value: row.visitors }))} />
              <AnalyticsBars title={isFarsi ? "نوع دستگاه" : "Device mix"} rows={(serverAnalytics.devices || []).map((row) => ({ label: row.device_type, value: row.events }))} />
              <p className="analytics-account-summary">{serverAnalytics.account_visitors || 0} {isFarsi ? "بازدیدکننده واردشده" : "signed-in visitors"} · {serverAnalytics.visitors || 0} {isFarsi ? "بازدیدکننده کل" : "total visitors"}</p>
            </div>
          )}
        </section>
        )}

        {ownerSection === "overview" && (
        <section className="dashboard-panel dashboard-panel-wide owner-alert-panel">

          <div className="dashboard-panel-header">
            <h2>
              {isFarsi
                ? "هشدارهای کسب‌وکار"
                : "Business alerts"}
            </h2>

            <span>
              {dashboardCatalog.source}
            </span>
          </div>

          <div className="owner-alert-grid">

            <article
              className={`owner-alert ${outOfStockProducts.length
                  ? "owner-alert-danger"
                  : ""
                }`}
            >
              <strong>
                {outOfStockProducts.length}
              </strong>

              <span>
                {isFarsi
                  ? "محصول ناموجود"
                  : "products out of stock"}
              </span>
            </article>

            <article
              className={`owner-alert ${criticalStockProducts.length
                  ? "owner-alert-danger"
                  : ""
                }`}
            >
              <strong>
                {criticalStockProducts.length}
              </strong>

              <span>
                {isFarsi
                  ? "موجودی بحرانی"
                  : "critical stock products"}
              </span>
            </article>

            <article
              className={`owner-alert ${lowStockProducts.length
                  ? "owner-alert-warning"
                  : ""
                }`}
            >
              <strong>
                {lowStockProducts.length}
              </strong>

              <span>
                {isFarsi
                  ? "محصول کم‌موجود"
                  : "low-stock products"}
              </span>
            </article>

            <article className="owner-alert">
              <strong>
                {metrics.saleProducts.length}
              </strong>

              <span>
                {isFarsi
                  ? "محصول تخفیف‌دار"
                  : "products on sale"}
              </span>
            </article>

          </div>
        </section>
        )}

        {ownerSection === "overview" && (
        <section className="dashboard-panel dashboard-panel-wide">

          <div className="dashboard-panel-header">
            <h2>
              {isFarsi
                ? "داده زنده بک‌اند"
                : "Live backend data"}
            </h2>

            <span>
                {ownerDashboard
                  ? isFarsi
                    ? "متصل"
                    : "Connected"
                  : isFarsi
                    ? "وارد نشده"
                    : "Not signed in"}
            </span>
          </div>

          <div className="owner-alert-grid">
            <article className="owner-alert">
              <strong>{ownerCounts.products}</strong>
              <span>{isFarsi ? "محصول" : "products"}</span>
            </article>

            <article className="owner-alert">
              <strong>{ownerCounts.orders}</strong>
              <span>{isFarsi ? "سفارش" : "orders"}</span>
            </article>

            <article className="owner-alert">
              <strong>{ownerCounts.customers}</strong>
              <span>{isFarsi ? "مشتری" : "customers"}</span>
            </article>

            <article className="owner-alert">
              <strong>{ownerCounts.inventory}</strong>
              <span>{isFarsi ? "آیتم موجودی" : "inventory items"}</span>
            </article>

            <article className="owner-alert">
              <strong>{ownerCounts.stockLocations}</strong>
              <span>{isFarsi ? "مکان انبار" : "stock locations"}</span>
            </article>
          </div>
        </section>
        )}

        {ownerSection === "overview" && (
        <div className="owner-dashboard-grid">
          <section className="dashboard-panel">
            <div className="dashboard-panel-header">
              <h2>{isFarsi ? "سفارش‌های اخیر" : "Recent orders"}</h2>
              <span>{recentOrders.length}</span>
            </div>

            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>{isFarsi ? "سفارش" : "Order"}</th>
                    <th>{isFarsi ? "وضعیت" : "Status"}</th>
                    <th>{isFarsi ? "مبلغ" : "Total"}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.length ? recentOrders.map((order) => (
                    <tr key={order.id || `${order.display_id || "order"}-${Math.random()}`}>
                      <td>{order.display_id || order.id}</td>
                      <td>{order.fulfillment_status || order.status || "—"}</td>
                      <td>{order.total || order.total_paid || "—"}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="3">{isFarsi ? "هیچ سفارشی ثبت نشده است." : "No recent orders."}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="dashboard-panel">
            <div className="dashboard-panel-header">
              <h2>{isFarsi ? "مشتریان اخیر" : "Recent customers"}</h2>
              <span>{recentCustomers.length}</span>
            </div>

            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>{isFarsi ? "مشتری" : "Customer"}</th>
                    <th>{isFarsi ? "ایمیل" : "Email"}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCustomers.length ? recentCustomers.map((customer) => (
                    <tr key={customer.id || customer.email || `${customer.first_name || "customer"}-row`}>
                      <td>{customer.first_name || customer.last_name ? `${customer.first_name || ""} ${customer.last_name || ""}`.trim() : customer.id}</td>
                      <td>{customer.email || "—"}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="2">{isFarsi ? "هیچ مشتری جدیدی وجود ندارد." : "No recent customers."}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
        )}

        {ownerSection === "overview" && (
        <section className="dashboard-panel dashboard-panel-wide">
          <div className="dashboard-panel-header">
            <h2>{isFarsi ? "محصولات مهم" : "Key products"}</h2>
            <span>{topProducts.length}</span>
          </div>

          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>{labels.name}</th>
                  <th>{isFarsi ? "موجودی" : "Stock"}</th>
                  <th>{labels.price}</th>
                  <th>{isFarsi ? "وضعیت" : "State"}</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.length ? topProducts.map((product) => {
                  const stock = Number(product.stockCount ?? product.quantity ?? 0);
                  const status = stock <= 0 ? (isFarsi ? "ناموجود" : "Out of stock") : stock <= 5 ? (isFarsi ? "کم‌موجود" : "Low stock") : (isFarsi ? "موجود" : "In stock");

                  return (
                    <tr key={product.id || product.handle || product.title || product.name}>
                      <td>{product.name || product.title || product.id}</td>
                      <td>{stock}</td>
                      <td>{product.price || "—"}</td>
                      <td>{status}</td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="4">{isFarsi ? "هیچ محصولی برای نمایش وجود ندارد." : "No products available."}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
        )}

        {ownerSection === "overview" && (
        <section className="dashboard-panel dashboard-panel-wide">
          <div className="dashboard-panel-header">
            <h2>{isFarsi ? "موجودی انبار" : "Inventory overview"}</h2>
            <span>{inventoryItems.length}</span>
          </div>

          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>{isFarsi ? "کد SKU" : "SKU"}</th>
                  <th>{isFarsi ? "موجودی" : "Quantity"}</th>
                  <th>{isFarsi ? "مکان" : "Location"}</th>
                  <th>{isFarsi ? "وضعیت" : "Status"}</th>
                </tr>
              </thead>
              <tbody>
                {inventoryItems.length ? inventoryItems.map((item) => {
                  const stock = Number(item.quantity ?? item.stock ?? item.available_quantity ?? 0);
                  const status = stock <= 0 ? (isFarsi ? "ناموجود" : "Empty") : stock <= 5 ? (isFarsi ? "هشدار" : "Warning") : (isFarsi ? "سالم" : "Healthy");

                  return (
                    <tr key={item.id || item.sku || `${item.location_id || "inv"}-row`}>
                      <td>{item.sku || item.id || "—"}</td>
                      <td>{stock}</td>
                      <td>{item.location_name || item.location_id || item.location || "—"}</td>
                      <td>{status}</td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="4">{isFarsi ? "داده‌ای برای موجودی انبار وجود ندارد." : "No inventory data available."}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
        )}

        {ownerSection === "overview" && (
        <div className="owner-dashboard-grid">

          <section className="dashboard-panel">

            <div className="dashboard-panel-header">
              <h2>
                {isFarsi
                  ? "موجودی نیازمند توجه"
                  : "Inventory requiring attention"}
              </h2>

              <span>
                {priorityProducts.length}
              </span>
            </div>

            <div className="dashboard-table-wrap">
              <table className="dashboard-table owner-inventory-table">

                <thead>
                  <tr>
                    <th>
                      {labels.name}
                    </th>

                    <th>
                      {isFarsi
                        ? "موجودی"
                        : "Stock"}
                    </th>

                    <th>
                      {labels.price}
                    </th>

                    <th>
                      {isFarsi
                        ? "ارزش موجودی"
                        : "Stock value"}
                    </th>

                    <th>
                      {labels.status}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {priorityProducts.map(
                    (product) => {
                      const stock =
                        Number(
                          product.stockCount
                        ) || 0;

                      const price =
                        Number(
                          product.priceAmount
                        ) || 0;

                      const stockValue =
                        stock * price;

                      let stockStatus =
                        isFarsi
                          ? "سالم"
                          : "Healthy";

                      if (
                        product.inStock ===
                        false ||
                        stock <= 0
                      ) {
                        stockStatus =
                          isFarsi
                            ? "ناموجود"
                            : "Out";
                      } else if (
                        stock <= 3
                      ) {
                        stockStatus =
                          isFarsi
                            ? "بحرانی"
                            : "Critical";
                      } else if (
                        stock <= 8
                      ) {
                        stockStatus =
                          isFarsi
                            ? "کم"
                            : "Low";
                      }

                      return (
                        <tr
                          key={product.id}
                        >
                          <td>
                            <a
                              href={productPageHref(
                                product
                              )}
                            >
                              {productDisplayName(
                                product,
                                isFarsi
                              )}
                            </a>

                            <span>
                              {productCategoryName(
                                product,
                                isFarsi
                              )}
                            </span>
                          </td>

                          <td>
                            {stock}
                          </td>

                          <td>
                            {product.price}
                          </td>

                          <td>
                            {formatCompactAmount(
                              stockValue
                            )}
                          </td>

                          <td>
                            <span
                              className={`inventory-status inventory-status-${stockStatus
                                .toLowerCase()
                                .replace(
                                  /\s+/g,
                                  "-"
                                )}`}
                            >
                              {stockStatus}
                            </span>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="dashboard-panel">

            <div className="dashboard-panel-header">
              <h2>
                {isFarsi
                  ? "ارزش موجودی بالا"
                  : "Highest inventory value"}
              </h2>
            </div>

            <div className="owner-value-list">
              {highestValueProducts.map(
                (product) => {
                  const value =
                    Number(
                      product.stockCount
                    ) *
                    Number(
                      product.priceAmount
                    );

                  return (
                    <a
                      href={productPageHref(
                        product
                      )}
                      key={product.id}
                      className="owner-value-row"
                    >
                      <div>
                        <strong>
                          {productDisplayName(
                            product,
                            isFarsi
                          )}
                        </strong>

                        <span>
                          {
                            product.stockCount
                          }{" "}
                          {isFarsi
                            ? "عدد"
                            : "units"}
                        </span>
                      </div>

                      <b>
                        {formatCompactAmount(
                          value
                        )}
                      </b>
                    </a>
                  );
                }
              )}
            </div>

          </aside>
        </div>
        )}

        {ownerSection === "overview" && (
        <section className="dashboard-panel dashboard-panel-wide">

          <div className="dashboard-panel-header">
            <h2>
              {labels.categoryMix}
            </h2>
          </div>

          <div className="category-mix">
            {(catalog.categories || []).map(
              (category) => (
                <div key={category.slug}>
                  <span>
                    {isFarsi
                      ? category.nameFa
                      : category.name}
                  </span>

                  <strong>
                    {category.count}
                  </strong>
                </div>
              )
            )}
          </div>

        </section>
        )}

      </section>
    </div>
  );
}

function DeveloperWorkspacePage({ catalog, language, labels }) {
  const isFarsi = language === "farsi";
  const metrics = catalogMetrics(catalog);
  const moduleRows = medusaFeatureRows(metrics, labels);
  const apiRows = [
    {
      id: "store",
      title: labels.storefront,
      status: labels.public,
      route: "/store/products, /store/carts",
      detail: "Catalog, cart, payment collection, checkout completion",
    },
    {
      id: "admin",
      title: labels.backend,
      status: labels.protected,
      route: "/api/commerce/admin/*",
      detail: "Orders, products, customers, promotions, price lists",
    },
    {
      id: "warehouse",
      title: labels.inventory,
      status: labels.protected,
      route: "/api/commerce/warehouse/*",
      detail: "Stock locations, inventory items, inventory levels",
    },
    {
      id: "push",
      title: labels.browserPush,
      status: labels.chromeSafari,
      route: "/api/commerce/loyalty/push/*",
      detail: "Subscription registration and loyalty notification delivery",
    },
  ];

  return (
    <div className="dashboard-page developer-page">
      <section className="dashboard-shell">
        <div className="dashboard-heading">
          <div>
            <span className="eyebrow">{labels.developerEyebrow}</span>
            <h1>{labels.developerTitle}</h1>
            <p>{labels.developerDescription}</p>
          </div>

          <div className="dashboard-heading-actions">
            <a href="#/owner" className="button button-outline">
              {labels.owner}
              <ArrowRight />
            </a>
            <a href="#/assist" className="button button-dark">
              {labels.websiteAssist}
              <ArrowRight />
            </a>
          </div>
        </div>

        <div className="workspace-grid">
          <section className="dashboard-panel workspace-panel">
            <div className="dashboard-panel-header">
              <h2>{labels.medusaDomains}</h2>
              <span>{catalog.source}</span>
            </div>

            <div className="module-list">
              {moduleRows.map((feature) => (
                <article className="workspace-row" key={feature.id}>
                  <div>
                    <strong>{isFarsi ? feature.titleFa : feature.title}</strong>
                    <span>{isFarsi ? feature.detailFa : feature.detail}</span>
                  </div>
                  <b>{feature.metric}</b>
                </article>
              ))}
            </div>
          </section>

          <section className="dashboard-panel workspace-panel">
            <div className="dashboard-panel-header">
              <h2>{labels.apiSurface}</h2>
              <span>{mouherApiConfig.baseUrl || labels.needsApi}</span>
            </div>

            <div className="module-list">
              {apiRows.map((row) => (
                <article className="workspace-row workspace-row-api" key={row.id}>
                  <div>
                    <strong>{row.title}</strong>
                    <span>{row.detail}</span>
                    <code>{row.route}</code>
                  </div>
                  <b>{row.status}</b>
                </article>
              ))}
            </div>
          </section>
        </div>

        <div className="metric-grid">
          <MetricCard label={labels.products} value={metrics.totalProducts} />
          <MetricCard label={labels.inventoryValue} value={formatCompactAmount(metrics.inventoryValue)} />
          <MetricCard label={labels.lowStock} value={metrics.lowStockProducts.length} />
          <MetricCard label={labels.sale} value={metrics.saleProducts.length} />
        </div>
      </section>
    </div>
  );
}

function WebsiteAssistDashboard({ catalog, language, labels }) {
  const isFarsi = language === "farsi";
  const [assistQuery, setAssistQuery] = useState("");
  const metrics = catalogMetrics(catalog);
  const normalizedQuery = assistQuery.trim().toLowerCase();
  const productMatches = metrics.products
    .filter((product) => {
      if (!normalizedQuery) return true;

      return [
        product.name,
        product.nameFa,
        product.category,
        product.categoryFa,
        product.collection,
        product.price,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    })
    .slice(0, 8);
  const selectedProduct = productMatches[0] || metrics.products[0];
  const taskRows = buildAssistantTasks(metrics.products, labels);

  return (
    <div className="dashboard-page assistant-page">
      <section className="dashboard-shell">
        <div className="dashboard-heading">
          <div>
            <span className="eyebrow">{labels.assistEyebrow}</span>
            <h1>{labels.assistTitle}</h1>
            <p>{labels.assistDescription}</p>
          </div>

          <div className="dashboard-heading-actions">
            <a href="#/owner" className="button button-outline">
              {labels.owner}
              <ArrowRight />
            </a>
            <a href="#products" className="button button-dark">
              {labels.viewStore}
              <ArrowRight />
            </a>
          </div>
        </div>

        <form className="assistant-search" onSubmit={(event) => event.preventDefault()}>
          <SearchIcon />
          <input
            type="search"
            value={assistQuery}
            onChange={(event) => setAssistQuery(event.target.value)}
            placeholder={labels.search}
            aria-label={labels.search}
          />
        </form>

        <div className="assistant-grid">
          <section className="dashboard-panel assistant-answer">
            <div className="dashboard-panel-header">
              <h2>{labels.suggestedReply}</h2>
              {selectedProduct && <span>{productStockLabel(selectedProduct, labels)}</span>}
            </div>

            {selectedProduct ? (
              <>
                <h3>{productDisplayName(selectedProduct, isFarsi)}</h3>
                <p>{assistantReply(selectedProduct, isFarsi)}</p>
                <div className="quick-view-actions">
                  <a href={productPageHref(selectedProduct)} className="button button-dark">
                    {labels.open}
                    <ArrowRight />
                  </a>
                  {selectedProduct.externalUrl && (
                    <a
                      href={selectedProduct.externalUrl}
                      className="button button-outline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {labels.live}
                      <ArrowUpRight />
                    </a>
                  )}
                </div>
              </>
            ) : (
              <p>{labels.noTasks}</p>
            )}
          </section>

          <section className="dashboard-panel">
            <div className="dashboard-panel-header">
              <h2>{labels.productMatches}</h2>
              <span>{productMatches.length}</span>
            </div>

            <div className="assistant-product-list">
              {productMatches.map((product) => (
                <a href={productPageHref(product)} key={product.id}>
                  <ProductImage
                    image={product.imageUrls}
                    alt={productDisplayName(product, isFarsi)}
                    className="assistant-product-image"
                  />
                  <span>{productDisplayName(product, isFarsi)}</span>
                  <b>{product.price}</b>
                </a>
              ))}
            </div>
          </section>

          <section className="dashboard-panel">
            <div className="dashboard-panel-header">
              <h2>{labels.contentQueue}</h2>
            </div>

            <div className="task-list">
              {taskRows.length ? (
                taskRows.map((task) => (
                  <div key={task.id}>
                    <span>{task.label}</span>
                    <strong>{task.count}</strong>
                  </div>
                ))
              ) : (
                <p>{labels.noTasks}</p>
              )}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

function ownerSectionLabel(section, isFarsi) {
  const labels = {
    overview: isFarsi ? "نمای کلی" : "Overview",
    products: isFarsi ? "محصولات" : "Products",
    categories: isFarsi ? "دسته‌بندی‌ها" : "Categories",
    orders: isFarsi ? "سفارش‌ها" : "Orders",
    users: isFarsi ? "کاربران" : "Users",
  };
  return labels[section] || labels.overview;
}

function getOwnerResourceRows(section, dashboard, catalog) {
  if (section === "products") return dashboard?.products?.data || [];
  if (section === "orders") return dashboard?.orders?.data || [];
  if (section === "users") return dashboard?.customers?.data || [];
  if (section === "categories") return catalog?.categories || [];
  return [];
}

function ownerResourceSearchText(row) {
  return Object.values(row || {}).filter((value) => ["string", "number"].includes(typeof value)).join(" ").toLowerCase();
}

function OwnerResourceTable({ section, rows, isFarsi }) {
  if (section === "categories") {
    return (
      <div className="dashboard-table-wrap"><table className="dashboard-table"><thead><tr><th>{isFarsi ? "دسته‌بندی" : "Category"}</th><th>{isFarsi ? "شناسه" : "Slug"}</th><th>{isFarsi ? "تعداد محصول" : "Products"}</th></tr></thead><tbody>
        {rows.length ? rows.map((row) => <tr key={row.slug || row.name}><td>{isFarsi ? row.nameFa || row.name : row.name}</td><td>{row.slug || "-"}</td><td>{row.count || 0}</td></tr>) : <OwnerEmptyRow colSpan="3" isFarsi={isFarsi} />}
      </tbody></table></div>
    );
  }

  const columns = section === "products"
    ? [[isFarsi ? "محصول" : "Product", (row) => row.title || row.name || row.id], [isFarsi ? "وضعیت" : "Status", (row) => row.status || "-"], [isFarsi ? "دسته" : "Category", (row) => row.category || row.collection || "-"], [isFarsi ? "به‌روزرسانی" : "Updated", (row) => row.updated_at || row.created_at || "-"]]
    : section === "orders"
      ? [[isFarsi ? "سفارش" : "Order", (row) => row.display_id || row.id], [isFarsi ? "وضعیت" : "Status", (row) => row.status || row.fulfillment_status || "-"], [isFarsi ? "مبلغ" : "Total", (row) => row.total || row.total_paid || "-"], [isFarsi ? "تاریخ" : "Date", (row) => row.created_at || "-"]]
      : [[isFarsi ? "کاربر" : "User", (row) => `${row.first_name || ""} ${row.last_name || ""}`.trim() || row.id], [isFarsi ? "ایمیل" : "Email", (row) => row.email || "-"], [isFarsi ? "گروه" : "Group", (row) => row.groups?.join?.(", ") || "Customer"], [isFarsi ? "تاریخ" : "Created", (row) => row.created_at || "-"]];

  return <div className="dashboard-table-wrap"><table className="dashboard-table"><thead><tr>{columns.map(([label]) => <th key={label}>{label}</th>)}</tr></thead><tbody>{rows.length ? rows.map((row, index) => <tr key={row.id || index}>{columns.map(([label, value]) => <td key={label}>{value(row)}</td>)}</tr>) : <OwnerEmptyRow colSpan={String(columns.length)} isFarsi={isFarsi} />}</tbody></table></div>;
}

function OwnerEmptyRow({ colSpan, isFarsi }) {
  return <tr><td colSpan={colSpan}>{isFarsi ? "داده‌ای برای نمایش وجود ندارد." : "No data available."}</td></tr>;
}

function OwnerResourceInsights({ section, rows, catalog, dashboard, isFarsi }) {
  const products = catalog?.products || [];
  const inventory = dashboard?.inventory?.data || [];
  const orders = section === "orders" ? rows : dashboard?.orders?.data || [];
  const customers = section === "users" ? rows : dashboard?.customers?.data || [];
  const orderStatuses = Object.entries(orders.reduce((result, order) => {
    const status = order.status || order.fulfillment_status || "unknown";
    result[status] = (result[status] || 0) + 1;
    return result;
  }, {})).map(([label, value]) => ({ label, value }));
  const categoryRows = (catalog?.categories || []).map((category) => ({ label: isFarsi ? category.nameFa || category.name : category.name, value: category.count || 0 }));
  const productAttention = products.filter((product) => Number(product.stockCount) <= 5).length;
  const saleProducts = products.filter((product) => Number(product.compareAtAmount) > Number(product.priceAmount)).length;
  const totalOrderValue = orders.reduce((total, order) => total + (Number(order.total) || Number(order.total_paid) || 0), 0);
  const repeatCustomers = customers.filter((customer) => Number(customer.orders_count || customer.order_count || 0) > 1).length;

  return (
    <div className="owner-resource-insights">
      <div className="owner-today-grid">
        {section === "products" && <>
          <MetricCard label={isFarsi ? "محصولات کم‌موجود" : "Low-stock products"} value={productAttention} />
          <MetricCard label={isFarsi ? "محصولات تخفیف‌دار" : "Sale products"} value={saleProducts} />
          <MetricCard label={isFarsi ? "آیتم‌های انبار" : "Inventory items"} value={inventory.length} />
          <MetricCard label={isFarsi ? "ارزش کاتالوگ" : "Catalog value"} value={formatCompactAmount(products.reduce((total, product) => total + (Number(product.priceAmount) || 0), 0))} />
        </>}
        {section === "categories" && <>
          <MetricCard label={isFarsi ? "دسته‌ها" : "Categories"} value={categoryRows.length} />
          <MetricCard label={isFarsi ? "محصولات دسته‌بندی‌شده" : "Categorized products"} value={categoryRows.reduce((total, row) => total + row.value, 0)} />
          <MetricCard label={isFarsi ? "دسته‌های فعال" : "Active categories"} value={categoryRows.filter((row) => row.value > 0).length} />
          <MetricCard label={isFarsi ? "محصول بدون دسته" : "Uncategorized"} value={Math.max(0, products.length - categoryRows.reduce((total, row) => total + row.value, 0))} />
        </>}
        {section === "orders" && <>
          <MetricCard label={isFarsi ? "سفارش‌ها" : "Orders"} value={orders.length} />
          <MetricCard label={isFarsi ? "ارزش سفارش‌ها" : "Order value"} value={formatCompactAmount(totalOrderValue)} />
          <MetricCard label={isFarsi ? "وضعیت‌ها" : "Statuses"} value={orderStatuses.length} />
          <MetricCard label={isFarsi ? "تغییرات امروز" : "Changed today"} value={orders.filter((order) => String(order.updated_at || "").slice(0, 10) === new Date().toISOString().slice(0, 10)).length} />
        </>}
        {section === "users" && <>
          <MetricCard label={isFarsi ? "مشتری‌ها" : "Customers"} value={customers.length} />
          <MetricCard label={isFarsi ? "مشتری تکراری" : "Repeat customers"} value={repeatCustomers} />
          <MetricCard label={isFarsi ? "ایمیل ثبت‌شده" : "With email"} value={customers.filter((customer) => customer.email).length} />
          <MetricCard label={isFarsi ? "بدون فعالیت" : "No activity data"} value={customers.filter((customer) => !customer.created_at && !customer.updated_at).length} />
        </>}
      </div>
      {section === "categories" && <AnalyticsBars title={isFarsi ? "ترکیب دسته‌ها" : "Category mix"} rows={categoryRows} />}
      {section === "orders" && <AnalyticsBars title={isFarsi ? "توزیع وضعیت سفارش‌ها" : "Order status distribution"} rows={orderStatuses} />}
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function AnalyticsBars({ title, rows }) {
  const maximum = Math.max(1, ...rows.map((row) => row.value));
  return (
    <section className="analytics-chart" aria-label={title}>
      <h3>{title}</h3>
      <div className="analytics-bars">
        {rows.map((row) => (
          <div className="analytics-bar-row" key={row.label}>
            <span>{row.label}</span>
            <div><i style={{ width: `${(row.value / maximum) * 100}%` }} /></div>
            <strong>{row.value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function AnalyticsLine({ title, rows }) {
  const values = rows.map((row) => Number(row.value) || 0);
  const maximum = Math.max(1, ...values);
  const points = rows.map((row, index) => {
    const x = rows.length === 1 ? 50 : (index / (rows.length - 1)) * 100;
    const y = 100 - ((Number(row.value) || 0) / maximum) * 82 - 8;
    return `${x},${y}`;
  }).join(" ");

  return (
    <section className="analytics-chart analytics-line-chart" aria-label={title}>
      <h3>{title}</h3>
      <div className="analytics-line-plot">
        <svg viewBox="0 0 100 100" role="img" aria-label={title} preserveAspectRatio="none">
          <polyline points={points} />
          {rows.map((row, index) => {
            const x = rows.length === 1 ? 50 : (index / (rows.length - 1)) * 100;
            const y = 100 - ((Number(row.value) || 0) / maximum) * 82 - 8;
            return <circle key={`${row.label}-${index}`} cx={x} cy={y} r="1.6" />;
          })}
        </svg>
      </div>
      <div className="analytics-line-labels">
        {rows.filter((_, index) => index === 0 || index === rows.length - 1 || index % Math.max(1, Math.floor(rows.length / 5)) === 0).map((row) => (
          <span key={row.label}>{row.label}</span>
        ))}
      </div>
    </section>
  );
}

function AnalyticsFunnel({ title, rows }) {
  const maximum = Math.max(1, ...rows.map((row) => Number(row.value) || 0));

  return (
    <section className="analytics-chart analytics-funnel" aria-label={title}>
      <h3>{title}</h3>
      {rows.map((row) => (
        <div className="analytics-funnel-row" key={row.label}>
          <div>
            <span>{row.label}</span>
            <strong>{row.value}</strong>
          </div>
          <i style={{ width: `${((Number(row.value) || 0) / maximum) * 100}%` }} />
        </div>
      ))}
    </section>
  );
}

function OwnerAnalyticsReport({ title, rows, valueKey, valueLabel, isFarsi }) {
  return (
    <section className="analytics-report" aria-label={title}>
      <h3>{title}</h3>
      {rows.length ? rows.map((row) => (
        <div className="analytics-report-row" key={row.product_id}>
          <span>{row.product_name || row.product_id}</span>
          <strong>{row[valueKey] || 0} {valueLabel}</strong>
        </div>
      )) : (
        <p className="analytics-empty">{isFarsi ? "هنوز داده‌ای ثبت نشده است." : "No report data yet."}</p>
      )}
    </section>
  );
}

function exportOwnerReport({ reportDaily, reportFunnel, serverAnalytics }) {
  const rows = [
    ["Metric", "Value"],
    ...reportFunnel.map((row) => [row.label, row.value]),
    ["Visitors", serverAnalytics?.visitors || 0],
    ["Events", serverAnalytics?.events || 0],
    [],
    ["Date", "Events"],
    ...reportDaily.map((row) => [row.date, row.events ?? row.total ?? 0]),
  ];
  const csv = rows.map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "mouher-owner-report.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function buildAssistantTasks(products, labels) {
  const rows = [
    {
      id: "photo",
      label: labels.missingPhoto,
      count: products.filter((product) => !product.imageUrls?.length).length,
    },
    {
      id: "color",
      label: labels.missingColor,
      count: products.filter((product) => !product.colors?.length).length,
    },
    {
      id: "size",
      label: labels.missingSize,
      count: products.filter((product) => !product.sizes?.length).length,
    },
    {
      id: "sale",
      label: labels.saleBadge,
      count: products.filter(
        (product) => Number(product.compareAtAmount) > Number(product.priceAmount)
      ).length,
    },
  ];

  return rows.filter((row) => row.count > 0);
}

function assistantReply(product, isFarsi) {
  const name = productDisplayName(product, isFarsi);
  const category = productCategoryName(product, isFarsi);
  const collection = productCollectionName(product, isFarsi);

  if (isFarsi) {
    return `${name} از محصولات فعلی موهر در دسته ${category} و ادیت ${collection} است. قیمت فعلی ${product.price} است و صفحه محصول برای عکس، رنگ، سایز و وضعیت موجودی آماده است.`;
  }

  return `${name} is a current Mouher product in ${category}, listed under ${collection}. The current price is ${product.price}, and the product page is ready for photos, colors, sizes and stock status.`;
}

function upsertCartItem(items, product) {
  const existing = items.find((item) => item.product.id === product.id);

  if (existing) {
    return items.map((item) =>
      item.product.id === product.id
        ? { ...item, quantity: item.quantity + 1 }
        : item
    );
  }

  return [...items, { product, quantity: 1 }];
}

function updateCartItemQuantity(items, productId, delta) {
  return items.flatMap((item) => {
    if (item.product.id !== productId) return [item];

    const quantity = item.quantity + delta;

    return quantity > 0 ? [{ ...item, quantity }] : [];
  });
}

export default function App() {
  const [language, setLanguage] = useState("pinglish");
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [cartMessage, setCartMessage] = useState("");
  const [email, setEmail] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [route, setRoute] = useState(() => getRouteFromHash());
  const [catalog, setCatalog] = useState({
    products: [],
    categories: [],
    source: "demo",
    featuredImage: "",
    notice: "",
  });
  const [catalogState, setCatalogState] = useState("loading");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeCollection, setActiveCollection] = useState("all");
  const [query, setQuery] = useState("");
  const [addingProductId, setAddingProductId] = useState("");
  const [analyticsConsent, setAnalyticsConsentState] = useState(() => getAnalyticsConsent());

  const t = content[language];
  const isFarsi = language === "farsi";
  const cartCount = sumCartItems(cartItems);

  useEffect(() => {
    let cancelled = false;

    async function hydrateCatalog() {
      setCatalogState("loading");
      const nextCatalog = await loadCatalog();

      if (!cancelled) {
        setCatalog(nextCatalog);
        setCatalogState("ready");
      }
    }

    hydrateCatalog();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handleHashChange() {
      setRoute(getRouteFromHash());
    }

    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setSelectedProduct(null);

    if (route.type !== "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    window.requestAnimationFrame(() => {
      document.getElementById(route.section)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [route]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key !== "Escape") return;

      setMenuOpen(false);
      setSearchOpen(false);
      setCartOpen(false);
      setSelectedProduct(null);
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const shouldLock = menuOpen || searchOpen || cartOpen || selectedProduct;

    document.body.style.overflow = shouldLock ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [cartOpen, menuOpen, searchOpen, selectedProduct]);

  const categoryOptions = useMemo(
    () => [
      {
        id: "all",
        slug: "all",
        name: t.categories.all,
        nameFa: t.categories.all,
        count: catalog.products.length,
      },
      ...catalog.categories,
    ],
    [catalog.categories, catalog.products.length, t.categories.all]
  );

  const collectionOptions = useMemo(
    () => [
      {
        id: "all",
        slug: "all",
        name: t.collections.all,
        nameFa: t.collections.all,
        count: catalog.products.length,
      },
      ...(catalog.collections || []),
    ],
    [catalog.collections, catalog.products.length, t.collections.all]
  );

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return catalog.products.filter((product) => {
      const matchesCategory =
        activeCategory === "all" || product.categorySlug === activeCategory;
      const matchesCollection =
        activeCollection === "all" || slugify(product.collection) === activeCollection;
      const searchable = [
        product.name,
        product.nameFa,
        product.category,
        product.categoryFa,
        product.collection,
        product.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);

      return matchesCategory && matchesCollection && matchesQuery;
    });
  }, [activeCategory, activeCollection, catalog.products, query]);

  const routedProduct = useMemo(() => {
    if (route.type !== "product") return null;

    return catalog.products.find(
      (product) => product.handle === route.handle || product.id === route.handle
    );
  }, [catalog.products, route]);

  useEffect(() => {
    trackEvent(route.type === "product" ? "product_view" : "page_view", {
      product_id: routedProduct?.id,
      product_name: routedProduct?.name,
      source: catalog.source,
    });
  }, [catalog.source, route, routedProduct]);

  useEffect(() => {
    if (route.type === "product" && routedProduct) {
      document.title = `${productDisplayName(routedProduct, isFarsi)} | Mouher`;
      return;
    }

    if (route.type === "owner") {
      document.title = `${t.dashboard.ownerTitle} | Mouher`;
      return;
    }

    if (route.type === "developer") {
      document.title = `${t.dashboard.developerTitle} | Mouher`;
      return;
    }

    if (route.type === "assist") {
      document.title = `${t.dashboard.assistTitle} | Mouher`;
      return;
    }

    if (route.type === "account") {
      document.title = `${t.dashboard.accountTitle} | Mouher`;
      return;
    }

    document.title = "Mouher — Contemporary Clothing";
  }, [
    isFarsi,
    route,
    routedProduct,
    t.dashboard.accountTitle,
    t.dashboard.assistTitle,
    t.dashboard.developerTitle,
    t.dashboard.ownerTitle,
  ]);

  const heroImage =
    catalog.featuredImage || catalog.products.find((product) => product.imageUrls?.length)
      ?.imageUrls[0];
  const sourceLabel =
    catalogState === "loading"
      ? t.products.loading
      : catalog.source === "medusa"
        ? t.products.sourceMedusa
        : catalog.source === "mouher-live-snapshot"
          ? t.products.sourceLive
        : t.products.sourceDemo;

  async function handleAddToCart(product) {
    trackEvent("add_to_cart", { product_id: product.id, product_name: product.name, price: product.priceAmount, source: product.source });
    setAddingProductId(product.id);
    setCartMessage("");
    setCartOpen(true);

    try {
      if (product.source === "medusa" && isMedusaConfigured(medusaConfig)) {
        await addProductToCart(product, medusaConfig);
        setCartMessage(t.cart.medusaAdded);
      } else {
        setCartMessage(t.cart.previewAdded);
      }

      setCartItems((current) => upsertCartItem(current, product));
      setSelectedProduct(null);
    } catch (error) {
      console.error("Add to cart failed:", error);
      setCartMessage(t.cart.unavailable);
    } finally {
      setAddingProductId("");
    }
  }

  function handleIncreaseCartItem(productId) {
    setCartMessage("");
    setCartItems((current) => updateCartItemQuantity(current, productId, 1));
  }

  function handleDecreaseCartItem(productId) {
    setCartMessage("");
    setCartItems((current) => updateCartItemQuantity(current, productId, -1));
  }

  function handleRemoveCartItem(productId) {
    setCartMessage("");
    setCartItems((current) => current.filter((item) => item.product.id !== productId));
  }

  function handleCheckoutIntent() {
    trackEvent("begin_checkout", { value: cartItems.reduce((total, item) => total + (Number(item.product.priceAmount) || 0) * item.quantity, 0), currency: "EUR" });
    setCartMessage(t.checkout.description);
  }

  function handleNewsletterSubmit(event) {
    event.preventDefault();

    if (!email.trim()) return;

    alert(t.newsletter.thanks);
    setEmail("");
  }

  function handleSearchSubmit(event) {
    event.preventDefault();
    setSearchOpen(false);
    setActiveCategory("all");
  }

  return (
    <div
      className={`site ${isFarsi ? "site-farsi" : ""}`}
      dir={isFarsi ? "rtl" : "ltr"}
    >
      <div className="announcement">
        <p>{t.announcement}</p>
      </div>

      <header className="header">
        <div className="header-inner">
          <button
            type="button"
            className="mobile-menu-button"
            onClick={() => setMenuOpen(true)}
            aria-label={isFarsi ? "باز کردن منو" : "Open menu"}
            aria-expanded={menuOpen}
          >
            <MenuIcon />
          </button>

          <nav className="desktop-nav nav-left" aria-label="Primary">
            <a href="#new">{t.nav.newIn}</a>
            <a href="#categories">{t.nav.collections}</a>
            <a href="#products">{t.nav.shop}</a>
          </nav>

          <a href="#new" className="logo" aria-label="Mouher home">
            MOUHER
          </a>

          <nav className="desktop-nav nav-right" aria-label="Utility">
            <a href="#/owner">{t.nav.owner}</a>
            <a href="#/developer">{t.nav.developer}</a>
            <a href="#/assist">{t.nav.assist}</a>

            <button
              type="button"
              className="icon-button"
              onClick={() => setSearchOpen(true)}
              aria-label={t.search.open}
            >
              <SearchIcon />
            </button>

            <a href="#/account" className="icon-button" aria-label={t.cart.account}>
              <UserIcon />
            </a>

            <button
              type="button"
              className="bag-button"
              onClick={() => setCartOpen(true)}
              aria-label={`${t.cart.bag}, ${cartCount}`}
            >
              <BagIcon />

              {cartCount > 0 && (
                <span className="cart-count" aria-hidden="true">
                  {cartCount}
                </span>
              )}
            </button>
          </nav>
        </div>
      </header>

      <button
        type="button"
        className="language-indicator"
        onClick={() =>
          setLanguage((current) => (current === "pinglish" ? "farsi" : "pinglish"))
        }
        aria-label={isFarsi ? "Switch to Pinglish" : "تغییر زبان به فارسی"}
      >
        <span className={language === "pinglish" ? "active" : ""}>EN</span>
        <span className="language-dot" aria-hidden="true">
          /
        </span>
        <span className={language === "farsi" ? "active" : ""}>فا</span>
      </button>

      {cartMessage && (
        <div className="cart-toast" role="status" aria-live="polite">
          {cartMessage}
        </div>
      )}

      {analyticsConsent === "unknown" && (
        <aside className="analytics-consent" role="dialog" aria-label="Analytics preferences">
          <p>{isFarsi ? "با اجازه شما، رفتار خرید را به‌صورت ناشناس برای بهبود فروشگاه تحلیل می‌کنیم. مکان فقط در سطح شهر/منطقه ثبت می‌شود." : "With your permission, we use first-party analytics to improve the store. Location is limited to city/region level and no raw IP is stored."}</p>
          <div>
            <button type="button" className="button button-outline" onClick={() => { setAnalyticsConsent(false); setAnalyticsConsentState("denied"); }}>{isFarsi ? "رد کردن" : "Decline"}</button>
            <button type="button" className="button button-dark" onClick={() => { setAnalyticsConsent(true); setAnalyticsConsentState("granted"); trackEvent("page_view", { source: catalog.source }); }}>{isFarsi ? "پذیرفتن" : "Allow analytics"}</button>
          </div>
        </aside>
      )}

      <CartDrawer
        open={cartOpen}
        items={cartItems}
        labels={t.cart}
        checkoutLabels={t.checkout}
        language={language}
        onClose={() => setCartOpen(false)}
        onCheckout={handleCheckoutIntent}
        onIncrease={handleIncreaseCartItem}
        onDecrease={handleDecreaseCartItem}
        onRemove={handleRemoveCartItem}
      />

      <QuickView
        product={selectedProduct}
        language={language}
        labels={t.cart}
        productLabels={t.products}
        onAdd={handleAddToCart}
        onClose={() => setSelectedProduct(null)}
        isAdding={addingProductId === selectedProduct?.id}
      />

      {menuOpen && (
        <div className="mobile-menu" role="dialog" aria-modal="true">
          <div className="mobile-menu-header">
            <span className="logo">MOUHER</span>

            <button
              type="button"
              className="icon-button"
              onClick={() => setMenuOpen(false)}
              aria-label={isFarsi ? "بستن منو" : "Close menu"}
            >
              <CloseIcon />
            </button>
          </div>

          <nav className="mobile-nav" aria-label="Mobile">
            <a href="#new" onClick={() => setMenuOpen(false)}>
              {t.nav.newIn}
            </a>
            <a href="#categories" onClick={() => setMenuOpen(false)}>
              {t.nav.collections}
            </a>
            <a href="#products" onClick={() => setMenuOpen(false)}>
              {t.nav.shop}
            </a>
            <a href="#/owner" onClick={() => setMenuOpen(false)}>
              {t.nav.owner}
            </a>
            <a href="#/developer" onClick={() => setMenuOpen(false)}>
              {t.nav.developer}
            </a>
            <a href="#/assist" onClick={() => setMenuOpen(false)}>
              {t.nav.assist}
            </a>
            <a href="#/account" onClick={() => setMenuOpen(false)}>
              {t.cart.account}
            </a>
          </nav>
        </div>
      )}

      {searchOpen && (
        <div
          className="search-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={t.search.title}
        >
          <div className="search-inner">
            <div className="search-header">
              <span className="search-title">{t.search.title}</span>

              <button
                type="button"
                className="icon-button"
                onClick={() => setSearchOpen(false)}
                aria-label={t.search.close}
              >
                <CloseIcon />
              </button>
            </div>

            <form className="search-form" onSubmit={handleSearchSubmit}>
              <SearchIcon />

              <input
                autoFocus
                type="search"
                placeholder={t.search.placeholder}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label={t.search.open}
              />

              <button type="submit">{t.search.submit}</button>
            </form>
          </div>
        </div>
      )}

      <main>
        {route.type === "product" ? (
          <ProductPage
            product={routedProduct}
            catalog={catalog}
            catalogState={catalogState}
            language={language}
            labels={t.productPage}
            cartLabels={{ ...t.cart, outOfStock: t.dashboard.outOfStock }}
            onAdd={handleAddToCart}
            isAdding={addingProductId === routedProduct?.id}
          />
        ) : route.type === "owner" ? (
          <OwnerDashboardPage
            catalog={catalog}
            language={language}
            labels={t.dashboard}
          />
        ) : route.type === "developer" ? (
          <DeveloperWorkspacePage
            catalog={catalog}
            language={language}
            labels={t.dashboard}
          />
        ) : route.type === "assist" ? (
          <WebsiteAssistDashboard
            catalog={catalog}
            language={language}
            labels={t.dashboard}
          />
        ) : route.type === "account" ? (
          <AccountWorkspacePage
            language={language}
            labels={t.account}
            dashboardLabels={t.dashboard}
          />
        ) : (
          <>
        <section className="hero" id="new">
          <ProductImage
            image={heroImage}
            alt="Mouher collection"
            className="hero-image"
          />

          <div className="hero-overlay" />

          <div className="hero-content">
            <p className="eyebrow hero-eyebrow">{t.hero.eyebrow}</p>

            <h1>
              {t.hero.title.split("\n").map((line, index) => (
                <span key={line}>
                  {line}
                  {index === 0 && <br />}
                </span>
              ))}
            </h1>

            <p className="hero-description">{t.hero.description}</p>

            <a href="#products" className="button button-light">
              {t.hero.button}
              <ArrowRight />
            </a>
          </div>
        </section>

        <section className="trust-strip" aria-label="Store benefits">
          <span>{t.trust.shipping}</span>
          <span>{t.trust.returns}</span>
          <span>{t.trust.support}</span>
        </section>

        <section className="section collections-section" id="collections">
          <div className="section-heading">
            <div>
              <span className="eyebrow">{t.collections.eyebrow}</span>
              <h2>{t.collections.title}</h2>
            </div>
          </div>

          <div className="collection-rail">
            {collectionOptions.map((collection) => (
              <button
                type="button"
                key={collection.slug}
                className={activeCollection === collection.slug ? "active" : ""}
                onClick={() => {
                  setActiveCollection(collection.slug);
                  document.getElementById("products")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }}
              >
                <strong>{isFarsi ? collection.nameFa : collection.name}</strong>
                <span>{collection.count}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="section products-section" id="products">
          <div className="section-heading catalog-heading">
            <div>
              <span className="eyebrow">{t.products.eyebrow}</span>
              <h2>{t.products.title}</h2>
            </div>

            <div className="catalog-actions">
              <span className={`catalog-pill catalog-pill-${catalog.source}`}>
                {sourceLabel}
              </span>

              <button
                type="button"
                className="text-link"
                onClick={() => {
                  setActiveCategory("all");
                  setActiveCollection("all");
                  setQuery("");
                }}
              >
                {t.products.shopAll}
                <ArrowRight />
              </button>
            </div>
          </div>

          {catalog.notice && <p className="catalog-notice">{catalog.notice}</p>}

          <div className="filter-bar" aria-label={t.categories.eyebrow}>
            {categoryOptions.map((category) => (
              <button
                type="button"
                key={category.slug}
                className={activeCategory === category.slug ? "active" : ""}
                onClick={() => setActiveCategory(category.slug)}
              >
                <span>{isFarsi ? category.nameFa : category.name}</span>
                <span>{category.count}</span>
              </button>
            ))}
          </div>

          {filteredProducts.length > 0 ? (
            <div className="products-grid">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  language={language}
                  labels={t.cart}
                  onAdd={handleAddToCart}
                  onView={setSelectedProduct}
                  isAdding={addingProductId === product.id}
                />
              ))}
            </div>
          ) : (
            <p className="empty-state">{t.products.empty}</p>
          )}
        </section>

        <section className="section categories-section" id="categories">
          <div className="section-heading">
            <div>
              <span className="eyebrow">{t.categories.eyebrow}</span>
              <h2>{t.categories.title}</h2>
            </div>
          </div>

          <div className="categories-grid">
            {catalog.categories.slice(0, 3).map((category) => (
              <CategoryCard
                key={category.slug}
                category={category}
                language={language}
                labels={t.categories}
                active={activeCategory === category.slug}
                onSelect={(slug) => {
                  setActiveCategory(slug);
                  document.getElementById("products")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }}
              />
            ))}
          </div>
        </section>

        <section className="philosophy">
          <div className="philosophy-image">
            <ProductImage
              image={catalog.products[1]?.imageUrls || heroImage}
              alt="Mouher editorial"
              className=""
            />
          </div>

          <div className="philosophy-content">
            <span className="eyebrow">{t.philosophy.eyebrow}</span>

            <h2>{t.philosophy.title}</h2>

            <p>{t.philosophy.description}</p>

            <a href="#newsletter" className="button button-dark">
              {t.philosophy.button}
              <ArrowRight />
            </a>
          </div>
        </section>

        <section className="newsletter" id="newsletter">
          <div className="newsletter-inner">
            <span className="eyebrow">{t.newsletter.eyebrow}</span>

            <h2>{t.newsletter.title}</h2>

            <p>{t.newsletter.description}</p>

            <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
              <input
                type="email"
                placeholder={t.newsletter.placeholder}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-label={t.newsletter.placeholder}
                autoComplete="email"
                required
              />

              <button type="submit">
                {t.newsletter.button}
                <ArrowRight />
              </button>
            </form>
          </div>
        </section>
          </>
        )}
      </main>

      <footer className="footer" id="footer">
        <div className="footer-top">
          <div className="footer-brand">
            <a href="/" className="footer-logo">
              MOUHER
            </a>

            <p>
              {isFarsi
                ? "لباس معاصر برای زندگی روزمره."
                : "Lebas-e moaser baraye zendegi-e roozmarreh."}
            </p>
          </div>

          <div className="footer-column">
            <h4>{t.footer.shop}</h4>
            <a href="#new">{t.footer.newIn}</a>
            <a href="#categories">{t.footer.collections}</a>
            <a href="#products">{t.footer.allClothing}</a>
          </div>

          <div className="footer-column">
            <h4>{t.footer.information}</h4>
            <a href="#footer">{t.footer.shipping}</a>
            <a href="#footer">{t.footer.returns}</a>
            <a href="#footer">{t.footer.sizeGuide}</a>
            <a href="#footer">{t.footer.contact}</a>
          </div>

          <div className="footer-column">
            <h4>{t.footer.follow}</h4>
            <a href="#footer">{t.footer.instagram}</a>
            <a href="#footer">{t.footer.pinterest}</a>
            <a href="#footer">{t.footer.tiktok}</a>
          </div>
        </div>

        <div className="footer-bottom">
          <span>{t.footer.copyright}</span>

          <div>
            <a href="#footer">{t.footer.privacy}</a>
            <a href="#footer">{t.footer.terms}</a>
          </div>

          <span>MOUHER</span>
        </div>
      </footer>
    </div>
  );
}
