import {
  currentMouherCatalog,
} from "../../data/currentMouherCatalog.js";

import {
  demoCatalog,
} from "../../data/demoCatalog.js";

export const CATEGORY_LABELS = {
  "پیراهن": {
    name: "Shirts",
    nameFa: "پیراهن",
    slug: "shirts",
  },

  "تیشرت": {
    name: "T-shirts",
    nameFa: "تیشرت",
    slug: "t-shirts",
  },

  "شلوار": {
    name: "Trousers",
    nameFa: "شلوار",
    slug: "trousers",
  },

  "کت": {
    name: "Coats",
    nameFa: "کت",
    slug: "coats",
  },

  "ست": {
    name: "Sets",
    nameFa: "ست",
    slug: "sets",
  },

  "اکسسوری": {
    name: "Accessories",
    nameFa: "اکسسوری",
    slug: "accessories",
  },

  "پوشاک": {
    name: "Clothing",
    nameFa: "پوشاک",
    slug: "clothing",
  },
};

export const DEFAULT_PAGE_SIZE = 30;

export const MAX_PAGE_SIZE = 100;

export const DEFAULT_PRODUCT_FIELDS = [
  "id",
  "title",
  "handle",
  "description",
  "thumbnail",

  "created_at",
  "updated_at",

  "*images",

  "*variants",
  "*variants.calculated_price",
  "*variants.prices",

  "*categories",
  "*collection",
  "*tags",
].join(",");

export const FALLBACK_CATALOG =
  currentMouherCatalog ||
  demoCatalog;

export const EMPTY_CATALOG = {
  products: [],
  categories: [],
  collections: [],

  source: "api",

  featuredImage: "",

  merchandising: {},

  notice: "",
};

export const EMPTY_PAGINATION = {
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,

  offset: 0,

  count: 0,
  total: 0,
  totalPages: 0,

  hasPrevious: false,
  hasNext: false,
};

export const DEFAULT_CATALOG_FILTERS = {
  query: "",

  category: "all",
  collection: "all",

  minPrice: "",
  maxPrice: "",

  size: "all",
  color: "all",

  inStock: false,
  sale: false,

  sort: "featured",
};