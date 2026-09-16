import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import AppRoutes from "./components/layout/AppRoutes";
import LanguageSwitch from "./components/layout/LanguageSwitch";
import StorefrontOverlays from "./components/layout/StorefrontOverlays";

import { useAnalyticsConsent } from "./hooks/useAnalyticsConsent";
import { useCatalog } from "./hooks/useCatalog";
import { useCart } from "./hooks/useCart";
import { useHashRoute } from "./hooks/useHashRoute";
import { useLocale } from "./hooks/useLocale";
import { useNewsletter } from "./hooks/useNewsletter";
import { useStorefrontFilters } from "./hooks/useStorefrontFilters";
import { useStorefrontShell } from "./hooks/useStorefrontShell";

export default function App() {
  const locale = useLocale();

  const {
    language,
    t,
    isFarsi,
    direction,
    siteClassName,
    toggleLanguage,
  } = locale;

  const catalogState = useCatalog({
    productLabels: t.products,
  });

  const {
    catalog,
    catalogState: loadingState,
    heroImage,
    sourceLabel,
  } = catalogState;

  const shell = useStorefrontShell();

  const filters = useStorefrontFilters({
    catalog,
    categoriesLabel: t.categories.all,
    collectionsLabel: t.collections.all,
  });

  const cart = useCart({
    cartLabels: t.cart,
    checkoutLabels: t.checkout,
    onOpenCart: shell.openCart,
    onProductAdded: shell.closeQuickView,
  });

  const routing = useHashRoute({
    products: catalog.products,
    catalogSource: catalog.source,
    isFarsi,
    dashboardLabels: t.dashboard,
    onRouteChange: shell.closeTransientUi,
  });

  const analytics = useAnalyticsConsent({
    catalogSource: catalog.source,
  });

  const newsletter = useNewsletter({
    thanksMessage: t.newsletter.thanks,
  });

  function handleSearchSubmit(event) {
    event.preventDefault();

    shell.closeSearch();
    filters.setActiveCategory("all");

    document
      .getElementById("products")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }

  return (
    <div
      className={siteClassName}
      dir={direction}
    >
      <div className="announcement">
        <p>{t.announcement}</p>
      </div>

      <Header
        t={t}
        isFarsi={isFarsi}
        menuOpen={shell.menuOpen}
        cartCount={cart.cartCount}
        onOpenMenu={shell.openMenu}
        onOpenSearch={shell.openSearch}
        onOpenCart={shell.openCart}
      />

      <LanguageSwitch
        language={language}
        isFarsi={isFarsi}
        onToggle={toggleLanguage}
      />

      {cart.cartMessage && (
        <div
          className="cart-toast"
          role="status"
          aria-live="polite"
        >
          {cart.cartMessage}
        </div>
      )}

      <StorefrontOverlays
        t={t}
        language={language}
        isFarsi={isFarsi}
        analytics={analytics}
        shell={shell}
        cart={cart}
        query={filters.query}
        onQueryChange={filters.setQuery}
        onSearchSubmit={handleSearchSubmit}
      />

      <AppRoutes
        route={routing.route}
        routedProduct={routing.routedProduct}
        catalog={catalog}
        catalogState={loadingState}
        language={language}
        t={t}
        isFarsi={isFarsi}
        addingProductId={cart.addingProductId}
        addToCart={cart.addToCart}
        heroImage={heroImage}
        sourceLabel={sourceLabel}
        categoryOptions={filters.categoryOptions}
        collectionOptions={filters.collectionOptions}
        filteredProducts={filters.filteredProducts}
        activeCategory={filters.activeCategory}
        activeCollection={filters.activeCollection}
        email={newsletter.email}
        setActiveCategory={filters.setActiveCategory}
        setActiveCollection={filters.setActiveCollection}
        setQuery={filters.setQuery}
        setEmail={newsletter.setEmail}
        handleNewsletterSubmit={
          newsletter.handleSubmit
        }
      />

      <Footer
        t={t}
        isFarsi={isFarsi}
      />
    </div>
  );
}