export function getRouteFromHash() {
  const hash =
    typeof window === "undefined"
      ? ""
      : window.location.hash;

  const rawValue = hash.replace(/^#\/?/, "");

  const [pathPart, queryString = ""] =
    rawValue.split("?");

  const value = pathPart.replace(/\/+$/, "");

  const params = new URLSearchParams(
    queryString
  );

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

  if (value === "shop") {
    return {
      type: "shop",

      query:
        params.get("q") || "",

      category:
        params.get("category") || "all",

      collection:
        params.get("collection") || "all",

      minPrice:
        params.get("minPrice") || "",

      maxPrice:
        params.get("maxPrice") || "",

      size:
        params.get("size") || "all",

      color:
        params.get("color") || "all",

      inStock:
        params.get("inStock") === "true",

      sale:
        params.get("sale") === "true",

      sort:
        params.get("sort") || "featured",

      page:
        normalizePositiveInteger(
          params.get("page"),
          1
        ),

      pageSize:
        normalizePageSize(
          params.get("pageSize"),
          30
        ),
    };
  }

  if (value.startsWith("categories/")) {
    return {
      type: "category",

      slug: decodeRoutePart(
        value.replace(
          /^categories\//,
          ""
        )
      ),

      minPrice:
        params.get("minPrice") || "",

      maxPrice:
        params.get("maxPrice") || "",

      size:
        params.get("size") || "all",

      color:
        params.get("color") || "all",

      inStock:
        params.get("inStock") === "true",

      sale:
        params.get("sale") === "true",

      sort:
        params.get("sort") || "featured",

      page:
        normalizePositiveInteger(
          params.get("page"),
          1
        ),

      pageSize:
        normalizePageSize(
          params.get("pageSize"),
          30
        ),
    };
  }

  if (value.startsWith("collections/")) {
    return {
      type: "collection",

      slug: decodeRoutePart(
        value.replace(
          /^collections\//,
          ""
        )
      ),

      minPrice:
        params.get("minPrice") || "",

      maxPrice:
        params.get("maxPrice") || "",

      size:
        params.get("size") || "all",

      color:
        params.get("color") || "all",

      inStock:
        params.get("inStock") === "true",

      sale:
        params.get("sale") === "true",

      sort:
        params.get("sort") || "featured",

      page:
        normalizePositiveInteger(
          params.get("page"),
          1
        ),

      pageSize:
        normalizePageSize(
          params.get("pageSize"),
          30
        ),
    };
  }

  if (value === "search") {
    return {
      type: "search",

      query:
        params.get("q") || "",

      category:
        params.get("category") || "all",

      collection:
        params.get("collection") || "all",

      minPrice:
        params.get("minPrice") || "",

      maxPrice:
        params.get("maxPrice") || "",

      size:
        params.get("size") || "all",

      color:
        params.get("color") || "all",

      inStock:
        params.get("inStock") === "true",

      sale:
        params.get("sale") === "true",

      sort:
        params.get("sort") || "featured",

      page:
        normalizePositiveInteger(
          params.get("page"),
          1
        ),

      pageSize:
        normalizePageSize(
          params.get("pageSize"),
          30
        ),
    };
  }

  if (value === "owner") {
    return {
      type: "owner",
    };
  }

  if (value === "developer") {
    return {
      type: "developer",
    };
  }

  if (value === "assist") {
    return {
      type: "assist",
    };
  }

  if (value === "account") {
    return {
      type: "account",
    };
  }

  return {
    type: "home",

    section:
      value.replace(/^#/, "") ||
      "new",
  };
}

export function decodeRoutePart(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizePositiveInteger(
  value,
  fallback
) {
  const parsed =
    Number.parseInt(
      value,
      10
    );

  if (
    !Number.isFinite(parsed) ||
    parsed < 1
  ) {
    return fallback;
  }

  return parsed;
}

function normalizePageSize(
  value,
  fallback
) {
  const parsed =
    normalizePositiveInteger(
      value,
      fallback
    );

  return Math.min(
    parsed,
    100
  );
}