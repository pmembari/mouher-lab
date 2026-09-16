import Keycloak from "keycloak-js";

const viteEnv = import.meta.env || {};

export const keycloakConfig = {
  url: stripTrailingSlash(viteEnv.VITE_KEYCLOAK_URL || ""),
  realm: viteEnv.VITE_KEYCLOAK_REALM || "",
  clientId: viteEnv.VITE_KEYCLOAK_CLIENT_ID || "",
};

let keycloakClient = null;
let initPromise = null;

export function createKeycloakAuth({
  KeycloakAdapter = Keycloak,
  defaultConfig = keycloakConfig,
  getCurrentUrl = browserCurrentUrl,
} = {}) {
  let client = null;
  let initialization = null;

  function isConfigured(config = defaultConfig) {
    return Boolean(config.url && config.realm && config.clientId);
  }

  async function initSession(config = defaultConfig) {
    if (!isConfigured(config)) {
      return {
        configured: false,
        authenticated: false,
        user: null,
        token: "",
      };
    }

    if (!client) {
      client = new KeycloakAdapter({
        url: config.url,
        realm: config.realm,
        clientId: config.clientId,
      });
    }

    if (!initialization) {
      initialization = client.init({
        onLoad: "check-sso",
        pkceMethod: "S256",
        checkLoginIframe: false,
      });
    }

    const authenticated = await initialization;

    return {
      configured: true,
      authenticated,
      user: keycloakUser(client),
      token: client.token || "",
    };
  }

  function login(options = {}) {
    if (!client) return Promise.resolve();

    return client.login(options);
  }

  function register(options = {}) {
    if (!client) return Promise.resolve();

    return client.register(options);
  }

  function logout(options = {}) {
    if (!client) return Promise.resolve();

    return client.logout({
      redirectUri: getCurrentUrl(),
      ...options,
    });
  }

  async function bearerToken() {
    if (!client?.authenticated) return "";

    await client.updateToken(30);

    return client.token || "";
  }

  return {
    isKeycloakConfigured: isConfigured,
    initKeycloakSession: initSession,
    loginWithKeycloak: login,
    registerWithKeycloak: register,
    logoutFromKeycloak: logout,
    keycloakBearerToken: bearerToken,
  };
}

const defaultKeycloakAuth = createKeycloakAuth({
  KeycloakAdapter: Keycloak,
  defaultConfig: keycloakConfig,
  getCurrentUrl: browserCurrentUrl,
});

export const isKeycloakConfigured = defaultKeycloakAuth.isKeycloakConfigured;
export const initKeycloakSession = defaultKeycloakAuth.initKeycloakSession;
export const loginWithKeycloak = defaultKeycloakAuth.loginWithKeycloak;
export const registerWithKeycloak = defaultKeycloakAuth.registerWithKeycloak;
export const logoutFromKeycloak = defaultKeycloakAuth.logoutFromKeycloak;
export const keycloakBearerToken = defaultKeycloakAuth.keycloakBearerToken;

function keycloakUser(client) {
  const token = client?.tokenParsed || {};
  const name =
    token.name ||
    [token.given_name, token.family_name].filter(Boolean).join(" ") ||
    token.preferred_username ||
    "";

  return {
    id: token.sub || "",
    name,
    email: token.email || "",
  };
}

function stripTrailingSlash(value) {
  return String(value || "").replace(/\/$/, "");
}

function browserCurrentUrl() {
  if (typeof window === "undefined") return "";

  return window.location.href;
}
