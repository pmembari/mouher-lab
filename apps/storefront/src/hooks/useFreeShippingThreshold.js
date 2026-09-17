import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  medusaConfig,
} from "../lib/catalog/config";

const FALLBACK_THRESHOLD_RIAL =
  120_000_000;

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
              next.threshold_rial
            )
          ) &&
          Number(
            next.threshold_rial
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
    const thresholdRial =
      Number(
        threshold?.threshold_rial
      ) ||
      FALLBACK_THRESHOLD_RIAL;

    return {
      ...threshold,
      thresholdRial,
      announcement:
        formatShippingCopy({
          language,
          thresholdRial,
        }),
    };
  }, [language, threshold]);
}

function formatShippingCopy({
  language,
  thresholdRial,
}) {
  const isFarsi =
    language === "farsi";

  const roundedMillions =
    Math.round(
      thresholdRial /
        1_000_000
    );

  if (isFarsi) {
    return `ارسال رایگان برای خریدهای بالای ${toPersianDigits(
      roundedMillions
    )} میلیون ریال`;
  }

  return `Free shipping on orders over ${new Intl.NumberFormat(
    "en-US"
  ).format(
    roundedMillions
  )} million rial`;
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
