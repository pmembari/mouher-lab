import { useEffect, useState } from "react";
import { getMouherImages } from "./mouherImages";

/* =========================================================
   CONTENT
========================================================= */

const content = {
  pinglish: {
    announcement: "Ersal رایگان baraye sefaresh-haye بالای €150",

    nav: {
      newIn: "Collection-e Jadid",
      collections: "Collection-ha",
      shop: "Shop",
    },

    hero: {
      eyebrow: "Payiz / Zemestan 2026",
      title: "Mouher.\nWhat you wear.",
      description:
        "Lebas-haye modern ba focus bar rooye quality, form va details.",
      button: "Boro be Collection ha",
    },

    products: {
      eyebrow: "Collection-e Jadid",
      title: "Collection-e Jadid",
      shopAll: "Boro be Hame",
    },

    philosophy: {
      eyebrow: "Mouher",
      title: "What you wear.",
      description:
        "Lebas-haye modern baraye har rooz; sade, precise va ba identity.",
      button: "Darbare-ye Mouher",
    },

    newsletter: {
      eyebrow: "Ba Mouher bemoon",
      title: "Latest from Mouher.",
      description:
        "Collection-haye jadid, story-haye studio va news-haye Mouher.",
      placeholder: "Email شما",
      button: "Join",
    },

    footer: {
      shop: "Shop",
      information: "Ettelaat",
      follow: "Follow",
      newIn: "Collection-e Jadid",
      collections: "Collection-ha",
      allClothing: "Hame-ye Products",
      shipping: "Ersal",
      returns: "Returns",
      sizeGuide: "Size Guide",
      contact: "Tamas",
      instagram: "Instagram",
      pinterest: "Pinterest",
      tiktok: "TikTok",
      copyright: "© 2026 Mouher",
      privacy: "Privacy",
      terms: "Terms",
    },
  },

  farsi: {
    announcement: "ارسال رایگان برای سفارش‌های بالای €150",

    nav: {
      newIn: "کالکشن جدید",
      collections: "کالکشن‌ها",
      shop: "فروشگاه",
    },

    hero: {
      eyebrow: "پاییز / زمستان ۱۴۰۵",
      title: "موهر.\nآنچه می‌پوشی.",
      description:
        "لباس‌های مدرن با تمرکز بر کیفیت، فرم و جزئیات.",
      button: "دیدن کالکشن",
    },

    products: {
      eyebrow: "کالکشن جدید",
      title: "کالکشن جدید",
      shopAll: "مشاهده همه",
    },

    philosophy: {
      eyebrow: "موهر",
      title: "آنچه می‌پوشی.",
      description:
        "لباس‌های مدرن برای هر روز؛ ساده، دقیق و با هویت.",
      button: "درباره موهر",
    },

    newsletter: {
      eyebrow: "با موهر همراه باش",
      title: "تازه‌های موهر.",
      description:
        "کالکشن‌های جدید، داستان‌های استودیو و خبرهای موهر.",
      placeholder: "ایمیل شما",
      button: "عضویت",
    },

    footer: {
      shop: "فروشگاه",
      information: "اطلاعات",
      follow: "دنبال کردن",
      newIn: "کالکشن جدید",
      collections: "کالکشن‌ها",
      allClothing: "همه محصولات",
      shipping: "ارسال",
      returns: "مرجوعی",
      sizeGuide: "راهنمای اندازه",
      contact: "تماس",
      instagram: "اینستاگرام",
      pinterest: "پینترست",
      tiktok: "تیک‌تاک",
      copyright: "© ۱۴۰۵ موهر",
      privacy: "حریم خصوصی",
      terms: "قوانین",
    },
  },
};

/* =========================================================
   PRODUCT DATA
========================================================= */

const products = [
  {
    id: 1,
    name: "Structured Linen Coat",
    nameFa: "کت لینن حمالی برای بدبحتا",
    category: "Outerwear",
    categoryFa: "لباس رویی",
    price: "€240",
    fallbackImage:
      "https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?auto=format&fit=crop&w=1200&q=90",
    badge: "NEW",
  },
  {
    id: 2,
    name: "Relaxed Cotton Shirt",
    nameFa: " پیراهن نخی آزاد برای ازادی های یواشکی",
    category: "Shirts",
    categoryFa: "پیراهن",
    price: "€95",
    fallbackImage:
      "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=1200&q=90",
    badge: "NEW",
  },
  {
    id: 3,
    name: "Wide Pleated Trouser",
    nameFa: "شلوار پلیسه واید برا چوسی زیاد",
    category: "Trousers",
    categoryFa: "شلوار",
    price: "€135",
    fallbackImage:
      "https://images.unsplash.com/photo-1506629905607-d9c297d3d5f7?auto=format&fit=crop&w=1200&q=90",
    badge: "",
  },
  {
    id: 4,
    name: "Oversized Wool Blazer",
    nameFa: "بلیزر پشمی اورسایز مخصوص پوشاندن چربی ها",
    category: "Outerwear",
    categoryFa: "لباس رویی",
    price: "€280",
    fallbackImage:
      "https://images.unsplash.com/photo-1598808503746-f34c53b9323e?auto=format&fit=crop&w=1200&q=90",
    badge: "NEW",
  },
];

const categories = [
  {
    name: "Outerwear",
    nameFa: "لباس رویی",
    image:
      "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=1200&q=85",
  },
  {
    name: "Shirts",
    nameFa: "پیراهن",
    image:
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1200&q=85",
  },
  {
    name: "Trousers",
    nameFa: "شلوار",
    image:
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1200&q=85",
  },
];

/* =========================================================
   ICONS
========================================================= */

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 5 5" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 21c.7-4.1 3-6 7-6s6.3 1.9 7 6" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M5 8h14l-1 13H6L5 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="21"
      height="21"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M3 7h18" />
      <path d="M3 12h18" />
      <path d="M3 17h18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="21"
      height="21"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M5 5l14 14" />
      <path d="M19 5 5 19" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="17"
      height="17"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M4 12h15" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function ArrowUpRight() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="15"
      height="15"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M6 18 18 6" />
      <path d="M8 6h10v10" />
    </svg>
  );
}


function ProductImage({ image, fallbackImage, alt, className }) {
  const sources = Array.isArray(image)
    ? image.filter(Boolean)
    : image
      ? [image]
      : [];

  const allSources = [...sources, fallbackImage].filter(
    (src, index, list) =>
      src && list.indexOf(src) === index
  );

  const [sourceIndex, setSourceIndex] = useState(0);

  const src = allSources[sourceIndex] || fallbackImage;

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => {
        if (sourceIndex < allSources.length - 1) {
          setSourceIndex((current) => current + 1);
        }
      }}
    />
  );
}

/* =========================================================
   PRODUCT CARD
========================================================= */

function ProductCard({ product, image, language, onAdd }) {
  const isFarsi = language === "farsi";

  return (
    <article className="product-card">
      <div className="product-image-wrap">
        {product.badge && (
          <span className="product-badge">
            {isFarsi ? "جدید" : product.badge}
          </span>
        )}

        <button
          type="button"
          className="wishlist-button"
          aria-label={isFarsi ? "افزودن به علاقه‌مندی‌ها" : "Add to wishlist"}
        >
          <span aria-hidden="true">♡</span>
        </button>

        <ProductImage
          image={image}
          fallbackImage={product.fallbackImage}
          alt={isFarsi ? product.nameFa : product.name}
          className="product-image"
        />

        <button
          type="button"
          className="quick-add"
          onClick={() => onAdd(product)}
        >
          <span>{isFarsi ? "افزودن سریع" : "Quick add"}</span>
          <ArrowRight />
        </button>
      </div>

      <div className="product-info">
        <div>
          <h3>{isFarsi ? product.nameFa : product.name}</h3>
          <p>{isFarsi ? product.categoryFa : product.category}</p>
        </div>

        <span className="product-price">{product.price}</span>
      </div>
    </article>
  );
}

/* =========================================================
   CATEGORY CARD
========================================================= */

function CategoryCard({ category, language }) {
  const isFarsi = language === "farsi";

  return (
    <a href="#products" className="category-card">
      <div className="category-image-wrap">
        <img
          src={category.image}
          alt={isFarsi ? category.nameFa : category.name}
          className="category-image"
          loading="lazy"
          decoding="async"
        />

        <div className="category-overlay" />

        <div className="category-content">
          <h3>{isFarsi ? category.nameFa : category.name}</h3>

          <span>
            {isFarsi ? "مشاهده" : "Shop"}
            <ArrowUpRight />
          </span>
        </div>
      </div>
    </a>
  );
}

/* =========================================================
   APP
========================================================= */

export default function App() {
  const [language, setLanguage] = useState("pinglish");
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [email, setEmail] = useState("");
  const [mouherImages, setMouherImages] = useState([]);

  const t = content[language];
  const isFarsi = language === "farsi";

  /* -------------------------------------------------------
     LOAD REAL MOUHER IMAGES
  ------------------------------------------------------- */

  useEffect(() => {
    let cancelled = false;

    async function loadImages() {
      try {
        const images = await getMouherImages();

        if (!cancelled && Array.isArray(images)) {
          setMouherImages(images);
        }
      } catch (error) {
        console.error("Failed to load Mouher images:", error);
      }
    }

    loadImages();

    return () => {
      cancelled = true;
    };
  }, []);

  /* -------------------------------------------------------
     AUTOMATIC LANGUAGE SWITCH
     Every 10 seconds
  ------------------------------------------------------- */

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setLanguage((current) =>
        current === "pinglish" ? "farsi" : "pinglish"
      );
    }, 10_000);

    return () => window.clearInterval(intervalId);
  }, []);

  /* -------------------------------------------------------
     CLOSE MOBILE MENU / SEARCH WITH ESC
  ------------------------------------------------------- */

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key !== "Escape") return;

      setMenuOpen(false);
      setSearchOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  /* -------------------------------------------------------
     BODY SCROLL LOCK FOR OVERLAYS
  ------------------------------------------------------- */

  useEffect(() => {
    const shouldLock = menuOpen || searchOpen;

    document.body.style.overflow = shouldLock ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen, searchOpen]);

  /* -------------------------------------------------------
     CART
  ------------------------------------------------------- */

  function handleAddToCart() {
    setCartCount((current) => current + 1);
  }

  /* -------------------------------------------------------
     NEWSLETTER
  ------------------------------------------------------- */

  function handleNewsletterSubmit(event) {
    event.preventDefault();

    if (!email.trim()) return;

    alert(
      isFarsi
        ? "ممنون که به موهر پیوستی."
        : "Mamnoon ke be Mouher peyvasti."
    );

    setEmail("");
  }

  /* -------------------------------------------------------
     HELPERS
  ------------------------------------------------------- */

  

  const productImages = mouherImages
    .map((image) => image?.urls || image?.src || image?.url || image)
    .filter(Boolean)
    .slice(0, products.length);

  return (
    <div
      className={`site ${isFarsi ? "site-farsi" : ""}`}
      dir={isFarsi ? "rtl" : "ltr"}
    >
      {/* =================================================
          ANNOUNCEMENT
      ================================================= */}

      <div className="announcement">
        <p>{t.announcement}</p>
      </div>

      {/* =================================================
          HEADER
      ================================================= */}

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

          <a href="/" className="logo" aria-label="Mouher home">
            MOUHER
          </a>

          <nav className="desktop-nav nav-right" aria-label="Utility">
            <button
              type="button"
              className="icon-button"
              onClick={() => setSearchOpen(true)}
              aria-label={isFarsi ? "جستجو" : "Search"}
            >
              <SearchIcon />
            </button>

            <button
              type="button"
              className="icon-button"
              aria-label={isFarsi ? "حساب کاربری" : "Account"}
            >
              <UserIcon />
            </button>

            <button
              type="button"
              className="bag-button"
              aria-label={
                isFarsi
                  ? `سبد خرید، ${cartCount} کالا`
                  : `Shopping bag, ${cartCount} items`
              }
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

      {/* =================================================
          LANGUAGE INDICATOR
      ================================================= */}

      <div className="language-indicator" aria-live="polite">
        <span className={language === "pinglish" ? "active" : ""}>EN</span>
        <span className="language-dot" aria-hidden="true">
          /
        </span>
        <span className={language === "farsi" ? "active" : ""}>فا</span>
      </div>

      {/* =================================================
          MOBILE MENU
      ================================================= */}

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
          </nav>
        </div>
      )}

      {/* =================================================
          SEARCH
      ================================================= */}

      {searchOpen && (
        <div
          className="search-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={isFarsi ? "جستجو در موهر" : "Search Mouher"}
        >
          <div className="search-inner">
            <div className="search-header">
              <span className="search-title">
                {isFarsi ? "جستجو در موهر" : "Search Mouher"}
              </span>

              <button
                type="button"
                className="icon-button"
                onClick={() => setSearchOpen(false)}
                aria-label={isFarsi ? "بستن جستجو" : "Close search"}
              >
                <CloseIcon />
              </button>
            </div>

            <form
              className="search-form"
              onSubmit={(event) => {
                event.preventDefault();
                setSearchOpen(false);
              }}
            >
              <SearchIcon />

              <input
                autoFocus
                type="search"
                placeholder={
                  isFarsi
                    ? "محصول یا کالکشن..."
                    : "Search products, collections..."
                }
                aria-label={isFarsi ? "عبارت جستجو" : "Search query"}
              />

              <button type="submit">
                {isFarsi ? "جستجو" : "Search"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =================================================
          MAIN
      ================================================= */}

      <main>
        {/* =================================================
            HERO
        ================================================= */}

        <section className="hero" id="new">
          <img
            src={
              "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=2300&q=85"
            }
            alt="Mouher collection"
            className="hero-image"
            fetchPriority="high"
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

        {/* =================================================
            PRODUCTS
        ================================================= */}

        <section className="section products-section" id="products">
          <div className="section-heading">
            <div>
              <span className="eyebrow">{t.products.eyebrow}</span>
              <h2>{t.products.title}</h2>
            </div>

            <a href="#products" className="text-link">
              {t.products.shopAll}
              <ArrowRight />
            </a>
          </div>

          <div className="products-grid">
            {products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                image={productImages[index] || product.fallbackImage}
                language={language}
                onAdd={handleAddToCart}
              />
            ))}
          </div>
        </section>

        {/* =================================================
            CATEGORIES
        ================================================= */}

        <section className="section categories-section" id="categories">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                {isFarsi ? "دسته‌بندی" : "Shop by category"}
              </span>

              <h2>{isFarsi ? "موهر را کشف کن" : "Explore Mouher"}</h2>
            </div>
          </div>

          <div className="categories-grid">
            {categories.map((category) => (
              <CategoryCard
                key={category.name}
                category={category}
                language={language}
              />
            ))}
          </div>
        </section>

        {/* =================================================
            PHILOSOPHY
        ================================================= */}

        <section className="philosophy">
          <div className="philosophy-image">
            <img
              src={
                productImages[1] ||
                "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=2200&q=90"
              }
              alt="Mouher editorial"
              loading="lazy"
              decoding="async"
            />
          </div>

          <div className="philosophy-content">
            <span className="eyebrow">{t.philosophy.eyebrow}</span>

            <h2>
              {t.philosophy.title.split("\n").map((line, index) => (
                <span key={line}>
                  {line}
                  {index === 0 && <br />}
                </span>
              ))}
            </h2>

            <p>{t.philosophy.description}</p>

            <a href="#newsletter" className="button button-dark">
              {t.philosophy.button}
              <ArrowRight />
            </a>
          </div>
        </section>

        {/* =================================================
            NEWSLETTER
        ================================================= */}

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
      </main>

      {/* =================================================
          FOOTER
      ================================================= */}

      <footer className="footer" id="footer">
        <div className="footer-top">
          <div className="footer-brand">
            <a href="/" className="footer-logo">
              MOUHER
            </a>

            <p>
              {isFarsi
                ? "لباس معاصر برای زندگی روزمره."
                : "Lebas-e modern baraye zendegi-e roozmarreh."}
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
