import { useState } from "react";

import {
  ArrowRight,
  ArrowUpRight,
  SearchIcon,
} from "../components/icons";

import { ProductImage } from "../components/ProductImage";

import {
  catalogMetrics,
} from "../utils/dashboard";

import {
  productCategoryName,
  productCollectionName,
  productDisplayName,
  productPageHref,
  productStockLabel,
} from "../utils/product";

export default function WebsiteAssistDashboard({
  catalog,
  language,
  labels,
}) {
  const isFarsi = language === "farsi";
  const [assistQuery, setAssistQuery] = useState("");

  const metrics = catalogMetrics(catalog);
  const normalizedQuery = assistQuery
    .trim()
    .toLowerCase();

  const productMatches = metrics.products
    .filter((product) => {
      if (!normalizedQuery) {
        return true;
      }

      return [
        product.name,
        product.nameFa,
        product.category,
        product.categoryFa,
        product.collection,
        product.price,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    })
    .slice(0, 8);

  const selectedProduct =
    productMatches[0] || metrics.products[0];

  const taskRows = buildAssistantTasks(
    metrics.products,
    labels
  );

  return (
    <div className="dashboard-page assistant-page">
      <section className="dashboard-shell">
        <div className="dashboard-heading">
          <div>
            <span className="eyebrow">
              {labels.assistEyebrow}
            </span>

            <h1>{labels.assistTitle}</h1>

            <p>{labels.assistDescription}</p>
          </div>

          <div className="dashboard-heading-actions">
            <a
              href="#/owner"
              className="button button-outline"
            >
              {labels.owner}
              <ArrowRight />
            </a>

            <a
              href="#products"
              className="button button-dark"
            >
              {labels.viewStore}
              <ArrowRight />
            </a>
          </div>
        </div>

        <form
          className="assistant-search"
          onSubmit={(event) =>
            event.preventDefault()
          }
        >
          <SearchIcon />

          <input
            type="search"
            value={assistQuery}
            onChange={(event) =>
              setAssistQuery(event.target.value)
            }
            placeholder={labels.search}
            aria-label={labels.search}
          />
        </form>

        <div className="assistant-grid">
          <section className="dashboard-panel assistant-answer">
            <div className="dashboard-panel-header">
              <h2>{labels.suggestedReply}</h2>

              {selectedProduct && (
                <span>
                  {productStockLabel(
                    selectedProduct,
                    labels
                  )}
                </span>
              )}
            </div>

            {selectedProduct ? (
              <>
                <h3>
                  {productDisplayName(
                    selectedProduct,
                    isFarsi
                  )}
                </h3>

                <p>
                  {assistantReply(
                    selectedProduct,
                    isFarsi
                  )}
                </p>

                <div className="quick-view-actions">
                  <a
                    href={productPageHref(
                      selectedProduct
                    )}
                    className="button button-dark"
                  >
                    {labels.open}
                    <ArrowRight />
                  </a>

                  {selectedProduct.externalUrl && (
                    <a
                      href={
                        selectedProduct.externalUrl
                      }
                      className="button button-outline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {labels.live}
                      <ArrowUpRight />
                    </a>
                  )}
                </div>
              </>
            ) : (
              <p>{labels.noTasks}</p>
            )}
          </section>

          <section className="dashboard-panel">
            <div className="dashboard-panel-header">
              <h2>{labels.productMatches}</h2>
              <span>{productMatches.length}</span>
            </div>

            <div className="assistant-product-list">
              {productMatches.map((product) => (
                <a
                  href={productPageHref(product)}
                  key={product.id}
                >
                  <ProductImage
                    image={product.imageUrls}
                    alt={productDisplayName(
                      product,
                      isFarsi
                    )}
                    className="assistant-product-image"
                  />

                  <span>
                    {productDisplayName(
                      product,
                      isFarsi
                    )}
                  </span>

                  <b>{product.price}</b>
                </a>
              ))}
            </div>
          </section>

          <section className="dashboard-panel">
            <div className="dashboard-panel-header">
              <h2>{labels.contentQueue}</h2>
            </div>

            <div className="task-list">
              {taskRows.length ? (
                taskRows.map((task) => (
                  <div key={task.id}>
                    <span>{task.label}</span>
                    <strong>{task.count}</strong>
                  </div>
                ))
              ) : (
                <p>{labels.noTasks}</p>
              )}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

function buildAssistantTasks(products, labels) {
  const rows = [
    {
      id: "photo",
      label: labels.missingPhoto,
      count: products.filter(
        (product) =>
          !product.imageUrls?.length
      ).length,
    },
    {
      id: "color",
      label: labels.missingColor,
      count: products.filter(
        (product) =>
          !product.colors?.length
      ).length,
    },
    {
      id: "size",
      label: labels.missingSize,
      count: products.filter(
        (product) =>
          !product.sizes?.length
      ).length,
    },
    {
      id: "sale",
      label: labels.saleBadge,
      count: products.filter(
        (product) =>
          Number(product.compareAtAmount) >
          Number(product.priceAmount)
      ).length,
    },
  ];

  return rows.filter(
    (row) => row.count > 0
  );
}

function assistantReply(product, isFarsi) {
  const name = productDisplayName(
    product,
    isFarsi
  );

  const category = productCategoryName(
    product,
    isFarsi
  );

  const collection = productCollectionName(
    product,
    isFarsi
  );

  if (isFarsi) {
    return `${name} از محصولات فعلی موهر در دسته ${category} و ادیت ${collection} است. قیمت فعلی ${product.price} است و صفحه محصول برای عکس، رنگ، سایز و وضعیت موجودی آماده است.`;
  }

  return `${name} is a current Mouher product in ${category}, listed under ${collection}. The current price is ${product.price}, and the product page is ready for photos, colors, sizes and stock status.`;
}