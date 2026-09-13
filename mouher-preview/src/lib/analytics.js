const STORAGE_KEY = "mouher.analytics.events.v1";
const CONSENT_KEY = "mouher.analytics.consent.v1";
const VISITOR_KEY = "mouher.analytics.visitor.v1";
const SESSION_KEY = "mouher.analytics.session.v1";
const MAX_EVENTS = 1000;
const apiBaseUrl = String(import.meta.env?.VITE_MOUHER_API_URL || "").replace(/\/$/, "");

function readEvents(storage) {
  if (!storage) return [];

  try {
    const events = JSON.parse(storage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(events) ? events : [];
  } catch {
    return [];
  }
}

export function trackEvent(name, properties = {}) {
  if (typeof window === "undefined" || !window.localStorage || getAnalyticsConsent() !== "granted") return;

  const events = readEvents(window.localStorage);
  const event = {
    name,
    properties,
    timestamp: new Date().toISOString(),
  };
  events.push(event);

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
  } catch {
    // Analytics must never interrupt a shopping action.
  }

  if (apiBaseUrl) {
    const productId = properties.product_id || "";
    fetch(`${apiBaseUrl}/analytics/events/`, {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        consent: true,
        event_name: name,
        occurred_at: event.timestamp,
        anonymous_id: stableId(VISITOR_KEY, window.localStorage),
        session_id: stableId(SESSION_KEY, window.sessionStorage),
        path: `${window.location.pathname}${window.location.hash}`,
        product_id: productId,
        product_name: properties.product_name || "",
        value: properties.price ?? null,
        currency: properties.currency || "EUR",
        properties,
      }),
    }).catch(() => {});
  }
}

export function getAnalyticsConsent() {
  if (typeof window === "undefined") return "unknown";
  return window.localStorage.getItem(CONSENT_KEY) || "unknown";
}

export function setAnalyticsConsent(granted) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CONSENT_KEY, granted ? "granted" : "denied");
  if (!granted) window.localStorage.removeItem(STORAGE_KEY);
}

export function summarizeEvents(events, now = new Date()) {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - 30);

  const recent = events.filter((event) => {
    const timestamp = new Date(event.timestamp);
    return Number.isFinite(timestamp.getTime()) && timestamp >= cutoff && timestamp <= now;
  });
  const counts = recent.reduce((result, event) => {
    result[event.name] = (result[event.name] || 0) + 1;
    return result;
  }, {});
  const products = new Map();

  recent.forEach((event) => {
    const id = event.properties?.product_id;
    if (!id) return;

    const current = products.get(id) || {
      id,
      name: event.properties.product_name || event.properties.product_handle || id,
      clicks: 0,
      quickAdds: 0,
      wishlists: 0,
    };

    if (event.name === "product_click") current.clicks += 1;
    if (event.name === "quick_add_click") current.quickAdds += 1;
    if (event.name === "wishlist_click") current.wishlists += 1;
    products.set(id, current);
  });

  const productClicks = counts.product_click || 0;
  const quickAdds = counts.quick_add_click || 0;
  const dayMap = new Map();
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(now);
    date.setDate(date.getDate() - offset);
    dayMap.set(date.toISOString().slice(0, 10), 0);
  }
  recent.forEach((event) => {
    const day = String(event.timestamp || "").slice(0, 10);
    if (dayMap.has(day)) dayMap.set(day, dayMap.get(day) + 1);
  });

  return {
    totalEvents: recent.length,
    productClicks,
    quickAdds,
    wishlists: counts.wishlist_click || 0,
    conversionRate: productClicks ? Math.round((quickAdds / productClicks) * 100) : 0,
    daily: [...dayMap].map(([date, total]) => ({ date, total })),
    funnel: [
      { label: "Product views", value: productClicks },
      { label: "Added to cart", value: quickAdds },
      { label: "Checkout", value: counts.begin_checkout || 0 },
      { label: "Purchase", value: counts.purchase || 0 },
    ],
    topProducts: [...products.values()]
      .sort((a, b) => (b.clicks + b.quickAdds + b.wishlists) - (a.clicks + a.quickAdds + a.wishlists))
      .slice(0, 5),
  };
}

export function getAnalyticsSummary() {
  const storage = typeof window === "undefined" ? null : window.localStorage;
  return summarizeEvents(readEvents(storage));
}

function stableId(key, storage) {
  let value = storage.getItem(key);
  if (!value) {
    value = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    storage.setItem(key, value);
  }
  return value;
}
