import {
  BagIcon,
  MenuIcon,
  SearchIcon,
  UserIcon,
} from "../icons";

export default function Header({
  t,
  isFarsi,
  menuOpen,
  cartCount,
  onOpenMenu,
  onOpenSearch,
  onOpenCart,
}) {
  return (
    <header className="header">
      <div className="header-inner">
        <button
          type="button"
          className="mobile-menu-button"
          onClick={onOpenMenu}
          aria-label={
            isFarsi
              ? "باز کردن منو"
              : "Open menu"
          }
          aria-expanded={menuOpen}
        >
          <MenuIcon />
        </button>

        <nav
          className="desktop-nav nav-left"
          aria-label={
            isFarsi
              ? "منوی اصلی"
              : "Primary navigation"
          }
        >
          <a href="#new">
            {t.nav.newIn}
          </a>

          <a href="#/shop">
            {t.nav.shop}
          </a>

          <a href="#/shop">
            {t.nav.collections}
          </a>

          <a href="#categories">
            {isFarsi
              ? "دسته‌بندی‌ها"
              : "Categories"}
          </a>
        </nav>

        <a
          href="#new"
          className="logo"
          aria-label={
            isFarsi
              ? "صفحه اصلی موهر"
              : "Mouher home"
          }
        >
          MOUHER
        </a>

        <nav
          className="desktop-nav nav-right"
          aria-label={
            isFarsi
              ? "ابزارهای فروشگاه"
              : "Store utilities"
          }
        >
          <button
            type="button"
            className="icon-button"
            onClick={onOpenSearch}
            aria-label={t.search.open}
          >
            <SearchIcon />
          </button>

          <a
            href="#/account"
            className="icon-button"
            aria-label={t.cart.account}
          >
            <UserIcon />
          </a>

          <button
            type="button"
            className="bag-button"
            onClick={onOpenCart}
            aria-label={`${t.cart.bag}, ${cartCount}`}
          >
            <BagIcon />

            {cartCount > 0 && (
              <span
                className="cart-count"
                aria-hidden="true"
              >
                {cartCount}
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}
