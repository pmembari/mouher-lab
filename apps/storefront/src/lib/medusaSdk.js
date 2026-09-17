import Medusa from "@medusajs/js-sdk";

import {
  isMedusaConfigured,
  medusaConfig,
} from "./catalog/config.js";

let sdkInstance = null;

export function getMedusaSdk() {
  if (!isMedusaConfigured()) {
    throw new Error(
      "Medusa storefront configuration is incomplete. Set VITE_MEDUSA_BACKEND_URL and VITE_MEDUSA_PUBLISHABLE_KEY."
    );
  }

  if (!sdkInstance) {
    sdkInstance = new Medusa({
      baseUrl: medusaConfig.backendUrl,
      publishableKey: medusaConfig.publishableKey,
      auth: {
        type: "jwt",
      },
    });
  }

  return sdkInstance;
}
