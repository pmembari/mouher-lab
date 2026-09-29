import {
  BagIcon,
  MenuIcon,
  SearchIcon,
  UserIcon,
} from "../icons";

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z" />
    </svg>
  );
}

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
    <header className="header mouher-reference-header">
      <div className="header-inner mouher-reference-header-inner">
        <button
          type="button"
          className="mobile-menu-button"
          onClick={onOpenMenu}
          aria-label={isFarsi ? "باز کردن منو" : "Open menu"}
          aria-expanded={menuOpen}
        >
          <MenuIcon />
        </button>

        <a href="#new" className="mouher-reference-logo" aria-label="Mouher home">
          <span className="mouher-mark" aria-hidden="true">M</span>
          <span>
            <strong>MOUHER</strong>
            <small>WHAT YOU WEAR</small>
          </span>
        </a>

        <nav className="desktop-nav mouher-reference-nav" aria-label="Primary navigation">
          <a href="#categories">{isFarsi ? "زنانه" : "Women"}</a>
          <a href="#categories">{isFarsi ? "مردانه" : "Men"}</a>
          <a href="#categories">{isFarsi ? "کالکشن‌ها" : "Collections"}</a>
          <a href="#/shop">{isFarsi ? "جدیدها" : "New Arrivals"}</a>
          <a href="#/shop">{isFarsi ? "فروش ویژه" : "Sale"}</a>
          <a href="#story">{isFarsi ? "درباره" : "About"}</a>
        </nav>

        <nav className="desktop-nav mouher-reference-tools" aria-label="Store utilities">
          <button type="button" className="mouher-header-search" onClick={onOpenSearch} aria-label={t.search.open}>
            <SearchIcon />
            <span>{isFarsi ? "جستجو برای استایل، رنگ..." : "Search for styles, colors..."}</span>
          </button>

          <a href="#/account" className="mouher-header-icon" aria-label={t.cart.account}>
            <UserIcon />
          </a>

          <a href="#/account" className="mouher-header-icon" aria-label={isFarsi ? "علاقه‌مندی‌ها" : "Wishlist"}>
            <HeartIcon />
          </a>

          <button type="button" className="mouher-header-icon mouher-header-bag" onClick={onOpenCart} aria-label={`${t.cart.bag}, ${cartCount}`}>
            <BagIcon />
            <span className="mouher-header-count">{cartCount}</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
