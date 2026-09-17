import { getMedusaSdk } from "./medusaSdk.js";

export async function loginCustomer(email, password) {
  const sdk = getMedusaSdk();
  const normalizedEmail = String(email || "").trim();

  const result = await sdk.auth.login(
    "customer",
    "emailpass",
    {
      email: normalizedEmail,
      password,
    }
  );

  assertAuthCompleted(result);

  const customer = await loadCurrentCustomer();

  if (!customer) {
    throw new Error(
      "Authentication succeeded, but the Medusa customer profile could not be loaded."
    );
  }

  return customer;
}

export async function registerCustomer({
  email,
  password,
  firstName = "",
  lastName = "",
  phone,
}) {
  const sdk = getMedusaSdk();
  const normalizedEmail = String(email || "").trim();
  const normalizedPhone = normalizeMobilePhone(phone);

  if (!normalizedEmail || !password) {
    throw new Error("Email and password are required.");
  }

  if (!isValidMobilePhone(normalizedPhone)) {
    throw new Error(
      "Enter a valid mobile phone number, including the country code."
    );
  }

  // Medusa's register call stores the registration JWT in the SDK client.
  // The following customer.create call automatically reuses that token.
  await sdk.auth.register(
    "customer",
    "emailpass",
    {
      email: normalizedEmail,
      password,
    }
  );

  await sdk.store.customer.create({
    email: normalizedEmail,
    first_name: firstName,
    last_name: lastName,
    phone: normalizedPhone,
  });

  // Start a normal customer session after the customer actor has been created.
  const loginResult = await sdk.auth.login(
    "customer",
    "emailpass",
    {
      email: normalizedEmail,
      password,
    }
  );

  assertAuthCompleted(loginResult);

  const customer = await loadCurrentCustomer();

  if (!customer) {
    throw new Error(
      "Your account was created, but the customer profile could not be loaded. Please sign in again."
    );
  }

  return customer;
}

export async function loadCurrentCustomer() {
  const sdk = getMedusaSdk();

  try {
    const payload = await sdk.store.customer.retrieve();
    return payload?.customer || null;
  } catch (error) {
    if (isUnauthenticatedError(error)) {
      return null;
    }

    throw error;
  }
}

export async function logoutCustomer() {
  const sdk = getMedusaSdk();
  await sdk.auth.logout();
}

export function normalizeMobilePhone(value) {
  const raw = String(value || "").trim();

  if (!raw) {
    return "";
  }

  const compact = raw.replace(/[\s().-]/g, "");

  if (/^09\d{9}$/.test(compact)) {
    return `+98${compact.slice(1)}`;
  }

  if (/^98\d{10}$/.test(compact)) {
    return `+${compact}`;
  }

  if (/^00\d+$/.test(compact)) {
    return `+${compact.slice(2)}`;
  }

  return compact;
}

export function isValidMobilePhone(value) {
  return /^\+[1-9]\d{7,14}$/.test(String(value || ""));
}

function assertAuthCompleted(result) {
  if (typeof result === "string") {
    return;
  }

  if (result?.verification_required) {
    throw new Error(
      "Please verify your email address before signing in."
    );
  }

  if (result?.mfa_required || result?.location) {
    throw new Error(
      "This account requires an additional authentication step."
    );
  }

  throw new Error(
    "Medusa authentication did not complete successfully."
  );
}

function isUnauthenticatedError(error) {
  const status = Number(
    error?.status ||
    error?.response?.status ||
    error?.statusCode
  );

  if (status === 401 || status === 403) {
    return true;
  }

  const message = String(
    error?.message || ""
  ).toLowerCase();

  return (
    message.includes("unauthorized") ||
    message.includes("not authenticated")
  );
}
