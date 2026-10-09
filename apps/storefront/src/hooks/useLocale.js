import { useCallback, useEffect, useMemo, useState } from "react";

import { content } from "../content/siteContent";

export function useLocale() {
  const [language, setLanguage] =
    useState("pinglish");

  const t = content[language];

  const isFarsi =
    language === "farsi";

  const direction =
    isFarsi ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = isFarsi ? "fa" : "en";
    document.documentElement.dir = direction;
  }, [isFarsi, direction]);

  const siteClassName = useMemo(
    () =>
      `site ${isFarsi
        ? "site-farsi"
        : ""
      }`,
    [isFarsi]
  );

  const toggleLanguage = useCallback(() => {
    setLanguage((current) =>
      current === "pinglish"
        ? "farsi"
        : "pinglish"
    );
  }, []);

  return {
    language,
    setLanguage,

    t,

    isFarsi,
    direction,
    siteClassName,

    toggleLanguage,
  };
}
