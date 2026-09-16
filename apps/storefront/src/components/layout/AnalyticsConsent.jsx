export default function AnalyticsConsent({
  visible,
  isFarsi,
  onDecline,
  onAccept,
}) {
  if (!visible) {
    return null;
  }

  return (
    <aside
      className="analytics-consent"
      role="dialog"
      aria-label="Analytics preferences"
    >
      <p>
        {isFarsi
          ? "با اجازه شما، رفتار خرید را به‌صورت ناشناس برای بهبود فروشگاه تحلیل می‌کنیم. مکان فقط در سطح شهر/منطقه ثبت می‌شود."
          : "With your permission, we use first-party analytics to improve the store. Location is limited to city/region level and no raw IP is stored."}
      </p>

      <div>
        <button
          type="button"
          className="button button-outline"
          onClick={onDecline}
        >
          {isFarsi ? "رد کردن" : "Decline"}
        </button>

        <button
          type="button"
          className="button button-dark"
          onClick={onAccept}
        >
          {isFarsi ? "پذیرفتن" : "Allow analytics"}
        </button>
      </div>
    </aside>
  );
}