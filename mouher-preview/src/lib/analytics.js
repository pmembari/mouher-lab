const STORAGE_KEY = "mouher.analytics.events.v1";
const MAX_EVENTS = 1000;

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
  if (typeof window === "undefined" || !window.localStorage) return;

  const events = readEvents(window.localStorage);
  events.push({
    name,
    properties,
    timestamp: new Date().toISOString(),
  });

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
  } catch {
    // Analytics must never interrupt a shopping action.
  }
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

  return {
    totalEvents: recent.length,
    productClicks,
    quickAdds,
    wishlists: counts.wishlist_click || 0,
    conversionRate: productClicks ? Math.round((quickAdds / productClicks) * 100) : 0,
    topProducts: [...products.values()]
      .sort((a, b) => (b.clicks + b.quickAdds + b.wishlists) - (a.clicks + a.quickAdds + a.wishlists))
      .slice(0, 5),
  };
}

export function getAnalyticsSummary() {
  const storage = typeof window === "undefined" ? null : window.localStorage;
  return summarizeEvents(readEvents(storage));
}
