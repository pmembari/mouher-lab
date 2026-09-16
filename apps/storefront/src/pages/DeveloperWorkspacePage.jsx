import { ArrowRight } from "../components/icons";
import { MetricCard } from "../components/dashboard/MetricCard";
import {
  catalogMetrics,
  formatCompactAmount,
  medusaFeatureRows,
} from "../utils/dashboard";
import { mouherApiConfig } from "../lib/notifications";

export default function DeveloperWorkspacePage({
  catalog,
  language,
  labels,
}) {
  const isFarsi = language === "farsi";
  const metrics = catalogMetrics(catalog);
  const moduleRows = medusaFeatureRows(metrics, labels);

  const apiRows = [
    {
      id: "store",
      title: labels.storefront,
      status: labels.public,
      route: "/store/products, /store/carts",
      detail:
        "Catalog, cart, payment collection, checkout completion",
    },
    {
      id: "admin",
      title: labels.backend,
      status: labels.protected,
      route: "/admin/*",
      detail:
        "Orders, products, customers, promotions, price lists",
    },
    {
      id: "inventory",
      title: labels.inventory,
      status: labels.protected,
      route:
        "/admin/inventory-items, /admin/stock-locations",
      detail:
        "Stock locations, inventory items, inventory levels",
    },
    {
      id: "push",
      title: labels.browserPush,
      status: labels.chromeSafari,
      route: "/loyalty/push/*",
      detail:
        "Subscription registration and loyalty notification delivery",
    },
  ];

  return (
    <div className="dashboard-page developer-page">
      <section className="dashboard-shell">
        <div className="dashboard-heading">
          <div>
            <span className="eyebrow">
              {labels.developerEyebrow}
            </span>

            <h1>{labels.developerTitle}</h1>

            <p>{labels.developerDescription}</p>
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
              href="#/assist"
              className="button button-dark"
            >
              {labels.websiteAssist}
              <ArrowRight />
            </a>
          </div>
        </div>

        <div className="workspace-grid">
          <section className="dashboard-panel workspace-panel">
            <div className="dashboard-panel-header">
              <h2>{labels.medusaDomains}</h2>
              <span>{catalog.source}</span>
            </div>

            <div className="module-list">
              {moduleRows.map((feature) => (
                <article
                  className="workspace-row"
                  key={feature.id}
                >
                  <div>
                    <strong>
                      {isFarsi
                        ? feature.titleFa
                        : feature.title}
                    </strong>

                    <span>
                      {isFarsi
                        ? feature.detailFa
                        : feature.detail}
                    </span>
                  </div>

                  <b>{feature.metric}</b>
                </article>
              ))}
            </div>
          </section>

          <section className="dashboard-panel workspace-panel">
            <div className="dashboard-panel-header">
              <h2>{labels.apiSurface}</h2>

              <span>
                {mouherApiConfig.baseUrl ||
                  labels.needsApi}
              </span>
            </div>

            <div className="module-list">
              {apiRows.map((row) => (
                <article
                  className="workspace-row workspace-row-api"
                  key={row.id}
                >
                  <div>
                    <strong>{row.title}</strong>
                    <span>{row.detail}</span>
                    <code>{row.route}</code>
                  </div>

                  <b>{row.status}</b>
                </article>
              ))}
            </div>
          </section>
        </div>

        <div className="metric-grid">
          <MetricCard
            label={labels.products}
            value={metrics.totalProducts}
          />

          <MetricCard
            label={labels.inventoryValue}
            value={formatCompactAmount(
              metrics.inventoryValue
            )}
          />

          <MetricCard
            label={labels.lowStock}
            value={metrics.lowStockProducts.length}
          />

          <MetricCard
            label={labels.sale}
            value={metrics.saleProducts.length}
          />
        </div>
      </section>
    </div>
  );
}