import { CloseIcon } from "../icons";

export default function MobileMenu({
  open,
  t,
  isFarsi,
  onClose,
}) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="mobile-menu"
      role="dialog"
      aria-modal="true"
    >
      <div className="mobile-menu-header">
        <span className="logo">
          MOUHER
        </span>

        <button
          type="button"
          className="icon-button"
          onClick={onClose}
          aria-label={
            isFarsi
              ? "بستن منو"
              : "Close menu"
          }
        >
          <CloseIcon />
        </button>
      </div>

      <nav
        className="mobile-nav"
        aria-label="Mobile"
      >
        <a
          href="#new"
          onClick={onClose}
        >
          {t.nav.newIn}
        </a>

        <a
          href="#categories"
          onClick={onClose}
        >
          {t.nav.collections}
        </a>

        <a
          href="#products"
          onClick={onClose}
        >
          {t.nav.shop}
        </a>

        <a
          href="#/owner"
          onClick={onClose}
        >
          {t.nav.owner}
        </a>

        <a
          href="#/developer"
          onClick={onClose}
        >
          {t.nav.developer}
        </a>

        <a
          href="#/assist"
          onClick={onClose}
        >
          {t.nav.assist}
        </a>

        <a
          href="#/account"
          onClick={onClose}
        >
          {t.cart.account}
        </a>
      </nav>
    </div>
  );
}