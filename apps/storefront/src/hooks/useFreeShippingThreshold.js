import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  medusaConfig,
} from "../lib/catalog/config";

const BASE_POLICY_YEAR = 2026;
const BASE_THRESHOLD_TOMAN =
  10_000_000;
const ANNUAL_INCREMENT_TOMAN =
  1_000_000;

export function useFreeShippingThreshold({
  language,
} = {}) {
  const [threshold, setThreshold] =
    useState(null);

  useEffect(() => {
    if (!medusaConfig.backendUrl) {
      return undefined;
    }

    const controller =
      new AbortController();

    const headers = {
      accept: "application/json",
    };

    if (
      medusaConfig.publishableKey
    ) {
      headers[
        "x-publishable-api-key"
      ] =
        medusaConfig.publishableKey;
    }

    fetch(
      `${medusaConfig.backendUrl}/store/shipping-threshold`,
      {
        headers,
        signal:
          controller.signal,
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Shipping threshold returned ${response.status}`
          );
        }

        return response.json();
      })
      .then((payload) => {
        const next =
          payload?.free_shipping;

        if (
          next &&
          Number.isFinite(
            Number(
              next.threshold_toman
            )
          ) &&
          Number(
            next.threshold_toman
          ) > 0
        ) {
          setThreshold(next);
        }
      })
      .catch((error) => {
        if (
          error?.name !==
          "AbortError"
        ) {
          console.warn(
            "Could not load free-shipping threshold",
            error
          );
        }
      });

    return () =>
      controller.abort();
  }, []);

  return useMemo(() => {
    const fallbackToman =
      annualThresholdToman(
        new Date().getUTCFullYear()
      );

    const thresholdToman =
      Number(
        threshold?.threshold_toman
      ) || fallbackToman;

    const thresholdRial =
      Number(
        threshold?.threshold_rial
      ) || thresholdToman * 10;

    return {
      ...threshold,
      thresholdToman,
      thresholdRial,
      announcement:
        formatShippingCopy({
          language,
          thresholdToman,
        }),
    };
  }, [language, threshold]);
}

function annualThresholdToman(year) {
  const elapsedYears = Math.max(
    0,
    Math.trunc(year) -
      BASE_POLICY_YEAR
  );

  return (
    BASE_THRESHOLD_TOMAN +
    elapsedYears *
      ANNUAL_INCREMENT_TOMAN
  );
}

function formatShippingCopy({
  language,
  thresholdToman,
}) {
  const isFarsi =
    language === "farsi";

  const millions =
    thresholdToman /
    1_000_000;

  if (isFarsi) {
    return `ارسال رایگان برای خریدهای بالای ${toPersianDigits(
      millions
    )} میلیون تومان`;
  }

  return `Free shipping on orders over ${new Intl.NumberFormat(
    "en-US"
  ).format(
    thresholdToman
  )} toman`;
}

function toPersianDigits(value) {
  return String(value).replace(
    /\d/g,
    (digit) =>
      "۰۱۲۳۴۵۶۷۸۹"[
        Number(digit)
      ]
  );
}
