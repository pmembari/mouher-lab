import Medusa from "@medusajs/js-sdk";

import {
  isMedusaConfigured,
  medusaConfig,
} from "./catalog/config.js";

let sdkInstance = null;
let instanceKey = "";

export function getMedusaSdk(config = medusaConfig) {
  if (!isMedusaConfigured(config)) {
    throw new Error(
      "Medusa storefront configuration is incomplete. Set VITE_MEDUSA_BACKEND_URL and VITE_MEDUSA_PUBLISHABLE_KEY."
    );
  }

  const key = JSON.stringify([config.backendUrl, config.publishableKey]);
  if (!sdkInstance || key !== instanceKey) {
    instanceKey = key;
    sdkInstance = new Medusa({
      baseUrl: config.backendUrl,
      publishableKey: config.publishableKey,
      auth: {
        type: "jwt",
      },
    });
  }

  return sdkInstance;
}
