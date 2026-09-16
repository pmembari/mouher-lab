export function getRouteFromHash() {
  const hash =
    typeof window === "undefined"
      ? ""
      : window.location.hash;

  const value = hash.replace(/^#\/?/, "");

  if (value.startsWith("products/")) {
    return {
      type: "product",
      handle: decodeRoutePart(
        value
          .replace(/^products\//, "")
          .split(/[?#]/)[0]
      ),
    };
  }

  if (value === "owner") {
    return { type: "owner" };
  }

  if (value === "developer") {
    return { type: "developer" };
  }

  if (value === "assist") {
    return { type: "assist" };
  }

  if (value === "account") {
    return { type: "account" };
  }

  return {
    type: "home",
    section: value.replace(/^#/, "") || "new",
  };
}

export function decodeRoutePart(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}