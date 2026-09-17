import { useState } from "react";

import { ArrowRight } from "../components/icons";
import { ProductImage } from "../components/ProductImage";
import ProductCard from "../components/storefront/ProductCard";
import {
  productDisplayName,
  productPageHref,
} from "../utils/product";

const BASE_URL = import.meta.env.BASE_URL;
const DISCOVERY_PAGE_SIZE = 30;

const HERO_VIDEOS = [
  { id: "hero-1", src: `${BASE_URL}media/home/hero-1.webm` },
  { id: "hero-2", src: `${BASE_URL}media/home/hero-2.webm` },
  { id: "hero-3", src: `${BASE_URL}media/home/hero-3.webm` },
];

export default function HomePage({
  catalog,
  catalogState,
  language,
  t,
  heroImage,
  sourceLabel,
  homepageProducts = [],
  homepageCategories = [],
  addingProductId,
  email,
  onSetEmail,
  onAddToCart,
  onNewsletterSubmit,
}) {
  const isFarsi = language === "farsi";
  const [discoveryPage, setDiscoveryPage] = useState(1);

  const featuredProducts = homepageProducts.slice(0, 8);
  const trendingProducts = homepageProducts.slice(0, 3);
  const visibleCategories = homepageCategories.slice(0, 3);
  const allDiscoveryProducts = catalog.products || [];

  const discoveryTotalPages = Math.max(
    1,
    Math.ceil(allDiscoveryProducts.length / DISCOVERY_PAGE_SIZE)
  );

  const currentDiscoveryPage = Math.min(
    discoveryPage,
    discoveryTotalPages
  );

  const discoveryStart =
    (currentDiscoveryPage - 1) * DISCOVERY_PAGE_SIZE;

  const discoveryProducts = allDiscoveryProducts.slice(
    discoveryStart,
    discoveryStart + DISCOVERY_PAGE_SIZE
  );

  const discoveryPaginationItems = buildPaginationItems(
    currentDiscoveryPage,
    discoveryTotalPages
  );

  const editorialImage =
    homepageProducts[1]?.imageUrls ||
    homepageProducts[0]?.imageUrls ||
    heroImage;

  function changeDiscoveryPage(page) {
    if (
      page < 1 ||
      page > discoveryTotalPages ||
      page === currentDiscoveryPage
    ) {
      return;
    }

    setDiscoveryPage(page);

    window.requestAnimationFrame(() => {
      document
        .getElementById("discover")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    });
  }

  return (
    <>
      <section
        className="hero-video-story"
        aria-label={isFarsi ? "داستان تصویری موهر" : "Mouher visual story"}
      >
        <div className="hero-video-grid">
          {HERO_VIDEOS.map((video) => (
            <div className="hero-video-panel" key={video.id}>
              <video
                className="hero-video"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                aria-hidden="true"
              >
                <source src={video.src} type="video/webm" />
              </video>
            </div>
          ))}
        </div>
      </section>

      <section className="home-intro" id="new">
        <div className="home-intro-copy">
          <p className="eyebrow">{t.hero.eyebrow}</p>

          <h1>
            {t.hero.title.split("\n").map((line, index, lines) => (
              <span key={`${line}-${index}`}>
                {line}
                {index < lines.length - 1 && <br />}
              </span>
            ))}
          </h1>

          <p className="hero-description">{t.hero.description}</p>
        </div>
      </section>

      <section
        className="trust-strip"
        aria-label={isFarsi ? "مزایای فروشگاه" : "Store benefits"}
      >
        <span>{t.trust.shipping}</span>
        <span>{t.trust.returns}</span>
        <span>{t.trust.support}</span>
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

            <a href="#/shop" className="text-link">
              {t.products.shopAll}
              <ArrowRight />
            </a>
          </div>
        </div>

        {catalog.notice && <p className="catalog-notice">{catalog.notice}</p>}

        {catalogState === "loading" ? (
          <p className="empty-state">{t.products.loading}</p>
        ) : featuredProducts.length > 0 ? (
          <div className="products-grid">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                language={language}
                labels={t.cart}
                onAdd={onAddToCart}
                isAdding={addingProductId === product.id}
              />
            ))}
          </div>
        ) : (
          <p className="empty-state">{t.products.empty}</p>
        )}
      </section>

      {trendingProducts.length > 0 && (
        <section className="section home-trending" id="trending">
          <div className="section-heading home-merch-heading">
            <div>
              <span className="eyebrow">
                {isFarsi ? "در حال توجه" : "Trending now"}
              </span>
              <h2>{isFarsi ? "انتخاب‌های این لحظه" : "What we’re watching"}</h2>
            </div>

            <a href="#/shop" className="text-link">
              {isFarsi ? "مشاهده فروشگاه" : "Shop all"}
              <ArrowRight />
            </a>
          </div>

          <div className="home-trending-grid">
            {trendingProducts.map((product) => {
              const name = productDisplayName(product, isFarsi);

              return (
                <a
                  key={product.id}
                  href={productPageHref(product)}
                  className="home-trending-card"
                >
                  <div className="home-trending-media">
                    <ProductImage
                      image={product.imageUrls}
                      alt={name}
                      className="home-trending-image"
                    />
                  </div>

                  <div className="home-trending-copy">
                    <div>
                      <span className="home-merch-kicker">
                        {isFarsi ? "منتخب موهر" : "Mouher pick"}
                      </span>
                      <h3>{name}</h3>
                      {product.price && <p>{product.price}</p>}
                    </div>

                    <span className="home-merch-arrow" aria-hidden="true">
                      <ArrowRight />
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      )}

      {visibleCategories.length > 0 && (
        <section className="section categories-section" id="categories">
          <div className="section-heading home-merch-heading">
            <div>
              <span className="eyebrow">
                {isFarsi ? "خرید بر اساس دسته‌بندی" : "Shop by category"}
              </span>
              <h2>{isFarsi ? "موهر را کشف کنید" : "Explore Mouher"}</h2>
            </div>

            <a href="#/shop" className="text-link">
              {isFarsi ? "همه محصولات" : "Shop all"}
              <ArrowRight />
            </a>
          </div>

          <div className="home-categories-grid">
            {visibleCategories.map((category) => {
              const name = isFarsi
                ? category.nameFa || category.name
                : category.name;

              const categoryImage =
                category.imageUrl ||
                getCategoryImage({
                  category,
                  products: homepageProducts,
                  fallback: heroImage,
                });

              return (
                <a
                  key={category.slug}
                  href={`#/categories/${encodeURIComponent(category.slug)}`}
                  className="home-category-card"
                >
                  <div className="home-category-media">
                    <ProductImage
                      image={categoryImage}
                      alt={name}
                      className="home-category-image"
                    />
                  </div>

                  <div className="home-category-copy">
                    <div>
                      <h3>{name}</h3>
                      {category.count > 0 && (
                        <span>
                          {isFarsi
                            ? `${category.count} محصول`
                            : `${category.count} ${category.count === 1 ? "style" : "styles"}`}
                        </span>
                      )}
                    </div>

                    <span className="home-merch-arrow" aria-hidden="true">
                      <ArrowRight />
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      )}

      <section className="philosophy">
        <div className="philosophy-image">
          <ProductImage
            image={editorialImage}
            alt={isFarsi ? "داستان موهر" : "Mouher editorial story"}
            className=""
          />
        </div>

        <div className="philosophy-content">
          <span className="eyebrow">{t.philosophy.eyebrow}</span>
          <h2>{t.philosophy.title}</h2>
          <p>{t.philosophy.description}</p>

          <a href="#/shop" className="button button-dark">
            {t.philosophy.button}
            <ArrowRight />
          </a>
        </div>
      </section>

      {allDiscoveryProducts.length > 0 && (
        <section
          className="section products-section home-discovery"
          id="discover"
        >
          <div className="section-heading home-discovery-heading">
            <div>
              <span className="eyebrow">
                {isFarsi ? "تمام محصولات" : "The full catalog"}
              </span>
              <h2>{isFarsi ? "برای کشف بیشتر" : "More to discover"}</h2>
              <p className="home-discovery-summary">
                {isFarsi
                  ? `${allDiscoveryProducts.length} محصول، ${DISCOVERY_PAGE_SIZE} محصول در هر صفحه`
                  : `${allDiscoveryProducts.length} products · ${DISCOVERY_PAGE_SIZE} per page`}
              </p>
            </div>

            <a href="#/shop" className="text-link">
              {isFarsi ? "فروشگاه و فیلترها" : "Shop & filters"}
              <ArrowRight />
            </a>
          </div>

          <div className="products-grid">
            {discoveryProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                language={language}
                labels={t.cart}
                onAdd={onAddToCart}
                isAdding={addingProductId === product.id}
              />
            ))}
          </div>

          {discoveryTotalPages > 1 && (
            <nav
              className="home-discovery-pagination"
              aria-label={
                isFarsi
                  ? "صفحه‌بندی محصولات بیشتر"
                  : "More to discover pagination"
              }
            >
              <button
                type="button"
                className="home-discovery-pagination-nav"
                disabled={currentDiscoveryPage === 1}
                onClick={() =>
                  changeDiscoveryPage(currentDiscoveryPage - 1)
                }
              >
                {isFarsi ? "قبلی" : "Previous"}
              </button>

              <div className="home-discovery-pagination-pages">
                {discoveryPaginationItems.map((item, index) =>
                  item === "ellipsis" ? (
                    <span
                      key={`ellipsis-${index}`}
                      className="home-discovery-pagination-ellipsis"
                      aria-hidden="true"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      className={
                        item === currentDiscoveryPage
                          ? "home-discovery-pagination-page is-active"
                          : "home-discovery-pagination-page"
                      }
                      aria-current={
                        item === currentDiscoveryPage ? "page" : undefined
                      }
                      onClick={() => changeDiscoveryPage(item)}
                    >
                      {item}
                    </button>
                  )
                )}
              </div>

              <button
                type="button"
                className="home-discovery-pagination-nav"
                disabled={currentDiscoveryPage === discoveryTotalPages}
                onClick={() =>
                  changeDiscoveryPage(currentDiscoveryPage + 1)
                }
              >
                {isFarsi ? "بعدی" : "Next"}
              </button>
            </nav>
          )}
        </section>
      )}

      <section className="newsletter" id="newsletter">
        <div className="newsletter-inner">
          <span className="eyebrow">{t.newsletter.eyebrow}</span>
          <h2>{t.newsletter.title}</h2>
          <p>{t.newsletter.description}</p>

          <form className="newsletter-form" onSubmit={onNewsletterSubmit}>
            <input
              type="email"
              placeholder={t.newsletter.placeholder}
              value={email}
              onChange={(event) => onSetEmail(event.target.value)}
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
  );
}

function getCategoryImage({ category, products, fallback }) {
  const match = products.find(
    (product) => product.categorySlug === category.slug
  );

  return match?.imageUrls || fallback || "";
}

function buildPaginationItems(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "ellipsis", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "ellipsis",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis",
    totalPages,
  ];
}
