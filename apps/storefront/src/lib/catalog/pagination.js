import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from "./constants";

import {
  normalizePage,
  normalizePageSize,
} from "./helpers";

export function buildPagination({
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  total = 0,
  count = 0,
} = {}) {
  const safePage =
    normalizePage(page);

  const safePageSize =
    normalizePageSize(
      pageSize,
      {
        defaultPageSize:
          DEFAULT_PAGE_SIZE,

        maxPageSize:
          MAX_PAGE_SIZE,
      }
    );

  const safeTotal =
    normalizeTotal(total);

  const totalPages =
    safeTotal > 0
      ? Math.ceil(
        safeTotal /
        safePageSize
      )
      : 0;

  const clampedPage =
    totalPages > 0
      ? Math.min(
        safePage,
        totalPages
      )
      : 1;

  const offset =
    (clampedPage - 1) *
    safePageSize;

  const safeCount =
    Math.max(
      0,
      Number(count) || 0
    );

  return {
    page:
      clampedPage,

    pageSize:
      safePageSize,

    offset,

    count:
      safeCount,

    total:
      safeTotal,

    totalPages,

    hasPrevious:
      clampedPage > 1,

    hasNext:
      totalPages > 0 &&
      clampedPage <
      totalPages,
  };
}

export function getPaginationInput({
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
} = {}) {
  const normalizedPage =
    normalizePage(page);

  const normalizedPageSize =
    normalizePageSize(
      pageSize,
      {
        defaultPageSize:
          DEFAULT_PAGE_SIZE,

        maxPageSize:
          MAX_PAGE_SIZE,
      }
    );

  const offset =
    (normalizedPage - 1) *
    normalizedPageSize;

  return {
    page:
      normalizedPage,

    pageSize:
      normalizedPageSize,

    offset,

    limit:
      normalizedPageSize,
  };
}

export function paginateItems(
  items,
  {
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
  } = {}
) {
  const source =
    Array.isArray(items)
      ? items
      : [];

  const input =
    getPaginationInput({
      page,
      pageSize,
    });

  const total =
    source.length;

  const totalPages =
    total > 0
      ? Math.ceil(
        total /
        input.pageSize
      )
      : 0;

  const safePage =
    totalPages > 0
      ? Math.min(
        input.page,
        totalPages
      )
      : 1;

  const offset =
    (safePage - 1) *
    input.pageSize;

  const products =
    source.slice(
      offset,
      offset +
      input.pageSize
    );

  return {
    items:
      products,

    pagination:
      buildPagination({
        page:
          safePage,

        pageSize:
          input.pageSize,

        total,

        count:
          products.length,
      }),
  };
}

function normalizeTotal(
  value
) {
  const number =
    Number(value);

  if (
    !Number.isFinite(
      number
    ) ||
    number < 0
  ) {
    return 0;
  }

  return Math.floor(
    number
  );
}