const viteEnv = import.meta.env || {};

export const mouherApiConfig = {
  baseUrl: String(
    viteEnv.VITE_MEDUSA_BACKEND_URL || ""
  ).replace(/\/$/, ""),
  workerUrl:
    `${viteEnv.BASE_URL || "/"}mouher-push-worker.js`,
};

export function supportsBrowserPush(environment = browserEnvironment()) {
  return Boolean(
    environment.window?.Notification &&
      environment.navigator?.serviceWorker &&
      environment.window?.PushManager
  );
}

export async function loadLoyaltyPushConfig(config = mouherApiConfig) {
  if (!config.baseUrl) {
    return {
      enabled: false,
      public_key: "",
      delivery: "browser_push",
      supported_browsers: ["Chrome", "Safari", "Edge", "Firefox"],
    };
  }

  const response = await fetch(`${config.baseUrl}/loyalty/push/config/`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Loyalty push config failed: ${response.status}`);
  }

  return response.json();
}

export async function requestLoyaltyPushSubscription({
  customerId = "",
  config = mouherApiConfig,
  environment = browserEnvironment(),
} = {}) {
  if (!supportsBrowserPush(environment)) {
    return {
      ok: false,
      reason: "unsupported",
    };
  }

  if (environment.window.Notification.permission === "denied") {
    return {
      ok: false,
      reason: "blocked",
    };
  }

  const pushConfig = await loadLoyaltyPushConfig(config);
  if (!pushConfig.enabled || !pushConfig.public_key) {
    return {
      ok: false,
      reason: "not_configured",
    };
  }

  const permission = await environment.window.Notification.requestPermission();
  if (permission !== "granted") {
    return {
      ok: false,
      reason: "not_granted",
    };
  }

  const registration = await environment.navigator.serviceWorker.register(
    config.workerUrl
  );
  const existingSubscription =
    await registration.pushManager.getSubscription();
  const subscription =
    existingSubscription ||
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(pushConfig.public_key),
    }));

  const response = await fetch(`${config.baseUrl}/loyalty/push/subscriptions/`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      customer_id: customerId,
      subscription: subscription.toJSON(),
    }),
  });

  if (!response.ok) {
    throw new Error(`Loyalty push subscription failed: ${response.status}`);
  }

  return {
    ok: true,
    result: await response.json(),
  };
}

export function urlBase64ToUint8Array(value) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = `${value}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    output[index] = rawData.charCodeAt(index);
  }

  return output;
}

function browserEnvironment() {
  return {
    navigator: typeof navigator === "undefined" ? null : navigator,
    window: typeof window === "undefined" ? null : window,
  };
}

function stripTrailingSlash(value) {
  return String(value || "").replace(/\/$/, "");
}
