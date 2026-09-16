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
          aria-label="Primary"
        >
          <a href="#new">
            {t.nav.newIn}
          </a>

          <a href="#categories">
            {t.nav.collections}
          </a>

          <a href="#products">
            {t.nav.shop}
          </a>
        </nav>

        <a
          href="#new"
          className="logo"
          aria-label="Mouher home"
        >
          MOUHER
        </a>

        <nav
          className="desktop-nav nav-right"
          aria-label="Utility"
        >
          <a href="#/owner">
            {t.nav.owner}
          </a>

          <a href="#/developer">
            {t.nav.developer}
          </a>

          <a href="#/assist">
            {t.nav.assist}
          </a>

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