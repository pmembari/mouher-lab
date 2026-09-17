import { useEffect, useState } from "react";
import { ArrowRight } from "../components/icons";
import { isMedusaConfigured } from "../lib/catalog/config.js";
import {
  isValidMobilePhone,
  loadCurrentCustomer,
  loginCustomer,
  logoutCustomer,
  normalizeMobilePhone,
  registerCustomer,
} from "../lib/medusaAuth";

export function AccountWorkspacePage({ language, labels, dashboardLabels }) {
  const medusaConfigured = isMedusaConfigured();
  const isFarsi = language === "farsi";
  const [authMode, setAuthMode] = useState("login");
  const [authPending, setAuthPending] = useState(false);
  const [authError, setAuthError] = useState("");
  const [accountUser, setAccountUser] = useState(null);
  const [authForm, setAuthForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!medusaConfigured) return undefined;

    let active = true;

    loadCurrentCustomer()
      .then((customer) => {
        if (!active || !customer) return;
        setAccountUser(normalizeCustomer(customer));
      })
      .catch((error) => {
        if (!active) return;
        setAuthError(
          error?.message ||
          (isFarsi
            ? "بازیابی نشست مدوسا ممکن نشد."
            : "Could not restore your Medusa session.")
        );
      });

    return () => {
      active = false;
    };
  }, [medusaConfigured, isFarsi]);

  function handleAuthChange(field, value) {
    setAuthForm((current) => ({
      ...current,
      [field]: value,
    }));
    setAuthError("");
  }

  function switchAuthMode() {
    setAuthMode((current) =>
      current === "login" ? "create" : "login"
    );
    setAuthError("");
    setAuthForm((current) => ({
      ...current,
      password: "",
      confirmPassword: "",
    }));
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();

    if (!medusaConfigured || authPending) return;

    const email = authForm.email.trim();
    const password = authForm.password;
    const name = authForm.name.trim();
    const phone = normalizeMobilePhone(authForm.phone);

    if (!email || !password) {
      setAuthError(labels.authErrorRequired);
      return;
    }

    if (password.length < 8) {
      setAuthError(labels.authErrorPasswordLength);
      return;
    }

    if (authMode === "create") {
      if (!name) {
        setAuthError(
          isFarsi
            ? "نام و نام خانوادگی را وارد کنید."
            : "Enter your full name."
        );
        return;
      }

      if (!isValidMobilePhone(phone)) {
        setAuthError(
          isFarsi
            ? "شماره موبایل معتبر وارد کنید. شماره ایران می‌تواند با 09 شروع شود."
            : "Enter a valid mobile phone number. Iranian numbers may start with 09."
        );
        return;
      }

      if (password !== authForm.confirmPassword) {
        setAuthError(labels.authErrorPasswordMismatch);
        return;
      }
    }

    setAuthPending(true);
    setAuthError("");

    try {
      let customer;

      if (authMode === "create") {
        const parts = name.split(/\s+/).filter(Boolean);

        customer = await registerCustomer({
          email,
          password,
          firstName: parts[0] || "",
          lastName: parts.slice(1).join(" "),
          phone,
        });
      } else {
        customer = await loginCustomer(email, password);
      }

      setAccountUser(normalizeCustomer(customer));
      setAuthForm((current) => ({
        ...current,
        name:
          [customer.first_name, customer.last_name]
            .filter(Boolean)
            .join(" ") || current.name,
        phone: customer.phone || current.phone,
        email: customer.email || email,
        password: "",
        confirmPassword: "",
      }));
    } catch (error) {
      setAuthError(
        error?.message ||
        labels.failed ||
        (isFarsi ? "ورود انجام نشد." : "Authentication failed.")
      );
    } finally {
      setAuthPending(false);
    }
  }

  async function handleSignOut() {
    setAuthPending(true);
    setAuthError("");

    try {
      await logoutCustomer();
      setAccountUser(null);
      setAuthForm((current) => ({
        ...current,
        password: "",
        confirmPassword: "",
      }));
    } catch (error) {
      setAuthError(
        error?.message ||
        (isFarsi ? "خروج انجام نشد." : "Could not sign out.")
      );
    } finally {
      setAuthPending(false);
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
            <a href="#/shop" className="button button-outline">
              {dashboardLabels.viewStore}
              <ArrowRight />
            </a>
          </div>
        </div>

        {!medusaConfigured && (
          <section className="account-auth-panel" dir={isFarsi ? "rtl" : undefined}>
            <div>
              <span className="eyebrow">{labels.authRequired}</span>
              <h2>
                {isFarsi
                  ? "حساب مشتری در مرحله توسعه است"
                  : "Customer accounts are in development"}
              </h2>
              <p>
                {isFarsi
                  ? "پس از راه‌اندازی بک‌اند مدوسا، ورود و ساخت حساب واقعی در همین صفحه فعال می‌شود."
                  : "Real sign in and account creation will activate here when the Medusa backend is configured."}
              </p>
            </div>
            <a href="#/shop" className="button button-dark">
              {dashboardLabels.viewStore}
              <ArrowRight />
            </a>
          </section>
        )}

        {medusaConfigured && !accountUser && (
          <section className="account-auth-panel" dir={isFarsi ? "rtl" : undefined}>
            <div>
              <span className="eyebrow">{labels.authRequired}</span>
              <h2>
                {authMode === "login"
                  ? labels.loginTitle
                  : labels.createTitle}
              </h2>
              <p>
                {authMode === "login"
                  ? labels.loginDescription
                  : labels.createDescription}
              </p>
            </div>

            <form className="account-auth-form" onSubmit={handleAuthSubmit}>
              {authMode === "create" && (
                <>
                  <label>
                    <span>{labels.fullName}</span>
                    <input
                      type="text"
                      value={authForm.name}
                      onChange={(event) =>
                        handleAuthChange("name", event.target.value)
                      }
                      placeholder={labels.fullNamePlaceholder}
                      autoComplete="name"
                      required
                    />
                  </label>

                  <label>
                    <span>{labels.phone}</span>
                    <input
                      type="tel"
                      value={authForm.phone}
                      onChange={(event) =>
                        handleAuthChange("phone", event.target.value)
                      }
                      placeholder={
                        isFarsi ? "0912 123 4567" : "+98 912 123 4567"
                      }
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
                  onChange={(event) =>
                    handleAuthChange("email", event.target.value)
                  }
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
                    onChange={(event) =>
                      handleAuthChange("password", event.target.value)
                    }
                    placeholder={labels.passwordPlaceholder}
                    autoComplete={
                      authMode === "login"
                        ? "current-password"
                        : "new-password"
                    }
                    minLength="8"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                  >
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
                    onChange={(event) =>
                      handleAuthChange("confirmPassword", event.target.value)
                    }
                    placeholder={labels.confirmPasswordPlaceholder}
                    autoComplete="new-password"
                    minLength="8"
                    required
                  />
                </label>
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
                  disabled={authPending}
                >
                  {authPending
                    ? (labels.loading || "Please wait...")
                    : authMode === "login"
                      ? labels.login
                      : labels.createAccount}
                  {!authPending && <ArrowRight />}
                </button>

                <button
                  type="button"
                  className="account-auth-switch"
                  disabled={authPending}
                  onClick={switchAuthMode}
                >
                  {authMode === "login"
                    ? labels.switchToCreate
                    : labels.switchToLogin}
                </button>
              </div>

              <p>
                {isFarsi
                  ? "احراز هویت مستقیماً توسط مدوسا انجام می‌شود. رمز عبور در فرانت‌اند ذخیره نمی‌شود."
                  : "Authentication is handled directly by Medusa. Your password is not stored by the storefront."}
              </p>
            </form>
          </section>
        )}

        {medusaConfigured && accountUser && (
          <section className="account-dashboard" dir={isFarsi ? "rtl" : undefined}>
            <aside className="account-menu" aria-label={labels.account}>
              <button type="button" className="account-menu-active">
                {labels.account}
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={authPending}
              >
                {labels.signOut}
              </button>
            </aside>

            <div className="account-main">
              <div className="account-welcome">
                <span className="eyebrow">{labels.account}</span>
                <h2>
                  {isFarsi ? "سلام" : "Hi"}, {accountUser.name}
                </h2>
              </div>

              <div className="profile-content-grid">
                <div className="profile-form">
                  <div className="dashboard-panel-header">
                    <h2>{labels.profileDetails}</h2>
                  </div>

                  <div className="profile-field-grid">
                    <label>
                      <span>{labels.fullName}</span>
                      <input value={accountUser.name} readOnly />
                    </label>
                    <label>
                      <span>{labels.email}</span>
                      <input value={accountUser.email} readOnly />
                    </label>
                    <label>
                      <span>{labels.phone}</span>
                      <input value={accountUser.phone || "—"} readOnly />
                    </label>
                  </div>
                </div>
              </div>

              {authError && (
                <strong className="account-auth-error" role="alert">
                  {authError}
                </strong>
              )}

              <div className="account-app-panel">
                <strong>
                  {isFarsi
                    ? "حساب شما به مدوسا متصل است."
                    : "Your account is connected to Medusa."}
                </strong>
                <a href="#/shop" className="button button-light">
                  {dashboardLabels.viewStore}
                  <ArrowRight />
                </a>
              </div>
            </div>
          </section>
        )}
      </section>
    </div>
  );
}

function normalizeCustomer(customer) {
  const name = [customer?.first_name, customer?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return {
    id: customer?.id || "",
    name: name || customer?.email || "Customer",
    email: customer?.email || "",
    phone: customer?.phone || "",
  };
}
