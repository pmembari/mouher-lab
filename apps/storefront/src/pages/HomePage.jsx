import { ArrowRight } from "../components/icons";
import { ProductImage } from "../components/ProductImage";
import ProductCard from "../components/storefront/ProductCard";

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
  onSetEmail,
  onAddToCart,
  onNewsletterSubmit,
}) {
  const isFarsi =
    language === "farsi";

  const featuredProducts =
    homepageProducts.slice(0, 8);

  const discoveryProducts =
    homepageProducts.slice(8, 20);

  const editorialImage =
    homepageProducts[1]?.imageUrls ||
    homepageProducts[0]?.imageUrls ||
    heroImage;

  const visualCollections =
    homepageCollections.map(
      (collection) => ({
        ...collection,

        image:
          getCollectionImage({
            collection,
            products:
              homepageProducts,
            fallback:
              heroImage,
          }),
      })
    );

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
              .map(
                (
                  line,
                  index,
                  lines
                ) => (
                  <span
                    key={`${line}-${index}`}
                  >
                    {line}

                    {index <
                      lines.length -
                      1 && (
                        <br />
                      )}
                  </span>
                )
              )}
          </h1>

          <p className="hero-description">
            {t.hero.description}
          </p>

          <a
            href="#/shop"
            className="button button-dark"
          >
            {t.hero.button}

            <ArrowRight />
          </a>
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
          {HERO_VIDEOS.map(
            (video) => (
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
            )
          )}
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

            <a
              href="#/shop"
              className="text-link"
            >
              {t.products.shopAll}

              <ArrowRight />
            </a>
          </div>
        </div>

        {catalog.notice && (
          <p className="catalog-notice">
            {catalog.notice}
          </p>
        )}

        {catalogState ===
          "loading" ? (
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
                  language={
                    language
                  }
                  labels={t.cart}
                  onAdd={
                    onAddToCart
                  }
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

      {visualCollections.length >
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

              <a
                href="#/shop"
                className="text-link"
              >
                {isFarsi
                  ? "مشاهده فروشگاه"
                  : "View all"}

                <ArrowRight />
              </a>
            </div>

            <div className="home-collections-grid">
              {visualCollections.map(
                (
                  collection,
                  index
                ) => {
                  const name =
                    isFarsi
                      ? collection.nameFa ||
                      collection.name
                      : collection.name;

                  return (
                    <a
                      key={
                        collection.slug
                      }
                      href={`#/collections/${encodeURIComponent(
                        collection.slug
                      )}`}
                      className={`home-collection-card ${index === 0
                          ? "home-collection-card-featured"
                          : ""
                        }`}
                    >
                      <div className="home-collection-media">
                        <ProductImage
                          image={
                            collection.image
                          }
                          alt={name}
                          className="home-collection-image"
                        />
                      </div>

                      <div className="home-collection-copy">
                        <div>
                          <span className="home-card-kicker">
                            {isFarsi
                              ? "کالکشن"
                              : "Collection"}
                          </span>

                          <h3>
                            {name}
                          </h3>
                        </div>

                        <div className="home-collection-meta">
                          {collection.count >
                            0 && (
                              <span>
                                {isFarsi
                                  ? `${collection.count} محصول`
                                  : `${collection.count} ${collection.count ===
                                    1
                                    ? "style"
                                    : "styles"
                                  }`}
                              </span>
                            )}

                          <span
                            className="home-card-arrow"
                            aria-hidden="true"
                          >
                            <ArrowRight />
                          </span>
                        </div>
                      </div>
                    </a>
                  );
                }
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

              <a
                href="#/shop"
                className="text-link"
              >
                {isFarsi
                  ? "همه محصولات"
                  : "Shop all"}

                <ArrowRight />
              </a>
            </div>

            <div className="home-categories-grid">
              {homepageCategories
                .slice(0, 6)
                .map(
                  (category) => {
                    const name =
                      isFarsi
                        ? category.nameFa ||
                        category.name
                        : category.name;

                    const categoryImage =
                      category.imageUrl ||
                      getCategoryImage({
                        category,
                        products:
                          homepageProducts,
                        fallback:
                          heroImage,
                      });

                    return (
                      <a
                        key={
                          category.slug
                        }
                        href={`#/categories/${encodeURIComponent(
                          category.slug
                        )}`}
                        className="home-category-card"
                      >
                        <div className="home-category-media">
                          <ProductImage
                            image={
                              categoryImage
                            }
                            alt={name}
                            className="home-category-image"
                          />
                        </div>

                        <div className="home-category-copy">
                          <div>
                            <h3>
                              {name}
                            </h3>

                            {category.count >
                              0 && (
                                <span>
                                  {isFarsi
                                    ? `${category.count} محصول`
                                    : `${category.count} ${category.count ===
                                      1
                                      ? "style"
                                      : "styles"
                                    }`}
                                </span>
                              )}
                          </div>

                          <span
                            className="home-card-arrow"
                            aria-hidden="true"
                          >
                            <ArrowRight />
                          </span>
                        </div>
                      </a>
                    );
                  }
                )}
            </div>
          </section>
        )}

      <section className="philosophy">
        <div className="philosophy-image">
          <ProductImage
            image={
              editorialImage
            }
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
            href="#/shop"
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

              <a
                href="#/shop"
                className="text-link"
              >
                {isFarsi
                  ? "مشاهده همه"
                  : "Shop all"}

                <ArrowRight />
              </a>
            </div>

            <div className="products-grid">
              {discoveryProducts.map(
                (product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    language={
                      language
                    }
                    labels={t.cart}
                    onAdd={
                      onAddToCart
                    }
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

function getCollectionImage({
  collection,
  products,
  fallback,
}) {
  if (collection.imageUrl) {
    return collection.imageUrl;
  }

  const match =
    products.find((product) => {
      const collectionSlug =
        slugifyValue(
          product.collection
        );

      return (
        collectionSlug ===
        collection.slug
      );
    });

  return (
    match?.imageUrls ||
    fallback ||
    ""
  );
}

function getCategoryImage({
  category,
  products,
  fallback,
}) {
  const match =
    products.find(
      (product) =>
        product.categorySlug ===
        category.slug
    );

  return (
    match?.imageUrls ||
    fallback ||
    ""
  );
}

function slugifyValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-|-$/g,
      ""
    );
}