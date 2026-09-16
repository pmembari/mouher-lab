import assert from "node:assert/strict";
import test from "node:test";

import {
  createKeycloakAuth,
  isKeycloakConfigured,
} from "./keycloakAuth.js";

const CONFIG = {
  url: "https://auth.example.test",
  realm: "mouher",
  clientId: "mouher-frontend",
};

test("detects complete Keycloak configuration", () => {
  assert.equal(isKeycloakConfigured(CONFIG), true);
  assert.equal(isKeycloakConfigured({ ...CONFIG, clientId: "" }), false);
  assert.equal(isKeycloakConfigured({ ...CONFIG, realm: "" }), false);
  assert.equal(isKeycloakConfigured({ ...CONFIG, url: "" }), false);
});

test("initializes a Keycloak session and maps token claims to the account user", async () => {
  const { KeycloakAdapter, calls } = fakeKeycloakAdapter({
    token: "access-token",
    tokenParsed: {
      sub: "user-123",
      given_name: "Parham",
      family_name: "Mouher",
      email: "parham@example.test",
    },
  });
  const auth = createKeycloakAuth({ KeycloakAdapter });

  const session = await auth.initKeycloakSession(CONFIG);

  assert.deepEqual(calls[0], {
    method: "constructor",
    config: CONFIG,
  });
  assert.deepEqual(calls[1], {
    method: "init",
    options: {
      onLoad: "check-sso",
      pkceMethod: "S256",
      checkLoginIframe: false,
    },
  });
  assert.deepEqual(session, {
    configured: true,
    authenticated: true,
    user: {
      id: "user-123",
      name: "Parham Mouher",
      email: "parham@example.test",
    },
    token: "access-token",
  });
});

test("starts Keycloak login with the storefront redirect URI", async () => {
  const { KeycloakAdapter, calls } = fakeKeycloakAdapter();
  const auth = createKeycloakAuth({ KeycloakAdapter });

  await auth.initKeycloakSession(CONFIG);
  await auth.loginWithKeycloak({
    redirectUri: "https://shop.example.test/account",
  });

  assert.deepEqual(calls.at(-1), {
    method: "login",
    options: {
      redirectUri: "https://shop.example.test/account",
    },
  });
});

test("starts Keycloak registration from the same initialized client", async () => {
  const { KeycloakAdapter, calls } = fakeKeycloakAdapter();
  const auth = createKeycloakAuth({ KeycloakAdapter });

  await auth.initKeycloakSession(CONFIG);
  await auth.registerWithKeycloak({
    redirectUri: "https://shop.example.test/account",
  });

  assert.deepEqual(calls.at(-1), {
    method: "register",
    options: {
      redirectUri: "https://shop.example.test/account",
    },
  });
});

test("logs out through Keycloak with the current page as redirect target", async () => {
  const { KeycloakAdapter, calls } = fakeKeycloakAdapter();
  const auth = createKeycloakAuth({
    KeycloakAdapter,
    getCurrentUrl: () => "https://shop.example.test/account",
  });

  await auth.initKeycloakSession(CONFIG);
  await auth.logoutFromKeycloak();

  assert.deepEqual(calls.at(-1), {
    method: "logout",
    options: {
      redirectUri: "https://shop.example.test/account",
    },
  });
});

test("refreshes and returns the bearer token for authenticated sessions", async () => {
  const { KeycloakAdapter, calls } = fakeKeycloakAdapter({
    token: "fresh-token",
  });
  const auth = createKeycloakAuth({ KeycloakAdapter });

  await auth.initKeycloakSession(CONFIG);
  const token = await auth.keycloakBearerToken();

  assert.equal(token, "fresh-token");
  assert.deepEqual(calls.at(-1), {
    method: "updateToken",
    minValidity: 30,
  });
});

function fakeKeycloakAdapter({
  authenticated = true,
  token = "access-token",
  tokenParsed = {
    sub: "user-123",
    name: "Parham",
    email: "parham@example.test",
  },
} = {}) {
  const calls = [];

  class KeycloakAdapter {
    constructor(config) {
      this.authenticated = false;
      this.token = token;
      this.tokenParsed = tokenParsed;

      calls.push({
        method: "constructor",
        config,
      });
    }

    init(options) {
      this.authenticated = authenticated;
      calls.push({
        method: "init",
        options,
      });

      return Promise.resolve(authenticated);
    }

    login(options) {
      calls.push({
        method: "login",
        options,
      });

      return Promise.resolve();
    }

    register(options) {
      calls.push({
        method: "register",
        options,
      });

      return Promise.resolve();
    }

    logout(options) {
      calls.push({
        method: "logout",
        options,
      });

      return Promise.resolve();
    }

    updateToken(minValidity) {
      calls.push({
        method: "updateToken",
        minValidity,
      });

      return Promise.resolve(true);
    }
  }

  return { KeycloakAdapter, calls };
}
