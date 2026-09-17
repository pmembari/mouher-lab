import {
  DEFAULT_PRODUCT_FIELDS,
} from "./constants";

import {
  stripTrailingSlash,
} from "./helpers";

export async function fetchMedusaProducts(
  config
) {
  const params =
    new URLSearchParams({
      limit:
        String(
          config.productLimit ||
          24
        ),

      fields:
        getProductFields(
          config
        ),
    });

  appendRegionContext(
    params,
    config
  );

  return medusaRequest(
    `/store/products?${params.toString()}`,
    {
      method: "GET",
      config,
    }
  );
}

export async function fetchMedusaProductsPage({
  config,
  limit,
  offset,
  query = "",
  sort = "featured",
}) {
  const params =
    new URLSearchParams({
      limit:
        String(limit),

      offset:
        String(offset),

      fields:
        getProductFields(
          config
        ),
    });

  if (query.trim()) {
    params.set(
      "q",
      query.trim()
    );
  }

  /*
   * Newest can be represented directly
   * by Medusa product ordering.
   *
   * Price sorting and best-selling need
   * backend support based on calculated
   * prices / sales aggregation before
   * they are globally correct across
   * thousands of products.
   */
  if (
    sort === "newest"
  ) {
    params.set(
      "order",
      "-created_at"
    );
  }

  appendRegionContext(
    params,
    config
  );

  return medusaRequest(
    `/store/products?${params.toString()}`,
    {
      method: "GET",
      config,
    }
  );
}

export async function medusaRequest(
  path,
  {
    method = "GET",
    body,
    config,
  }
) {
  const backendUrl =
    stripTrailingSlash(
      config?.backendUrl ||
      ""
    );

  if (!backendUrl) {
    throw new Error(
      "Medusa backend URL is required."
    );
  }

  const headers = {
    Accept:
      "application/json",

    "Content-Type":
      "application/json",
  };

  if (
    config?.publishableKey
  ) {
    headers[
      "x-publishable-api-key"
    ] =
      config.publishableKey;
  }

  const response =
    await fetch(
      `${backendUrl}${path}`,
      {
        method,

        credentials:
          "include",

        headers,

        body:
          body !==
            undefined
            ? JSON.stringify(
              body
            )
            : undefined,
      }
    );

  if (!response.ok) {
    let message =
      `Medusa request failed: ${response.status}`;

    try {
      const payload =
        await response.json();

      if (
        payload?.message
      ) {
        message =
          `${message} ${payload.message}`;
      }
    } catch {
      // Keep the HTTP status message.
    }

    throw new Error(
      message
    );
  }

  if (
    response.status === 204
  ) {
    return null;
  }

  return response.json();
}

export function getProductFields(
  config
) {
  return (
    config?.productFields ||
    DEFAULT_PRODUCT_FIELDS
  );
}

function appendRegionContext(
  params,
  config
) {
  if (
    config?.regionId
  ) {
    params.set(
      "region_id",
      config.regionId
    );
  }

  if (
    config?.countryCode
  ) {
    params.set(
      "country_code",
      config.countryCode
    );
  }
}