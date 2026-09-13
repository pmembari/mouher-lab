import { useEffect, useState } from "react";
import { ArrowRight } from "../components/icons";
import { ProductImage } from "../components/ProductImage";
import {
  initKeycloakSession,
  isKeycloakConfigured,
  loginWithKeycloak,
  logoutFromKeycloak,
  registerWithKeycloak,
} from "../lib/keycloakAuth";
import {
  requestLoyaltyPushSubscription,
  supportsBrowserPush,
} from "../lib/notifications";

function AccountProductRail({ title, viewAllLabel, products }) {
  return (
    <section className="account-rail">
      <div className="account-rail-header">
        <h3>{title}</h3>
        <a href="#products">{viewAllLabel}</a>
      </div>

      <div className="account-product-row">
        {products.map((product, index) => (
          <a href="#products" className="account-product-card" key={product.name}>
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

export function AccountWorkspacePage({ language, labels, dashboardLabels }) {
  const isSupported = supportsBrowserPush();
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
    name: "Parham",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [accountUser, setAccountUser] = useState(null);
  const [keycloakReady, setKeycloakReady] = useState(!isKeycloakConfigured());
  const isLoading = status === "loading";
  const statusLabel = loyaltyStatusLabel(status, labels);
  const isFarsi = language === "farsi";
  const keycloakEnabled = isKeycloakConfigured();
  const isAuthenticated = Boolean(accountUser);

  useEffect(() => {
    if (!keycloakEnabled) return;

    let active = true;

    initKeycloakSession()
      .then((session) => {
        if (!active) return;

        setKeycloakReady(true);

        if (session.authenticated && session.user) {
          applyAuthenticatedUser(session.user);
        }
      })
      .catch((error) => {
        console.error("Keycloak initialization failed:", error);

        if (active) {
          setKeycloakReady(true);
          setAuthError(labels.failed || "Authentication is unavailable.");
        }
      });

    return () => {
      active = false;
    };
  }, [keycloakEnabled, labels.failed]);

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

  function handleAuthSubmit(event) {
    event.preventDefault();

    if (keycloakEnabled) {
      const redirectUri = window.location.href;

      if (authMode === "create") {
        registerWithKeycloak({ redirectUri });
      } else {
        loginWithKeycloak({ redirectUri });
      }

      return;
    }

    const email = authForm.email.trim();
    const name = authForm.name.trim() || "Parham";

    if (!email || !authForm.password) {
      setAuthError(labels.authErrorRequired);
      return;
    }

    if (authForm.password.length < 8) {
      setAuthError(labels.authErrorPasswordLength);
      return;
    }

    if (authMode === "create" && authForm.password !== authForm.confirmPassword) {
      setAuthError(labels.authErrorPasswordMismatch);
      return;
    }

    applyAuthenticatedUser({ name, email });
    setAuthForm({
      name,
      email,
      password: "",
      confirmPassword: "",
    });
    setAuthError("");
  }

  function handleSignOut() {
    if (keycloakEnabled) {
      logoutFromKeycloak();
      return;
    }

    setAccountUser(null);
    setAuthForm((currentForm) => ({
      ...currentForm,
      password: "",
      confirmPassword: "",
    }));
  }

  function applyAuthenticatedUser(user) {
    const name = user.name || "Parham";
    const email = user.email || "";

    setAccountUser({ ...user, name, email });
    setCustomerId(user.id || email);
    setProfile((currentProfile) => ({
      ...currentProfile,
      name: currentProfile.name || name,
      email: currentProfile.email || email,
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
    {
      name: "Cornell Slim Jeans - Dark Wash",
      image: "",
    },
    {
      name: "Viscose Ribbed Turtleneck FN - Black",
      image: "",
    },
    {
      name: "Pick A Side Denim Top - Black",
      image: "",
    },
  ];
  const viewedItems = [
    {
      name: "Cropped Striped Button Up Shirt - Black",
      image: "",
    },
    {
      name: "Princeton Textured Johnny Collar Polo Shirt - Cream",
      image: "",
    },
    {
      name: "Monarch Royale Watch - Gold",
      image: "",
    },
    {
      name: "Bulls Digi Camo Soccer Top - Red",
      image: "",
    },
  ];
  const recommendedItems = [
    {
      name: "Tailored Everyday Blazer - Charcoal",
      image: "",
    },
    {
      name: "Wide Pleated Trouser - Stone",
      image: "",
    },
    {
      name: "Soft Cotton Overshirt - Ivory",
      image: "",
    },
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
            <a href="#products" className="button button-outline">
              {dashboardLabels.viewStore}
              <ArrowRight />
            </a>
          </div>
        </div>

        {!isAuthenticated && (
          <section className="account-auth-panel" dir={isFarsi ? "rtl" : undefined}>
            <div>
              <span className="eyebrow">{labels.authRequired}</span>
              <h2>{authMode === "login" ? labels.loginTitle : labels.createTitle}</h2>
              <p>{authMode === "login" ? labels.loginDescription : labels.createDescription}</p>
            </div>

            <form className="account-auth-form" onSubmit={handleAuthSubmit}>
              {!keycloakEnabled && authMode === "create" && (
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
              )}

              {!keycloakEnabled && (
                <>
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
                  )}
                </>
              )}

              {keycloakEnabled && (
                <div className="account-auth-provider">
                  <strong>Keycloak</strong>
                  <span>{labels.authSecurityNote}</span>
                </div>
              )}

              {authError && (
                <strong className="account-auth-error" role="alert">
                  {authError}
                </strong>
              )}

              <div className="account-auth-actions">
                <button type="submit" className="button button-dark" disabled={!keycloakReady}>
                  {authMode === "login" ? labels.login : labels.createAccount}
                  <ArrowRight />
                </button>

                <button
                  type="button"
                  className="account-auth-switch"
                  onClick={() => {
                    setAuthMode((currentMode) => (currentMode === "login" ? "create" : "login"));
                    setAuthError("");
                  }}
                >
                  {authMode === "login" ? labels.switchToCreate : labels.switchToLogin}
                </button>
              </div>

              {!keycloakEnabled && <p>{labels.authSecurityNote}</p>}
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
              <h2>{labels.greeting.replace("Parham", accountUser?.name || "Parham").replace("پرهام", accountUser?.name || "پرهام")}</h2>
            </div>

            <AccountProductRail
              title={labels.wishlist}
              viewAllLabel={labels.viewAll}
              products={wishlistItems}
            />

            <AccountProductRail
              title={labels.viewed}
              viewAllLabel={labels.viewAll}
              products={viewedItems}
            />

            <AccountProductRail
              title={labels.recommended}
              viewAllLabel={labels.viewAll}
              products={recommendedItems}
            />

            <div className="account-app-panel">
              <strong>{labels.shopFaster}</strong>
              <a href="#products" className="button button-light">
                {dashboardLabels.viewStore}
                <ArrowRight />
              </a>
            </div>

            <div className="account-footer-links">
              {accountLinkGroups.map((group) => (
                <div key={group.title}>
                  <h3>{group.title}</h3>
                  {group.links.map((link) => (
                    <a href="#/account" key={link}>
                      {link}
                    </a>
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
              <input
                type="file"
                accept="image/*"
                onChange={handleSinglePhotoChange(setCoverPhoto)}
              />
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
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSinglePhotoChange(setProfilePhoto)}
                />
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

              <label className="profile-notes-field">
                <span>{labels.styleNotes}</span>
                <textarea
                  value={profile.notes}
                  onChange={(event) => handleProfileChange("notes", event.target.value)}
                  placeholder={labels.styleNotesPlaceholder}
                  rows="6"
                />
              </label>

              <div className="profile-form-actions">
                <button type="submit" className="button button-dark">
                  {labels.saveProfile}
                  <ArrowRight />
                </button>

                {profileSaved && <span role="status">{labels.savedProfile}</span>}
              </div>
            </form>

            <aside className="profile-preview" aria-label={labels.previewLabel}>
              <span>{labels.previewLabel}</span>
              <h3>{profile.name || labels.emptyName}</h3>
              <p>{profileLocation || labels.emptyLocation}</p>
              <blockquote>{profile.notes || labels.emptyBio}</blockquote>
            </aside>
          </div>

          <section className="profile-gallery-panel">
            <div className="dashboard-panel-header">
              <h2>{labels.gallery}</h2>

              <label className="profile-upload">
                <input type="file" accept="image/*" multiple onChange={handleGalleryChange} />
                <span>{labels.addGalleryPhoto}</span>
              </label>
            </div>

            <div className="profile-gallery-grid">
              {galleryPhotos.length ? (
                galleryPhotos.map((photo) => (
                  <img src={photo} alt="" key={photo} />
                ))
              ) : (
                [0, 1, 2].map((slot) => (
                  <div className="profile-gallery-empty" key={slot} aria-hidden="true" />
                ))
              )}
            </div>
          </section>
        </section>
        )}

        {isAuthenticated && (
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
        )}
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
