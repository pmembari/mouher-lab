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
  phone,
  captchaToken,
}) {
  const sdk = getMedusaSdk();
  const normalizedPhone = normalizeMobilePhone(phone);
  const token = String(captchaToken || "").trim();

  if (!isValidMobilePhone(normalizedPhone)) {
    throw new Error(
      "Enter a valid mobile phone number, including the country code."
    );
  }

  if (!token) {
    throw new Error(
      "Complete the security check before creating your account."
    );
  }

  // sdk.auth.register doesn't accept custom request headers. Use the SDK's
  // low-level client for the built-in registration route so the backend can
  // verify the Turnstile token before Medusa creates the auth identity.
  const registration = await sdk.client.fetch(
    "/auth/customer/emailpass/register",
    {
      method: "POST",
      headers: {
        "x-turnstile-token": token,
      },
      body: {
        email,
        password,
      },
    }
  );

  const registrationToken = registration?.token;

  if (!registrationToken) {
    throw new Error(
      "Medusa registration completed without returning an account token."
    );
  }

  // The registration JWT has no customer actor attached yet, so pass it
  // explicitly while creating the Medusa customer profile. The SDK method's
  // second argument is query params and the third is request headers.
  await sdk.store.customer.create(
    {
      email,
      first_name: firstName,
      last_name: lastName,
      phone: normalizedPhone,
    },
    undefined,
    {
      authorization: `Bearer ${registrationToken}`,
    }
  );

  // Store a normal customer JWT in the SDK after the actor profile exists.
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

  if (result?.mfa_required) {
    throw new Error(
      "This account requires an additional authentication step."
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
