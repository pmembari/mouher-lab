import { useMemo } from "react";

import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import AppRoutes from "./components/layout/AppRoutes";
import LanguageSwitch from "./components/layout/LanguageSwitch";
import StorefrontOverlays from "./components/layout/StorefrontOverlays";

import { useAnalyticsConsent } from "./hooks/useAnalyticsConsent";
import { useCatalog } from "./hooks/useCatalog";
import { useCart } from "./hooks/useCart";
import { useFreeShippingThreshold } from "./hooks/useFreeShippingThreshold";
import { useHashRoute } from "./hooks/useHashRoute";
import { useLocale } from "./hooks/useLocale";
import { useNewsletter } from "./hooks/useNewsletter";
import { useStorefrontFilters } from "./hooks/useStorefrontFilters";
import { useStorefrontShell } from "./hooks/useStorefrontShell";

const HOMEPAGE_PRODUCT_LIMIT = 30;

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

  const freeShipping =
    useFreeShippingThreshold({
      language,
    });

  const storefrontText = useMemo(
    () => ({
      ...t,
      announcement:
        freeShipping.announcement,
      trust: {
        ...t.trust,
        shipping:
          freeShipping.announcement,
      },
    }),
    [
      t,
      freeShipping.announcement,
    ]
  );

  const catalogState = useCatalog({
    productLabels:
      storefrontText.products,
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
    categoriesLabel:
      storefrontText.categories.all,
    collectionsLabel:
      storefrontText.collections.all,
  });

  const cart = useCart({
    cartLabels: storefrontText.cart,
    checkoutLabels:
      storefrontText.checkout,
    onOpenCart: shell.openCart,
    onProductAdded:
      shell.closeQuickView,
  });

  const routing = useHashRoute({
    products: catalog.products,
    catalogSource: catalog.source,
    isFarsi,
    dashboardLabels:
      storefrontText.dashboard,
    onRouteChange:
      shell.closeTransientUi,
  });

  const analytics =
    useAnalyticsConsent({
      catalogSource: catalog.source,
    });

  const newsletter = useNewsletter({
    thanksMessage:
      storefrontText.newsletter.thanks,
  });

  const homepageProducts = (
    catalog.products || []
  ).slice(0, HOMEPAGE_PRODUCT_LIMIT);

  const homepageCategories = (
    catalog.categories || []
  ).slice(0, 6);

  const homepageCollections = (
    catalog.collections || []
  ).slice(0, 6);

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
        <p>
          {
            storefrontText.announcement
          }
        </p>
      </div>

      <Header
        t={storefrontText}
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
        t={storefrontText}
        language={language}
        isFarsi={isFarsi}
        analytics={analytics}
        shell={shell}
        cart={cart}
        query={filters.query}
        onQueryChange={
          filters.setQuery
        }
        onSearchSubmit={
          handleSearchSubmit
        }
      />

      <AppRoutes
        route={routing.route}
        routedProduct={
          routing.routedProduct
        }
        catalog={catalog}
        catalogState={loadingState}
        language={language}
        t={storefrontText}
        isFarsi={isFarsi}
        addingProductId={
          cart.addingProductId
        }
        addToCart={cart.addToCart}
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
        email={newsletter.email}
        setQuery={filters.setQuery}
        setEmail={
          newsletter.setEmail
        }
        handleNewsletterSubmit={
          newsletter.handleSubmit
        }
      />

      <Footer
        t={storefrontText}
        isFarsi={isFarsi}
      />
    </div>
  );
}
