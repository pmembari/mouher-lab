import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";

import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import MobileMenu from "./components/layout/MobileMenu";
import SearchOverlay from "./components/layout/SearchOverlay";
import AnalyticsConsent from "./components/layout/AnalyticsConsent";

import QuickView from "./components/storefront/QuickView";
import CartDrawer from "./components/storefront/CartDrawer";

import HomePage from "./pages/HomePage";

import { content } from "./content/siteContent";

import {
  getAnalyticsConsent,
  setAnalyticsConsent,
  trackEvent,
} from "./lib/analytics";

import {
  addProductToCart,
  isMedusaConfigured,
  loadCatalog,
  medusaConfig,
} from "./lib/catalog";

import {
  productDisplayName,
  slugify,
} from "./utils/product";

import {
  sumCartItems,
  upsertCartItem,
  updateCartItemQuantity,
} from "./utils/cart";

/*
 * Route-level code splitting.
 *
 * These pages are intentionally lazy-loaded so visitors do not download
 * owner/developer/account/dashboard code when they only visit the store.
 */
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

/*
 * AccountWorkspacePage currently uses a named export.
 */
const AccountWorkspacePage = lazy(() =>
  import("./pages/AccountWorkspacePage").then((module) => ({
    default: module.AccountWorkspacePage,
  }))
);

/*
 * Keep the storefront components local for this stage of the refactor.
 *
 * They can be moved to components/storefront once their props and CSS
 * contracts exactly match these implementations.
 */



function getRouteFromHash() {
  const hash =
    typeof window === "undefined"
      ? ""
      : window.location.hash;

  const value = hash.replace(
    /^#\/?/,
    ""
  );

  if (
    value.startsWith("products/")
  ) {
    return {
      type: "product",

      handle: decodeRoutePart(
        value
          .replace(
            /^products\//,
            ""
          )
          .split(/[?#]/)[0]
      ),
    };
  }

  if (value === "owner") {
    return {
      type: "owner",
    };
  }

  if (value === "developer") {
    return {
      type: "developer",
    };
  }

  if (value === "assist") {
    return {
      type: "assist",
    };
  }

  if (value === "account") {
    return {
      type: "account",
    };
  }

  return {
    type: "home",

    section:
      value.replace(/^#/, "") ||
      "new",
  };
}

function decodeRoutePart(value) {
  try {
    return decodeURIComponent(
      value
    );
  } catch {
    return value;
  }
}




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
  const [
    language,
    setLanguage,
  ] = useState("pinglish");

  const [
    menuOpen,
    setMenuOpen,
  ] = useState(false);

  const [
    searchOpen,
    setSearchOpen,
  ] = useState(false);

  const [
    cartOpen,
    setCartOpen,
  ] = useState(false);

  const [
    cartItems,
    setCartItems,
  ] = useState([]);

  const [
    cartMessage,
    setCartMessage,
  ] = useState("");

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    selectedProduct,
    setSelectedProduct,
  ] = useState(null);

  const [
    route,
    setRoute,
  ] = useState(() =>
    getRouteFromHash()
  );

  const [
    catalog,
    setCatalog,
  ] = useState({
    products: [],
    categories: [],
    collections: [],
    source: "demo",
    featuredImage: "",
    notice: "",
  });

  const [
    catalogState,
    setCatalogState,
  ] = useState("loading");

  const [
    activeCategory,
    setActiveCategory,
  ] = useState("all");

  const [
    activeCollection,
    setActiveCollection,
  ] = useState("all");

  const [
    query,
    setQuery,
  ] = useState("");

  const [
    addingProductId,
    setAddingProductId,
  ] = useState("");

  const [
    analyticsConsent,
    setAnalyticsConsentState,
  ] = useState(() =>
    getAnalyticsConsent()
  );

  const t = content[language];

  const isFarsi =
    language === "farsi";

  const cartCount =
    sumCartItems(cartItems);

  useEffect(() => {
    let cancelled = false;

    async function hydrateCatalog() {
      setCatalogState(
        "loading"
      );

      try {
        const nextCatalog =
          await loadCatalog();

        if (!cancelled) {
          setCatalog(
            nextCatalog
          );

          setCatalogState(
            "ready"
          );
        }
      } catch (error) {
        console.error(
          "Catalog load failed:",
          error
        );

        if (!cancelled) {
          setCatalogState(
            "error"
          );
        }
      }
    }

    hydrateCatalog();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handleHashChange() {
      setRoute(
        getRouteFromHash()
      );
    }

    window.addEventListener(
      "hashchange",
      handleHashChange
    );

    return () => {
      window.removeEventListener(
        "hashchange",
        handleHashChange
      );
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setSelectedProduct(null);

    if (
      route.type !== "home"
    ) {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    window.requestAnimationFrame(
      () => {
        document
          .getElementById(
            route.section
          )
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }
    );
  }, [route]);

  useEffect(() => {
    function handleKeyDown(
      event
    ) {
      if (
        event.key !==
        "Escape"
      ) {
        return;
      }

      setMenuOpen(false);
      setSearchOpen(false);
      setCartOpen(false);
      setSelectedProduct(null);
    }

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, []);

  useEffect(() => {
    const shouldLock =
      menuOpen ||
      searchOpen ||
      cartOpen ||
      Boolean(
        selectedProduct
      );

    document.body.style.overflow =
      shouldLock
        ? "hidden"
        : "";

    return () => {
      document.body.style.overflow =
        "";
    };
  }, [
    cartOpen,
    menuOpen,
    searchOpen,
    selectedProduct,
  ]);

  const categoryOptions =
    useMemo(
      () => [
        {
          id: "all",
          slug: "all",
          name:
            t.categories.all,
          nameFa:
            t.categories.all,
          count:
            catalog.products
              .length,
        },

        ...(
          catalog.categories ||
          []
        ),
      ],
      [
        catalog.categories,
        catalog.products
          .length,
        t.categories.all,
      ]
    );

  const collectionOptions =
    useMemo(
      () => [
        {
          id: "all",
          slug: "all",
          name:
            t.collections.all,
          nameFa:
            t.collections.all,
          count:
            catalog.products
              .length,
        },

        ...(
          catalog.collections ||
          []
        ),
      ],
      [
        catalog.collections,
        catalog.products
          .length,
        t.collections.all,
      ]
    );

  const filteredProducts =
    useMemo(() => {
      const normalizedQuery =
        query
          .trim()
          .toLowerCase();

      return (
        catalog.products || []
      ).filter((product) => {
        const matchesCategory =
          activeCategory ===
          "all" ||
          product.categorySlug ===
          activeCategory;

        const matchesCollection =
          activeCollection ===
          "all" ||
          slugify(
            product.collection
          ) ===
          activeCollection;

        const searchable = [
          product.name,
          product.nameFa,
          product.category,
          product.categoryFa,
          product.collection,
          product.description,
          product.descriptionFa,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesQuery =
          !normalizedQuery ||
          searchable.includes(
            normalizedQuery
          );

        return (
          matchesCategory &&
          matchesCollection &&
          matchesQuery
        );
      });
    }, [
      activeCategory,
      activeCollection,
      catalog.products,
      query,
    ]);

  const routedProduct =
    useMemo(() => {
      if (
        route.type !==
        "product"
      ) {
        return null;
      }

      return (
        catalog.products || []
      ).find(
        (product) =>
          product.handle ===
          route.handle ||
          product.id ===
          route.handle
      );
    }, [
      catalog.products,
      route,
    ]);

  useEffect(() => {
    trackEvent(
      route.type ===
        "product"
        ? "product_view"
        : "page_view",
      {
        product_id:
          routedProduct?.id,

        product_name:
          routedProduct?.name,

        source:
          catalog.source,
      }
    );
  }, [
    catalog.source,
    route,
    routedProduct,
  ]);

  useEffect(() => {
    if (
      route.type ===
      "product" &&
      routedProduct
    ) {
      document.title = `${productDisplayName(
        routedProduct,
        isFarsi
      )} | Mouher`;

      return;
    }

    if (
      route.type === "owner"
    ) {
      document.title = `${t.dashboard.ownerTitle} | Mouher`;
      return;
    }

    if (
      route.type ===
      "developer"
    ) {
      document.title = `${t.dashboard.developerTitle} | Mouher`;
      return;
    }

    if (
      route.type ===
      "assist"
    ) {
      document.title = `${t.dashboard.assistTitle} | Mouher`;
      return;
    }

    if (
      route.type ===
      "account"
    ) {
      document.title = `${t.dashboard.accountTitle} | Mouher`;
      return;
    }

    document.title =
      "Mouher — Contemporary Clothing";
  }, [
    isFarsi,
    route,
    routedProduct,
    t.dashboard.accountTitle,
    t.dashboard.assistTitle,
    t.dashboard
      .developerTitle,
    t.dashboard.ownerTitle,
  ]);

  const heroImage =
    catalog.featuredImage ||
    catalog.products?.find(
      (product) =>
        product.imageUrls
          ?.length
    )?.imageUrls?.[0];

  const sourceLabel =
    catalogState ===
      "loading"
      ? t.products.loading
      : catalog.source ===
        "medusa"
        ? t.products
          .sourceMedusa
        : catalog.source ===
          "mouher-live-snapshot"
          ? t.products
            .sourceLive
          : t.products
            .sourceDemo;

  async function handleAddToCart(
    product
  ) {
    trackEvent(
      "add_to_cart",
      {
        product_id:
          product.id,

        product_name:
          product.name,

        price:
          product.priceAmount,

        source:
          product.source,
      }
    );

    setAddingProductId(
      product.id
    );

    setCartMessage("");
    setCartOpen(true);

    try {
      if (
        product.source ===
        "medusa" &&
        isMedusaConfigured(
          medusaConfig
        )
      ) {
        await addProductToCart(
          product,
          medusaConfig
        );

        setCartMessage(
          t.cart.medusaAdded
        );
      } else {
        setCartMessage(
          t.cart.previewAdded
        );
      }

      setCartItems(
        (current) =>
          upsertCartItem(
            current,
            product
          )
      );

      setSelectedProduct(null);
    } catch (error) {
      console.error(
        "Add to cart failed:",
        error
      );

      setCartMessage(
        t.cart.unavailable
      );
    } finally {
      setAddingProductId("");
    }
  }

  function handleIncreaseCartItem(
    productId
  ) {
    setCartMessage("");

    setCartItems(
      (current) =>
        updateCartItemQuantity(
          current,
          productId,
          1
        )
    );
  }

  function handleDecreaseCartItem(
    productId
  ) {
    setCartMessage("");

    setCartItems(
      (current) =>
        updateCartItemQuantity(
          current,
          productId,
          -1
        )
    );
  }

  function handleRemoveCartItem(
    productId
  ) {
    setCartMessage("");

    setCartItems(
      (current) =>
        current.filter(
          (item) =>
            item.product.id !==
            productId
        )
    );
  }

  function handleCheckoutIntent() {
    trackEvent(
      "begin_checkout",
      {
        value:
          cartItems.reduce(
            (
              total,
              item
            ) =>
              total +
              (Number(
                item.product
                  .priceAmount
              ) || 0) *
              item.quantity,
            0
          ),

        currency: "EUR",
      }
    );

    setCartMessage(
      t.checkout.description
    );
  }

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

    setSearchOpen(false);
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
      className={`site ${isFarsi ? "site-farsi" : ""}`}
      dir={isFarsi ? "rtl" : "ltr"}
    >
      <div className="announcement">
        <p>{t.announcement}</p>
      </div>

      <Header
        t={t}
        isFarsi={isFarsi}
        menuOpen={menuOpen}
        cartCount={cartCount}
        onOpenMenu={() => setMenuOpen(true)}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenCart={() => setCartOpen(true)}
      />

      <button
        type="button"
        className="language-indicator"
        onClick={() =>
          setLanguage((current) =>
            current === "pinglish"
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
        <span className={language === "pinglish" ? "active" : ""}>
          EN
        </span>

        <span
          className="language-dot"
          aria-hidden="true"
        >
          /
        </span>

        <span className={language === "farsi" ? "active" : ""}>
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
        visible={analyticsConsent === "unknown"}
        isFarsi={isFarsi}
        onDecline={() => {
          setAnalyticsConsent(false);
          setAnalyticsConsentState("denied");
        }}
        onAccept={() => {
          setAnalyticsConsent(true);
          setAnalyticsConsentState("granted");

          trackEvent("page_view", {
            source: catalog.source,
          });
        }}
      />

      <CartDrawer
        open={cartOpen}
        items={cartItems}
        labels={t.cart}
        checkoutLabels={t.checkout}
        language={language}
        onClose={() => setCartOpen(false)}
        onCheckout={handleCheckoutIntent}
        onIncrease={handleIncreaseCartItem}
        onDecrease={handleDecreaseCartItem}
        onRemove={handleRemoveCartItem}
      />

      <QuickView
        product={selectedProduct}
        language={language}
        labels={t.cart}
        productLabels={t.products}
        onAdd={handleAddToCart}
        onClose={() => setSelectedProduct(null)}
        isAdding={
          addingProductId === selectedProduct?.id
        }
      />

      <MobileMenu
        open={menuOpen}
        t={t}
        isFarsi={isFarsi}
        onClose={() => setMenuOpen(false)}
      />

      <SearchOverlay
        open={searchOpen}
        t={t}
        query={query}
        onQueryChange={setQuery}
        onClose={() => setSearchOpen(false)}
        onSubmit={handleSearchSubmit}
      />

      <main>
        <Suspense
          fallback={
            <RouteFallback isFarsi={isFarsi} />
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
                outOfStock: t.dashboard.outOfStock,
              }}
              onAdd={handleAddToCart}
              isAdding={
                addingProductId === routedProduct?.id
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
              categoryOptions={categoryOptions}
              collectionOptions={collectionOptions}
              filteredProducts={filteredProducts}
              activeCategory={activeCategory}
              activeCollection={activeCollection}
              addingProductId={addingProductId}
              email={email}
              onSetActiveCategory={setActiveCategory}
              onSetActiveCollection={setActiveCollection}
              onSetQuery={setQuery}
              onSetEmail={setEmail}
              onAddToCart={handleAddToCart}
              onNewsletterSubmit={handleNewsletterSubmit}
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