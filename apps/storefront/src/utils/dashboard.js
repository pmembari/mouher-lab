export function formatCompactAmount(amount) {
  const value = Number(amount);

  if (!Number.isFinite(value) || value <= 0) {
    return "Preview";
  }

  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B IRR`;
  }

  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M IRR`;
  }

  return `${Math.round(value).toLocaleString("en-US")} IRR`;
}

export function catalogMetrics(catalog) {
  const products = catalog?.products || [];

  const lowStockProducts = products.filter((product) => {
    const stock = Number(product.stockCount);

    return (
      Number.isFinite(stock) &&
      stock > 0 &&
      stock <= 5
    );
  });

  const saleProducts = products.filter(
    (product) =>
      Number(product.compareAtAmount) >
      Number(product.priceAmount)
  );

  const inventoryUnits = products.reduce(
    (total, product) => {
      const stock = Number(product.stockCount);

      return Number.isFinite(stock) && stock > 0
        ? total + stock
        : total;
    },
    0
  );

  const inventoryValue = products.reduce(
    (total, product) => {
      const stock = Number(product.stockCount);
      const price = Number(product.priceAmount);

      return (
        Number.isFinite(stock) &&
        stock > 0 &&
        Number.isFinite(price)
      )
        ? total + stock * price
        : total;
    },
    0
  );

  return {
    products,
    totalProducts: products.length,
    inStockProducts: products.filter(
      (product) => product.inStock !== false
    ).length,
    lowStockProducts,
    saleProducts,
    inventoryUnits,
    inventoryValue,
  };
}

export function medusaFeatureRows(metrics, labels) {
  return [
    {
      id: "orders",
      title: "Orders",
      titleFa: "سفارش‌ها",
      metric: "0",
      detail:
        "Payment, fulfillment, returns, exchanges",
      detailFa:
        "پرداخت، ارسال، مرجوعی و تعویض",
    },
    {
      id: "products",
      title: "Products",
      titleFa: "محصولات",
      metric: String(metrics.totalProducts),
      detail:
        "Variants, categories, collections, product options",
      detailFa:
        "وریانت، دسته‌بندی، کالکشن و گزینه‌های محصول",
    },
    {
      id: "inventory",
      title: "Inventory",
      titleFa: "موجودی",
      metric: String(metrics.inventoryUnits),
      detail:
        "Stock locations, availability, reservations",
      detailFa:
        "مکان‌های انبار، دسترسی و رزرو موجودی",
    },
    {
      id: "customers",
      title: "Customers",
      titleFa: "مشتریان",
      metric: "0",
      detail:
        "Accounts, guest customers, customer groups",
      detailFa:
        "حساب‌ها، مشتری مهمان و گروه‌های مشتری",
    },
    {
      id: "promotions",
      title: "Promotions",
      titleFa: "پروموشن‌ها",
      metric: String(metrics.saleProducts.length),
      detail:
        "Coupons, automatic discounts, campaign budgets",
      detailFa:
        "کد تخفیف، تخفیف خودکار و بودجه کمپین",
    },
    {
      id: "price-lists",
      title: "Price Lists",
      titleFa: "لیست قیمت",
      metric: "1",
      detail:
        "Sale prices and group-specific price overrides",
      detailFa:
        "قیمت تخفیفی و قیمت اختصاصی گروه مشتری",
    },
    {
      id: "loyalty",
      title: "Loyalty",
      titleFa: "وفاداری",
      metric: "Web Push",
      detail:
        "Reward notices sent through opted-in Chrome and Safari browsers",
      detailFa:
        "اعلان پاداش از طریق مرورگرهای کروم و سافاری با اجازه مشتری",
    },
  ].map((feature) => ({
    ...feature,
    status:
      feature.metric === "0"
        ? labels.needsApi
        : labels.ready,
  }));
}