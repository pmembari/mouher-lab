export default function LanguageSwitch({
  language,
  isFarsi,
  onToggle,
}) {
  return (
    <button
      type="button"
      className="language-indicator"
      onClick={onToggle}
      aria-label={
        isFarsi
          ? "Switch to Pinglish"
          : "تغییر زبان به فارسی"
      }
    >
      <span
        className={
          language === "pinglish"
            ? "active"
            : ""
        }
      >
        EN
      </span>

      <span
        className="language-dot"
        aria-hidden="true"
      >
        /
      </span>

      <span
        className={
          language === "farsi"
            ? "active"
            : ""
        }
      >
        فا
      </span>
    </button>
  );
}