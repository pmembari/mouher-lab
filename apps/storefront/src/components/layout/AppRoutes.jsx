import { lazy, Suspense } from "react";

import HomePage from "../../pages/HomePage";

const ProductPage = lazy(
  () => import("../../pages/ProductPage")
);

const ShopPage = lazy(
  () => import("../../pages/ShopPage")
);

const OwnerDashboardPage = lazy(
  () => import("../../pages/OwnerDashboardPage")
);

const DeveloperWorkspacePage = lazy(
  () => import("../../pages/DeveloperWorkspacePage")
);

const WebsiteAssistDashboard = lazy(
  () => import("../../pages/WebsiteAssistDashboard")
);

const AccountWorkspacePage = lazy(() =>
  import("../../pages/AccountWorkspacePage").then(
    (module) => ({
      default: module.AccountWorkspacePage,
    })
  )
);

function RouteFallback({
  isFarsi,
}) {
  return (
    <div className="dashboard-page">
      <section className="dashboard-shell">
        <p>
          {isFarsi
            ? "در حال بارگذاری..."
            : "Loading..."}
        </p>
      </section>
    </div>
  );
}

export default function AppRoutes({
  route,
  routedProduct,

  catalog,
  catalogState,

  language,
  t,
  isFarsi,

  addingProductId,
  addToCart,

  heroImage,
  sourceLabel,

  homepageProducts,
  homepageCategories,
  homepageCollections,

  email,
  setQuery,
  setEmail,
  handleNewsletterSubmit,
}) {
  const isCatalogBrowseRoute =
    route.type === "shop" ||
    route.type === "category" ||
    route.type === "collection" ||
    route.type === "search";

  return (
    <main>
      <Suspense
        fallback={
          <RouteFallback
            isFarsi={isFarsi}
          />
        }
      >
        {route.type === "product" ? (
          <ProductPage
            product={routedProduct}
            catalog={catalog}
            catalogState={catalogState}
            language={language}
            labels={t.productPage}
            cartLabels={{
              ...t.cart,
              outOfStock:
                t.dashboard.outOfStock,
            }}
            onAdd={addToCart}
            isAdding={
              addingProductId ===
              routedProduct?.id
            }
          />
        ) : isCatalogBrowseRoute ? (
          <ShopPage
            route={route}
            catalog={catalog}
            catalogState={catalogState}
            language={language}
            t={t}
            addingProductId={
              addingProductId
            }
            onAddToCart={
              addToCart
            }
          />
        ) : route.type === "owner" ? (
          <OwnerDashboardPage
            catalog={catalog}
            language={language}
            labels={t.dashboard}
          />
        ) : route.type === "developer" ? (
          <DeveloperWorkspacePage
            catalog={catalog}
            language={language}
            labels={t.dashboard}
          />
        ) : route.type === "assist" ? (
          <WebsiteAssistDashboard
            catalog={catalog}
            language={language}
            labels={t.dashboard}
          />
        ) : route.type === "account" ? (
          <AccountWorkspacePage
            language={language}
            labels={t.account}
            dashboardLabels={t.dashboard}
          />
        ) : (
          <HomePage
            catalog={catalog}
            catalogState={catalogState}
            language={language}
            t={t}
            heroImage={heroImage}
            sourceLabel={sourceLabel}
            homepageProducts={
              homepageProducts
            }
            homepageCategories={
              homepageCategories
            }
            homepageCollections={
              homepageCollections
            }
            addingProductId={
              addingProductId
            }
            email={email}
            onSetQuery={setQuery}
            onSetEmail={setEmail}
            onAddToCart={
              addToCart
            }
            onNewsletterSubmit={
              handleNewsletterSubmit
            }
          />
        )}
      </Suspense>
    </main>
  );
}