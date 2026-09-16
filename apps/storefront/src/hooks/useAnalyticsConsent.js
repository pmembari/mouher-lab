import { useCallback, useState } from "react";

import {
  getAnalyticsConsent,
  setAnalyticsConsent,
  trackEvent,
} from "../lib/analytics";

export function useAnalyticsConsent({
  catalogSource,
}) {
  const [consent, setConsent] = useState(() =>
    getAnalyticsConsent()
  );

  const decline = useCallback(() => {
    setAnalyticsConsent(false);
    setConsent("denied");
  }, []);

  const accept = useCallback(() => {
    setAnalyticsConsent(true);
    setConsent("granted");

    trackEvent("page_view", {
      source: catalogSource,
    });
  }, [catalogSource]);

  return {
    consent,
    accept,
    decline,
  };
}