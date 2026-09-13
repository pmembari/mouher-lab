import Keycloak from "keycloak-js";

const config = {
  url: import.meta.env.VITE_KEYCLOAK_URL || "",
  realm: import.meta.env.VITE_KEYCLOAK_REALM || "",
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || "",
};

let client;

export function isKeycloakConfigured() {
  return Boolean(config.url && config.realm && config.clientId);
}

function getClient() {
  if (!isKeycloakConfigured()) return null;
  if (!client) client = new Keycloak(config);
  return client;
}

export async function initKeycloakSession() {
  const keycloak = getClient();
  if (!keycloak) return { authenticated: false, user: null };

  const authenticated = await keycloak.init({
    onLoad: "check-sso",
    pkceMethod: "S256",
    checkLoginIframe: false,
  });

  return {
    authenticated,
    user: authenticated ? {
      id: keycloak.subject || "",
      name: keycloak.tokenParsed?.name || keycloak.tokenParsed?.preferred_username || "",
      email: keycloak.tokenParsed?.email || "",
    } : null,
  };
}

export function loginWithKeycloak({ redirectUri = window.location.href } = {}) {
  return getClient()?.login({ redirectUri });
}

export function registerWithKeycloak({ redirectUri = window.location.href } = {}) {
  return getClient()?.register({ redirectUri });
}

export function logoutFromKeycloak({ redirectUri = window.location.origin } = {}) {
  return getClient()?.logout({ redirectUri });
}
