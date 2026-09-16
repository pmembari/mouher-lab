import {
  ArrowRight,
  ArrowUpRight,
  CloseIcon,
} from "../icons";

import { ProductImage } from "../ProductImage";

function ColorSwatches({
  colors,
  language,
}) {
  const visibleColors = Array.isArray(colors)
    ? colors.slice(0, 5)
    : [];

  const isFarsi = language === "farsi";

  if (!visibleColors.length) {
    return null;
  }

  return (
    <div
      className="color-swatches"
      aria-label={isFarsi ? "رنگ‌ها" : "Colors"}
    >
      {visibleColors.map((color) => (
        <span
          key={`${color.label}-${color.hex}`}
          className="color-swatch"
          title={
            isFarsi
              ? color.labelFa || color.label
              : color.label
          }
          style={{
            background:
              color.hex || "#b9b5aa",
          }}
        />
      ))}
    </div>
  );
}

export default function QuickView({
  product,
  language,
  labels,
  productLabels,
  onAdd,
  onClose,
  isAdding,
}) {
  if (!product) {
    return null;
  }

  const isFarsi = language === "farsi";

  const name = isFarsi
    ? product.nameFa || product.name
    : product.name || product.nameFa;

  const description = isFarsi
    ? product.descriptionFa || product.description
    : product.description;

  const canAdd =
    product.source !== "medusa" ||
    product.variantId;

  return (
    <div
      className="quick-view-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={name}
    >
      <div className="quick-view">
        <button
          type="button"
          className="icon-button quick-view-close"
          onClick={onClose}
          aria-label={
            isFarsi ? "بستن" : "Close"
          }
        >
          <CloseIcon />
        </button>

        <div className="quick-view-media">
          <ProductImage
            image={product.imageUrls}
            alt={name}
            className="product-image"
          />
        </div>

        <div className="quick-view-content">
          <span className="eyebrow">
            {isFarsi
              ? product.categoryFa ||
              product.category
              : product.category ||
              product.categoryFa}
          </span>

          <h2>{name}</h2>

          {description && (
            <p>{description}</p>
          )}

          <div className="detail-price-row">
            {product.compareAtPrice && (
              <span className="compare-price">
                {product.compareAtPrice}
              </span>
            )}

            <span className="product-price">
              {product.price}
            </span>
          </div>

          <ColorSwatches
            colors={product.colors}
            language={language}
          />

          {Array.isArray(product.sizes) &&
            product.sizes.length > 0 && (
              <div className="size-list">
                {product.sizes.map((size) => (
                  <span key={size}>
                    {size}
                  </span>
                ))}
              </div>
            )}

          {product.installment && (
            <p className="installment-note strong">
              {product.installment}
            </p>
          )}

          <div className="quick-view-actions">
            <button
              type="button"
              className="button button-dark"
              onClick={() => onAdd(product)}
              disabled={
                !canAdd || isAdding
              }
            >
              {isAdding
                ? labels.adding
                : canAdd
                  ? labels.quickAdd
                  : labels.noVariant}

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