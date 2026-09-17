import { useMemo, useState } from "react";
import { ArrowRight } from "../components/icons";
import { ProductImage } from "../components/ProductImage";
import ProductCard from "../components/storefront/ProductCard";
import CategoryCard from "../components/storefront/CategoryCard";

const BASE_URL = import.meta.env.BASE_URL;

const HERO_VIDEOS = [
  {
    id: "hero-1",
    src: `${BASE_URL}media/home/hero-1.webm`,
  },
  {
    id: "hero-2",
    src: `${BASE_URL}media/home/hero-2.webm`,
  },
  {
    id: "hero-3",
    src: `${BASE_URL}media/home/hero-3.webm`,
  },
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
  homepageCollections = [],
  addingProductId,
  email,
  onSetQuery,
  onSetEmail,
  onAddToCart,
  onNewsletterSubmit,
}) {
  const isFarsi = language === "farsi";
  const [activeCategory, setActiveCategory] =
    useState("all");
  const visibleProducts = useMemo(() => {
    if (activeCategory === "all") {
      return homepageProducts;
    }

    return homepageProducts.filter(
      (product) =>
        product.categorySlug === activeCategory
    );
  }, [
    homepageProducts,
    activeCategory,
  ]);

  const featuredProducts = visibleProducts.slice(
    0,
    8
  );

  const discoveryProducts = visibleProducts.slice(
    8,
    20
  );

  const editorialImage =
    homepageProducts[1]?.imageUrls ||
    homepageProducts[0]?.imageUrls ||
    heroImage;

  function scrollToProducts() {
    document
      .getElementById("products")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }

  function handleShopAll() {
    onSetQuery?.("");
    setActiveCategory("all");
    scrollToProducts();
  }
  function handleCategorySelect(categorySlug) {
    setActiveCategory(categorySlug);

    document
      .getElementById("products")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }
  return (
    <>
      <section
        className="home-intro"
        id="new"
      >
        <div className="home-intro-copy">
          <p className="eyebrow">
            {t.hero.eyebrow}
          </p>

          <h1>
            {t.hero.title
              .split("\n")
              .map((line, index, lines) => (
                <span
                  key={`${line}-${index}`}
                >
                  {line}

                  {index <
                    lines.length - 1 && (
                      <br />
                    )}
                </span>
              ))}
          </h1>

          <p className="hero-description">
            {t.hero.description}
          </p>

          <button
            type="button"
            className="button button-dark"
            onClick={scrollToProducts}
          >
            {t.hero.button}
            <ArrowRight />
          </button>
        </div>
      </section>

      <section
        className="hero-video-story"
        aria-label={
          isFarsi
            ? "داستان تصویری موهر"
            : "Mouher visual story"
        }
      >
        <div className="hero-video-grid">
          {HERO_VIDEOS.map((video) => (
            <div
              className="hero-video-panel"
              key={video.id}
            >
              <video
                className="hero-video"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                aria-hidden="true"
              >
                <source
                  src={video.src}
                  type="video/webm"
                />
              </video>
            </div>
          ))}
        </div>
      </section>

      <section
        className="trust-strip"
        aria-label={
          isFarsi
            ? "مزایای فروشگاه"
            : "Store benefits"
        }
      >
        <span>
          {t.trust.shipping}
        </span>

        <span>
          {t.trust.returns}
        </span>

        <span>
          {t.trust.support}
        </span>
      </section>

      <section
        className="section products-section"
        id="products"
      >
        <div className="section-heading catalog-heading">
          <div>
            <span className="eyebrow">
              {t.products.eyebrow}
            </span>

            <h2>
              {t.products.title}
            </h2>
          </div>

          <div className="catalog-actions">
            <span
              className={`catalog-pill catalog-pill-${catalog.source}`}
            >
              {sourceLabel}
            </span>

            <button
              type="button"
              className="text-link"
              onClick={handleShopAll}
            >
              {t.products.shopAll}
              <ArrowRight />
            </button>
          </div>
        </div>

        {catalog.notice && (
          <p className="catalog-notice">
            {catalog.notice}
          </p>
        )}

        {catalogState === "loading" ? (
          <p className="empty-state">
            {t.products.loading}
          </p>
        ) : featuredProducts.length >
          0 ? (
          <div className="products-grid">
            {featuredProducts.map(
              (product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  language={language}
                  labels={t.cart}
                  onAdd={onAddToCart}
                  isAdding={
                    addingProductId ===
                    product.id
                  }
                />
              )
            )}
          </div>
        ) : (
          <p className="empty-state">
            {t.products.empty}
          </p>
        )}
      </section>

      {homepageCollections.length >
        0 && (
          <section
            className="section collections-section"
            id="collections"
          >
            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  {t.collections.eyebrow}
                </span>

                <h2>
                  {t.collections.title}
                </h2>
              </div>
            </div>

            <div className="collection-rail">
              {homepageCollections.map(
                (collection) => (
                  <a
                    key={collection.slug}
                    href="#products"
                    className="home-collection-link"
                  >
                    <strong>
                      {isFarsi
                        ? collection.nameFa ||
                        collection.name
                        : collection.name}
                    </strong>

                    <span>
                      {collection.count}
                    </span>
                  </a>
                )
              )}
            </div>
          </section>
        )}

      {homepageCategories.length >
        0 && (
          <section
            className="section categories-section"
            id="categories"
          >
            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  {t.categories.eyebrow}
                </span>

                <h2>
                  {t.categories.title}
                </h2>
              </div>
            </div>
          <button
            type="button"
            className={`category-reset ${activeCategory === "all"
                ? "category-reset-active"
                : ""
              }`}
            onClick={() => {
              setActiveCategory("all");
              scrollToProducts();
            }}
          >
            {t.categories.all}
          </button>
            <div className="categories-grid">
              {homepageCategories
                .slice(0, 6)
                .map((category) => (
                  <CategoryCard
                    key={category.slug}
                    category={category}
                    language={language}
                    labels={t.categories}
                    active={
                      activeCategory ===
                      category.slug
                    }
                    onSelect={
                      handleCategorySelect
                    }
                  />
                ))}
            </div>
          </section>
        )}

      <section className="philosophy">
        <div className="philosophy-image">
          <ProductImage
            image={editorialImage}
            alt={
              isFarsi
                ? "داستان موهر"
                : "Mouher editorial story"
            }
            className=""
          />
        </div>

        <div className="philosophy-content">
          <span className="eyebrow">
            {t.philosophy.eyebrow}
          </span>

          <h2>
            {t.philosophy.title}
          </h2>

          <p>
            {t.philosophy.description}
          </p>

          <a
            href="#collections"
            className="button button-dark"
          >
            {t.philosophy.button}
            <ArrowRight />
          </a>
        </div>
      </section>

      {discoveryProducts.length >
        0 && (
          <section className="section products-section home-discovery">
            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  {isFarsi
                    ? "انتخاب‌های موهر"
                    : "The Mouher Edit"}
                </span>

                <h2>
                  {isFarsi
                    ? "برای کشف بیشتر"
                    : "More to discover"}
                </h2>
              </div>
            </div>

            <div className="products-grid">
              {discoveryProducts.map(
                (product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    language={language}
                    labels={t.cart}
                    onAdd={onAddToCart}
                    isAdding={
                      addingProductId ===
                      product.id
                    }
                  />
                )
              )}
            </div>
          </section>
        )}

      <section
        className="newsletter"
        id="newsletter"
      >
        <div className="newsletter-inner">
          <span className="eyebrow">
            {t.newsletter.eyebrow}
          </span>

          <h2>
            {t.newsletter.title}
          </h2>

          <p>
            {t.newsletter.description}
          </p>

          <form
            className="newsletter-form"
            onSubmit={
              onNewsletterSubmit
            }
          >
            <input
              type="email"
              placeholder={
                t.newsletter
                  .placeholder
              }
              value={email}
              onChange={(event) =>
                onSetEmail(
                  event.target.value
                )
              }
              aria-label={
                t.newsletter
                  .placeholder
              }
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