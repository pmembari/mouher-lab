import { useState } from "react";

import { ArrowRight } from "../components/icons";

import { AnalyticsBars } from "../components/dashboard/AnalyticsBars";
import { AnalyticsFunnel } from "../components/dashboard/AnalyticsFunnel";
import { AnalyticsLine } from "../components/dashboard/AnalyticsLine";
import { MetricCard } from "../components/dashboard/MetricCard";
import { OwnerAnalyticsReport } from "../components/dashboard/OwnerAnalyticsReport";

import { getAnalyticsSummary } from "../lib/analytics";

import {
  loginOwner,
  logoutOwner,
  loadOwnerDashboard,
} from "../lib/ownerApi";

import {
  catalogMetrics,
  formatCompactAmount,
} from "../utils/dashboard";

import {
  productCategoryName,
  productDisplayName,
  productPageHref,
  uniqueProducts,
} from "../utils/product";

export default function OwnerDashboardPage({
  catalog,
  language,
  labels,
}) {
  const isFarsi = language === "farsi";

  const [ownerDashboard, setOwnerDashboard] = useState(null);
  const [ownerLoading, setOwnerLoading] = useState(false);
  const [ownerError, setOwnerError] = useState("");

  const [ownerUser, setOwnerUser] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");

  const [reportRange, setReportRange] = useState(30);
  const [ownerSection, setOwnerSection] = useState("overview");
  const [resourceQuery, setResourceQuery] = useState("");
  const [resourcePage, setResourcePage] = useState(1);

  const dashboardCatalog =
    ownerDashboard?.catalog?.products?.length
      ? ownerDashboard.catalog
      : catalog;

  const metrics = catalogMetrics(dashboardCatalog);
  const analytics = getAnalyticsSummary();

  async function handleAnalyticsLogin(event) {
    event.preventDefault();
    setOwnerError("");

    const email = ownerUser.trim();

    if (!email || !ownerPassword) {
      setOwnerError(
        isFarsi
          ? "ایمیل و رمز عبور مدیر الزامی است."
          : "Admin email and password are required."
      );
      return;
    }

    setOwnerLoading(true);

    try {
      await loginOwner(email, ownerPassword);

      const dashboard = await loadOwnerDashboard(
        undefined,
        reportRange
      );

      setOwnerDashboard(dashboard);

      // Do not retain the administrator password.
      setOwnerPassword("");
    } catch (error) {
      setOwnerDashboard(null);

      setOwnerError(
        error?.message ||
        (isFarsi
          ? "ورود مدیر یا اتصال به سرور ناموفق بود."
          : "Admin login or backend connection failed.")
      );
    } finally {
      setOwnerLoading(false);
    }
  }

  async function handleReportRangeChange(event) {
    const nextRange = Number(event.target.value);

    setReportRange(nextRange);

    if (!ownerDashboard) {
      return;
    }

    setOwnerLoading(true);
    setOwnerError("");

    try {
      setOwnerDashboard(
        await loadOwnerDashboard(
          undefined,
          nextRange
        )
      );
    } catch (error) {
      setOwnerError(
        error?.message ||
        (isFarsi
          ? "گزارش بارگذاری نشد."
          : "The report could not be loaded.")
      );
    } finally {
      setOwnerLoading(false);
    }
  }

  async function handleLogoutOwner(event) {
    event.preventDefault();

    setOwnerLoading(true);
    setOwnerError("");

    try {
      await logoutOwner();
    } catch (error) {
      console.error(
        "Owner logout failed:",
        error
      );
    } finally {
      setOwnerDashboard(null);
      setOwnerUser("");
      setOwnerPassword("");
      setOwnerLoading(false);
    }
  }

  const products = metrics.products || [];

  const serverAnalytics =
    ownerDashboard?.analytics;

  const reportDaily =
    Array.isArray(serverAnalytics?.daily) &&
      serverAnalytics.daily.length
      ? serverAnalytics.daily
      : analytics.daily;

  const reportFunnel = serverAnalytics?.funnel
    ? [
      {
        label: isFarsi
          ? "بازدید محصول"
          : "Product views",
        value:
          serverAnalytics.funnel.product_views || 0,
      },
      {
        label: isFarsi
          ? "افزودن به سبد"
          : "Added to cart",
        value:
          serverAnalytics.funnel.adds || 0,
      },
      {
        label: isFarsi
          ? "شروع پرداخت"
          : "Checkout",
        value:
          serverAnalytics.funnel.checkouts || 0,
      },
      {
        label: isFarsi
          ? "خرید"
          : "Purchase",
        value:
          serverAnalytics.funnel.purchases || 0,
      },
    ]
    : analytics.funnel;

  const recentOrders =
    ownerDashboard?.orders?.data?.slice(0, 5) ??
    [];

  const recentCustomers =
    ownerDashboard?.customers?.data?.slice(0, 5) ??
    [];

  const topProducts =
    ownerDashboard?.products?.data?.slice(0, 6) ??
    products.slice(0, 6);

  const inventoryItems =
    ownerDashboard?.inventory?.data?.slice(0, 8) ??
    [];

  const resourceRows = getOwnerResourceRows(
    ownerSection,
    ownerDashboard,
    dashboardCatalog
  );

  const filteredResourceRows =
    resourceRows.filter((row) =>
      ownerResourceSearchText(row).includes(
        resourceQuery.trim().toLowerCase()
      )
    );

  const resourcePageSize = 8;

  const resourcePageCount = Math.max(
    1,
    Math.ceil(
      filteredResourceRows.length /
      resourcePageSize
    )
  );

  const visibleResourceRows =
    filteredResourceRows.slice(
      (resourcePage - 1) *
      resourcePageSize,
      resourcePage * resourcePageSize
    );

  const ownerCounts = {
    products:
      ownerDashboard?.products?.meta?.count ??
      metrics.totalProducts,

    orders:
      ownerDashboard?.orders?.meta?.count ??
      0,

    customers:
      ownerDashboard?.customers?.meta?.count ??
      0,

    inventory:
      ownerDashboard?.inventory?.meta?.count ??
      products.length,

    stockLocations:
      ownerDashboard?.stockLocations?.meta?.count ??
      0,
  };

  function selectOwnerSection(section) {
    setOwnerSection(section);
    setResourceQuery("");
    setResourcePage(1);
  }

  const outOfStockProducts =
    products.filter((product) => {
      const stock = Number(
        product.stockCount
      );

      return (
        product.inStock === false ||
        stock <= 0
      );
    });

  const criticalStockProducts = products
    .filter((product) => {
      const stock = Number(
        product.stockCount
      );

      return (
        Number.isFinite(stock) &&
        stock > 0 &&
        stock <= 3
      );
    })
    .sort(
      (a, b) =>
        Number(a.stockCount) -
        Number(b.stockCount)
    );

  const lowStockProducts = products
    .filter((product) => {
      const stock = Number(
        product.stockCount
      );

      return (
        Number.isFinite(stock) &&
        stock > 3 &&
        stock <= 8
      );
    })
    .sort(
      (a, b) =>
        Number(a.stockCount) -
        Number(b.stockCount)
    );

  const highestValueProducts = [
    ...products,
  ]
    .filter((product) => {
      const stock = Number(
        product.stockCount
      );

      const price = Number(
        product.priceAmount
      );

      return (
        Number.isFinite(stock) &&
        Number.isFinite(price) &&
        stock > 0
      );
    })
    .sort((a, b) => {
      const aValue =
        Number(a.stockCount) *
        Number(a.priceAmount);

      const bValue =
        Number(b.stockCount) *
        Number(b.priceAmount);

      return bValue - aValue;
    })
    .slice(0, 8);

  const priorityProducts =
    uniqueProducts([
      ...outOfStockProducts,
      ...criticalStockProducts,
      ...lowStockProducts,
      ...metrics.saleProducts,
      ...products,
    ]).slice(0, 12);

  const inventoryHealth =
    products.length
      ? Math.round(
        ((products.length -
          outOfStockProducts.length -
          criticalStockProducts.length) /
          products.length) *
        100
      )
      : 100;

  if (!ownerDashboard && !ownerLoading) {
    return (
      <div className="dashboard-page owner-dashboard-page">
        <section className="dashboard-shell">
          <div className="dashboard-heading">
            <div>
              <span className="eyebrow">
                {labels.ownerEyebrow}
              </span>

              <h1>
                {isFarsi
                  ? "مرکز کنترل موهر"
                  : "Mouher control center"}
              </h1>

              <p>
                {isFarsi
                  ? "برای مشاهده داشبورد، با حساب مدیر Medusa وارد شوید."
                  : "Sign in with your Medusa administrator account to view the dashboard."}
              </p>
            </div>
          </div>

          <form
            className="analytics-owner-access"
            onSubmit={
              handleAnalyticsLogin
            }
          >
            <label htmlFor="owner-email">
              {isFarsi
                ? "ایمیل مدیر"
                : "Admin email"}
            </label>

            <input
              id="owner-email"
              type="email"
              autoComplete="username"
              value={ownerUser}
              onChange={(event) =>
                setOwnerUser(
                  event.target.value
                )
              }
              required
            />

            <label htmlFor="owner-password">
              {isFarsi
                ? "رمز عبور مدیر"
                : "Admin password"}
            </label>

            <input
              id="owner-password"
              type="password"
              autoComplete="current-password"
              value={ownerPassword}
              onChange={(event) =>
                setOwnerPassword(
                  event.target.value
                )
              }
              required
            />

            <button
              className="button button-dark"
              type="submit"
              disabled={ownerLoading}
            >
              {ownerLoading
                ? isFarsi
                  ? "در حال ورود..."
                  : "Signing in..."
                : isFarsi
                  ? "ورود به داشبورد"
                  : "Open dashboard"}
            </button>

            {ownerError && (
              <p role="alert">
                {ownerError}
              </p>
            )}
          </form>
        </section>
      </div>
    );
  }

  if (ownerLoading) {
    return (
      <div className="dashboard-page owner-dashboard-page">
        <section className="dashboard-shell">
          <div className="dashboard-heading">
            <div>
              <span className="eyebrow">
                {labels.ownerEyebrow}
              </span>

              <h1>
                {isFarsi
                  ? "در حال بارگذاری داشبورد"
                  : "Loading dashboard"}
              </h1>

              <p>
                {isFarsi
                  ? "در حال دریافت داده‌های فروش، مشتریان و موجودی..."
                  : "Loading products, orders, customers, and inventory..."}
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="dashboard-page owner-dashboard-page">
      <section className="dashboard-shell">
        <div className="dashboard-heading">
          <div>
            <span className="eyebrow">
              {labels.ownerEyebrow}
            </span>

            <h1>
              {isFarsi
                ? "مرکز کنترل موهر"
                : "Mouher control center"}
            </h1>

            <p>
              {isFarsi
                ? "نمایش وضعیت موجودی، ارزش کالا، محصولات کم‌موجود و هشدارهای عملیاتی."
                : "Monitor inventory health, stock value, low-stock products and operational alerts."}
            </p>
          </div>

          <div className="dashboard-heading-actions">
            <a
              href="#products"
              className="button button-outline"
            >
              {labels.viewStore}
              <ArrowRight />
            </a>

            <a
              href="#/assist"
              className="button button-dark"
            >
              {labels.websiteAssist}
              <ArrowRight />
            </a>

            <button
              type="button"
              className="button button-outline"
              onClick={
                handleLogoutOwner
              }
            >
              {isFarsi
                ? "خروج"
                : "Logout"}
            </button>
          </div>
        </div>

        <nav
          className="owner-section-nav"
          aria-label={
            isFarsi
              ? "بخش‌های مالک"
              : "Owner sections"
          }
        >
          {[
            "overview",
            "products",
            "categories",
            "orders",
            "users",
          ].map((section) => (
            <button
              key={section}
              type="button"
              className={
                ownerSection === section
                  ? "active"
                  : ""
              }
              onClick={() =>
                selectOwnerSection(section)
              }
            >
              {ownerSectionLabel(
                section,
                isFarsi
              )}
            </button>
          ))}
        </nav>

        {ownerSection !== "overview" && (
          <section className="dashboard-panel dashboard-panel-wide owner-resource-panel">
            <div className="dashboard-panel-header">
              <div>
                <h2>
                  {ownerSectionLabel(
                    ownerSection,
                    isFarsi
                  )}
                </h2>

                <span>
                  {
                    filteredResourceRows.length
                  }{" "}
                  {isFarsi
                    ? "رکورد"
                    : "records"}
                </span>
              </div>

              <label className="owner-resource-search">
                <span className="sr-only">
                  {isFarsi
                    ? "جستجو"
                    : "Search"}
                </span>

                <input
                  type="search"
                  value={resourceQuery}
                  onChange={(event) => {
                    setResourceQuery(
                      event.target.value
                    );
                    setResourcePage(1);
                  }}
                  placeholder={
                    isFarsi
                      ? "جستجوی رکوردها"
                      : `Search ${ownerSection}...`
                  }
                />
              </label>
            </div>

            <OwnerResourceTable
              section={ownerSection}
              rows={visibleResourceRows}
              isFarsi={isFarsi}
            />

            <div className="owner-pagination">
              <button
                type="button"
                disabled={
                  resourcePage <= 1
                }
                onClick={() =>
                  setResourcePage(
                    (page) => page - 1
                  )
                }
              >
                {isFarsi
                  ? "قبلی"
                  : "Previous"}
              </button>

              <span>
                {resourcePage} /{" "}
                {resourcePageCount}
              </span>

              <button
                type="button"
                disabled={
                  resourcePage >=
                  resourcePageCount
                }
                onClick={() =>
                  setResourcePage(
                    (page) => page + 1
                  )
                }
              >
                {isFarsi
                  ? "بعدی"
                  : "Next"}
              </button>
            </div>

            <OwnerResourceInsights
              section={ownerSection}
              rows={resourceRows}
              catalog={
                dashboardCatalog
              }
              dashboard={
                ownerDashboard
              }
              isFarsi={isFarsi}
            />
          </section>
        )}

        <div className="owner-kpi-grid">
          <MetricCard
            label={
              isFarsi
                ? "ارزش موجودی"
                : "Inventory value"
            }
            value={formatCompactAmount(
              metrics.inventoryValue
            )}
          />

          <MetricCard
            label={
              isFarsi
                ? "واحد موجود"
                : "Units in stock"
            }
            value={
              metrics.inventoryUnits
            }
          />

          <MetricCard
            label={
              isFarsi
                ? "موجودی بحرانی"
                : "Critical stock"
            }
            value={
              criticalStockProducts.length
            }
          />

          <MetricCard
            label={
              isFarsi
                ? "ناموجود"
                : "Out of stock"
            }
            value={
              outOfStockProducts.length
            }
          />

          <MetricCard
            label={
              isFarsi
                ? "سلامت موجودی"
                : "Inventory health"
            }
            value={`${inventoryHealth}%`}
          />
        </div>

        {ownerSection ===
          "overview" && (
            <section className="dashboard-panel dashboard-panel-wide owner-today-panel">
              <div className="dashboard-panel-header">
                <h2>
                  {isFarsi
                    ? "گزارش عملیاتی امروز"
                    : "Today at a glance"}
                </h2>

                <span>
                  {isFarsi
                    ? "بر پایه داده‌های واقعی API"
                    : "From live API analytics"}
                </span>
              </div>

              <div className="owner-today-grid">
                <MetricCard
                  label={
                    isFarsi
                      ? "بازدیدکننده امروز"
                      : "Today's visitors"
                  }
                  value={
                    serverAnalytics?.visitors ||
                    0
                  }
                />

                <MetricCard
                  label={
                    isFarsi
                      ? "شروع پرداخت بدون خرید"
                      : "Checkout drop-off"
                  }
                  value={Math.max(
                    0,
                    (serverAnalytics?.funnel
                      ?.checkouts || 0) -
                    (serverAnalytics?.funnel
                      ?.purchases || 0)
                  )}
                />

                <MetricCard
                  label={
                    isFarsi
                      ? "محصولات پرفروش/پرتعامل"
                      : "Top products"
                  }
                  value={
                    serverAnalytics
                      ?.top_products?.length ||
                    analytics.topProducts
                      .length
                  }
                />

                <MetricCard
                  label={
                    isFarsi
                      ? "موارد نیازمند توجه"
                      : "Needs attention"
                  }
                  value={
                    outOfStockProducts.length +
                    criticalStockProducts.length
                  }
                />
              </div>
            </section>
          )}

        {ownerSection ===
          "overview" && (
            <section className="dashboard-panel dashboard-panel-wide analytics-panel">
              <div className="dashboard-panel-header">
                <h2>
                  {isFarsi
                    ? "تحلیل رفتار فروشگاه"
                    : "Store analytics"}
                </h2>

                <div className="dashboard-report-controls">
                  <label htmlFor="owner-report-range">
                    {isFarsi
                      ? "گزارش"
                      : "Report"}
                  </label>

                  <select
                    id="owner-report-range"
                    value={reportRange}
                    onChange={
                      handleReportRangeChange
                    }
                  >
                    <option value="7">
                      {isFarsi
                        ? "۷ روز"
                        : "7 days"}
                    </option>

                    <option value="30">
                      {isFarsi
                        ? "۳۰ روز"
                        : "30 days"}
                    </option>

                    <option value="90">
                      {isFarsi
                        ? "۹۰ روز"
                        : "90 days"}
                    </option>
                  </select>

                  <button
                    type="button"
                    className="report-export-button"
                    onClick={() =>
                      exportOwnerReport({
                        reportDaily,
                        reportFunnel,
                        serverAnalytics,
                      })
                    }
                  >
                    {isFarsi
                      ? "خروجی CSV"
                      : "Export CSV"}
                  </button>
                </div>
              </div>

              <div className="analytics-kpi-grid">
                <MetricCard
                  label={
                    isFarsi
                      ? "کلیک محصول"
                      : "Product clicks"
                  }
                  value={
                    analytics.productClicks
                  }
                />

                <MetricCard
                  label={
                    isFarsi
                      ? "افزودن سریع"
                      : "Quick adds"
                  }
                  value={
                    analytics.quickAdds
                  }
                />

                <MetricCard
                  label={
                    isFarsi
                      ? "علاقه‌مندی"
                      : "Wishlists"
                  }
                  value={
                    analytics.wishlists
                  }
                />

                <MetricCard
                  label={
                    isFarsi
                      ? "نرخ تبدیل"
                      : "Click-to-add rate"
                  }
                  value={`${analytics.conversionRate}%`}
                />
              </div>

              <div className="analytics-products">
                <h3>
                  {isFarsi
                    ? "محصولات پربازدید"
                    : "Top engaged products"}
                </h3>

                {analytics.topProducts
                  .length ? (
                  analytics.topProducts.map(
                    (product) => (
                      <div
                        className="analytics-product-row"
                        key={product.id}
                      >
                        <strong>
                          {product.name}
                        </strong>

                        <span>
                          {product.clicks}{" "}
                          {isFarsi
                            ? "کلیک"
                            : "clicks"}
                        </span>

                        <span>
                          {
                            product.quickAdds
                          }{" "}
                          {isFarsi
                            ? "افزودن"
                            : "adds"}
                        </span>

                        <span>
                          {
                            product.wishlists
                          }{" "}
                          {isFarsi
                            ? "علاقه‌مندی"
                            : "wishlists"}
                        </span>
                      </div>
                    )
                  )
                ) : (
                  <p className="analytics-empty">
                    {isFarsi
                      ? "پس از تعامل بازدیدکنندگان، داده‌ها اینجا نمایش داده می‌شوند."
                      : "Analytics will appear after visitors interact with products."}
                  </p>
                )}
              </div>

              <div className="analytics-report-grid">
                <OwnerAnalyticsReport
                  title={
                    isFarsi
                      ? "پرفروش‌ترین محصولات"
                      : "Top sold products"
                  }
                  rows={
                    serverAnalytics
                      ?.top_sold_products ||
                    []
                  }
                  valueKey="sold_units"
                  valueLabel={
                    isFarsi
                      ? "فروش"
                      : "sold"
                  }
                  isFarsi={isFarsi}
                />

                <OwnerAnalyticsReport
                  title={
                    isFarsi
                      ? "محبوب‌ترین علاقه‌مندی‌ها"
                      : "Top wishlisted products"
                  }
                  rows={
                    serverAnalytics
                      ?.top_wishlisted_products ||
                    []
                  }
                  valueKey="wishlists"
                  valueLabel={
                    isFarsi
                      ? "علاقه‌مندی"
                      : "wishlists"
                  }
                  isFarsi={isFarsi}
                />
              </div>

              <div className="analytics-visual-grid">
                <section className="analytics-chart">
                  <h3>
                    {isFarsi
                      ? "روند تعامل"
                      : "Engagement trend"}
                  </h3>

                  <AnalyticsLine
                    data={reportDaily.map(
                      (row) => ({
                        label: (
                          row.date || ""
                        ).slice(5),

                        value:
                          row.events ??
                          row.total,
                      })
                    )}
                  />
                </section>

                <AnalyticsFunnel
                  title={
                    isFarsi
                      ? "قیف خرید"
                      : "Commerce funnel"
                  }
                  rows={reportFunnel}
                />
              </div>

              {serverAnalytics && (
                <div className="analytics-visual-grid">
                  <section className="analytics-chart">
                    <h3>
                      {isFarsi
                        ? "موقعیت بازدیدکنندگان"
                        : "Visitor locations"}
                    </h3>

                    <AnalyticsBars
                      data={(
                        serverAnalytics.locations ||
                        []
                      )
                        .slice(0, 8)
                        .map((row) => ({
                          label: [
                            row.city,
                            row.country_code,
                          ]
                            .filter(Boolean)
                            .join(", "),

                          value:
                            row.visitors,
                        }))}
                    />
                  </section>

                  <section className="analytics-chart">
                    <h3>
                      {isFarsi
                        ? "نوع دستگاه"
                        : "Device mix"}
                    </h3>

                    <AnalyticsBars
                      data={(
                        serverAnalytics.devices ||
                        []
                      ).map((row) => ({
                        label:
                          row.device_type,

                        value:
                          row.events,
                      }))}
                    />
                  </section>

                  <p className="analytics-account-summary">
                    {serverAnalytics.account_visitors ||
                      0}{" "}
                    {isFarsi
                      ? "بازدیدکننده واردشده"
                      : "signed-in visitors"}{" "}
                    ·{" "}
                    {serverAnalytics.visitors ||
                      0}{" "}
                    {isFarsi
                      ? "بازدیدکننده کل"
                      : "total visitors"}
                  </p>
                </div>
              )}
            </section>
          )}

        {ownerSection ===
          "overview" && (
            <section className="dashboard-panel dashboard-panel-wide owner-alert-panel">
              <div className="dashboard-panel-header">
                <h2>
                  {isFarsi
                    ? "هشدارهای کسب‌وکار"
                    : "Business alerts"}
                </h2>

                <span>
                  {
                    dashboardCatalog.source
                  }
                </span>
              </div>

              <div className="owner-alert-grid">
                <article
                  className={`owner-alert ${outOfStockProducts.length
                      ? "owner-alert-danger"
                      : ""
                    }`}
                >
                  <strong>
                    {
                      outOfStockProducts.length
                    }
                  </strong>

                  <span>
                    {isFarsi
                      ? "محصول ناموجود"
                      : "products out of stock"}
                  </span>
                </article>

                <article
                  className={`owner-alert ${criticalStockProducts.length
                      ? "owner-alert-danger"
                      : ""
                    }`}
                >
                  <strong>
                    {
                      criticalStockProducts.length
                    }
                  </strong>

                  <span>
                    {isFarsi
                      ? "موجودی بحرانی"
                      : "critical stock products"}
                  </span>
                </article>

                <article
                  className={`owner-alert ${lowStockProducts.length
                      ? "owner-alert-warning"
                      : ""
                    }`}
                >
                  <strong>
                    {
                      lowStockProducts.length
                    }
                  </strong>

                  <span>
                    {isFarsi
                      ? "محصول کم‌موجود"
                      : "low-stock products"}
                  </span>
                </article>

                <article className="owner-alert">
                  <strong>
                    {
                      metrics.saleProducts
                        .length
                    }
                  </strong>

                  <span>
                    {isFarsi
                      ? "محصول تخفیف‌دار"
                      : "products on sale"}
                  </span>
                </article>
              </div>
            </section>
          )}

        {ownerSection ===
          "overview" && (
            <section className="dashboard-panel dashboard-panel-wide">
              <div className="dashboard-panel-header">
                <h2>
                  {isFarsi
                    ? "داده زنده بک‌اند"
                    : "Live backend data"}
                </h2>

                <span>
                  {ownerDashboard
                    ? isFarsi
                      ? "متصل"
                      : "Connected"
                    : isFarsi
                      ? "وارد نشده"
                      : "Not signed in"}
                </span>
              </div>

              <div className="owner-alert-grid">
                <article className="owner-alert">
                  <strong>
                    {ownerCounts.products}
                  </strong>
                  <span>
                    {isFarsi
                      ? "محصول"
                      : "products"}
                  </span>
                </article>

                <article className="owner-alert">
                  <strong>
                    {ownerCounts.orders}
                  </strong>
                  <span>
                    {isFarsi
                      ? "سفارش"
                      : "orders"}
                  </span>
                </article>

                <article className="owner-alert">
                  <strong>
                    {ownerCounts.customers}
                  </strong>
                  <span>
                    {isFarsi
                      ? "مشتری"
                      : "customers"}
                  </span>
                </article>

                <article className="owner-alert">
                  <strong>
                    {ownerCounts.inventory}
                  </strong>
                  <span>
                    {isFarsi
                      ? "آیتم موجودی"
                      : "inventory items"}
                  </span>
                </article>

                <article className="owner-alert">
                  <strong>
                    {
                      ownerCounts.stockLocations
                    }
                  </strong>
                  <span>
                    {isFarsi
                      ? "مکان انبار"
                      : "stock locations"}
                  </span>
                </article>
              </div>
            </section>
          )}

        {ownerSection ===
          "overview" && (
            <div className="owner-dashboard-grid">
              <section className="dashboard-panel">
                <div className="dashboard-panel-header">
                  <h2>
                    {isFarsi
                      ? "سفارش‌های اخیر"
                      : "Recent orders"}
                  </h2>

                  <span>
                    {
                      recentOrders.length
                    }
                  </span>
                </div>

                <div className="dashboard-table-wrap">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>
                          {isFarsi
                            ? "سفارش"
                            : "Order"}
                        </th>

                        <th>
                          {isFarsi
                            ? "وضعیت"
                            : "Status"}
                        </th>

                        <th>
                          {isFarsi
                            ? "مبلغ"
                            : "Total"}
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {recentOrders.length ? (
                        recentOrders.map(
                          (order) => (
                            <tr
                              key={
                                order.id ||
                                order.display_id
                              }
                            >
                              <td>
                                {order.display_id ||
                                  order.id}
                              </td>

                              <td>
                                {order.fulfillment_status ||
                                  order.status ||
                                  "—"}
                              </td>

                              <td>
                                {order.total ??
                                  order.total_paid ??
                                  "—"}
                              </td>
                            </tr>
                          )
                        )
                      ) : (
                        <tr>
                          <td colSpan="3">
                            {isFarsi
                              ? "هیچ سفارشی ثبت نشده است."
                              : "No recent orders."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="dashboard-panel">
                <div className="dashboard-panel-header">
                  <h2>
                    {isFarsi
                      ? "مشتریان اخیر"
                      : "Recent customers"}
                  </h2>

                  <span>
                    {
                      recentCustomers.length
                    }
                  </span>
                </div>

                <div className="dashboard-table-wrap">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>
                          {isFarsi
                            ? "مشتری"
                            : "Customer"}
                        </th>

                        <th>
                          {isFarsi
                            ? "ایمیل"
                            : "Email"}
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {recentCustomers.length ? (
                        recentCustomers.map(
                          (customer) => (
                            <tr
                              key={
                                customer.id ||
                                customer.email
                              }
                            >
                              <td>
                                {customer.first_name ||
                                  customer.last_name
                                  ? `${customer.first_name || ""} ${customer.last_name || ""}`.trim()
                                  : customer.id}
                              </td>

                              <td>
                                {customer.email ||
                                  "—"}
                              </td>
                            </tr>
                          )
                        )
                      ) : (
                        <tr>
                          <td colSpan="2">
                            {isFarsi
                              ? "هیچ مشتری جدیدی وجود ندارد."
                              : "No recent customers."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

        {ownerSection ===
          "overview" && (
            <section className="dashboard-panel dashboard-panel-wide">
              <div className="dashboard-panel-header">
                <h2>
                  {isFarsi
                    ? "محصولات مهم"
                    : "Key products"}
                </h2>

                <span>
                  {topProducts.length}
                </span>
              </div>

              <div className="dashboard-table-wrap">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>
                        {labels.name}
                      </th>

                      <th>
                        {isFarsi
                          ? "موجودی"
                          : "Stock"}
                      </th>

                      <th>
                        {labels.price}
                      </th>

                      <th>
                        {isFarsi
                          ? "وضعیت"
                          : "State"}
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {topProducts.length ? (
                      topProducts.map(
                        (product) => {
                          const stock =
                            Number(
                              product.stockCount ??
                              product.quantity ??
                              0
                            );

                          const status =
                            stock <= 0
                              ? isFarsi
                                ? "ناموجود"
                                : "Out of stock"
                              : stock <= 5
                                ? isFarsi
                                  ? "کم‌موجود"
                                  : "Low stock"
                                : isFarsi
                                  ? "موجود"
                                  : "In stock";

                          return (
                            <tr
                              key={
                                product.id ||
                                product.handle ||
                                product.title ||
                                product.name
                              }
                            >
                              <td>
                                {product.name ||
                                  product.title ||
                                  product.id}
                              </td>

                              <td>
                                {stock}
                              </td>

                              <td>
                                {product.price ||
                                  "—"}
                              </td>

                              <td>
                                {status}
                              </td>
                            </tr>
                          );
                        }
                      )
                    ) : (
                      <tr>
                        <td colSpan="4">
                          {isFarsi
                            ? "هیچ محصولی برای نمایش وجود ندارد."
                            : "No products available."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

        {ownerSection ===
          "overview" && (
            <section className="dashboard-panel dashboard-panel-wide">
              <div className="dashboard-panel-header">
                <h2>
                  {isFarsi
                    ? "موجودی انبار"
                    : "Inventory overview"}
                </h2>

                <span>
                  {inventoryItems.length}
                </span>
              </div>

              <div className="dashboard-table-wrap">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>SKU</th>

                      <th>
                        {isFarsi
                          ? "موجودی"
                          : "Quantity"}
                      </th>

                      <th>
                        {isFarsi
                          ? "مکان"
                          : "Location"}
                      </th>

                      <th>
                        {isFarsi
                          ? "وضعیت"
                          : "Status"}
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {inventoryItems.length ? (
                      inventoryItems.map(
                        (item) => {
                          const stock =
                            Number(
                              item.quantity ??
                              item.stock ??
                              item.available_quantity ??
                              0
                            );

                          const status =
                            stock <= 0
                              ? isFarsi
                                ? "ناموجود"
                                : "Empty"
                              : stock <= 5
                                ? isFarsi
                                  ? "هشدار"
                                  : "Warning"
                                : isFarsi
                                  ? "سالم"
                                  : "Healthy";

                          return (
                            <tr
                              key={
                                item.id ||
                                item.sku
                              }
                            >
                              <td>
                                {item.sku ||
                                  item.id ||
                                  "—"}
                              </td>

                              <td>
                                {stock}
                              </td>

                              <td>
                                {item.location_name ||
                                  item.location_id ||
                                  item.location ||
                                  "—"}
                              </td>

                              <td>
                                {status}
                              </td>
                            </tr>
                          );
                        }
                      )
                    ) : (
                      <tr>
                        <td colSpan="4">
                          {isFarsi
                            ? "داده‌ای برای موجودی انبار وجود ندارد."
                            : "No inventory data available."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

        {ownerSection ===
          "overview" && (
            <div className="owner-dashboard-grid">
              <section className="dashboard-panel">
                <div className="dashboard-panel-header">
                  <h2>
                    {isFarsi
                      ? "موجودی نیازمند توجه"
                      : "Inventory requiring attention"}
                  </h2>

                  <span>
                    {
                      priorityProducts.length
                    }
                  </span>
                </div>

                <div className="dashboard-table-wrap">
                  <table className="dashboard-table owner-inventory-table">
                    <thead>
                      <tr>
                        <th>
                          {labels.name}
                        </th>

                        <th>
                          {isFarsi
                            ? "موجودی"
                            : "Stock"}
                        </th>

                        <th>
                          {labels.price}
                        </th>

                        <th>
                          {isFarsi
                            ? "ارزش موجودی"
                            : "Stock value"}
                        </th>

                        <th>
                          {labels.status}
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {priorityProducts.map(
                        (product) => {
                          const stock =
                            Number(
                              product.stockCount
                            ) || 0;

                          const price =
                            Number(
                              product.priceAmount
                            ) || 0;

                          const stockValue =
                            stock * price;

                          let stockStatus =
                            isFarsi
                              ? "سالم"
                              : "Healthy";

                          if (
                            product.inStock ===
                            false ||
                            stock <= 0
                          ) {
                            stockStatus =
                              isFarsi
                                ? "ناموجود"
                                : "Out";
                          } else if (
                            stock <= 3
                          ) {
                            stockStatus =
                              isFarsi
                                ? "بحرانی"
                                : "Critical";
                          } else if (
                            stock <= 8
                          ) {
                            stockStatus =
                              isFarsi
                                ? "کم"
                                : "Low";
                          }

                          return (
                            <tr
                              key={product.id}
                            >
                              <td>
                                <a
                                  href={productPageHref(
                                    product
                                  )}
                                >
                                  {productDisplayName(
                                    product,
                                    isFarsi
                                  )}
                                </a>

                                <span>
                                  {productCategoryName(
                                    product,
                                    isFarsi
                                  )}
                                </span>
                              </td>

                              <td>
                                {stock}
                              </td>

                              <td>
                                {product.price}
                              </td>

                              <td>
                                {formatCompactAmount(
                                  stockValue
                                )}
                              </td>

                              <td>
                                <span
                                  className={`inventory-status inventory-status-${stockStatus
                                    .toLowerCase()
                                    .replace(
                                      /\s+/g,
                                      "-"
                                    )}`}
                                >
                                  {
                                    stockStatus
                                  }
                                </span>
                              </td>
                            </tr>
                          );
                        }
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <aside className="dashboard-panel">
                <div className="dashboard-panel-header">
                  <h2>
                    {isFarsi
                      ? "ارزش موجودی بالا"
                      : "Highest inventory value"}
                  </h2>
                </div>

                <div className="owner-value-list">
                  {highestValueProducts.map(
                    (product) => {
                      const value =
                        Number(
                          product.stockCount
                        ) *
                        Number(
                          product.priceAmount
                        );

                      return (
                        <a
                          href={productPageHref(
                            product
                          )}
                          key={product.id}
                          className="owner-value-row"
                        >
                          <div>
                            <strong>
                              {productDisplayName(
                                product,
                                isFarsi
                              )}
                            </strong>

                            <span>
                              {
                                product.stockCount
                              }{" "}
                              {isFarsi
                                ? "عدد"
                                : "units"}
                            </span>
                          </div>

                          <b>
                            {formatCompactAmount(
                              value
                            )}
                          </b>
                        </a>
                      );
                    }
                  )}
                </div>
              </aside>
            </div>
          )}

        {ownerSection ===
          "overview" && (
            <section className="dashboard-panel dashboard-panel-wide">
              <div className="dashboard-panel-header">
                <h2>
                  {labels.categoryMix}
                </h2>
              </div>

              <div className="category-mix">
                {(
                  dashboardCatalog.categories ||
                  []
                ).map((category) => (
                  <div
                    key={
                      category.slug
                    }
                  >
                    <span>
                      {isFarsi
                        ? category.nameFa
                        : category.name}
                    </span>

                    <strong>
                      {category.count}
                    </strong>
                  </div>
                ))}
              </div>
            </section>
          )}
      </section>
    </div>
  );
}

function ownerSectionLabel(
  section,
  isFarsi
) {
  const sectionLabels = {
    overview: isFarsi
      ? "نمای کلی"
      : "Overview",

    products: isFarsi
      ? "محصولات"
      : "Products",

    categories: isFarsi
      ? "دسته‌بندی‌ها"
      : "Categories",

    orders: isFarsi
      ? "سفارش‌ها"
      : "Orders",

    users: isFarsi
      ? "کاربران"
      : "Users",
  };

  return (
    sectionLabels[section] ||
    sectionLabels.overview
  );
}

function getOwnerResourceRows(
  section,
  dashboard,
  catalog
) {
  if (section === "products") {
    return dashboard?.products?.data || [];
  }

  if (section === "orders") {
    return dashboard?.orders?.data || [];
  }

  if (section === "users") {
    return dashboard?.customers?.data || [];
  }

  if (section === "categories") {
    return catalog?.categories || [];
  }

  return [];
}

function ownerResourceSearchText(row) {
  return Object.values(row || {})
    .filter((value) =>
      ["string", "number"].includes(
        typeof value
      )
    )
    .join(" ")
    .toLowerCase();
}

function OwnerResourceTable({
  section,
  rows,
  isFarsi,
}) {
  if (section === "categories") {
    return (
      <div className="dashboard-table-wrap">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>
                {isFarsi
                  ? "دسته‌بندی"
                  : "Category"}
              </th>

              <th>
                {isFarsi
                  ? "شناسه"
                  : "Slug"}
              </th>

              <th>
                {isFarsi
                  ? "تعداد محصول"
                  : "Products"}
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.length ? (
              rows.map((row) => (
                <tr
                  key={
                    row.slug ||
                    row.name
                  }
                >
                  <td>
                    {isFarsi
                      ? row.nameFa ||
                      row.name
                      : row.name}
                  </td>

                  <td>
                    {row.slug || "-"}
                  </td>

                  <td>
                    {row.count || 0}
                  </td>
                </tr>
              ))
            ) : (
              <OwnerEmptyRow
                colSpan="3"
                isFarsi={isFarsi}
              />
            )}
          </tbody>
        </table>
      </div>
    );
  }

  const columns =
    section === "products"
      ? [
        [
          isFarsi
            ? "محصول"
            : "Product",

          (row) =>
            row.title ||
            row.name ||
            row.id,
        ],
        [
          isFarsi
            ? "وضعیت"
            : "Status",

          (row) =>
            row.status || "-",
        ],
        [
          isFarsi
            ? "دسته"
            : "Category",

          (row) =>
            row.category ||
            row.collection ||
            "-",
        ],
        [
          isFarsi
            ? "به‌روزرسانی"
            : "Updated",

          (row) =>
            row.updated_at ||
            row.created_at ||
            "-",
        ],
      ]
      : section === "orders"
        ? [
          [
            isFarsi
              ? "سفارش"
              : "Order",

            (row) =>
              row.display_id ||
              row.id,
          ],
          [
            isFarsi
              ? "وضعیت"
              : "Status",

            (row) =>
              row.status ||
              row.fulfillment_status ||
              "-",
          ],
          [
            isFarsi
              ? "مبلغ"
              : "Total",

            (row) =>
              row.total ??
              row.total_paid ??
              "-",
          ],
          [
            isFarsi
              ? "تاریخ"
              : "Date",

            (row) =>
              row.created_at ||
              "-",
          ],
        ]
        : [
          [
            isFarsi
              ? "کاربر"
              : "User",

            (row) =>
              `${row.first_name || ""} ${row.last_name || ""}`.trim() ||
              row.id,
          ],
          [
            isFarsi
              ? "ایمیل"
              : "Email",

            (row) =>
              row.email || "-",
          ],
          [
            isFarsi
              ? "گروه"
              : "Group",

            (row) =>
              row.groups?.join?.(
                ", "
              ) || "Customer",
          ],
          [
            isFarsi
              ? "تاریخ"
              : "Created",

            (row) =>
              row.created_at ||
              "-",
          ],
        ];

  return (
    <div className="dashboard-table-wrap">
      <table className="dashboard-table">
        <thead>
          <tr>
            {columns.map(
              ([label]) => (
                <th key={label}>
                  {label}
                </th>
              )
            )}
          </tr>
        </thead>

        <tbody>
          {rows.length ? (
            rows.map(
              (row, index) => (
                <tr
                  key={
                    row.id || index
                  }
                >
                  {columns.map(
                    ([
                      label,
                      value,
                    ]) => (
                      <td
                        key={
                          label
                        }
                      >
                        {
                          value(
                            row
                          )
                        }
                      </td>
                    )
                  )}
                </tr>
              )
            )
          ) : (
            <OwnerEmptyRow
              colSpan={String(
                columns.length
              )}
              isFarsi={isFarsi}
            />
          )}
        </tbody>
      </table>
    </div>
  );
}

function OwnerEmptyRow({
  colSpan,
  isFarsi,
}) {
  return (
    <tr>
      <td colSpan={colSpan}>
        {isFarsi
          ? "داده‌ای برای نمایش وجود ندارد."
          : "No data available."}
      </td>
    </tr>
  );
}

function OwnerResourceInsights({
  section,
  rows,
  catalog,
  dashboard,
  isFarsi,
}) {
  const products =
    catalog?.products || [];

  const inventory =
    dashboard?.inventory?.data || [];

  const orders =
    section === "orders"
      ? rows
      : dashboard?.orders?.data ||
      [];

  const customers =
    section === "users"
      ? rows
      : dashboard?.customers?.data ||
      [];

  const orderStatuses =
    Object.entries(
      orders.reduce(
        (result, order) => {
          const status =
            order.status ||
            order.fulfillment_status ||
            "unknown";

          result[status] =
            (result[status] || 0) +
            1;

          return result;
        },
        {}
      )
    ).map(([label, value]) => ({
      label,
      value,
    }));

  const categoryRows = (
    catalog?.categories || []
  ).map((category) => ({
    label: isFarsi
      ? category.nameFa ||
      category.name
      : category.name,

    value: category.count || 0,
  }));

  const productAttention =
    products.filter(
      (product) =>
        Number(
          product.stockCount
        ) <= 5
    ).length;

  const saleProducts =
    products.filter(
      (product) =>
        Number(
          product.compareAtAmount
        ) >
        Number(
          product.priceAmount
        )
    ).length;

  const totalOrderValue =
    orders.reduce(
      (total, order) =>
        total +
        (Number(order.total) ||
          Number(
            order.total_paid
          ) ||
          0),
      0
    );

  const repeatCustomers =
    customers.filter(
      (customer) =>
        Number(
          customer.orders_count ||
          customer.order_count ||
          0
        ) > 1
    ).length;

  return (
    <div className="owner-resource-insights">
      <div className="owner-today-grid">
        {section ===
          "products" && (
            <>
              <MetricCard
                label={
                  isFarsi
                    ? "محصولات کم‌موجود"
                    : "Low-stock products"
                }
                value={
                  productAttention
                }
              />

              <MetricCard
                label={
                  isFarsi
                    ? "محصولات تخفیف‌دار"
                    : "Sale products"
                }
                value={
                  saleProducts
                }
              />

              <MetricCard
                label={
                  isFarsi
                    ? "آیتم‌های انبار"
                    : "Inventory items"
                }
                value={
                  inventory.length
                }
              />

              <MetricCard
                label={
                  isFarsi
                    ? "ارزش کاتالوگ"
                    : "Catalog value"
                }
                value={formatCompactAmount(
                  products.reduce(
                    (
                      total,
                      product
                    ) =>
                      total +
                      (Number(
                        product.priceAmount
                      ) || 0),
                    0
                  )
                )}
              />
            </>
          )}

        {section ===
          "categories" && (
            <>
              <MetricCard
                label={
                  isFarsi
                    ? "دسته‌ها"
                    : "Categories"
                }
                value={
                  categoryRows.length
                }
              />

              <MetricCard
                label={
                  isFarsi
                    ? "محصولات دسته‌بندی‌شده"
                    : "Categorized products"
                }
                value={categoryRows.reduce(
                  (total, row) =>
                    total +
                    row.value,
                  0
                )}
              />

              <MetricCard
                label={
                  isFarsi
                    ? "دسته‌های فعال"
                    : "Active categories"
                }
                value={
                  categoryRows.filter(
                    (row) =>
                      row.value > 0
                  ).length
                }
              />

              <MetricCard
                label={
                  isFarsi
                    ? "محصول بدون دسته"
                    : "Uncategorized"
                }
                value={Math.max(
                  0,
                  products.length -
                  categoryRows.reduce(
                    (
                      total,
                      row
                    ) =>
                      total +
                      row.value,
                    0
                  )
                )}
              />
            </>
          )}

        {section ===
          "orders" && (
            <>
              <MetricCard
                label={
                  isFarsi
                    ? "سفارش‌ها"
                    : "Orders"
                }
                value={orders.length}
              />

              <MetricCard
                label={
                  isFarsi
                    ? "ارزش سفارش‌ها"
                    : "Order value"
                }
                value={formatCompactAmount(
                  totalOrderValue
                )}
              />

              <MetricCard
                label={
                  isFarsi
                    ? "وضعیت‌ها"
                    : "Statuses"
                }
                value={
                  orderStatuses.length
                }
              />
            </>
          )}

        {section ===
          "users" && (
            <>
              <MetricCard
                label={
                  isFarsi
                    ? "مشتری‌ها"
                    : "Customers"
                }
                value={
                  customers.length
                }
              />

              <MetricCard
                label={
                  isFarsi
                    ? "مشتری تکراری"
                    : "Repeat customers"
                }
                value={
                  repeatCustomers
                }
              />

              <MetricCard
                label={
                  isFarsi
                    ? "ایمیل ثبت‌شده"
                    : "With email"
                }
                value={
                  customers.filter(
                    (customer) =>
                      customer.email
                  ).length
                }
              />
            </>
          )}
      </div>

      {section ===
        "categories" && (
          <section className="analytics-chart">
            <h3>
              {isFarsi
                ? "ترکیب دسته‌ها"
                : "Category mix"}
            </h3>

            <AnalyticsBars
              data={categoryRows}
            />
          </section>
        )}

      {section === "orders" && (
        <section className="analytics-chart">
          <h3>
            {isFarsi
              ? "توزیع وضعیت سفارش‌ها"
              : "Order status distribution"}
          </h3>

          <AnalyticsBars
            data={orderStatuses}
          />
        </section>
      )}
    </div>
  );
}

function exportOwnerReport({
  reportDaily,
  reportFunnel,
  serverAnalytics,
}) {
  const rows = [
    ["Metric", "Value"],

    ...reportFunnel.map(
      (row) => [
        row.label,
        row.value,
      ]
    ),

    [
      "Visitors",
      serverAnalytics?.visitors ||
      0,
    ],

    [
      "Events",
      serverAnalytics?.events ||
      0,
    ],

    [],

    ["Date", "Events"],

    ...reportDaily.map(
      (row) => [
        row.date,
        row.events ??
        row.total ??
        0,
      ]
    ),
  ];

  const csv = rows
    .map((row) =>
      row
        .map(
          (value) =>
            `"${String(
              value ?? ""
            ).replaceAll(
              '"',
              '""'
            )}"`
        )
        .join(",")
    )
    .join("\n");

  const blob = new Blob(
    [csv],
    {
      type: "text/csv;charset=utf-8",
    }
  );

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;

  link.download =
    "mouher-owner-report.csv";

  link.click();

  URL.revokeObjectURL(url);
}