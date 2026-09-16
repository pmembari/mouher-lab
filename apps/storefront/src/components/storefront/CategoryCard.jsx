import { ArrowUpRight } from "../icons";
import { ProductImage } from "../ProductImage";

export default function CategoryCard({
  category,
  language,
  labels,
  active,
  onSelect,
}) {
  const isFarsi = language === "farsi";

  return (
    <button
      type="button"
      className={`category-card ${active ? "category-card-active" : ""
        }`}
      onClick={() => onSelect(category.slug)}
    >
      <div className="category-image-wrap">
        <ProductImage
          image={category.imageUrl}
          alt={
            isFarsi
              ? category.nameFa
              : category.name
          }
          className="category-image"
        />

        <div className="category-overlay" />

        <div className="category-content">
          <h3>
            {isFarsi
              ? category.nameFa
              : category.name}
          </h3>

          <span>
            {labels.shop}
            <ArrowUpRight />
          </span>
        </div>
      </div>
    </button>
  );
}