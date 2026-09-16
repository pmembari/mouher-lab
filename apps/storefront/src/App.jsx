import {
  lazy,
  Suspense,
  useState,
} from "react";

import AnalyticsConsent from "./components/layout/AnalyticsConsent";
import Footer from "./components/layout/Footer";
import Header from "./components/layout/Header";
import MobileMenu from "./components/layout/MobileMenu";
import SearchOverlay from "./components/layout/SearchOverlay";

import CartDrawer from "./components/storefront/CartDrawer";
import QuickView from "./components/storefront/QuickView";

import HomePage from "./pages/HomePage";

import { content } from "./content/siteContent";

import {
  getAnalyticsConsent,
  setAnalyticsConsent,
  trackEvent,
} from "./lib/analytics";

import { useCatalog } from "./hooks/useCatalog";
import { useCart } from "./hooks/useCart";
import { useHashRoute } from "./hooks/useHashRoute";
import { useStorefrontFilters } from "./hooks/useStorefrontFilters";
import { useStorefrontShell } from "./hooks/useStorefrontShell";

const ProductPage = lazy(
  () => import("./pages/ProductPage")
);

const OwnerDashboardPage = lazy(
  () => import("./pages/OwnerDashboardPage")
);

const DeveloperWorkspacePage = lazy(
  () => import("./pages/DeveloperWorkspacePage")
);

const WebsiteAssistDashboard = lazy(
  () => import("./pages/WebsiteAssistDashboard")
);

const AccountWorkspacePage = lazy(() =>
  import("./pages/AccountWorkspacePage").then((module) => ({
    default: module.AccountWorkspacePage,
  }))
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

export default function App() {
  const [language, setLanguage] =
    useState("pinglish");

  const [email, setEmail] =
    useState("");

  const [
    analyticsConsent,
    setAnalyticsConsentState,
  ] = useState(() =>
    getAnalyticsConsent()
  );

  const t = content[language];
  const isFarsi =
    language === "farsi";

  const {
    catalog,
    catalogState,
    heroImage,
    sourceLabel,
  } = useCatalog({
    productLabels: t.products,
  });

  const shell =
    useStorefrontShell();

  const {
    activeCategory,
    setActiveCategory,
    activeCollection,
    setActiveCollection,
    query,
    setQuery,
    categoryOptions,
    collectionOptions,
    filteredProducts,
  } = useStorefrontFilters({
    catalog,
    categoriesLabel:
      t.categories.all,
    collectionsLabel:
      t.collections.all,
  });

  const {
    cartItems,
    cartMessage,
    cartCount,
    addingProductId,
    addToCart,
    increaseCartItem,
    decreaseCartItem,
    removeCartItem,
    beginCheckout,
  } = useCart({
    cartLabels: t.cart,
    checkoutLabels:
      t.checkout,
    onOpenCart:
      shell.openCart,
    onProductAdded:
      shell.closeQuickView,
  });

  const {
    route,
    routedProduct,
  } = useHashRoute({
    products:
      catalog.products,
    catalogSource:
      catalog.source,
    isFarsi,
    dashboardLabels:
      t.dashboard,
    onRouteChange:
      shell.closeTransientUi,
  });

  function handleNewsletterSubmit(
    event
  ) {
    event.preventDefault();

    if (!email.trim()) {
      return;
    }

    alert(
      t.newsletter.thanks
    );

    setEmail("");
  }

  function handleSearchSubmit(
    event
  ) {
    event.preventDefault();

    shell.closeSearch();

    setActiveCategory(
      "all"
    );

    document
      .getElementById(
        "products"
      )
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }

  return (
    <div
      className={`site ${isFarsi
          ? "site-farsi"
          : ""
        }`}
      dir={
        isFarsi
          ? "rtl"
          : "ltr"
      }
    >
      <div className="announcement">
        <p>
          {t.announcement}
        </p>
      </div>

      <Header
        t={t}
        isFarsi={isFarsi}
        menuOpen={
          shell.menuOpen
        }
        cartCount={
          cartCount
        }
        onOpenMenu={
          shell.openMenu
        }
        onOpenSearch={
          shell.openSearch
        }
        onOpenCart={
          shell.openCart
        }
      />

      <button
        type="button"
        className="language-indicator"
        onClick={() =>
          setLanguage(
            (current) =>
              current ===
                "pinglish"
                ? "farsi"
                : "pinglish"
          )
        }
        aria-label={
          isFarsi
            ? "Switch to Pinglish"
            : "تغییر زبان به فارسی"
        }
      >
        <span
          className={
            language ===
              "pinglish"
              ? "active"
              : ""
          }
        >
          EN
        </span>

        <span
          className="language-dot"
          aria-hidden="true"
        >
          /
        </span>

        <span
          className={
            language ===
              "farsi"
              ? "active"
              : ""
          }
        >
          فا
        </span>
      </button>

      {cartMessage && (
        <div
          className="cart-toast"
          role="status"
          aria-live="polite"
        >
          {cartMessage}
        </div>
      )}

      <AnalyticsConsent
        visible={
          analyticsConsent ===
          "unknown"
        }
        isFarsi={isFarsi}
        onDecline={() => {
          setAnalyticsConsent(
            false
          );

          setAnalyticsConsentState(
            "denied"
          );
        }}
        onAccept={() => {
          setAnalyticsConsent(
            true
          );

          setAnalyticsConsentState(
            "granted"
          );

          trackEvent(
            "page_view",
            {
              source:
                catalog.source,
            }
          );
        }}
      />

      <CartDrawer
        open={
          shell.cartOpen
        }
        items={
          cartItems
        }
        labels={
          t.cart
        }
        checkoutLabels={
          t.checkout
        }
        language={
          language
        }
        onClose={
          shell.closeCart
        }
        onCheckout={
          beginCheckout
        }
        onIncrease={
          increaseCartItem
        }
        onDecrease={
          decreaseCartItem
        }
        onRemove={
          removeCartItem
        }
      />

      <QuickView
        product={
          shell.selectedProduct
        }
        language={
          language
        }
        labels={
          t.cart
        }
        productLabels={
          t.products
        }
        onAdd={
          addToCart
        }
        onClose={
          shell.closeQuickView
        }
        isAdding={
          addingProductId ===
          shell.selectedProduct
            ?.id
        }
      />

      <MobileMenu
        open={
          shell.menuOpen
        }
        t={t}
        isFarsi={isFarsi}
        onClose={
          shell.closeMenu
        }
      />

      <SearchOverlay
        open={
          shell.searchOpen
        }
        t={t}
        query={query}
        onQueryChange={
          setQuery
        }
        onClose={
          shell.closeSearch
        }
        onSubmit={
          handleSearchSubmit
        }
      />

      <main>
        <Suspense
          fallback={
            <RouteFallback
              isFarsi={
                isFarsi
              }
            />
          }
        >
          {route.type ===
            "product" ? (
            <ProductPage
              product={
                routedProduct
              }
              catalog={
                catalog
              }
              catalogState={
                catalogState
              }
              language={
                language
              }
              labels={
                t.productPage
              }
              cartLabels={{
                ...t.cart,
                outOfStock:
                  t.dashboard
                    .outOfStock,
              }}
              onAdd={
                addToCart
              }
              isAdding={
                addingProductId ===
                routedProduct?.id
              }
            />
          ) : route.type ===
            "owner" ? (
            <OwnerDashboardPage
              catalog={
                catalog
              }
              language={
                language
              }
              labels={
                t.dashboard
              }
            />
          ) : route.type ===
            "developer" ? (
            <DeveloperWorkspacePage
              catalog={
                catalog
              }
              language={
                language
              }
              labels={
                t.dashboard
              }
            />
          ) : route.type ===
            "assist" ? (
            <WebsiteAssistDashboard
              catalog={
                catalog
              }
              language={
                language
              }
              labels={
                t.dashboard
              }
            />
          ) : route.type ===
            "account" ? (
            <AccountWorkspacePage
              language={
                language
              }
              labels={
                t.account
              }
              dashboardLabels={
                t.dashboard
              }
            />
          ) : (
            <HomePage
              catalog={
                catalog
              }
              catalogState={
                catalogState
              }
              language={
                language
              }
              t={t}
              heroImage={
                heroImage
              }
              sourceLabel={
                sourceLabel
              }
              categoryOptions={
                categoryOptions
              }
              collectionOptions={
                collectionOptions
              }
              filteredProducts={
                filteredProducts
              }
              activeCategory={
                activeCategory
              }
              activeCollection={
                activeCollection
              }
              addingProductId={
                addingProductId
              }
              email={email}
              onSetActiveCategory={
                setActiveCategory
              }
              onSetActiveCollection={
                setActiveCollection
              }
              onSetQuery={
                setQuery
              }
              onSetEmail={
                setEmail
              }
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

      <Footer
        t={t}
        isFarsi={isFarsi}
      />
    </div>
  );
}