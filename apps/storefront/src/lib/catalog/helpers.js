export function slugify(value) {
  const slug = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "collection";
}

export function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

export function normalizeFilterValue(value) {
  return (
    normalizeText(value) ||
    "all"
  );
}

export function normalizePage(value) {
  const number = Math.floor(
    Number(value)
  );

  return (
    Number.isFinite(number) &&
    number > 0
  )
    ? number
    : 1;
}

export function normalizePageSize(
  value,
  {
    defaultPageSize = 30,
    maxPageSize = 100,
  } = {}
) {
  const number = Math.floor(
    Number(value)
  );

  if (
    !Number.isFinite(number) ||
    number <= 0
  ) {
    return defaultPageSize;
  }

  return Math.min(
    number,
    maxPageSize
  );
}

export function finiteNumber(value) {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

export function optionalNumber(value) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return undefined;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : undefined;
}

export function firstValue(value) {
  return Array.isArray(value)
    ? value[0]
    : value;
}

export function toArray(value) {
  return Array.isArray(value)
    ? value
    : [];
}

export function truthy(value) {
  if (
    typeof value ===
    "boolean"
  ) {
    return value;
  }

  return [
    "1",
    "true",
    "yes",
    "on",
  ].includes(
    String(value || "")
      .trim()
      .toLowerCase()
  );
}

export function stripTrailingSlash(
  value
) {
  return String(value || "")
    .replace(/\/$/, "");
}

export function compareNullableNumbers(
  left,
  right,
  direction = "asc"
) {
  if (
    left === null &&
    right === null
  ) {
    return 0;
  }

  if (left === null) {
    return 1;
  }

  if (right === null) {
    return -1;
  }

  return direction === "desc"
    ? right - left
    : left - right;
}

export function compareNatural(
  left,
  right
) {
  return String(left).localeCompare(
    String(right),
    undefined,
    {
      numeric: true,
      sensitivity: "base",
    }
  );
}

export function getProductTimestamp(
  product
) {
  const candidates = [
    product?.createdAt,
    product?.created_at,
    product?.publishedAt,
    product?.published_at,
    product?.updatedAt,
    product?.updated_at,
  ];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    const timestamp =
      Date.parse(candidate);

    if (
      Number.isFinite(timestamp)
    ) {
      return timestamp;
    }
  }

  return null;
}