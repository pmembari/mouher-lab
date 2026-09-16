const backendUrl = String(
  import.meta.env?.VITE_MEDUSA_BACKEND_URL || ""
).replace(/\/$/, "");

function requireBackend() {
  if (!backendUrl) {
    throw new Error("Medusa backend is not configured.");
  }
}

async function request(path, options = {}) {
  requireBackend();

  const response = await fetch(`${backendUrl}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body
        ? { "Content-Type": "application/json" }
        : {}),
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      payload?.message ||
      payload?.error?.message ||
      `Authentication request failed: ${response.status}`
    );
  }

  return payload;
}

export async function loginCustomer(email, password) {
  const auth = await request("/auth/customer/emailpass", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });

  if (!auth?.token) {
    throw new Error("Medusa did not return an authentication token.");
  }

  await request("/auth/session", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.token}`,
    },
  });

  return loadCurrentCustomer();
}

export async function registerCustomer({
  email,
  password,
  firstName = "",
  lastName = "",
}) {
  const auth = await request("/auth/customer/emailpass/register", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });

  if (!auth?.token) {
    throw new Error("Medusa did not return a registration token.");
  }

  await request("/store/customers", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "x-publishable-api-key":
        import.meta.env?.VITE_MEDUSA_PUBLISHABLE_KEY || "",
    },
    body: JSON.stringify({
      email,
      first_name: firstName,
      last_name: lastName,
    }),
  });

  await request("/auth/session", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.token}`,
    },
  });

  return loadCurrentCustomer();
}

export async function loadCurrentCustomer() {
  try {
    const payload = await request("/store/customers/me", {
      headers: {
        "x-publishable-api-key":
          import.meta.env?.VITE_MEDUSA_PUBLISHABLE_KEY || "",
      },
    });

    return payload?.customer || null;
  } catch {
    return null;
  }
}

export async function logoutCustomer() {
  await request("/auth/session", {
    method: "DELETE",
  });
}