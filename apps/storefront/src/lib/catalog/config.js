import {
  optionalNumber,
  stripTrailingSlash,
  truthy,
} from "./helpers";

const viteEnv =
  import.meta.env || {};

export const medusaConfig = {
  mouherApiUrl:
    stripTrailingSlash(
      viteEnv.VITE_MOUHER_API_URL ||
      ""
    ),

  backendUrl:
    stripTrailingSlash(
      viteEnv.VITE_MEDUSA_BACKEND_URL ||
      ""
    ),

  publishableKey:
    viteEnv.VITE_MEDUSA_PUBLISHABLE_KEY ||
    "",

  regionId:
    viteEnv.VITE_MEDUSA_REGION_ID ||
    "",

  countryCode:
    viteEnv.VITE_MEDUSA_COUNTRY_CODE ||
    "",

  currencyCode:
    viteEnv.VITE_MEDUSA_CURRENCY_CODE ||
    "",

  productFields:
    viteEnv.VITE_MEDUSA_PRODUCT_FIELDS ||
    "",

  productLimit:
    optionalNumber(
      viteEnv.VITE_MEDUSA_PRODUCT_LIMIT
    ),

  allowStaticCatalogFallback:
    truthy(
      viteEnv
        .VITE_ALLOW_STATIC_CATALOG_FALLBACK
    ),
};

export function isMedusaConfigured(
  config = medusaConfig
) {
  return Boolean(
    config.backendUrl &&
    config.publishableKey
  );
}