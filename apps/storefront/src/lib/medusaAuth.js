import { getMedusaSdk } from "./medusaSdk.js";

export async function loginCustomer(email, password) {
  const sdk = getMedusaSdk();

  const result = await sdk.auth.login(
    "customer",
    "emailpass",
    {
      email,
      password,
    }
  );

  assertAuthCompleted(result);

  const customer = await loadCurrentCustomer();

  if (!customer) {
    throw new Error(
      "Authentication succeeded, but no Medusa customer profile was found for this account."
    );
  }

  return customer;
}

export async function registerCustomer({
  email,
  password,
  firstName = "",
  lastName = "",
}) {
  const sdk = getMedusaSdk();
  let authenticatedExistingIdentity = false;
  let authResult;

  try {
    authResult = await sdk.auth.register(
      "customer",
      "emailpass",
      {
        email,
        password,
      }
    );
  } catch (error) {
    if (!isExistingIdentityError(error)) {
      throw error;
    }

    authResult = await sdk.auth.login(
      "customer",
      "emailpass",
      {
        email,
        password,
      }
    );

    authenticatedExistingIdentity = true;
  }

  assertAuthCompleted(authResult);

  if (authenticatedExistingIdentity) {
    const existingCustomer =
      await loadCurrentCustomer();

    if (existingCustomer) {
      return existingCustomer;
    }
  }

  await sdk.store.customer.create({
    email,
    first_name: firstName,
    last_name: lastName,
  });

  // The registration token is used to create the customer. Log in once
  // more so the SDK stores a normal customer JWT for subsequent requests.
  const loginResult = await sdk.auth.login(
    "customer",
    "emailpass",
    {
      email,
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
    const payload =
      await sdk.store.customer.retrieve();

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

function assertAuthCompleted(result) {
  if (typeof result === "string") {
    return;
  }

  if (result?.verification_required) {
    throw new Error(
      "Please verify your email address before signing in."
    );
  }

  if (result?.location) {
    throw new Error(
      "This account requires an additional authentication step."
    );
  }

  throw new Error(
    "Medusa authentication did not complete successfully."
  );
}

function isExistingIdentityError(error) {
  const message = String(
    error?.message || ""
  ).toLowerCase();

  return (
    message.includes("identity") &&
    (
      message.includes("already") ||
      message.includes("exists")
    )
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
