import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { trackEvent } from "../lib/analytics";
import { productDisplayName } from "../utils/product";
import { getRouteFromHash } from "../utils/routing";

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

  useEffect(() => {
    function handleHashChange() {
      setRoute(getRouteFromHash());
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

  const routedProduct = useMemo(() => {
    if (route.type !== "product") {
      return null;
    }

    return products.find(
      (product) =>
        product.handle === route.handle ||
        product.id === route.handle
    );
  }, [
    products,
    route,
  ]);

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