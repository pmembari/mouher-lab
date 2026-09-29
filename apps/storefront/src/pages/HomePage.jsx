import { ArrowRight } from "../components/icons";
import { ProductImage } from "../components/ProductImage";

export default function HomePage({
  language,
  t,
  heroImage,
  homepageProducts = [],
  homepageCategories = [],
}) {
  const isFarsi = language === "farsi";
  const categories = homepageCategories.slice(0, 4);
  const storyImage =
    homepageProducts[1]?.imageUrls ||
    homepageProducts[0]?.imageUrls ||
    heroImage;

  return (
    <main className="mouher-reference-home">
      <section className="mouher-hero" id="new">
        <div className="mouher-hero-media">
          <ProductImage
            image={heroImage}
            alt={isFarsi ? "تصویر اصلی موهر" : "Mouher hero"}
            className="mouher-hero-image"
          />
          <div className="mouher-hero-overlay" />
          <div className="mouher-hero-sheen" aria-hidden="true" />
        </div>

        <div className="mouher-hero-copy">
          <span className="mouher-hero-kicker">
            {isFarsi ? "بیش از لباس" : "More than clothes"}
          </span>

          <h1>{t.hero.title}</h1>
          <p>{t.hero.description}</p>

          <div className="mouher-hero-actions">
            <a href="#/shop" className="mouher-hero-button mouher-hero-button-light">
              {isFarsi ? "خرید کنید" : "Shop now"} <ArrowRight />
            </a>
            <a href="#categories" className="mouher-hero-button mouher-hero-button-ghost">
              {isFarsi ? "مشاهده کالکشن‌ها" : "Explore collections"}
            </a>
          </div>

          <div className="mouher-hero-index" aria-hidden="true">
            <span>01</span><i className="active" />
            <span>02</span><i />
            <span>03</span>
          </div>

          <span className="mouher-hero-rooted">
            {isFarsi ? "استایل ریشه‌دار در تو" : "Style rooted in you"}
          </span>
        </div>

        <div className="mouher-hero-script" aria-hidden="true">
          Same You<br />A Brighter<br />Tomorrow
        </div>
        <div className="mouher-hero-side-note" aria-hidden="true">
          Configure · Inspire · Detail
        </div>
      </section>

      <section className="mouher-category-strip" id="categories">
        <div className="mouher-category-strip-heading">
          <span>{isFarsi ? "خرید بر اساس دسته‌بندی" : "Shop by category"}</span>
          <a href="#/shop">{isFarsi ? "مشاهده همه" : "View all"} <ArrowRight /></a>
        </div>

        <div className="mouher-category-strip-grid">
          {categories.map((category) => {
            const name = isFarsi
              ? category.nameFa || category.name
              : category.name;
            const image =
              category.imageUrl ||
              homepageProducts.find((product) => product.categorySlug === category.slug)?.imageUrls ||
              heroImage;

            return (
              <a
                key={category.slug}
                href={`#/categories/${encodeURIComponent(category.slug)}`}
                className="mouher-category-tile"
              >
                <ProductImage image={image} alt={name} className="mouher-category-tile-image" />
                <div className="mouher-category-tile-overlay" />
                <div className="mouher-category-tile-copy">
                  <div>
                    <h3>{name}</h3>
                    <span>{isFarsi ? "استایل خود را کشف کنید" : "Discover your style"}</span>
                  </div>
                  <span className="mouher-category-tile-arrow"><ArrowRight /></span>
                </div>
              </a>
            );
          })}
        </div>
      </section>

      <section className="mouher-reference-benefits" aria-label="Store benefits">
        <div><b>▱</b><span><strong>{isFarsi ? "ارسال رایگان" : "Free shipping"}</strong><small>{t.trust.shipping}</small></span></div>
        <div><b>◇</b><span><strong>{isFarsi ? "بازگشت آسان" : "Easy returns"}</strong><small>{t.trust.returns}</small></span></div>
        <div><b>♙</b><span><strong>{isFarsi ? "پرداخت امن" : "Secure payment"}</strong><small>{isFarsi ? "با اطمینان خرید کنید" : "Shop with confidence"}</small></span></div>
        <div><b>♧</b><span><strong>{isFarsi ? "انتخاب پایدار" : "Sustainable choices"}</strong><small>{isFarsi ? "آینده‌ای مهربان‌تر" : "A kinder future"}</small></span></div>
        <div><b>♡</b><span><strong>{isFarsi ? "مراقبت از مشتری" : "Customer care"}</strong><small>{t.trust.support}</small></span></div>
      </section>

      <section className="mouher-reference-story" id="story">
        <ProductImage image={storyImage} alt="Mouher story" className="mouher-reference-story-image" />
        <div className="mouher-reference-story-overlay" />
        <blockquote>“ MOUHER — WHAT YOU WEAR,<br />A BRIGHTER TOMORROW ”</blockquote>
        <a href="#/shop">{isFarsi ? "داستان ما" : "Our story"} <ArrowRight /></a>
      </section>
    </main>
  );
}
