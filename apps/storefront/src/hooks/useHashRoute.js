import { useEffect, useMemo, useState } from "react";

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
  }, [products, route]);

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
    trackEvent(
      route.type === "product"
        ? "product_view"
        : "page_view",
      {
        product_id: routedProduct?.id,
        product_name: routedProduct?.name,
        source: catalogSource,
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