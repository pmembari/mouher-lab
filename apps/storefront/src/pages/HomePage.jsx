import { ArrowRight } from "../components/icons";
import { ProductImage } from "../components/ProductImage";
import ProductCard from "../components/storefront/ProductCard";
import CategoryCard from "../components/storefront/CategoryCard";

export default function HomePage({
  catalog,
  catalogState,
  language,
  t,
  heroImage,
  sourceLabel,
  categoryOptions,
  collectionOptions,
  filteredProducts,
  activeCategory,
  activeCollection,
  addingProductId,
  email,
  onSetActiveCategory,
  onSetActiveCollection,
  onSetQuery,
  onSetEmail,
  onAddToCart,
  onNewsletterSubmit,
}) {
  const isFarsi = language === "farsi";

  function scrollToProducts() {
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
        className="hero"
        id="new"
      >
        <ProductImage
          image={heroImage}
          alt="Mouher collection"
          className="hero-image"
        />

        <div className="hero-overlay" />

        <div className="hero-content">
          <p className="eyebrow hero-eyebrow">
            {t.hero.eyebrow}
          </p>

          <h1>
            {t.hero.title
              .split("\n")
              .map((line, index) => (
                <span key={line}>
                  {line}
                  {index === 0 && <br />}
                </span>
              ))}
          </h1>

          <p className="hero-description">
            {t.hero.description}
          </p>

          <a
            href="#products"
            className="button button-light"
          >
            {t.hero.button}
            <ArrowRight />
          </a>
        </div>
      </section>

      <section
        className="trust-strip"
        aria-label="Store benefits"
      >
        <span>{t.trust.shipping}</span>
        <span>{t.trust.returns}</span>
        <span>{t.trust.support}</span>
      </section>

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
          {collectionOptions.map(
            (collection) => (
              <button
                type="button"
                key={collection.slug}
                className={
                  activeCollection ===
                    collection.slug
                    ? "active"
                    : ""
                }
                onClick={() => {
                  onSetActiveCollection(
                    collection.slug
                  );

                  scrollToProducts();
                }}
              >
                <strong>
                  {isFarsi
                    ? collection.nameFa
                    : collection.name}
                </strong>

                <span>
                  {collection.count}
                </span>
              </button>
            )
          )}
        </div>
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
              onClick={() => {
                onSetActiveCategory("all");
                onSetActiveCollection("all");
                onSetQuery("");
              }}
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

        <div
          className="filter-bar"
          aria-label={t.categories.eyebrow}
        >
          {categoryOptions.map(
            (category) => (
              <button
                type="button"
                key={category.slug}
                className={
                  activeCategory ===
                    category.slug
                    ? "active"
                    : ""
                }
                onClick={() =>
                  onSetActiveCategory(
                    category.slug
                  )
                }
              >
                <span>
                  {isFarsi
                    ? category.nameFa
                    : category.name}
                </span>

                <span>
                  {category.count}
                </span>
              </button>
            )
          )}
        </div>

        {catalogState === "loading" ? (
          <p className="empty-state">
            {t.products.loading}
          </p>
        ) : filteredProducts.length > 0 ? (
          <div className="products-grid">
            {filteredProducts.map(
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

        <div className="categories-grid">
          {(catalog.categories || [])
            .slice(0, 3)
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
                onSelect={(slug) => {
                  onSetActiveCategory(slug);
                  scrollToProducts();
                }}
              />
            ))}
        </div>
      </section>

      <section className="philosophy">
        <div className="philosophy-image">
          <ProductImage
            image={
              catalog.products?.[1]
                ?.imageUrls ||
              heroImage
            }
            alt="Mouher editorial"
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
            href="#newsletter"
            className="button button-dark"
          >
            {t.philosophy.button}
            <ArrowRight />
          </a>
        </div>
      </section>

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
            onSubmit={onNewsletterSubmit}
          >
            <input
              type="email"
              placeholder={
                t.newsletter.placeholder
              }
              value={email}
              onChange={(event) =>
                onSetEmail(
                  event.target.value
                )
              }
              aria-label={
                t.newsletter.placeholder
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