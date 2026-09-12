export async function loadCatalog(config = medusaConfig) {
  if (isMouherApiConfigured(config)) {
    try {
      const response = await fetchMouherProducts(config);

      return {
        ...normalizeMedusaProductsResponse(
          response,
          response.currency_code || config.currencyCode
        ),
        notice: "",
      };
    } catch (error) {
      console.error("Failed to load Mouher API:", error);
    }
  }

  if (isMedusaConfigured(config)) {
    try {
      const response = await fetchMedusaProducts(config);

      return {
        ...normalizeMedusaProductsResponse(
          response,
          response.currency_code || config.currencyCode
        ),
        notice: "",
      };
    } catch (error) {
      console.error("Failed to load Medusa:", error);
    }
  }

  return {
    ...currentMouherCatalog,
    notice: "Showing current Mouher catalog snapshot.",
  };
}