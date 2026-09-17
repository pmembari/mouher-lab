import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  medusaConfig,
} from "../lib/catalog/config";

const DEFAULT_EUR_AMOUNT = 50;

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
    const eurAmount =
      threshold?.eur_amount ||
      DEFAULT_EUR_AMOUNT;

    const thresholdToman =
      Number(
        threshold?.threshold_toman
      ) || null;

    const thresholdRial =
      Number(
        threshold?.threshold_rial
      ) || null;

    return {
      ...threshold,
      eurAmount,
      thresholdToman,
      thresholdRial,
      announcement:
        formatShippingCopy({
          language,
          eurAmount,
          thresholdToman,
        }),
    };
  }, [language, threshold]);
}

function formatShippingCopy({
  language,
  eurAmount,
  thresholdToman,
}) {
  const isFarsi =
    language === "farsi";

  if (!thresholdToman) {
    return isFarsi
      ? `ارسال رایگان برای سفارش‌های بالاتر از معادل روز ${toPersianDigits(
          eurAmount
        )} یورو`
      : `Free shipping above the current equivalent of €${eurAmount}`;
  }

  const millions =
    thresholdToman /
    1_000_000;

  if (isFarsi) {
    return `ارسال رایگان برای خریدهای بالای ${toPersianDigits(
      millions
    )} میلیون تومان`;
  }

  return `Free shipping on orders over ${formatEnglishToman(
    thresholdToman
  )}`;
}

function formatEnglishToman(
  value
) {
  return `${new Intl.NumberFormat(
    "en-US"
  ).format(value)} toman`;
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
