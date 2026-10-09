import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { trackEvent } from "../lib/analytics";
import { productDisplayName } from "../utils/product";
import { getRouteFromHash } from "../utils/routing";
import { categoryPath, navigateStorefront, productPath, productSchema, readPrerenderData, routeFromPath, serializeJson, storefrontBase } from "../lib/seo.js";
import { isMedusaConfigured, medusaConfig } from "../lib/catalog/config.js";
import { normalizeMedusaProduct } from "../lib/catalog/normalize.js";
import { DEFAULT_PRODUCT_FIELDS } from "../lib/catalog/constants.js";
import { withCatalogTimeout } from "../lib/publicCatalog.js";

export function useHashRoute({
  products = [],
  catalogSource,
  isFarsi,
  dashboardLabels,
  onRouteChange,
}) {
  const [route, setRoute] = useState(() =>
    getRouteFromHash()
  );
  const [detail, setDetail] = useState(null);
  const [initialProduct] = useState(() => readPrerenderData()?.product);

  useEffect(() => {
    function handleHashChange() {
      // Hash-based screens stay rooted at the storefront, never at a product URL.
      if (window.location.hash && window.location.pathname !== storefrontBase) {
        window.history.replaceState(null, "", `${storefrontBase}${window.location.hash}`);
      }
      const nextRoute = getRouteFromHash();
      if (nextRoute.type === "product" && window.location.hash) {
        window.history.replaceState(null, "", productPath({ handle: nextRoute.handle }));
      }
      setRoute(nextRoute);
    }

    function handleLink(event) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target.closest?.("a[href]");
      if (!link || link.target || link.hasAttribute("download")) return;
      const url = new URL(link.href);
      if (url.origin !== window.location.origin) return;
      if (routeFromPath(url.pathname) || (url.pathname === storefrontBase && url.hash)) {
        event.preventDefault();
        navigateStorefront(url.pathname + url.search + url.hash);
      }
    }
    handleHashChange();
    window.addEventListener("popstate", handleHashChange);
    document.addEventListener("click", handleLink);

    window.addEventListener(
      "hashchange",
      handleHashChange
    );

    return () => {
      window.removeEventListener("popstate", handleHashChange);
      document.removeEventListener("click", handleLink);
      window.removeEventListener(
        "hashchange",
        handleHashChange
      );
    };
  }, []);

  useEffect(() => {
    if (route.type !== "product" || !isMedusaConfigured()) return;
    let cancelled = false;
    setDetail(null);
    const query = { handle: route.handle, fields: DEFAULT_PRODUCT_FIELDS };
    if (medusaConfig.regionId) query.region_id = medusaConfig.regionId;
    if (medusaConfig.countryCode) query.country_code = medusaConfig.countryCode;
    withCatalogTimeout(import("../lib/medusaSdk.js").then(({ getMedusaSdk }) => getMedusaSdk().store.product.list(query)), 15000)
      .then((response) => {
        if (!cancelled) setDetail({ handle: route.handle, product: normalizeMedusaProduct(response.products?.[0], medusaConfig.currencyCode) });
      })
      .catch(() => {
        // The build snapshot remains readable if the live service is unavailable.
        if (!cancelled) setDetail({ handle: route.handle, failed: true });
      });
    return () => { cancelled = true; };
  }, [route.type, route.handle]);

  const routedProduct = useMemo(() => {
    if (route.type !== "product") {
      return null;
    }

    if (detail?.handle === route.handle && !detail.failed) return detail.product;
    const product = products.find(
      (product) =>
        product.handle === route.handle ||
        product.id === route.handle
    ) || (initialProduct?.handle === route.handle || initialProduct?.id === route.handle ? initialProduct : null);
    // Static data may inform browsing but must not authorize a stale live purchase.
    return product && isMedusaConfigured() ? { ...product, variantId: null } : product;
  }, [
    products,
    route,
    detail,
    initialProduct,
  ]);

  useEffect(() => {
    const path = route.type === "product" ? productPath({ handle: route.handle })
      : route.type === "category" ? categoryPath(route.slug)
      : route.type === "shop" ? `${storefrontBase}products/` : storefrontBase;
    const canonical = new URL(path, window.location.origin).href;
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) { link = document.createElement("link"); link.rel = "canonical"; document.head.append(link); }
    link.href = canonical;
    const existing = document.querySelector('script[type="application/ld+json"]');
    existing?.remove();
    if (route.type === "product" && routedProduct) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.textContent = serializeJson(productSchema(routedProduct, canonical));
      document.head.append(script);
    }
    const title = routedProduct ? `${productDisplayName(routedProduct, isFarsi)} | Mouher` : "Mouher — Contemporary Clothing";
    const description = routedProduct ? (isFarsi ? routedProduct.descriptionFa || routedProduct.description : routedProduct.description) : "Discover Mouher clothing and browse the product catalog.";
    for (const [attribute, name, value] of [["name", "description", description], ["property", "og:title", title], ["property", "og:description", description], ["property", "og:url", canonical], ["property", "og:type", routedProduct ? "product" : "website"]]) {
      let meta = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!meta) { meta = document.createElement("meta"); meta.setAttribute(attribute, name); document.head.append(meta); }
      meta.content = value || title;
    }
  }, [route, routedProduct, isFarsi]);

  useEffect(() => {
    onRouteChange?.();

    if (route.type !== "home") {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    window.requestAnimationFrame(() => {
      document
        .getElementById(route.section)
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    });
  }, [
    route,
    onRouteChange,
  ]);

  useEffect(() => {
    let eventName = "page_view";

    if (route.type === "product") {
      eventName = "product_view";
    }

    if (route.type === "search") {
      eventName = "search_view";
    }

    if (route.type === "category") {
      eventName = "category_view";
    }

    if (route.type === "collection") {
      eventName = "collection_view";
    }

    if (route.type === "shop") {
      eventName = "shop_view";
    }

    trackEvent(
      eventName,
      {
        product_id:
          routedProduct?.id,

        product_name:
          routedProduct?.name,

        source:
          catalogSource,

        route_type:
          route.type,

        query:
          route.query || "",

        category:
          route.category ||
          route.slug ||
          "",

        collection:
          route.collection ||
          (route.type === "collection"
            ? route.slug
            : ""),

        sort:
          route.sort || "",

        sale:
          route.sale || false,

        in_stock:
          route.inStock || false,
      }
    );
  }, [
    route,
    routedProduct,
    catalogSource,
  ]);

  useEffect(() => {
    if (
      route.type === "product" &&
      routedProduct
    ) {
      document.title = `${productDisplayName(
        routedProduct,
        isFarsi
      )} | Mouher`;

      return;
    }

    if (route.type === "shop") {
      document.title = isFarsi
        ? "فروشگاه | Mouher"
        : "Shop | Mouher";

      return;
    }

    if (route.type === "category") {
      document.title = `${formatRouteLabel(
        route.slug
      )} | Mouher`;

      return;
    }

    if (route.type === "collection") {
      document.title = `${formatRouteLabel(
        route.slug
      )} | Mouher`;

      return;
    }

    if (route.type === "search") {
      document.title =
        route.query
          ? `${isFarsi
            ? "جستجو"
            : "Search"
          }: ${route.query} | Mouher`
          : `${isFarsi
            ? "جستجو"
            : "Search"
          } | Mouher`;

      return;
    }

    if (route.type === "owner") {
      document.title = `${dashboardLabels.ownerTitle} | Mouher`;

      return;
    }

    if (route.type === "developer") {
      document.title = `${dashboardLabels.developerTitle} | Mouher`;

      return;
    }

    if (route.type === "assist") {
      document.title = `${dashboardLabels.assistTitle} | Mouher`;

      return;
    }

    if (route.type === "account") {
      document.title = `${dashboardLabels.accountTitle} | Mouher`;

      return;
    }

    document.title =
      "Mouher — Contemporary Clothing";
  }, [
    route,
    routedProduct,
    isFarsi,
    dashboardLabels.ownerTitle,
    dashboardLabels.developerTitle,
    dashboardLabels.assistTitle,
    dashboardLabels.accountTitle,
  ]);

  return {
    route,
    routedProduct,
  };
}

function formatRouteLabel(value) {
  return String(value || "")
    .split("-")
    .filter(Boolean)
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1)
    )
    .join(" ");
}
