import { ArrowRight, CloseIcon } from "../icons";
import { ProductImage } from "../ProductImage";

function formatDemoMoney(amount) {
  if (!Number.isFinite(Number(amount))) {
    return "Preview";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

function sumCartSubtotal(items) {
  return items.reduce(
    (total, item) =>
      total +
      (Number(item.product.priceAmount) || 0) *
      item.quantity,
    0
  );
}

export default function CartDrawer({
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

  if (!open) {
    return null;
  }

  return (
    <div className="cart-overlay">
      <button
        type="button"
        className="cart-backdrop"
        onClick={onClose}
        aria-label={labels.close}
      />

      <aside
        className="cart-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={labels.bag}
      >
        <div className="cart-drawer-header">
          <h2>{labels.bag}</h2>

          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label={labels.close}
          >
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

              const lineAmount =
                Number(item.product.priceAmount) * item.quantity;

              const lineTotal =
                Number.isFinite(lineAmount) && lineAmount > 0
                  ? formatDemoMoney(lineAmount)
                  : item.product.price;

              return (
                <div
                  className="cart-line"
                  key={item.product.id}
                >
                  <ProductImage
                    image={item.product.imageUrls}
                    alt={productName}
                    className="cart-line-image"
                  />

                  <div className="cart-line-main">
                    <div className="cart-line-heading">
                      <div>
                        <h3>{productName}</h3>

                        {categoryName && (
                          <p>{categoryName}</p>
                        )}
                      </div>

                      <strong>{lineTotal}</strong>
                    </div>

                    <div className="cart-line-actions">
                      <div
                        className="quantity-control"
                        aria-label={`${labels.quantity}: ${productName}`}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            onDecrease(item.product.id)
                          }
                          aria-label={`${labels.decrease}: ${productName}`}
                        >
                          -
                        </button>

                        <span>{item.quantity}</span>

                        <button
                          type="button"
                          onClick={() =>
                            onIncrease(item.product.id)
                          }
                          aria-label={`${labels.increase}: ${productName}`}
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        className="cart-remove"
                        onClick={() =>
                          onRemove(item.product.id)
                        }
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
          <p className="empty-cart">
            {labels.empty}
          </p>
        )}

        <div className="checkout-card">
          <div className="subtotal-row">
            <span>{labels.subtotal}</span>

            <strong>
              {subtotal
                ? formatDemoMoney(subtotal)
                : "Preview"}
            </strong>
          </div>

          <div className="checkout-steps">
            <span>{checkoutLabels.customer}</span>
            <span>{checkoutLabels.delivery}</span>
            <span>{checkoutLabels.payment}</span>
          </div>

          <label className="payment-choice">
            <input
              type="radio"
              name="payment"
              defaultChecked
            />
            <span>{checkoutLabels.snapPay}</span>
          </label>

          <label className="payment-choice">
            <input
              type="radio"
              name="payment"
            />
            <span>{checkoutLabels.card}</span>
          </label>

          <p>{labels.snapPay}</p>

          <button
            type="button"
            className="button button-dark"
            onClick={onCheckout}
          >
            {checkoutLabels.continue}
            <ArrowRight />
          </button>
        </div>
      </aside>
    </div>
  );
}