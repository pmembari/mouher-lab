import { useEffect, useMemo, useState } from "react";
import { getAnalyticsSummary, trackEvent } from "./lib/analytics";
import {
  addProductToCart,
  isMedusaConfigured,
  loadCatalog,
  medusaConfig,
} from "./lib/catalog";
import {
  mouherApiConfig,
  requestLoyaltyPushSubscription,
  supportsBrowserPush,
} from "./lib/notifications";

const content = {
  pinglish: {
    announcement: "Ersal رایگان baraye sefaresh-haye balaye €150",
    nav: {
      newIn: "New edit",
      collections: "Collections",
      shop: "Shop",
      owner: "Owner",
      developer: "Developer",
      assist: "Assist",
    },
    hero: {
      eyebrow: "Mouher Studio",
      title: "Mouher\nWhat you wear",
      description:
        "Modern clothing for daily movement, built as a commerce storefront with Medusa catalog, cart and checkout foundations.",
      button: "Shop collection",
    },
    products: {
      eyebrow: "Live catalog",
      title: "New arrivals",
      shopAll: "All products",
      empty: "No products match this search.",
      sourceDemo: "Demo catalog",
      sourceLive: "Mouher.com products",
      sourceMedusa: "Medusa catalog",
      loading: "Loading catalog",
      viewLive: "View live product",
    },
    productPage: {
      back: "Back to shop",
      details: "Product details",
      category: "Category",
      collection: "Edit",
      sizes: "Sizes",
      colors: "Colors",
      stock: "Stock",
      related: "Related products",
      openLive: "Open on mouher.com",
      loading: "Loading product",
      notFoundTitle: "Product not found",
      notFoundDescription: "This product is not available in the current catalog snapshot.",
    },
    dashboard: {
      ownerEyebrow: "Owner dashboard",
      ownerTitle: "Business overview",
      ownerDescription:
        "Current catalog, stock, category and merchandising signals from the Mouher products snapshot.",
      assistEyebrow: "Website assist",
      assistTitle: "Client support desk",
      assistDescription:
        "Fast product answers, storefront checks and content tasks for the website assistant.",
      viewStore: "View store",
      websiteAssist: "Website assist",
      owner: "Owner dashboard",
      products: "Products",
      inventory: "Inventory",
      inStock: "In stock",
      lowStock: "Low stock",
      sale: "Sale",
      inventoryValue: "Inventory value",
      categoryMix: "Category mix",
      priorityProducts: "Priority products",
      operations: "Operations",
      name: "Product",
      price: "Price",
      status: "Status",
      badge: "Badge",
      action: "Action",
      open: "Open",
      live: "Live",
      ready: "Ready",
      needsApi: "Needs API",
      developerEyebrow: "Developer workspace",
      developerTitle: "Commerce implementation",
      developerDescription:
        "Protected Medusa Admin proxy, Store API checkout, and browser push delivery status.",
      accountEyebrow: "Customer workspace",
      accountTitle: "Account and loyalty",
      accountDescription:
        "Loyalty rewards are delivered through browser notifications when the customer opts in.",
      apiSurface: "API surface",
      implementationQueue: "Implementation queue",
      medusaDomains: "Medusa domains",
      storefront: "Storefront",
      backend: "Backend",
      protected: "Protected",
      public: "Public",
      browserPush: "Browser push",
      chromeSafari: "Chrome / Safari",
      search: "Search products or client questions",
      suggestedReply: "Suggested reply",
      productMatches: "Product matches",
      contentQueue: "Content queue",
      missingPhoto: "Missing product photo",
      missingColor: "Missing color data",
      missingSize: "Missing size data",
      saleBadge: "Sale badge",
      noTasks: "No urgent website tasks.",
      outOfStock: "Out of stock",
    },
    account: {
      browserPush: "Browser push",
      browserSupported: "Supported in this browser",
      browserUnsupported: "Unavailable in this browser",
      customerId: "Customer ID",
      customerPlaceholder: "cus_...",
      enable: "Enable loyalty notifications",
      enabling: "Enabling",
      active: "Loyalty notifications are active in this browser.",
      blocked: "Notifications are blocked in this browser.",
      notConfigured: "Web Push keys are not configured in Django yet.",
      notGranted: "Notification permission was not granted.",
      unsupported: "This browser cannot receive Web Push notifications here.",
      failed: "Could not enable loyalty notifications.",
      noPaidChannels: "No email, SMS, WhatsApp, or paid messaging service.",
    },
    categories: {
      eyebrow: "Shop by category",
      title: "Explore Mouher",
      all: "All",
      shop: "Shop",
    },
    collections: {
      eyebrow: "Collections",
      title: "Shop the edit",
      all: "All edits",
    },
    cart: {
      quickAdd: "Quick add",
      viewDetails: "View details",
      adding: "Adding",
      previewAdded: "Added to preview bag.",
      medusaAdded: "Added to bag.",
      unavailable: "Cart is not available. Check Medusa cart settings.",
      noVariant: "Variant needed",
      bag: "Shopping bag",
      checkout: "Checkout",
      subtotal: "Subtotal",
      empty: "Your bag is empty.",
      quantity: "Quantity",
      increase: "Increase quantity",
      decrease: "Decrease quantity",
      remove: "Remove",
      close: "Close cart",
      account: "Account",
      wishlist: "Add to wishlist",
      stockLow: "Last pieces",
      inStock: "In stock",
      snapPay: "SnapPay installment option prepared for checkout.",
    },
    checkout: {
      title: "Ready for checkout",
      description:
        "Medusa will own cart, inventory, shipping, tax and checkout. SnapPay activation needs merchant credentials and production keys.",
      customer: "Customer",
      delivery: "Delivery",
      payment: "Payment",
      snapPay: "SnapPay installments",
      card: "Card / local payment provider",
      continue: "Continue checkout",
    },
    trust: {
      shipping: "Free shipping threshold ready",
      returns: "Returns policy block ready",
      support: "Instagram support workflow ready",
    },
    search: {
      open: "Search",
      title: "Search Mouher",
      placeholder: "Search products, categories...",
      submit: "Search",
      close: "Close search",
    },
    philosophy: {
      eyebrow: "Mouher",
      title: "Made for daily rhythm.",
      description:
        "The storefront keeps the visual language minimal and lets Medusa own the catalog, inventory, cart and pricing logic.",
      button: "About Mouher",
    },
    newsletter: {
      eyebrow: "Mouher updates",
      title: "Latest from Mouher.",
      description: "Collection notes, studio news and private launch updates.",
      placeholder: "Email address",
      button: "Join",
      thanks: "Mamnoon ke be Mouher peyvasti.",
    },
    footer: {
      shop: "Shop",
      information: "Information",
      follow: "Follow",
      newIn: "New edit",
      collections: "Collections",
      allClothing: "All clothing",
      shipping: "Shipping",
      returns: "Returns",
      sizeGuide: "Size guide",
      contact: "Contact",
      instagram: "Instagram",
      pinterest: "Pinterest",
      tiktok: "TikTok",
      copyright: "© 2026 Mouher",
      privacy: "Privacy",
      terms: "Terms",
    },
  },
  farsi: {
    announcement: "ارسال رایگان برای سفارش‌های بالای €150",
    nav: {
      newIn: "کالکشن جدید",
      collections: "کالکشن‌ها",
      shop: "فروشگاه",
      owner: "مالک",
      developer: "توسعه",
      assist: "دستیار",
    },
    hero: {
      eyebrow: "استودیو موهر",
      title: "موهر\nآنچه می‌پوشی",
      description:
        "فروشگاه پوشاک مدرن با پایه مدوسا برای کاتالوگ، سبد خرید و مسیر پرداخت واقعی.",
      button: "دیدن کالکشن",
    },
    products: {
      eyebrow: "کاتالوگ زنده",
      title: "تازه‌ها",
      shopAll: "همه محصولات",
      empty: "محصولی برای این جستجو پیدا نشد.",
      sourceDemo: "کاتالوگ آزمایشی",
      sourceLive: "محصولات mouher.com",
      sourceMedusa: "کاتالوگ مدوسا",
      loading: "در حال بارگذاری",
      viewLive: "دیدن محصول در سایت",
    },
    productPage: {
      back: "بازگشت به فروشگاه",
      details: "جزئیات محصول",
      category: "دسته‌بندی",
      collection: "ادیت",
      sizes: "سایزها",
      colors: "رنگ‌ها",
      stock: "موجودی",
      related: "محصولات مرتبط",
      openLive: "باز کردن در mouher.com",
      loading: "در حال بارگذاری محصول",
      notFoundTitle: "محصول پیدا نشد",
      notFoundDescription: "این محصول در اسنپ‌شات فعلی کاتالوگ موجود نیست.",
    },
    dashboard: {
      ownerEyebrow: "داشبورد مالک",
      ownerTitle: "نمای کلی کسب‌وکار",
      ownerDescription:
        "سیگنال‌های کاتالوگ، موجودی، دسته‌بندی و مرچندایزینگ از اسنپ‌شات محصولات موهر.",
      assistEyebrow: "دستیار سایت",
      assistTitle: "میز پاسخ به مشتری",
      assistDescription:
        "پاسخ سریع محصول، بررسی ویترین و کارهای محتوایی برای دستیار وب‌سایت.",
      viewStore: "دیدن فروشگاه",
      websiteAssist: "دستیار سایت",
      owner: "داشبورد مالک",
      products: "محصولات",
      inventory: "موجودی",
      inStock: "موجود",
      lowStock: "موجودی کم",
      sale: "تخفیف‌دار",
      inventoryValue: "ارزش موجودی",
      categoryMix: "ترکیب دسته‌ها",
      priorityProducts: "محصولات اولویت‌دار",
      operations: "عملیات",
      name: "محصول",
      price: "قیمت",
      status: "وضعیت",
      badge: "برچسب",
      action: "عملیات",
      open: "باز کردن",
      live: "سایت اصلی",
      ready: "آماده",
      needsApi: "نیازمند API",
      developerEyebrow: "فضای توسعه",
      developerTitle: "پیاده‌سازی کامرس",
      developerDescription:
        "وضعیت پروکسی محافظت‌شده ادمین مدوسا، چک‌اوت Store API و ارسال پوش مرورگر.",
      accountEyebrow: "فضای مشتری",
      accountTitle: "حساب و وفاداری",
      accountDescription:
        "پاداش‌های وفاداری با اجازه مشتری از طریق اعلان مرورگر ارسال می‌شوند.",
      apiSurface: "سطح API",
      implementationQueue: "صف پیاده‌سازی",
      medusaDomains: "دامنه‌های مدوسا",
      storefront: "ویترین",
      backend: "بک‌اند",
      protected: "محافظت‌شده",
      public: "عمومی",
      browserPush: "پوش مرورگر",
      chromeSafari: "کروم / سافاری",
      search: "جستجوی محصول یا سوال مشتری",
      suggestedReply: "پاسخ پیشنهادی",
      productMatches: "نتایج محصول",
      contentQueue: "صف محتوا",
      missingPhoto: "عکس محصول ندارد",
      missingColor: "داده رنگ ندارد",
      missingSize: "داده سایز ندارد",
      saleBadge: "برچسب تخفیف",
      noTasks: "کار فوری برای سایت وجود ندارد.",
      outOfStock: "ناموجود",
    },
    account: {
      browserPush: "پوش مرورگر",
      browserSupported: "در این مرورگر پشتیبانی می‌شود",
      browserUnsupported: "در این مرورگر در دسترس نیست",
      customerId: "شناسه مشتری",
      customerPlaceholder: "cus_...",
      enable: "فعال‌سازی اعلان وفاداری",
      enabling: "در حال فعال‌سازی",
      active: "اعلان‌های وفاداری در این مرورگر فعال است.",
      blocked: "اعلان‌ها در این مرورگر مسدود شده‌اند.",
      notConfigured: "کلیدهای Web Push هنوز در جنگو تنظیم نشده‌اند.",
      notGranted: "اجازه اعلان داده نشد.",
      unsupported: "این مرورگر اینجا نمی‌تواند Web Push دریافت کند.",
      failed: "فعال‌سازی اعلان وفاداری ممکن نشد.",
      noPaidChannels: "بدون ایمیل، پیامک، واتساپ یا سرویس پیام‌رسان پولی.",
    },
    categories: {
      eyebrow: "دسته‌بندی",
      title: "موهر را کشف کن",
      all: "همه",
      shop: "مشاهده",
    },
    collections: {
      eyebrow: "کالکشن‌ها",
      title: "انتخاب کالکشن",
      all: "همه کالکشن‌ها",
    },
    cart: {
      quickAdd: "افزودن سریع",
      viewDetails: "جزئیات",
      adding: "در حال افزودن",
      previewAdded: "به سبد آزمایشی اضافه شد.",
      medusaAdded: "به سبد خرید اضافه شد.",
      unavailable: "سبد خرید در دسترس نیست. تنظیمات مدوسا را بررسی کن.",
      noVariant: "نیاز به وریانت",
      bag: "سبد خرید",
      checkout: "پرداخت",
      subtotal: "جمع سبد",
      empty: "سبد خرید خالی است.",
      quantity: "تعداد",
      increase: "افزایش تعداد",
      decrease: "کاهش تعداد",
      remove: "حذف",
      close: "بستن سبد خرید",
      account: "حساب کاربری",
      wishlist: "افزودن به علاقه‌مندی‌ها",
      stockLow: "آخرین موجودی",
      inStock: "موجود",
      snapPay: "گزینه پرداخت اقساطی SnapPay برای چک‌اوت آماده شده است.",
    },
    checkout: {
      title: "آماده مسیر پرداخت",
      description:
        "مدوسا مسئول سبد، موجودی، ارسال، مالیات و پرداخت است. فعال‌سازی SnapPay به اطلاعات پذیرنده و کلیدهای پروداکشن نیاز دارد.",
      customer: "مشتری",
      delivery: "ارسال",
      payment: "پرداخت",
      snapPay: "اقساط SnapPay",
      card: "کارت / درگاه محلی",
      continue: "ادامه پرداخت",
    },
    trust: {
      shipping: "آستانه ارسال رایگان آماده",
      returns: "بخش قوانین مرجوعی آماده",
      support: "فرآیند پشتیبانی اینستاگرام آماده",
    },
    search: {
      open: "جستجو",
      title: "جستجو در موهر",
      placeholder: "جستجوی محصول یا دسته‌بندی...",
      submit: "جستجو",
      close: "بستن جستجو",
    },
    philosophy: {
      eyebrow: "موهر",
      title: "برای ریتم روزمره.",
      description:
        "ظاهر سایت ساده می‌ماند و مدوسا مسئول کاتالوگ، موجودی، قیمت‌گذاری و سبد خرید است.",
      button: "درباره موهر",
    },
    newsletter: {
      eyebrow: "خبرهای موهر",
      title: "تازه‌های موهر.",
      description: "یادداشت‌های کالکشن، خبرهای استودیو و لانچ‌های خصوصی.",
      placeholder: "ایمیل شما",
      button: "عضویت",
      thanks: "ممنون که به موهر پیوستی.",
    },
    footer: {
      shop: "فروشگاه",
      information: "اطلاعات",
      follow: "دنبال کردن",
      newIn: "کالکشن جدید",
      collections: "کالکشن‌ها",
      allClothing: "همه محصولات",
      shipping: "ارسال",
      returns: "مرجوعی",
      sizeGuide: "راهنمای اندازه",
      contact: "تماس",
      instagram: "اینستاگرام",
      pinterest: "پینترست",
      tiktok: "تیک‌تاک",
      copyright: "© ۱۴۰۵ موهر",
      privacy: "حریم خصوصی",
      terms: "قوانین",
    },
  },
};

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 5 5" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 21c.7-4.1 3-6 7-6s6.3 1.9 7 6" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M5 8h14l-1 13H6L5 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="21"
      height="21"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M3 7h18" />
      <path d="M3 12h18" />
      <path d="M3 17h18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="21"
      height="21"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M5 5l14 14" />
      <path d="M19 5 5 19" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="17"
      height="17"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M4 12h15" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function ArrowUpRight() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="15"
      height="15"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M6 18 18 6" />
      <path d="M8 6h10v10" />
    </svg>
  );
}

function ProductImage({ image, alt, className }) {
  const sources = Array.isArray(image) ? image.filter(Boolean) : [image].filter(Boolean);
  const [sourceIndex, setSourceIndex] = useState(0);
  const src = sources[sourceIndex] || "";

  useEffect(() => {
    setSourceIndex(0);
  }, [sources.join("|")]);

  if (!src) {
    return <div className={`${className} product-image-empty`} aria-label={alt} />;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => {
        if (sourceIndex < sources.length - 1) {
          setSourceIndex((current) => current + 1);
        }
      }}
    />
  );
}

function ColorSwatches({ colors, language }) {
  const visibleColors = Array.isArray(colors) ? colors.slice(0, 5) : [];
  const isFarsi = language === "farsi";

  if (!visibleColors.length) return null;

  return (
    <div className="color-swatches" aria-label={isFarsi ? "رنگ‌ها" : "Colors"}>
      {visibleColors.map((color) => (
        <span
          key={`${color.label}-${color.hex}`}
          className="color-swatch"
          title={isFarsi ? color.labelFa || color.label : color.label}
          style={{ background: color.hex || "#b9b5aa" }}
        />
      ))}
    </div>
  );
}

function ProductCard({ product, language, labels, onAdd, isAdding }) {
  const isFarsi = language === "farsi";
  const name = productDisplayName(product, isFarsi);
  const category = productCategoryName(product, isFarsi);
  const canAdd = product.source !== "medusa" || product.variantId;
  const href = productPageHref(product);

  const stockCount = Number(product.stockCount);

  const lowStock =
    Number.isFinite(stockCount) &&
    stockCount > 0 &&
    stockCount <= 5;

  function openProductPage(interaction = "mouse") {
    trackEvent("product_click", {
      product_id: product.id,
      product_handle: product.handle,
      product_name: product.name,
      product_name_fa: product.nameFa,
      category: product.category,
      category_fa: product.categoryFa,
      collection: product.collection,
      price: product.priceAmount,
      stock_count: Number.isFinite(stockCount) ? stockCount : null,
      source: product.source,
      interaction,
    });

    window.location.hash = href.replace(/^#/, "");
  }

  return (
    <article
      className="product-card product-card-clickable"
      onClick={() => {
        openProductPage("mouse");
      }}
      role="link"
      tabIndex={0}
      aria-label={name}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openProductPage("keyboard");
        }
      }}
    >
      <div className="product-image-wrap">
        {product.badge && (
          <span className="product-badge">
            {product.badge}
          </span>
        )}

        <button
          type="button"
          className="wishlist-button"
          aria-label={labels.wishlist}
          onClick={(event) => {
            event.stopPropagation();

            trackEvent("wishlist_click", {
              product_id: product.id,
              product_handle: product.handle,
              product_name: product.name,
              category: product.category,
              price: product.priceAmount,
            });
          }}
        >
          <span aria-hidden="true">♡</span>
        </button>

        <ProductImage
          image={product.imageUrls}
          alt={name}
          className="product-image"
        />

        <button
          type="button"
          className="quick-add"
          onClick={(event) => {
            event.stopPropagation();

            trackEvent("quick_add_click", {
              product_id: product.id,
              product_handle: product.handle,
              product_name: product.name,
              category: product.category,
              price: product.priceAmount,
            });

            onAdd(product);
          }}
          disabled={!canAdd || isAdding}
        >
          <span>
            {isAdding
              ? labels.adding
              : canAdd
                ? labels.quickAdd
                : labels.noVariant}
          </span>

          <ArrowRight />
        </button>
      </div>

      <div className="product-info">
        <div>
          <h3>{name}</h3>

          {category && (
            <p>
              {category}
            </p>
          )}

          <ColorSwatches
            colors={product.colors}
            language={language}
          />
        </div>

        <div className="product-commerce">
          {product.compareAtPrice && (
            <span className="compare-price">
              {product.compareAtPrice}
            </span>
          )}

          <span className="product-price">
            {product.price}
          </span>
        </div>
      </div>

      <div className="product-card-footer">
        <span>
          {lowStock
            ? labels.stockLow
            : labels.inStock}
        </span>

        <span className="product-card-view">
          {labels.viewDetails}
        </span>
      </div>

      {product.installment && (
        <p className="installment-note">
          {product.installment}
        </p>
      )}
    </article>
  );
}

function CategoryCard({ category, language, labels, active, onSelect }) {
  const isFarsi = language === "farsi";

  return (
    <button
      type="button"
      className={`category-card ${active ? "category-card-active" : ""}`}
      onClick={() => onSelect(category.slug)}
    >
      <div className="category-image-wrap">
        <ProductImage
          image={category.imageUrl}
          alt={isFarsi ? category.nameFa : category.name}
          className="category-image"
        />
        <div className="category-overlay" />

        <div className="category-content">
          <h3>{isFarsi ? category.nameFa : category.name}</h3>

          <span>
            {labels.shop}
            <ArrowUpRight />
          </span>
        </div>
      </div>
    </button>
  );
}

function sumCartItems(items) {
  return items.reduce((total, item) => total + item.quantity, 0);
}

function sumCartSubtotal(items) {
  return items.reduce(
    (total, item) => total + (Number(item.product.priceAmount) || 0) * item.quantity,
    0
  );
}

function formatDemoMoney(amount) {
  if (!Number.isFinite(Number(amount))) return "Preview";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getRouteFromHash() {
  const hash = typeof window === "undefined" ? "" : window.location.hash;
  const value = hash.replace(/^#\/?/, "");

  if (value.startsWith("products/")) {
    return {
      type: "product",
      handle: decodeRoutePart(value.replace(/^products\//, "").split(/[?#]/)[0]),
    };
  }

  if (value === "owner") return { type: "owner" };
  if (value === "developer") return { type: "developer" };
  if (value === "assist") return { type: "assist" };
  if (value === "account") return { type: "account" };

  return { type: "home", section: value.replace(/^#/, "") || "new" };
}

function decodeRoutePart(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function productPageHref(product) {
  return `#/products/${encodeURIComponent(product.handle || product.id)}`;
}

function productDisplayName(product, isFarsi) {
  return isFarsi ? product.nameFa || product.name : product.name || product.nameFa;
}

function productCategoryName(product, isFarsi) {
  return isFarsi
    ? product.categoryFa || product.category
    : product.category || product.categoryFa;
}

function productCollectionName(product, isFarsi) {
  return isFarsi
    ? product.collectionFa || product.collection
    : product.collection || product.collectionFa;
}

function productStockLabel(product, labels) {
  const stock = Number(product.stockCount);

  if (product.inStock === false || stock <= 0) return labels.outOfStock;
  if (Number.isFinite(stock) && stock <= 5) return labels.lowStock;
  return labels.inStock;
}

function formatCompactAmount(amount) {
  const value = Number(amount);

  if (!Number.isFinite(value) || value <= 0) return "Preview";
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B IRR`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M IRR`;

  return `${Math.round(value).toLocaleString("en-US")} IRR`;
}

function catalogMetrics(catalog) {
  const products = catalog.products || [];
  const lowStockProducts = products.filter((product) => {
    const stock = Number(product.stockCount);
    return Number.isFinite(stock) && stock > 0 && stock <= 5;
  });
  const saleProducts = products.filter(
    (product) => Number(product.compareAtAmount) > Number(product.priceAmount)
  );
  const inventoryUnits = products.reduce((total, product) => {
    const stock = Number(product.stockCount);
    return Number.isFinite(stock) && stock > 0 ? total + stock : total;
  }, 0);
  const inventoryValue = products.reduce((total, product) => {
    const stock = Number(product.stockCount);
    const price = Number(product.priceAmount);
    return Number.isFinite(stock) && stock > 0 && Number.isFinite(price)
      ? total + stock * price
      : total;
  }, 0);

  return {
    products,
    totalProducts: products.length,
    inStockProducts: products.filter((product) => product.inStock !== false).length,
    lowStockProducts,
    saleProducts,
    inventoryUnits,
    inventoryValue,
  };
}

function medusaFeatureRows(metrics, labels) {
  return [
    {
      id: "orders",
      title: "Orders",
      titleFa: "سفارش‌ها",
      metric: "0",
      detail: "Payment, fulfillment, returns, exchanges",
      detailFa: "پرداخت، ارسال، مرجوعی و تعویض",
    },
    {
      id: "products",
      title: "Products",
      titleFa: "محصولات",
      metric: String(metrics.totalProducts),
      detail: "Variants, categories, collections, product options",
      detailFa: "وریانت، دسته‌بندی، کالکشن و گزینه‌های محصول",
    },
    {
      id: "inventory",
      title: "Inventory",
      titleFa: "موجودی",
      metric: String(metrics.inventoryUnits),
      detail: "Stock locations, availability, reservations",
      detailFa: "مکان‌های انبار، دسترسی و رزرو موجودی",
    },
    {
      id: "customers",
      title: "Customers",
      titleFa: "مشتریان",
      metric: "0",
      detail: "Accounts, guest customers, customer groups",
      detailFa: "حساب‌ها، مشتری مهمان و گروه‌های مشتری",
    },
    {
      id: "promotions",
      title: "Promotions",
      titleFa: "پروموشن‌ها",
      metric: String(metrics.saleProducts.length),
      detail: "Coupons, automatic discounts, campaign budgets",
      detailFa: "کد تخفیف، تخفیف خودکار و بودجه کمپین",
    },
    {
      id: "price-lists",
      title: "Price Lists",
      titleFa: "لیست قیمت",
      metric: "1",
      detail: "Sale prices and group-specific price overrides",
      detailFa: "قیمت تخفیفی و قیمت اختصاصی گروه مشتری",
    },
    {
      id: "loyalty",
      title: "Loyalty",
      titleFa: "وفاداری",
      metric: "Web Push",
      detail: "Reward notices sent through opted-in Chrome and Safari browsers",
      detailFa: "اعلان پاداش از طریق مرورگرهای کروم و سافاری با اجازه مشتری",
    },
  ].map((feature) => ({
    ...feature,
    status: feature.metric === "0" ? labels.needsApi : labels.ready,
  }));
}

function uniqueProducts(products) {
  const seen = new Set();

  return products.filter((product) => {
    if (seen.has(product.id)) return false;

    seen.add(product.id);
    return true;
  });
}

function QuickView({
  product,
  language,
  labels,
  productLabels,
  onAdd,
  onClose,
  isAdding,
}) {
  if (!product) return null;

  const isFarsi = language === "farsi";
  const name = isFarsi ? product.nameFa : product.name;
  const description = isFarsi
    ? product.descriptionFa || product.description
    : product.description;
  const canAdd = product.source !== "medusa" || product.variantId;

  return (
    <div className="quick-view-overlay" role="dialog" aria-modal="true">
      <div className="quick-view">
        <button
          type="button"
          className="icon-button quick-view-close"
          onClick={onClose}
          aria-label={isFarsi ? "بستن" : "Close"}
        >
          <CloseIcon />
        </button>

        <div className="quick-view-media">
          <ProductImage image={product.imageUrls} alt={name} className="product-image" />
        </div>

        <div className="quick-view-content">
          <span className="eyebrow">{isFarsi ? product.categoryFa : product.category}</span>
          <h2>{name}</h2>
          <p>{description}</p>

          <div className="detail-price-row">
            {product.compareAtPrice && (
              <span className="compare-price">{product.compareAtPrice}</span>
            )}
            <span className="product-price">{product.price}</span>
          </div>

          <ColorSwatches colors={product.colors} language={language} />

          {Array.isArray(product.sizes) && product.sizes.length > 0 && (
            <div className="size-list">
              {product.sizes.map((size) => (
                <span key={size}>{size}</span>
              ))}
            </div>
          )}

          {product.installment && (
            <p className="installment-note strong">{product.installment}</p>
          )}

          <div className="quick-view-actions">
            <button
              type="button"
              className="button button-dark"
              onClick={() => onAdd(product)}
              disabled={!canAdd || isAdding}
            >
              {isAdding ? labels.adding : canAdd ? labels.quickAdd : labels.noVariant}
              <ArrowRight />
            </button>

            {product.externalUrl && (
              <a
                href={product.externalUrl}
                className="button button-outline"
                target="_blank"
                rel="noreferrer"
              >
                {productLabels.viewLive}
                <ArrowUpRight />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CartDrawer({
  open,
  items,
  labels,
  checkoutLabels,
  language,
  onClose,
  onCheckout,
  onIncrease,
  onDecrease,
  onRemove,
}) {
  const subtotal = sumCartSubtotal(items);
  const isFarsi = language === "farsi";

  if (!open) return null;

  return (
    <div className="cart-overlay">
      <button
        type="button"
        className="cart-backdrop"
        onClick={onClose}
        aria-label={labels.close}
      />

      <aside className="cart-drawer" role="dialog" aria-modal="true" aria-label={labels.bag}>
        <div className="cart-drawer-header">
          <h2>{labels.bag}</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label={labels.close}>
            <CloseIcon />
          </button>
        </div>

        {items.length ? (
          <div className="cart-items">
            {items.map((item) => {
              const productName = isFarsi
                ? item.product.nameFa || item.product.name
                : item.product.name || item.product.nameFa;
              const categoryName = isFarsi
                ? item.product.categoryFa || item.product.category
                : item.product.category || item.product.categoryFa;
              const lineAmount = Number(item.product.priceAmount) * item.quantity;
              const lineTotal =
                Number.isFinite(lineAmount) && lineAmount > 0
                  ? formatDemoMoney(lineAmount)
                  : item.product.price;

              return (
                <div className="cart-line" key={item.product.id}>
                  <ProductImage
                    image={item.product.imageUrls}
                    alt={productName}
                    className="cart-line-image"
                  />

                  <div className="cart-line-main">
                    <div className="cart-line-heading">
                      <div>
                        <h3>{productName}</h3>
                        {categoryName && <p>{categoryName}</p>}
                      </div>

                      <strong>{lineTotal}</strong>
                    </div>

                    <div className="cart-line-actions">
                      <div className="quantity-control" aria-label={`${labels.quantity}: ${productName}`}>
                        <button
                          type="button"
                          onClick={() => onDecrease(item.product.id)}
                          aria-label={`${labels.decrease}: ${productName}`}
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => onIncrease(item.product.id)}
                          aria-label={`${labels.increase}: ${productName}`}
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        className="cart-remove"
                        onClick={() => onRemove(item.product.id)}
                      >
                        {labels.remove}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="empty-cart">{labels.empty}</p>
        )}

        <div className="checkout-card">
          <div className="subtotal-row">
            <span>{labels.subtotal}</span>
            <strong>{subtotal ? formatDemoMoney(subtotal) : "Preview"}</strong>
          </div>

          <div className="checkout-steps">
            <span>{checkoutLabels.customer}</span>
            <span>{checkoutLabels.delivery}</span>
            <span>{checkoutLabels.payment}</span>
          </div>

          <label className="payment-choice">
            <input type="radio" name="payment" defaultChecked />
            <span>{checkoutLabels.snapPay}</span>
          </label>
          <label className="payment-choice">
            <input type="radio" name="payment" />
            <span>{checkoutLabels.card}</span>
          </label>

          <p>{labels.snapPay}</p>

          <button type="button" className="button button-dark" onClick={onCheckout}>
            {checkoutLabels.continue}
            <ArrowRight />
          </button>
        </div>
      </aside>
    </div>
  );
}

function ProductPage({
  product,
  catalog,
  catalogState,
  language,
  labels,
  cartLabels,
  onAdd,
  isAdding,
}) {
  const isFarsi = language === "farsi";

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");

  useEffect(() => {
    setSelectedImage(0);
    setSelectedSize(product?.sizes?.[0] || "");
    setSelectedColor(product?.colors?.[0]?.label || "");
  }, [product?.id]);

  if (!product) {
    return (
      <div className="product-page product-page-empty">
        <a href="#products" className="text-link product-back-link">
          <ArrowRight />
          {labels.back}
        </a>

        <section className="product-not-found">
          <h1>
            {catalogState === "loading"
              ? labels.loading
              : labels.notFoundTitle}
          </h1>

          <p>{labels.notFoundDescription}</p>
        </section>
      </div>
    );
  }

  const name = productDisplayName(product, isFarsi);

  const category = productCategoryName(product, isFarsi);

  const description = isFarsi
    ? product.descriptionFa || product.description
    : product.description;

  const canAdd =
    product.source !== "medusa" || product.variantId;

  const images = Array.isArray(product.imageUrls)
    ? product.imageUrls.filter(Boolean)
    : [];

  const relatedProducts = catalog.products
    .filter(
      (item) =>
        item.id !== product.id &&
        item.categorySlug === product.categorySlug
    )
    .slice(0, 4);

  return (
    <div className="product-page">

      <div className="product-page-topbar">
        <a
          href="#products"
          className="product-back-link"
        >
          <ArrowRight />
          {labels.back}
        </a>

        {category && (
          <span className="product-breadcrumb-category">
            {category}
          </span>
        )}
      </div>

      <section className="pdp-layout">

        <div className="pdp-gallery">

          <div className="pdp-main-image-wrap">

            {product.badge && (
              <span className="pdp-badge">
                {product.badge}
              </span>
            )}

            <ProductImage
              image={
                images[selectedImage] ||
                images[0]
              }
              alt={name}
              className="pdp-main-image"
            />

            <button
              type="button"
              className="pdp-wishlist"
              aria-label={cartLabels.wishlist}
            >
              ♡
            </button>
          </div>

          {images.length > 1 && (
            <div className="pdp-thumbnail-list">
              {images.map((image, index) => (
                <button
                  type="button"
                  key={`${image}-${index}`}
                  className={`pdp-thumbnail ${selectedImage === index
                      ? "is-selected"
                      : ""
                    }`}
                  onClick={() =>
                    setSelectedImage(index)
                  }
                >
                  <ProductImage
                    image={image}
                    alt={`${name} ${index + 1}`}
                    className="pdp-thumbnail-image"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <aside className="pdp-info">

          <div className="pdp-title-block">

            <h1>{name}</h1>

            <div className="pdp-price-row">

              <span className="pdp-price">
                {product.price}
              </span>

              {product.compareAtPrice && (
                <span className="pdp-compare-price">
                  {product.compareAtPrice}
                </span>
              )}

              {product.badge && (
                <span className="pdp-sale-label">
                  {product.badge}
                </span>
              )}
            </div>
          </div>

          {description && (
            <p className="pdp-description">
              {description}
            </p>
          )}

          {Array.isArray(product.colors) &&
            product.colors.length > 0 && (
              <div className="pdp-option">

                <div className="pdp-option-heading">
                  <strong>
                    {labels.colors}
                  </strong>

                  {selectedColor && (
                    <span>
                      {selectedColor}
                    </span>
                  )}
                </div>

                <div className="pdp-color-list">

                  {product.colors.map((color) => {

                    const colorName = isFarsi
                      ? color.labelFa ||
                      color.label
                      : color.label;

                    return (
                      <button
                        type="button"
                        key={`${color.label}-${color.hex}`}
                        className={`pdp-color-button ${selectedColor ===
                            color.label
                            ? "is-selected"
                            : ""
                          }`}
                        onClick={() =>
                          setSelectedColor(
                            color.label
                          )
                        }
                        aria-label={colorName}
                        title={colorName}
                      >
                        <span
                          style={{
                            background:
                              color.hex ||
                              "#b9b5aa",
                          }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          {Array.isArray(product.sizes) &&
            product.sizes.length > 0 && (
              <div className="pdp-option">

                <div className="pdp-option-heading">
                  <strong>
                    {labels.sizes}
                  </strong>

                  <button
                    type="button"
                    className="pdp-size-guide"
                  >
                    {isFarsi
                      ? "راهنمای سایز"
                      : "Size guide"}
                  </button>
                </div>

                <div className="pdp-size-list">
                  {product.sizes.map((size) => (
                    <button
                      type="button"
                      key={size}
                      className={`pdp-size-button ${selectedSize === size
                          ? "is-selected"
                          : ""
                        }`}
                      onClick={() =>
                        setSelectedSize(size)
                      }
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

          <button
            type="button"
            className="pdp-add-button"
            onClick={() => onAdd(product)}
            disabled={!canAdd || isAdding}
          >
            <span>
              {isAdding
                ? cartLabels.adding
                : canAdd
                  ? isFarsi
                    ? "افزودن به سبد خرید"
                    : "Add to bag"
                  : cartLabels.noVariant}
            </span>

            <BagIcon />
          </button>

          <div className="pdp-stock">
            <span
              className={`pdp-stock-dot ${product.inStock === false
                  ? "is-out"
                  : ""
                }`}
            />

            <span>
              {productStockLabel(
                product,
                cartLabels
              )}
            </span>
          </div>

          {product.installment && (
            <div className="pdp-installment">
              {product.installment}
            </div>
          )}

          <div className="pdp-benefits">

            <div>
              <strong>
                {isFarsi
                  ? "ارسال"
                  : "Delivery"}
              </strong>

              <span>
                {isFarsi
                  ? "اطلاعات ارسال هنگام پرداخت نمایش داده می‌شود"
                  : "Delivery options shown at checkout"}
              </span>
            </div>

            <div>
              <strong>
                {isFarsi
                  ? "مرجوعی"
                  : "Returns"}
              </strong>

              <span>
                {isFarsi
                  ? "شرایط مرجوعی را پیش از خرید بررسی کنید"
                  : "Review return conditions before ordering"}
              </span>
            </div>
          </div>

          <div className="pdp-accordions">

            <details open>
              <summary>
                {isFarsi
                  ? "جزئیات محصول"
                  : "Product details"}
              </summary>

              <div className="pdp-accordion-content">
                <p>{description}</p>

                {category && (
                  <p>
                    <strong>
                      {labels.category}:
                    </strong>{" "}
                    {category}
                  </p>
                )}
              </div>
            </details>

            <details>
              <summary>
                {isFarsi
                  ? "راهنمای سایز"
                  : "Size & fit"}
              </summary>

              <div className="pdp-accordion-content">
                <p>
                  {isFarsi
                    ? "اطلاعات دقیق سایزبندی این محصول در این بخش قرار می‌گیرد."
                    : "Detailed size and fit information will appear here."}
                </p>
              </div>
            </details>

            <details>
              <summary>
                {isFarsi
                  ? "ارسال و مرجوعی"
                  : "Delivery & returns"}
              </summary>

              <div className="pdp-accordion-content">
                <p>
                  {isFarsi
                    ? "زمان و هزینه ارسال بر اساس آدرس سفارش محاسبه می‌شود."
                    : "Delivery timing and pricing depend on the order destination."}
                </p>
              </div>
            </details>
          </div>

        </aside>
      </section>

      {relatedProducts.length > 0 && (
        <section className="product-related">

          <div className="product-related-heading">
            <span>{category}</span>

            <h2>
              {labels.related}
            </h2>
          </div>

          <div className="products-grid">
            {relatedProducts.map(
              (relatedProduct) => (
                <ProductCard
                  key={relatedProduct.id}
                  product={relatedProduct}
                  language={language}
                  labels={cartLabels}
                  onAdd={onAdd}
                  isAdding={
                    isAdding &&
                    relatedProduct.id ===
                    product.id
                  }
                />
              )
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function OwnerDashboardPage({ catalog, language, labels }) {
  const isFarsi = language === "farsi";
  const metrics = catalogMetrics(catalog);
  const analytics = getAnalyticsSummary();

  const products = metrics.products || [];

  const outOfStockProducts = products.filter((product) => {
    const stock = Number(product.stockCount);
    return product.inStock === false || stock <= 0;
  });

  const criticalStockProducts = products
    .filter((product) => {
      const stock = Number(product.stockCount);

      return (
        Number.isFinite(stock) &&
        stock > 0 &&
        stock <= 3
      );
    })
    .sort(
      (a, b) =>
        Number(a.stockCount) -
        Number(b.stockCount)
    );

  const lowStockProducts = products
    .filter((product) => {
      const stock = Number(product.stockCount);

      return (
        Number.isFinite(stock) &&
        stock > 3 &&
        stock <= 8
      );
    })
    .sort(
      (a, b) =>
        Number(a.stockCount) -
        Number(b.stockCount)
    );

  const highestValueProducts = [...products]
    .filter((product) => {
      const stock = Number(product.stockCount);
      const price = Number(product.priceAmount);

      return (
        Number.isFinite(stock) &&
        Number.isFinite(price) &&
        stock > 0
      );
    })
    .sort((a, b) => {
      const aValue =
        Number(a.stockCount) *
        Number(a.priceAmount);

      const bValue =
        Number(b.stockCount) *
        Number(b.priceAmount);

      return bValue - aValue;
    })
    .slice(0, 8);

  const priorityProducts = uniqueProducts([
    ...outOfStockProducts,
    ...criticalStockProducts,
    ...lowStockProducts,
    ...metrics.saleProducts,
    ...products,
  ]).slice(0, 12);

  const inventoryHealth = products.length
    ? Math.round(
      ((products.length -
        outOfStockProducts.length -
        criticalStockProducts.length) /
        products.length) *
      100
    )
    : 100;

  return (
    <div className="dashboard-page owner-dashboard-page">
      <section className="dashboard-shell">

        <div className="dashboard-heading">
          <div>
            <span className="eyebrow">
              {labels.ownerEyebrow}
            </span>

            <h1>
              {isFarsi
                ? "مرکز کنترل موهر"
                : "Mouher control center"}
            </h1>

            <p>
              {isFarsi
                ? "نمایش وضعیت موجودی، ارزش کالا، محصولات کم‌موجود و هشدارهای عملیاتی."
                : "Monitor inventory health, stock value, low-stock products and operational alerts."}
            </p>
          </div>

          <div className="dashboard-heading-actions">
            <a
              href="#products"
              className="button button-outline"
            >
              {labels.viewStore}
              <ArrowRight />
            </a>

            <a
              href="#/assist"
              className="button button-dark"
            >
              {labels.websiteAssist}
              <ArrowRight />
            </a>
          </div>
        </div>

        <div className="owner-kpi-grid">

          <MetricCard
            label={
              isFarsi
                ? "ارزش موجودی"
                : "Inventory value"
            }
            value={formatCompactAmount(
              metrics.inventoryValue
            )}
          />

          <MetricCard
            label={
              isFarsi
                ? "واحد موجود"
                : "Units in stock"
            }
            value={metrics.inventoryUnits}
          />

          <MetricCard
            label={
              isFarsi
                ? "موجودی بحرانی"
                : "Critical stock"
            }
            value={
              criticalStockProducts.length
            }
          />

          <MetricCard
            label={
              isFarsi
                ? "ناموجود"
                : "Out of stock"
            }
            value={
              outOfStockProducts.length
            }
          />

          <MetricCard
            label={
              isFarsi
                ? "سلامت موجودی"
                : "Inventory health"
            }
            value={`${inventoryHealth}%`}
          />

        </div>

        <section className="dashboard-panel dashboard-panel-wide analytics-panel">
          <div className="dashboard-panel-header">
            <h2>{isFarsi ? "تحلیل رفتار فروشگاه" : "Store analytics"}</h2>
            <span>{isFarsi ? "۳۰ روز گذشته" : "Last 30 days"}</span>
          </div>

          <div className="analytics-kpi-grid">
            <MetricCard label={isFarsi ? "کلیک محصول" : "Product clicks"} value={analytics.productClicks} />
            <MetricCard label={isFarsi ? "افزودن سریع" : "Quick adds"} value={analytics.quickAdds} />
            <MetricCard label={isFarsi ? "علاقه‌مندی" : "Wishlists"} value={analytics.wishlists} />
            <MetricCard label={isFarsi ? "نرخ تبدیل" : "Click-to-add rate"} value={`${analytics.conversionRate}%`} />
          </div>

          <div className="analytics-products">
            <h3>{isFarsi ? "محصولات پربازدید" : "Top engaged products"}</h3>
            {analytics.topProducts.length ? analytics.topProducts.map((product) => (
              <div className="analytics-product-row" key={product.id}>
                <strong>{product.name}</strong>
                <span>{product.clicks} {isFarsi ? "کلیک" : "clicks"}</span>
                <span>{product.quickAdds} {isFarsi ? "افزودن" : "adds"}</span>
                <span>{product.wishlists} {isFarsi ? "علاقه‌مندی" : "wishlists"}</span>
              </div>
            )) : (
              <p className="analytics-empty">
                {isFarsi ? "پس از تعامل بازدیدکنندگان، داده‌ها اینجا نمایش داده می‌شوند." : "Analytics will appear after visitors interact with products."}
              </p>
            )}
          </div>
        </section>

        <section className="dashboard-panel dashboard-panel-wide owner-alert-panel">

          <div className="dashboard-panel-header">
            <h2>
              {isFarsi
                ? "هشدارهای کسب‌وکار"
                : "Business alerts"}
            </h2>

            <span>
              {catalog.source}
            </span>
          </div>

          <div className="owner-alert-grid">

            <article
              className={`owner-alert ${outOfStockProducts.length
                  ? "owner-alert-danger"
                  : ""
                }`}
            >
              <strong>
                {outOfStockProducts.length}
              </strong>

              <span>
                {isFarsi
                  ? "محصول ناموجود"
                  : "products out of stock"}
              </span>
            </article>

            <article
              className={`owner-alert ${criticalStockProducts.length
                  ? "owner-alert-danger"
                  : ""
                }`}
            >
              <strong>
                {criticalStockProducts.length}
              </strong>

              <span>
                {isFarsi
                  ? "موجودی بحرانی"
                  : "critical stock products"}
              </span>
            </article>

            <article
              className={`owner-alert ${lowStockProducts.length
                  ? "owner-alert-warning"
                  : ""
                }`}
            >
              <strong>
                {lowStockProducts.length}
              </strong>

              <span>
                {isFarsi
                  ? "محصول کم‌موجود"
                  : "low-stock products"}
              </span>
            </article>

            <article className="owner-alert">
              <strong>
                {metrics.saleProducts.length}
              </strong>

              <span>
                {isFarsi
                  ? "محصول تخفیف‌دار"
                  : "products on sale"}
              </span>
            </article>

          </div>
        </section>

        <div className="owner-dashboard-grid">

          <section className="dashboard-panel">

            <div className="dashboard-panel-header">
              <h2>
                {isFarsi
                  ? "موجودی نیازمند توجه"
                  : "Inventory requiring attention"}
              </h2>

              <span>
                {priorityProducts.length}
              </span>
            </div>

            <div className="dashboard-table-wrap">
              <table className="dashboard-table owner-inventory-table">

                <thead>
                  <tr>
                    <th>
                      {labels.name}
                    </th>

                    <th>
                      {isFarsi
                        ? "موجودی"
                        : "Stock"}
                    </th>

                    <th>
                      {labels.price}
                    </th>

                    <th>
                      {isFarsi
                        ? "ارزش موجودی"
                        : "Stock value"}
                    </th>

                    <th>
                      {labels.status}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {priorityProducts.map(
                    (product) => {
                      const stock =
                        Number(
                          product.stockCount
                        ) || 0;

                      const price =
                        Number(
                          product.priceAmount
                        ) || 0;

                      const stockValue =
                        stock * price;

                      let stockStatus =
                        isFarsi
                          ? "سالم"
                          : "Healthy";

                      if (
                        product.inStock ===
                        false ||
                        stock <= 0
                      ) {
                        stockStatus =
                          isFarsi
                            ? "ناموجود"
                            : "Out";
                      } else if (
                        stock <= 3
                      ) {
                        stockStatus =
                          isFarsi
                            ? "بحرانی"
                            : "Critical";
                      } else if (
                        stock <= 8
                      ) {
                        stockStatus =
                          isFarsi
                            ? "کم"
                            : "Low";
                      }

                      return (
                        <tr
                          key={product.id}
                        >
                          <td>
                            <a
                              href={productPageHref(
                                product
                              )}
                            >
                              {productDisplayName(
                                product,
                                isFarsi
                              )}
                            </a>

                            <span>
                              {productCategoryName(
                                product,
                                isFarsi
                              )}
                            </span>
                          </td>

                          <td>
                            {stock}
                          </td>

                          <td>
                            {product.price}
                          </td>

                          <td>
                            {formatCompactAmount(
                              stockValue
                            )}
                          </td>

                          <td>
                            <span
                              className={`inventory-status inventory-status-${stockStatus
                                .toLowerCase()
                                .replace(
                                  /\s+/g,
                                  "-"
                                )}`}
                            >
                              {stockStatus}
                            </span>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="dashboard-panel">

            <div className="dashboard-panel-header">
              <h2>
                {isFarsi
                  ? "ارزش موجودی بالا"
                  : "Highest inventory value"}
              </h2>
            </div>

            <div className="owner-value-list">
              {highestValueProducts.map(
                (product) => {
                  const value =
                    Number(
                      product.stockCount
                    ) *
                    Number(
                      product.priceAmount
                    );

                  return (
                    <a
                      href={productPageHref(
                        product
                      )}
                      key={product.id}
                      className="owner-value-row"
                    >
                      <div>
                        <strong>
                          {productDisplayName(
                            product,
                            isFarsi
                          )}
                        </strong>

                        <span>
                          {
                            product.stockCount
                          }{" "}
                          {isFarsi
                            ? "عدد"
                            : "units"}
                        </span>
                      </div>

                      <b>
                        {formatCompactAmount(
                          value
                        )}
                      </b>
                    </a>
                  );
                }
              )}
            </div>

          </aside>
        </div>

        <section className="dashboard-panel dashboard-panel-wide">

          <div className="dashboard-panel-header">
            <h2>
              {labels.categoryMix}
            </h2>
          </div>

          <div className="category-mix">
            {(catalog.categories || []).map(
              (category) => (
                <div key={category.slug}>
                  <span>
                    {isFarsi
                      ? category.nameFa
                      : category.name}
                  </span>

                  <strong>
                    {category.count}
                  </strong>
                </div>
              )
            )}
          </div>

        </section>

      </section>
    </div>
  );
}

function DeveloperWorkspacePage({ catalog, language, labels }) {
  const isFarsi = language === "farsi";
  const metrics = catalogMetrics(catalog);
  const moduleRows = medusaFeatureRows(metrics, labels);
  const apiRows = [
    {
      id: "store",
      title: labels.storefront,
      status: labels.public,
      route: "/store/products, /store/carts",
      detail: "Catalog, cart, payment collection, checkout completion",
    },
    {
      id: "admin",
      title: labels.backend,
      status: labels.protected,
      route: "/api/commerce/admin/*",
      detail: "Orders, products, customers, promotions, price lists",
    },
    {
      id: "warehouse",
      title: labels.inventory,
      status: labels.protected,
      route: "/api/commerce/warehouse/*",
      detail: "Stock locations, inventory items, inventory levels",
    },
    {
      id: "push",
      title: labels.browserPush,
      status: labels.chromeSafari,
      route: "/api/commerce/loyalty/push/*",
      detail: "Subscription registration and loyalty notification delivery",
    },
  ];

  return (
    <div className="dashboard-page developer-page">
      <section className="dashboard-shell">
        <div className="dashboard-heading">
          <div>
            <span className="eyebrow">{labels.developerEyebrow}</span>
            <h1>{labels.developerTitle}</h1>
            <p>{labels.developerDescription}</p>
          </div>

          <div className="dashboard-heading-actions">
            <a href="#/owner" className="button button-outline">
              {labels.owner}
              <ArrowRight />
            </a>
            <a href="#/assist" className="button button-dark">
              {labels.websiteAssist}
              <ArrowRight />
            </a>
          </div>
        </div>

        <div className="workspace-grid">
          <section className="dashboard-panel workspace-panel">
            <div className="dashboard-panel-header">
              <h2>{labels.medusaDomains}</h2>
              <span>{catalog.source}</span>
            </div>

            <div className="module-list">
              {moduleRows.map((feature) => (
                <article className="workspace-row" key={feature.id}>
                  <div>
                    <strong>{isFarsi ? feature.titleFa : feature.title}</strong>
                    <span>{isFarsi ? feature.detailFa : feature.detail}</span>
                  </div>
                  <b>{feature.metric}</b>
                </article>
              ))}
            </div>
          </section>

          <section className="dashboard-panel workspace-panel">
            <div className="dashboard-panel-header">
              <h2>{labels.apiSurface}</h2>
              <span>{mouherApiConfig.baseUrl || labels.needsApi}</span>
            </div>

            <div className="module-list">
              {apiRows.map((row) => (
                <article className="workspace-row workspace-row-api" key={row.id}>
                  <div>
                    <strong>{row.title}</strong>
                    <span>{row.detail}</span>
                    <code>{row.route}</code>
                  </div>
                  <b>{row.status}</b>
                </article>
              ))}
            </div>
          </section>
        </div>

        <div className="metric-grid">
          <MetricCard label={labels.products} value={metrics.totalProducts} />
          <MetricCard label={labels.inventoryValue} value={formatCompactAmount(metrics.inventoryValue)} />
          <MetricCard label={labels.lowStock} value={metrics.lowStockProducts.length} />
          <MetricCard label={labels.sale} value={metrics.saleProducts.length} />
        </div>
      </section>
    </div>
  );
}

function AccountWorkspacePage({ language, labels, dashboardLabels }) {
  const isSupported = supportsBrowserPush();
  const [customerId, setCustomerId] = useState("");
  const [status, setStatus] = useState(isSupported ? "idle" : "unsupported");
  const isLoading = status === "loading";
  const statusLabel = loyaltyStatusLabel(status, labels);

  async function handleEnablePush(event) {
    event.preventDefault();
    setStatus("loading");

    try {
      const result = await requestLoyaltyPushSubscription({
        customerId: customerId.trim(),
      });

      setStatus(result.ok ? "active" : result.reason);
    } catch (error) {
      console.error("Loyalty push setup failed:", error);
      setStatus("failed");
    }
  }

  return (
    <div className="dashboard-page account-page">
      <section className="dashboard-shell account-shell">
        <div className="dashboard-heading">
          <div>
            <span className="eyebrow">{dashboardLabels.accountEyebrow}</span>
            <h1>{dashboardLabels.accountTitle}</h1>
            <p>{dashboardLabels.accountDescription}</p>
          </div>

          <div className="dashboard-heading-actions">
            <a href="#products" className="button button-outline">
              {dashboardLabels.viewStore}
              <ArrowRight />
            </a>
          </div>
        </div>

        <section className="dashboard-panel loyalty-panel">
          <div className="dashboard-panel-header">
            <h2>{labels.browserPush}</h2>
            <span>{isSupported ? labels.browserSupported : labels.browserUnsupported}</span>
          </div>

          <form className="loyalty-form" onSubmit={handleEnablePush}>
            <label>
              <span>{labels.customerId}</span>
              <input
                type="text"
                value={customerId}
                onChange={(event) => setCustomerId(event.target.value)}
                placeholder={labels.customerPlaceholder}
                autoComplete="off"
              />
            </label>

            <button
              type="submit"
              className="button button-dark"
              disabled={!isSupported || isLoading}
            >
              {isLoading ? labels.enabling : labels.enable}
              <ArrowRight />
            </button>
          </form>

          <div className={`loyalty-status loyalty-status-${status || "idle"}`} role="status">
            <strong>{statusLabel}</strong>
            <span>{labels.noPaidChannels}</span>
          </div>
        </section>
      </section>
    </div>
  );
}

function loyaltyStatusLabel(status, labels) {
  if (status === "active") return labels.active;
  if (status === "blocked") return labels.blocked;
  if (status === "not_configured") return labels.notConfigured;
  if (status === "not_granted") return labels.notGranted;
  if (status === "unsupported") return labels.unsupported;
  if (status === "failed") return labels.failed;

  return labels.browserPush;
}

function WebsiteAssistDashboard({ catalog, language, labels }) {
  const isFarsi = language === "farsi";
  const [assistQuery, setAssistQuery] = useState("");
  const metrics = catalogMetrics(catalog);
  const normalizedQuery = assistQuery.trim().toLowerCase();
  const productMatches = metrics.products
    .filter((product) => {
      if (!normalizedQuery) return true;

      return [
        product.name,
        product.nameFa,
        product.category,
        product.categoryFa,
        product.collection,
        product.price,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    })
    .slice(0, 8);
  const selectedProduct = productMatches[0] || metrics.products[0];
  const taskRows = buildAssistantTasks(metrics.products, labels);

  return (
    <div className="dashboard-page assistant-page">
      <section className="dashboard-shell">
        <div className="dashboard-heading">
          <div>
            <span className="eyebrow">{labels.assistEyebrow}</span>
            <h1>{labels.assistTitle}</h1>
            <p>{labels.assistDescription}</p>
          </div>

          <div className="dashboard-heading-actions">
            <a href="#/owner" className="button button-outline">
              {labels.owner}
              <ArrowRight />
            </a>
            <a href="#products" className="button button-dark">
              {labels.viewStore}
              <ArrowRight />
            </a>
          </div>
        </div>

        <form className="assistant-search" onSubmit={(event) => event.preventDefault()}>
          <SearchIcon />
          <input
            type="search"
            value={assistQuery}
            onChange={(event) => setAssistQuery(event.target.value)}
            placeholder={labels.search}
            aria-label={labels.search}
          />
        </form>

        <div className="assistant-grid">
          <section className="dashboard-panel assistant-answer">
            <div className="dashboard-panel-header">
              <h2>{labels.suggestedReply}</h2>
              {selectedProduct && <span>{productStockLabel(selectedProduct, labels)}</span>}
            </div>

            {selectedProduct ? (
              <>
                <h3>{productDisplayName(selectedProduct, isFarsi)}</h3>
                <p>{assistantReply(selectedProduct, isFarsi)}</p>
                <div className="quick-view-actions">
                  <a href={productPageHref(selectedProduct)} className="button button-dark">
                    {labels.open}
                    <ArrowRight />
                  </a>
                  {selectedProduct.externalUrl && (
                    <a
                      href={selectedProduct.externalUrl}
                      className="button button-outline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {labels.live}
                      <ArrowUpRight />
                    </a>
                  )}
                </div>
              </>
            ) : (
              <p>{labels.noTasks}</p>
            )}
          </section>

          <section className="dashboard-panel">
            <div className="dashboard-panel-header">
              <h2>{labels.productMatches}</h2>
              <span>{productMatches.length}</span>
            </div>

            <div className="assistant-product-list">
              {productMatches.map((product) => (
                <a href={productPageHref(product)} key={product.id}>
                  <ProductImage
                    image={product.imageUrls}
                    alt={productDisplayName(product, isFarsi)}
                    className="assistant-product-image"
                  />
                  <span>{productDisplayName(product, isFarsi)}</span>
                  <b>{product.price}</b>
                </a>
              ))}
            </div>
          </section>

          <section className="dashboard-panel">
            <div className="dashboard-panel-header">
              <h2>{labels.contentQueue}</h2>
            </div>

            <div className="task-list">
              {taskRows.length ? (
                taskRows.map((task) => (
                  <div key={task.id}>
                    <span>{task.label}</span>
                    <strong>{task.count}</strong>
                  </div>
                ))
              ) : (
                <p>{labels.noTasks}</p>
              )}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function buildAssistantTasks(products, labels) {
  const rows = [
    {
      id: "photo",
      label: labels.missingPhoto,
      count: products.filter((product) => !product.imageUrls?.length).length,
    },
    {
      id: "color",
      label: labels.missingColor,
      count: products.filter((product) => !product.colors?.length).length,
    },
    {
      id: "size",
      label: labels.missingSize,
      count: products.filter((product) => !product.sizes?.length).length,
    },
    {
      id: "sale",
      label: labels.saleBadge,
      count: products.filter(
        (product) => Number(product.compareAtAmount) > Number(product.priceAmount)
      ).length,
    },
  ];

  return rows.filter((row) => row.count > 0);
}

function assistantReply(product, isFarsi) {
  const name = productDisplayName(product, isFarsi);
  const category = productCategoryName(product, isFarsi);
  const collection = productCollectionName(product, isFarsi);

  if (isFarsi) {
    return `${name} از محصولات فعلی موهر در دسته ${category} و ادیت ${collection} است. قیمت فعلی ${product.price} است و صفحه محصول برای عکس، رنگ، سایز و وضعیت موجودی آماده است.`;
  }

  return `${name} is a current Mouher product in ${category}, listed under ${collection}. The current price is ${product.price}, and the product page is ready for photos, colors, sizes and stock status.`;
}

function upsertCartItem(items, product) {
  const existing = items.find((item) => item.product.id === product.id);

  if (existing) {
    return items.map((item) =>
      item.product.id === product.id
        ? { ...item, quantity: item.quantity + 1 }
        : item
    );
  }

  return [...items, { product, quantity: 1 }];
}

function updateCartItemQuantity(items, productId, delta) {
  return items.flatMap((item) => {
    if (item.product.id !== productId) return [item];

    const quantity = item.quantity + delta;

    return quantity > 0 ? [{ ...item, quantity }] : [];
  });
}

export default function App() {
  const [language, setLanguage] = useState("pinglish");
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [cartMessage, setCartMessage] = useState("");
  const [email, setEmail] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [route, setRoute] = useState(() => getRouteFromHash());
  const [catalog, setCatalog] = useState({
    products: [],
    categories: [],
    source: "demo",
    featuredImage: "",
    notice: "",
  });
  const [catalogState, setCatalogState] = useState("loading");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeCollection, setActiveCollection] = useState("all");
  const [query, setQuery] = useState("");
  const [addingProductId, setAddingProductId] = useState("");

  const t = content[language];
  const isFarsi = language === "farsi";
  const cartCount = sumCartItems(cartItems);

  useEffect(() => {
    let cancelled = false;

    async function hydrateCatalog() {
      setCatalogState("loading");
      const nextCatalog = await loadCatalog();

      if (!cancelled) {
        setCatalog(nextCatalog);
        setCatalogState("ready");
      }
    }

    hydrateCatalog();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handleHashChange() {
      setRoute(getRouteFromHash());
    }

    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setSelectedProduct(null);

    if (route.type !== "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    window.requestAnimationFrame(() => {
      document.getElementById(route.section)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [route]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key !== "Escape") return;

      setMenuOpen(false);
      setSearchOpen(false);
      setCartOpen(false);
      setSelectedProduct(null);
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const shouldLock = menuOpen || searchOpen || cartOpen || selectedProduct;

    document.body.style.overflow = shouldLock ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [cartOpen, menuOpen, searchOpen, selectedProduct]);

  const categoryOptions = useMemo(
    () => [
      {
        id: "all",
        slug: "all",
        name: t.categories.all,
        nameFa: t.categories.all,
        count: catalog.products.length,
      },
      ...catalog.categories,
    ],
    [catalog.categories, catalog.products.length, t.categories.all]
  );

  const collectionOptions = useMemo(
    () => [
      {
        id: "all",
        slug: "all",
        name: t.collections.all,
        nameFa: t.collections.all,
        count: catalog.products.length,
      },
      ...(catalog.collections || []),
    ],
    [catalog.collections, catalog.products.length, t.collections.all]
  );

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return catalog.products.filter((product) => {
      const matchesCategory =
        activeCategory === "all" || product.categorySlug === activeCategory;
      const matchesCollection =
        activeCollection === "all" || slugify(product.collection) === activeCollection;
      const searchable = [
        product.name,
        product.nameFa,
        product.category,
        product.categoryFa,
        product.collection,
        product.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);

      return matchesCategory && matchesCollection && matchesQuery;
    });
  }, [activeCategory, activeCollection, catalog.products, query]);

  const routedProduct = useMemo(() => {
    if (route.type !== "product") return null;

    return catalog.products.find(
      (product) => product.handle === route.handle || product.id === route.handle
    );
  }, [catalog.products, route]);

  useEffect(() => {
    if (route.type === "product" && routedProduct) {
      document.title = `${productDisplayName(routedProduct, isFarsi)} | Mouher`;
      return;
    }

    if (route.type === "owner") {
      document.title = `${t.dashboard.ownerTitle} | Mouher`;
      return;
    }

    if (route.type === "developer") {
      document.title = `${t.dashboard.developerTitle} | Mouher`;
      return;
    }

    if (route.type === "assist") {
      document.title = `${t.dashboard.assistTitle} | Mouher`;
      return;
    }

    if (route.type === "account") {
      document.title = `${t.dashboard.accountTitle} | Mouher`;
      return;
    }

    document.title = "Mouher — Contemporary Clothing";
  }, [
    isFarsi,
    route,
    routedProduct,
    t.dashboard.accountTitle,
    t.dashboard.assistTitle,
    t.dashboard.developerTitle,
    t.dashboard.ownerTitle,
  ]);

  const heroImage =
    catalog.featuredImage || catalog.products.find((product) => product.imageUrls?.length)
      ?.imageUrls[0];
  const sourceLabel =
    catalogState === "loading"
      ? t.products.loading
      : catalog.source === "medusa"
        ? t.products.sourceMedusa
        : catalog.source === "mouher-live-snapshot"
          ? t.products.sourceLive
        : t.products.sourceDemo;

  async function handleAddToCart(product) {
    setAddingProductId(product.id);
    setCartMessage("");
    setCartOpen(true);

    try {
      if (product.source === "medusa" && isMedusaConfigured(medusaConfig)) {
        await addProductToCart(product, medusaConfig);
        setCartMessage(t.cart.medusaAdded);
      } else {
        setCartMessage(t.cart.previewAdded);
      }

      setCartItems((current) => upsertCartItem(current, product));
      setSelectedProduct(null);
    } catch (error) {
      console.error("Add to cart failed:", error);
      setCartMessage(t.cart.unavailable);
    } finally {
      setAddingProductId("");
    }
  }

  function handleIncreaseCartItem(productId) {
    setCartMessage("");
    setCartItems((current) => updateCartItemQuantity(current, productId, 1));
  }

  function handleDecreaseCartItem(productId) {
    setCartMessage("");
    setCartItems((current) => updateCartItemQuantity(current, productId, -1));
  }

  function handleRemoveCartItem(productId) {
    setCartMessage("");
    setCartItems((current) => current.filter((item) => item.product.id !== productId));
  }

  function handleCheckoutIntent() {
    setCartMessage(t.checkout.description);
  }

  function handleNewsletterSubmit(event) {
    event.preventDefault();

    if (!email.trim()) return;

    alert(t.newsletter.thanks);
    setEmail("");
  }

  function handleSearchSubmit(event) {
    event.preventDefault();
    setSearchOpen(false);
    setActiveCategory("all");
  }

  return (
    <div
      className={`site ${isFarsi ? "site-farsi" : ""}`}
      dir={isFarsi ? "rtl" : "ltr"}
    >
      <div className="announcement">
        <p>{t.announcement}</p>
      </div>

      <header className="header">
        <div className="header-inner">
          <button
            type="button"
            className="mobile-menu-button"
            onClick={() => setMenuOpen(true)}
            aria-label={isFarsi ? "باز کردن منو" : "Open menu"}
            aria-expanded={menuOpen}
          >
            <MenuIcon />
          </button>

          <nav className="desktop-nav nav-left" aria-label="Primary">
            <a href="#new">{t.nav.newIn}</a>
            <a href="#categories">{t.nav.collections}</a>
            <a href="#products">{t.nav.shop}</a>
          </nav>

          <a href="#new" className="logo" aria-label="Mouher home">
            MOUHER
          </a>

          <nav className="desktop-nav nav-right" aria-label="Utility">
            <a href="#/owner">{t.nav.owner}</a>
            <a href="#/developer">{t.nav.developer}</a>
            <a href="#/assist">{t.nav.assist}</a>

            <button
              type="button"
              className="icon-button"
              onClick={() => setSearchOpen(true)}
              aria-label={t.search.open}
            >
              <SearchIcon />
            </button>

            <a href="#/account" className="icon-button" aria-label={t.cart.account}>
              <UserIcon />
            </a>

            <button
              type="button"
              className="bag-button"
              onClick={() => setCartOpen(true)}
              aria-label={`${t.cart.bag}, ${cartCount}`}
            >
              <BagIcon />

              {cartCount > 0 && (
                <span className="cart-count" aria-hidden="true">
                  {cartCount}
                </span>
              )}
            </button>
          </nav>
        </div>
      </header>

      <button
        type="button"
        className="language-indicator"
        onClick={() =>
          setLanguage((current) => (current === "pinglish" ? "farsi" : "pinglish"))
        }
        aria-label={isFarsi ? "Switch to Pinglish" : "تغییر زبان به فارسی"}
      >
        <span className={language === "pinglish" ? "active" : ""}>EN</span>
        <span className="language-dot" aria-hidden="true">
          /
        </span>
        <span className={language === "farsi" ? "active" : ""}>فا</span>
      </button>

      {cartMessage && (
        <div className="cart-toast" role="status" aria-live="polite">
          {cartMessage}
        </div>
      )}

      <CartDrawer
        open={cartOpen}
        items={cartItems}
        labels={t.cart}
        checkoutLabels={t.checkout}
        language={language}
        onClose={() => setCartOpen(false)}
        onCheckout={handleCheckoutIntent}
        onIncrease={handleIncreaseCartItem}
        onDecrease={handleDecreaseCartItem}
        onRemove={handleRemoveCartItem}
      />

      <QuickView
        product={selectedProduct}
        language={language}
        labels={t.cart}
        productLabels={t.products}
        onAdd={handleAddToCart}
        onClose={() => setSelectedProduct(null)}
        isAdding={addingProductId === selectedProduct?.id}
      />

      {menuOpen && (
        <div className="mobile-menu" role="dialog" aria-modal="true">
          <div className="mobile-menu-header">
            <span className="logo">MOUHER</span>

            <button
              type="button"
              className="icon-button"
              onClick={() => setMenuOpen(false)}
              aria-label={isFarsi ? "بستن منو" : "Close menu"}
            >
              <CloseIcon />
            </button>
          </div>

          <nav className="mobile-nav" aria-label="Mobile">
            <a href="#new" onClick={() => setMenuOpen(false)}>
              {t.nav.newIn}
            </a>
            <a href="#categories" onClick={() => setMenuOpen(false)}>
              {t.nav.collections}
            </a>
            <a href="#products" onClick={() => setMenuOpen(false)}>
              {t.nav.shop}
            </a>
            <a href="#/owner" onClick={() => setMenuOpen(false)}>
              {t.nav.owner}
            </a>
            <a href="#/developer" onClick={() => setMenuOpen(false)}>
              {t.nav.developer}
            </a>
            <a href="#/assist" onClick={() => setMenuOpen(false)}>
              {t.nav.assist}
            </a>
            <a href="#/account" onClick={() => setMenuOpen(false)}>
              {t.cart.account}
            </a>
          </nav>
        </div>
      )}

      {searchOpen && (
        <div
          className="search-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={t.search.title}
        >
          <div className="search-inner">
            <div className="search-header">
              <span className="search-title">{t.search.title}</span>

              <button
                type="button"
                className="icon-button"
                onClick={() => setSearchOpen(false)}
                aria-label={t.search.close}
              >
                <CloseIcon />
              </button>
            </div>

            <form className="search-form" onSubmit={handleSearchSubmit}>
              <SearchIcon />

              <input
                autoFocus
                type="search"
                placeholder={t.search.placeholder}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label={t.search.open}
              />

              <button type="submit">{t.search.submit}</button>
            </form>
          </div>
        </div>
      )}

      <main>
        {route.type === "product" ? (
          <ProductPage
            product={routedProduct}
            catalog={catalog}
            catalogState={catalogState}
            language={language}
            labels={t.productPage}
            cartLabels={{ ...t.cart, outOfStock: t.dashboard.outOfStock }}
            onAdd={handleAddToCart}
            isAdding={addingProductId === routedProduct?.id}
          />
        ) : route.type === "owner" ? (
          <OwnerDashboardPage
            catalog={catalog}
            language={language}
            labels={t.dashboard}
          />
        ) : route.type === "developer" ? (
          <DeveloperWorkspacePage
            catalog={catalog}
            language={language}
            labels={t.dashboard}
          />
        ) : route.type === "assist" ? (
          <WebsiteAssistDashboard
            catalog={catalog}
            language={language}
            labels={t.dashboard}
          />
        ) : route.type === "account" ? (
          <AccountWorkspacePage
            language={language}
            labels={t.account}
            dashboardLabels={t.dashboard}
          />
        ) : (
          <>
        <section className="hero" id="new">
          <ProductImage
            image={heroImage}
            alt="Mouher collection"
            className="hero-image"
          />

          <div className="hero-overlay" />

          <div className="hero-content">
            <p className="eyebrow hero-eyebrow">{t.hero.eyebrow}</p>

            <h1>
              {t.hero.title.split("\n").map((line, index) => (
                <span key={line}>
                  {line}
                  {index === 0 && <br />}
                </span>
              ))}
            </h1>

            <p className="hero-description">{t.hero.description}</p>

            <a href="#products" className="button button-light">
              {t.hero.button}
              <ArrowRight />
            </a>
          </div>
        </section>

        <section className="trust-strip" aria-label="Store benefits">
          <span>{t.trust.shipping}</span>
          <span>{t.trust.returns}</span>
          <span>{t.trust.support}</span>
        </section>

        <section className="section collections-section" id="collections">
          <div className="section-heading">
            <div>
              <span className="eyebrow">{t.collections.eyebrow}</span>
              <h2>{t.collections.title}</h2>
            </div>
          </div>

          <div className="collection-rail">
            {collectionOptions.map((collection) => (
              <button
                type="button"
                key={collection.slug}
                className={activeCollection === collection.slug ? "active" : ""}
                onClick={() => {
                  setActiveCollection(collection.slug);
                  document.getElementById("products")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }}
              >
                <strong>{isFarsi ? collection.nameFa : collection.name}</strong>
                <span>{collection.count}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="section products-section" id="products">
          <div className="section-heading catalog-heading">
            <div>
              <span className="eyebrow">{t.products.eyebrow}</span>
              <h2>{t.products.title}</h2>
            </div>

            <div className="catalog-actions">
              <span className={`catalog-pill catalog-pill-${catalog.source}`}>
                {sourceLabel}
              </span>

              <button
                type="button"
                className="text-link"
                onClick={() => {
                  setActiveCategory("all");
                  setActiveCollection("all");
                  setQuery("");
                }}
              >
                {t.products.shopAll}
                <ArrowRight />
              </button>
            </div>
          </div>

          {catalog.notice && <p className="catalog-notice">{catalog.notice}</p>}

          <div className="filter-bar" aria-label={t.categories.eyebrow}>
            {categoryOptions.map((category) => (
              <button
                type="button"
                key={category.slug}
                className={activeCategory === category.slug ? "active" : ""}
                onClick={() => setActiveCategory(category.slug)}
              >
                <span>{isFarsi ? category.nameFa : category.name}</span>
                <span>{category.count}</span>
              </button>
            ))}
          </div>

          {filteredProducts.length > 0 ? (
            <div className="products-grid">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  language={language}
                  labels={t.cart}
                  onAdd={handleAddToCart}
                  onView={setSelectedProduct}
                  isAdding={addingProductId === product.id}
                />
              ))}
            </div>
          ) : (
            <p className="empty-state">{t.products.empty}</p>
          )}
        </section>

        <section className="section categories-section" id="categories">
          <div className="section-heading">
            <div>
              <span className="eyebrow">{t.categories.eyebrow}</span>
              <h2>{t.categories.title}</h2>
            </div>
          </div>

          <div className="categories-grid">
            {catalog.categories.slice(0, 3).map((category) => (
              <CategoryCard
                key={category.slug}
                category={category}
                language={language}
                labels={t.categories}
                active={activeCategory === category.slug}
                onSelect={(slug) => {
                  setActiveCategory(slug);
                  document.getElementById("products")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }}
              />
            ))}
          </div>
        </section>

        <section className="philosophy">
          <div className="philosophy-image">
            <ProductImage
              image={catalog.products[1]?.imageUrls || heroImage}
              alt="Mouher editorial"
              className=""
            />
          </div>

          <div className="philosophy-content">
            <span className="eyebrow">{t.philosophy.eyebrow}</span>

            <h2>{t.philosophy.title}</h2>

            <p>{t.philosophy.description}</p>

            <a href="#newsletter" className="button button-dark">
              {t.philosophy.button}
              <ArrowRight />
            </a>
          </div>
        </section>

        <section className="newsletter" id="newsletter">
          <div className="newsletter-inner">
            <span className="eyebrow">{t.newsletter.eyebrow}</span>

            <h2>{t.newsletter.title}</h2>

            <p>{t.newsletter.description}</p>

            <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
              <input
                type="email"
                placeholder={t.newsletter.placeholder}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-label={t.newsletter.placeholder}
                autoComplete="email"
                required
              />

              <button type="submit">
                {t.newsletter.button}
                <ArrowRight />
              </button>
            </form>
          </div>
        </section>
          </>
        )}
      </main>

      <footer className="footer" id="footer">
        <div className="footer-top">
          <div className="footer-brand">
            <a href="/" className="footer-logo">
              MOUHER
            </a>

            <p>
              {isFarsi
                ? "لباس معاصر برای زندگی روزمره."
                : "Lebas-e moaser baraye zendegi-e roozmarreh."}
            </p>
          </div>

          <div className="footer-column">
            <h4>{t.footer.shop}</h4>
            <a href="#new">{t.footer.newIn}</a>
            <a href="#categories">{t.footer.collections}</a>
            <a href="#products">{t.footer.allClothing}</a>
          </div>

          <div className="footer-column">
            <h4>{t.footer.information}</h4>
            <a href="#footer">{t.footer.shipping}</a>
            <a href="#footer">{t.footer.returns}</a>
            <a href="#footer">{t.footer.sizeGuide}</a>
            <a href="#footer">{t.footer.contact}</a>
          </div>

          <div className="footer-column">
            <h4>{t.footer.follow}</h4>
            <a href="#footer">{t.footer.instagram}</a>
            <a href="#footer">{t.footer.pinterest}</a>
            <a href="#footer">{t.footer.tiktok}</a>
          </div>
        </div>

        <div className="footer-bottom">
          <span>{t.footer.copyright}</span>

          <div>
            <a href="#footer">{t.footer.privacy}</a>
            <a href="#footer">{t.footer.terms}</a>
          </div>

          <span>MOUHER</span>
        </div>
      </footer>
    </div>
  );
}
