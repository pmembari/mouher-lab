import { useEffect, useState } from "react";
import { ArrowRight, BagIcon } from "../components/icons";
import { ProductImage } from "../components/ProductImage";
import ProductCard from "../components/storefront/ProductCard";
import {
  productCategoryName,
  productDisplayName,
  productStockLabel,
} from "../utils/product";

export default function ProductPage({
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

  const relatedProducts = (catalog.products || [])
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
                  <strong>{labels.colors}</strong>

                  {selectedColor && (
                    <span>{selectedColor}</span>
                  )}
                </div>

                <div className="pdp-color-list">
                  {product.colors.map((color) => {
                    const colorName = isFarsi
                      ? color.labelFa || color.label
                      : color.label;

                    return (
                      <button
                        type="button"
                        key={`${color.label}-${color.hex}`}
                        className={`pdp-color-button ${selectedColor === color.label
                            ? "is-selected"
                            : ""
                          }`}
                        onClick={() =>
                          setSelectedColor(color.label)
                        }
                        aria-label={colorName}
                        title={colorName}
                      >
                        <span
                          style={{
                            background:
                              color.hex || "#b9b5aa",
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
                  <strong>{labels.sizes}</strong>

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
                {isFarsi ? "ارسال" : "Delivery"}
              </strong>

              <span>
                {isFarsi
                  ? "اطلاعات ارسال هنگام پرداخت نمایش داده می‌شود"
                  : "Delivery options shown at checkout"}
              </span>
            </div>

            <div>
              <strong>
                {isFarsi ? "مرجوعی" : "Returns"}
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
            <h2>{labels.related}</h2>
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
                    relatedProduct.id === product.id
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