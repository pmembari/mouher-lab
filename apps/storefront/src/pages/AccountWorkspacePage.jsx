import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "../components/icons";
import { ProductImage } from "../components/ProductImage";
import { isMedusaConfigured } from "../lib/catalog/config.js";
import {
  isValidMobilePhone,
  loadCurrentCustomer,
  loginCustomer,
  logoutCustomer,
  normalizeMobilePhone,
  registerCustomer,
} from "../lib/medusaAuth";
import {
  requestLoyaltyPushSubscription,
  supportsBrowserPush,
} from "../lib/notifications";

const TURNSTILE_SCRIPT_ID = "mouher-turnstile-script";
const TURNSTILE_SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function AccountProductRail({ title, viewAllLabel, products }) {
  return (
    <section className="account-rail">
      <div className="account-rail-header">
        <h3>{title}</h3>
        <a href="#/shop">{viewAllLabel}</a>
      </div>

      <div className="account-product-row">
        {products.map((product, index) => (
          <a href="#/shop" className="account-product-card" key={product.name}>
            <ProductImage
              image={product.image}
              alt={`${product.name} | image ${index + 1} of ${products.length}.`}
              className="account-product-image"
            />
            <span>{product.name}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

function TurnstileWidget({ siteKey, onToken, resetKey }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!siteKey || !containerRef.current || typeof window === "undefined") {
      return undefined;
    }

    let cancelled = false;
    let widgetId = null;
    const container = containerRef.current;

    function renderWidget() {
      if (cancelled || !window.turnstile || !container) return;

      container.innerHTML = "";
      widgetId = window.turnstile.render(container, {
        sitekey: siteKey,
        action: "customer-register",
        callback: (token) => onToken(token || ""),
        "expired-callback": () => onToken(""),
        "error-callback": () => onToken(""),
      });
    }

    let script = document.getElementById(TURNSTILE_SCRIPT_ID);

    if (!script) {
      script = document.createElement("script");
      script.id = TURNSTILE_SCRIPT_ID;
      script.src = TURNSTILE_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    if (window.turnstile) {
      renderWidget();
    } else {
      script.addEventListener("load", renderWidget, { once: true });
    }

    return () => {
      cancelled = true;
      script?.removeEventListener("load", renderWidget);

      if (widgetId !== null && window.turnstile?.remove) {
        try {
          window.turnstile.remove(widgetId);
        } catch {
          // Widget cleanup should never block account navigation.
        }
      }
    };
  }, [siteKey, resetKey]);

  return (
    <div
      ref={containerRef}
      className="account-turnstile"
      aria-label="Security check"
    />
  );
}

export function AccountWorkspacePage({ language, labels, dashboardLabels }) {
  const isSupported = supportsBrowserPush();
  const medusaConfigured = isMedusaConfigured();
  const turnstileSiteKey = String(
    import.meta.env.VITE_TURNSTILE_SITE_KEY || ""
  ).trim();
  const [customerId, setCustomerId] = useState("");
  const [status, setStatus] = useState(isSupported ? "idle" : "unsupported");
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    notes: "",
  });
  const [profilePhoto, setProfilePhoto] = useState("");
  const [coverPhoto, setCoverPhoto] = useState("");
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [profileSaved, setProfileSaved] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authPending, setAuthPending] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [accountUser, setAccountUser] = useState(null);
  const isLoading = status === "loading";
  const statusLabel = loyaltyStatusLabel(status, labels);
  const isFarsi = language === "farsi";
  const isAuthenticated = Boolean(accountUser);

  useEffect(() => {
    if (!medusaConfigured) {
      return undefined;
    }

    let active = true;

    loadCurrentCustomer()
      .then((customer) => {
        if (!active || !customer) return;

        applyAuthenticatedUser({
          id: customer.id,
          name: [customer.first_name, customer.last_name]
            .filter(Boolean)
            .join(" "),
          email: customer.email || "",
          phone: customer.phone || "",
        });
      })
      .catch((error) => {
        if (!active) return;
        setAuthError(error?.message || "Could not restore your Medusa session.");
      });

    return () => {
      active = false;
    };
  }, [medusaConfigured]);

  function handleProfileChange(field, value) {
    setProfile((currentProfile) => ({
      ...currentProfile,
      [field]: value,
    }));
    setProfileSaved(false);
  }

  function handleSinglePhotoChange(setPhoto) {
    return (event) => {
      const file = event.target.files?.[0];

      if (!file) return;

      const nextPhoto = URL.createObjectURL(file);
      setPhoto((currentPhoto) => {
        if (currentPhoto) URL.revokeObjectURL(currentPhoto);
        return nextPhoto;
      });
    };
  }

  function handleGalleryChange(event) {
    const files = Array.from(event.target.files || []);

    if (!files.length) return;

    setGalleryPhotos((currentPhotos) => [
      ...currentPhotos,
      ...files.slice(0, 6).map((file) => URL.createObjectURL(file)),
    ].slice(0, 6));
  }

  function handleSaveProfile(event) {
    event.preventDefault();
    setProfileSaved(true);
  }

  function handleAuthChange(field, value) {
    setAuthForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
    setAuthError("");
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();

    if (authPending || !medusaConfigured) return;

    const email = authForm.email.trim();
    const name = authForm.name.trim();
    const phone = normalizeMobilePhone(authForm.phone);

    if (!email || !authForm.password) {
      setAuthError(labels.authErrorRequired);
      return;
    }

    if (authForm.password.length < 8) {
      setAuthError(labels.authErrorPasswordLength);
      return;
    }

    if (authMode === "create" && !isValidMobilePhone(phone)) {
      setAuthError(
        isFarsi
          ? "شماره موبایل معتبر وارد کنید. شماره باید با کد کشور ثبت شود."
          : "Enter a valid mobile phone number, including the country code."
      );
      return;
    }

    if (
      authMode === "create" &&
      authForm.password !== authForm.confirmPassword
    ) {
      setAuthError(labels.authErrorPasswordMismatch);
      return;
    }

    if (authMode === "create" && !turnstileSiteKey) {
      setAuthError(
        isFarsi
          ? "ساخت حساب تا زمان پیکربندی بررسی امنیتی در دسترس نیست."
          : "Account creation is unavailable until the security check is configured."
      );
      return;
    }

    if (authMode === "create" && !captchaToken) {
      setAuthError(
        isFarsi
          ? "لطفاً بررسی امنیتی را کامل کنید."
          : "Complete the security check before creating your account."
      );
      return;
    }

    setAuthError("");
    setAuthPending(true);

    try {
      let customer;

      if (authMode === "create") {
        const parts = name.split(/\s+/).filter(Boolean);

        customer = await registerCustomer({
          email,
          password: authForm.password,
          firstName: parts[0] || "",
          lastName: parts.slice(1).join(" "),
          phone,
          captchaToken,
        });
      } else {
        customer = await loginCustomer(email, authForm.password);
      }

      if (!customer) {
        throw new Error(labels.failed || "Authentication failed.");
      }

      applyAuthenticatedUser({
        id: customer.id,
        name:
          [customer.first_name, customer.last_name]
            .filter(Boolean)
            .join(" ") || customer.email,
        email: customer.email || "",
        phone: customer.phone || phone,
      });

      setAuthForm({
        name,
        phone: customer.phone || phone,
        email,
        password: "",
        confirmPassword: "",
      });
      setCaptchaToken("");
    } catch (error) {
      setAuthError(error?.message || labels.failed || "Authentication failed.");

      if (authMode === "create") {
        setCaptchaToken("");
        setCaptchaResetKey((current) => current + 1);
      }
    } finally {
      setAuthPending(false);
    }
  }

  async function handleSignOut() {
    try {
      await logoutCustomer();
    } catch (error) {
      console.error("Medusa logout failed:", error);
    }

    setAccountUser(null);
    setCustomerId("");

    setAuthForm((currentForm) => ({
      ...currentForm,
      password: "",
      confirmPassword: "",
    }));
  }

  function applyAuthenticatedUser(user) {
    const name = user.name || user.email || "Customer";
    const email = user.email || "";
    const phone = user.phone || "";

    setAccountUser({ ...user, name, email, phone });
    setCustomerId(user.id || email);
    setProfile((currentProfile) => ({
      ...currentProfile,
      name: currentProfile.name || name,
      email: currentProfile.email || email,
      phone: currentProfile.phone || phone,
    }));
  }

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

  const profileLocation = [profile.city, profile.email || profile.phone].filter(Boolean).join(" / ");
  const accountMenu = [
    { label: labels.account, action: "account" },
    { label: labels.orders, action: "orders" },
    { label: labels.myInfo, action: "info" },
    { label: labels.notifications, action: "notifications" },
    { label: labels.notifyMeList, action: "notify" },
    { label: labels.giftCards, action: "gift-cards" },
    { label: labels.helpCenter, action: "help" },
    { label: labels.signOut, action: "sign-out" },
  ];
  const wishlistItems = [
    { name: "Cornell Slim Jeans - Dark Wash", image: "" },
    { name: "Viscose Ribbed Turtleneck FN - Black", image: "" },
    { name: "Pick A Side Denim Top - Black", image: "" },
  ];
  const viewedItems = [
    { name: "Cropped Striped Button Up Shirt - Black", image: "" },
    { name: "Princeton Textured Johnny Collar Polo Shirt - Cream", image: "" },
    { name: "Monarch Royale Watch - Gold", image: "" },
    { name: "Bulls Digi Camo Soccer Top - Red", image: "" },
  ];
  const recommendedItems = [
    { name: "Tailored Everyday Blazer - Charcoal", image: "" },
    { name: "Wide Pleated Trouser - Stone", image: "" },
    { name: "Soft Cotton Overshirt - Ivory", image: "" },
  ];
  const accountLinkGroups = [
    {
      title: labels.help,
      links: [labels.helpCenter, labels.trackOrder, labels.shippingInfo, labels.returns, labels.contactUs],
    },
    {
      title: labels.company,
      links: [labels.careers, labels.about, labels.stores, labels.ambassadorProgram],
    },
    {
      title: labels.quickLinks,
      links: [labels.blog, labels.sizeGuide, labels.sitemap, labels.giftCards, labels.checkGiftCardBalance],
    },
  ];

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
            <a href="#/shop" className="button button-outline">
              {dashboardLabels.viewStore}
              <ArrowRight />
            </a>
          </div>
        </div>

        {!isAuthenticated && !medusaConfigured && (
          <section className="account-auth-panel" dir={isFarsi ? "rtl" : undefined}>
            <div>
              <span className="eyebrow">{labels.authRequired}</span>
              <h2>
                {isFarsi ? "حساب مشتری به‌زودی فعال می‌شود" : "Customer accounts are coming soon"}
              </h2>
              <p>
                {isFarsi
                  ? "ورود، سفارش‌ها و اطلاعات حساب زمانی فعال می‌شوند که بک‌اند مدوسا راه‌اندازی شود."
                  : "Sign in, orders and saved account details will become available when the Medusa backend goes live."}
              </p>
            </div>
            <a href="#/shop" className="button button-dark">
              {dashboardLabels.viewStore}
              <ArrowRight />
            </a>
          </section>
        )}

        {!isAuthenticated && medusaConfigured && (
          <section className="account-auth-panel" dir={isFarsi ? "rtl" : undefined}>
            <div>
              <span className="eyebrow">{labels.authRequired}</span>
              <h2>{authMode === "login" ? labels.loginTitle : labels.createTitle}</h2>
              <p>{authMode === "login" ? labels.loginDescription : labels.createDescription}</p>
            </div>

            <form className="account-auth-form" onSubmit={handleAuthSubmit}>
              {authMode === "create" && (
                <>
                  <label>
                    <span>{labels.fullName}</span>
                    <input
                      type="text"
                      value={authForm.name}
                      onChange={(event) => handleAuthChange("name", event.target.value)}
                      placeholder={labels.fullNamePlaceholder}
                      autoComplete="name"
                    />
                  </label>

                  <label>
                    <span>{labels.phone}</span>
                    <input
                      type="tel"
                      value={authForm.phone}
                      onChange={(event) => handleAuthChange("phone", event.target.value)}
                      placeholder={labels.phonePlaceholder || "+98 912 123 4567"}
                      autoComplete="tel"
                      inputMode="tel"
                      required
                    />
                  </label>
                </>
              )}

              <label>
                <span>{labels.email}</span>
                <input
                  type="email"
                  value={authForm.email}
                  onChange={(event) => handleAuthChange("email", event.target.value)}
                  placeholder={labels.emailPlaceholder}
                  autoComplete="email"
                  required
                />
              </label>

              <label>
                <span>{labels.password}</span>
                <div className="password-field">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={authForm.password}
                    onChange={(event) => handleAuthChange("password", event.target.value)}
                    placeholder={labels.passwordPlaceholder}
                    autoComplete={authMode === "login" ? "current-password" : "new-password"}
                    minLength="8"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword((current) => !current)}>
                    {showPassword ? labels.hidePassword : labels.showPassword}
                  </button>
                </div>
              </label>

              {authMode === "create" && (
                <>
                  <label>
                    <span>{labels.confirmPassword}</span>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={authForm.confirmPassword}
                      onChange={(event) => handleAuthChange("confirmPassword", event.target.value)}
                      placeholder={labels.confirmPasswordPlaceholder}
                      autoComplete="new-password"
                      minLength="8"
                      required
                    />
                  </label>

                  {turnstileSiteKey ? (
                    <TurnstileWidget
                      siteKey={turnstileSiteKey}
                      resetKey={captchaResetKey}
                      onToken={setCaptchaToken}
                    />
                  ) : (
                    <p className="account-auth-error" role="status">
                      {isFarsi
                        ? "بررسی امنیتی برای ساخت حساب هنوز پیکربندی نشده است."
                        : "The security check for account creation is not configured yet."}
                    </p>
                  )}
                </>
              )}

              {authError && (
                <strong className="account-auth-error" role="alert">
                  {authError}
                </strong>
              )}

              <div className="account-auth-actions">
                <button
                  type="submit"
                  className="button button-dark"
                  disabled={
                    authPending ||
                    (authMode === "create" && (!turnstileSiteKey || !captchaToken))
                  }
                >
                  {authPending
                    ? (labels.loading || "Please wait...")
                    : (authMode === "login" ? labels.login : labels.createAccount)}
                  {!authPending && <ArrowRight />}
                </button>

                <button
                  type="button"
                  className="account-auth-switch"
                  disabled={authPending}
                  onClick={() => {
                    setAuthMode((currentMode) => (currentMode === "login" ? "create" : "login"));
                    setAuthError("");
                    setCaptchaToken("");
                    setCaptchaResetKey((current) => current + 1);
                  }}
                >
                  {authMode === "login" ? labels.switchToCreate : labels.switchToLogin}
                </button>
              </div>

              <p>{labels.authSecurityNote}</p>
            </form>
          </section>
        )}

        {isAuthenticated && (
          <section className="account-dashboard">
            <aside className="account-menu" aria-label={labels.account}>
              {accountMenu.map((item) => (
                <button
                  type="button"
                  className={item.action === "account" ? "account-menu-active" : ""}
                  key={item.action}
                  onClick={item.action === "sign-out" ? handleSignOut : undefined}
                >
                  {item.label}
                </button>
              ))}
            </aside>

            <div className="account-main">
              <div className="account-welcome">
                <span className="eyebrow">{labels.account}</span>
                <h2>{labels.greeting.replace("Parham", accountUser?.name || "Customer").replace("پرهام", accountUser?.name || "مشتری")}</h2>
              </div>

              <AccountProductRail title={labels.wishlist} viewAllLabel={labels.viewAll} products={wishlistItems} />
              <AccountProductRail title={labels.viewed} viewAllLabel={labels.viewAll} products={viewedItems} />
              <AccountProductRail title={labels.recommended} viewAllLabel={labels.viewAll} products={recommendedItems} />

              <div className="account-app-panel">
                <strong>{labels.shopFaster}</strong>
                <a href="#/shop" className="button button-light">
                  {dashboardLabels.viewStore}
                  <ArrowRight />
                </a>
              </div>

              <div className="account-footer-links">
                {accountLinkGroups.map((group) => (
                  <div key={group.title}>
                    <h3>{group.title}</h3>
                    {group.links.map((link) => (
                      <a href="#/account" key={link}>{link}</a>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {isAuthenticated && (
          <section className="profile-landing" dir={isFarsi ? "rtl" : undefined}>
            <div className="profile-cover">
              {coverPhoto ? (
                <img src={coverPhoto} alt="" />
              ) : (
                <div className="profile-cover-empty" aria-hidden="true" />
              )}

              <label className="profile-upload profile-cover-upload">
                <input type="file" accept="image/*" onChange={handleSinglePhotoChange(setCoverPhoto)} />
                <span>{coverPhoto ? labels.changePhoto : labels.coverPhoto}</span>
              </label>
            </div>

            <div className="profile-intro">
              <div className="profile-avatar-wrap">
                <div className="profile-avatar">
                  {profilePhoto ? (
                    <img src={profilePhoto} alt="" />
                  ) : (
                    <span>{(profile.name || "M").trim().charAt(0).toUpperCase()}</span>
                  )}
                </div>

                <label className="profile-upload">
                  <input type="file" accept="image/*" onChange={handleSinglePhotoChange(setProfilePhoto)} />
                  <span>{profilePhoto ? labels.changePhoto : labels.addPhoto}</span>
                </label>
              </div>

              <div>
                <span className="eyebrow">{labels.profileEyebrow}</span>
                <h2>{labels.heroTitle}</h2>
                <p>{labels.heroDescription}</p>
              </div>
            </div>

            <div className="profile-content-grid">
              <form className="profile-form" onSubmit={handleSaveProfile}>
                <div className="dashboard-panel-header">
                  <h2>{labels.profileDetails}</h2>
                  <span>{labels.profilePhoto}</span>
                </div>

                <div className="profile-field-grid">
                  <label>
                    <span>{labels.fullName}</span>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(event) => handleProfileChange("name", event.target.value)}
                      placeholder={labels.fullNamePlaceholder}
                      autoComplete="name"
                    />
                  </label>

                  <label>
                    <span>{labels.city}</span>
                    <input
                      type="text"
                      value={profile.city}
                      onChange={(event) => handleProfileChange("city", event.target.value)}
                      placeholder={labels.cityPlaceholder}
                      autoComplete="address-level2"
                    />
                  </label>

                  <label>
                    <span>{labels.email}</span>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(event) => handleProfileChange("email", event.target.value)}
                      placeholder={labels.emailPlaceholder}
                      autoComplete="email"
                    />
                  </label>

                  <label>
                    <span>{labels.phone}</span>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(event) => handleProfileChange("phone", event.target.value)}
                      placeholder={labels.phonePlaceholder}
                      autoComplete="tel"
                    />
                  </label>
                </div>

                <label>
                  <span>{labels.notes}</span>
                  <textarea
                    rows="4"
                    value={profile.notes}
                    onChange={(event) => handleProfileChange("notes", event.target.value)}
                    placeholder={labels.notesPlaceholder}
                  />
                </label>

                <button type="submit" className="button button-dark">
                  {labels.saveProfile}
                  <ArrowRight />
                </button>
                {profileSaved && <p>{labels.profileSaved}</p>}
              </form>

              <aside className="profile-side-panel">
                <div className="profile-location-card">
                  <span>{labels.location}</span>
                  <strong>{profileLocation || labels.locationPlaceholder}</strong>
                </div>

                <div className="profile-gallery-card">
                  <div className="dashboard-panel-header">
                    <h2>{labels.gallery}</h2>
                    <span>{galleryPhotos.length}/6</span>
                  </div>

                  <div className="profile-gallery-grid">
                    {galleryPhotos.map((photo) => (
                      <img key={photo} src={photo} alt="" />
                    ))}
                  </div>

                  <label className="profile-upload">
                    <input type="file" accept="image/*" multiple onChange={handleGalleryChange} />
                    <span>{labels.addGallery}</span>
                  </label>
                </div>
              </aside>
            </div>
          </section>
        )}

        {isAuthenticated && (
          <section className="profile-card">
            <div className="dashboard-panel-header">
              <h2>{labels.loyaltyTitle}</h2>
              <span>{statusLabel}</span>
            </div>

            <p>{labels.loyaltyDescription}</p>

            <button
              type="button"
              className="button button-outline"
              disabled={isLoading || status === "active"}
              onClick={handleEnablePush}
            >
              {isLoading ? labels.loading : labels.enableNotifications}
            </button>
          </section>
        )}
      </section>
    </div>
  );
}

function loyaltyStatusLabel(status, labels) {
  switch (status) {
    case "active":
      return labels.active;
    case "unsupported":
      return labels.unsupported;
    case "denied":
      return labels.denied;
    case "failed":
      return labels.failed;
    case "loading":
      return labels.loading;
    default:
      return labels.inactive;
  }
}
