import { ArrowRight } from "../icons";
import { ProductImage } from "../ProductImage";
import { trackEvent } from "../../lib/analytics";
import {
  productCategoryName,
  productDisplayName,
  productPageHref,
} from "../../utils/product";

function ColorSwatches({
  colors,
  language,
}) {
  const visibleColors = Array.isArray(colors)
    ? colors.slice(0, 5)
    : [];

  const isFarsi =
    language === "farsi";

  if (!visibleColors.length) {
    return null;
  }

  return (
    <div
      className="color-swatches"
      aria-label={
        isFarsi
          ? "رنگ‌ها"
          : "Colors"
      }
    >
      {visibleColors.map((color) => (
        <span
          key={`${color.label}-${color.hex}`}
          className="color-swatch"
          title={
            isFarsi
              ? color.labelFa ||
              color.label
              : color.label
          }
          style={{
            background:
              color.hex ||
              "#b9b5aa",
          }}
        />
      ))}
    </div>
  );
}

export default function ProductCard({
  product,
  language,
  labels,
  onAdd,
  isAdding,
}) {
  const isFarsi =
    language === "farsi";

  const name =
    productDisplayName(
      product,
      isFarsi
    );

  const category =
    productCategoryName(
      product,
      isFarsi
    );

  const canAdd =
    product.source !==
    "medusa" ||
    product.variantId;

  const href =
    productPageHref(product);

  const stockCount =
    Number(
      product.stockCount
    );

  const lowStock =
    Number.isFinite(
      stockCount
    ) &&
    stockCount > 0 &&
    stockCount <= 5;

  function openProductPage(
    interaction = "mouse"
  ) {
    trackEvent(
      "product_click",
      {
        product_id:
          product.id,

        product_handle:
          product.handle,

        product_name:
          product.name,

        product_name_fa:
          product.nameFa,

        category:
          product.category,

        category_fa:
          product.categoryFa,

        collection:
          product.collection,

        price:
          product.priceAmount,

        stock_count:
          Number.isFinite(
            stockCount
          )
            ? stockCount
            : null,

        source:
          product.source,

        interaction,
      }
    );

    window.location.hash =
      href.replace(/^#/, "");
  }

  return (
    <article
      className="product-card product-card-clickable"
      onClick={() =>
        openProductPage(
          "mouse"
        )
      }
      role="link"
      tabIndex={0}
      aria-label={name}
      onKeyDown={(event) => {
        if (
          event.key ===
          "Enter" ||
          event.key === " "
        ) {
          event.preventDefault();

          openProductPage(
            "keyboard"
          );
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
          aria-label={
            labels.wishlist
          }
          onClick={(event) => {
            event.stopPropagation();

            trackEvent(
              "wishlist_click",
              {
                product_id:
                  product.id,

                product_handle:
                  product.handle,

                product_name:
                  product.name,

                category:
                  product.category,

                price:
                  product.priceAmount,
              }
            );
          }}
        >
          <span aria-hidden="true">
            ♡
          </span>
        </button>

        <ProductImage
          image={
            product.imageUrls
          }
          alt={name}
          className="product-image"
        />

        <button
          type="button"
          className="quick-add"
          onClick={(event) => {
            event.stopPropagation();

            trackEvent(
              "quick_add_click",
              {
                product_id:
                  product.id,

                product_handle:
                  product.handle,

                product_name:
                  product.name,

                category:
                  product.category,

                price:
                  product.priceAmount,
              }
            );

            onAdd(product);
          }}
          disabled={
            !canAdd ||
            isAdding
          }
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
            colors={
              product.colors
            }
            language={
              language
            }
          />
        </div>

        <div className="product-commerce">
          {product.compareAtPrice && (
            <span className="compare-price">
              {
                product
                  .compareAtPrice
              }
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
          {
            labels.viewDetails
          }
        </span>
      </div>

      {product.installment && (
        <p className="installment-note">
          {
            product.installment
          }
        </p>
      )}
    </article>
  );
}