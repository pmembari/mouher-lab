export function OwnerAnalyticsReport({
  title,
  rows = [],
  valueKey,
  valueLabel,
  isFarsi,
}) {
  return (
    <section
      className="analytics-report"
      aria-label={title}
    >
      <h3>{title}</h3>

      {rows.length ? (
        rows.map((row) => (
          <div
            className="analytics-report-row"
            key={row.product_id}
          >
            <span>
              {row.product_name || row.product_id}
            </span>

            <strong>
              {row[valueKey] || 0} {valueLabel}
            </strong>
          </div>
        ))
      ) : (
        <p className="analytics-empty">
          {isFarsi
            ? "هنوز داده‌ای ثبت نشده است."
            : "No report data yet."}
        </p>
      )}
    </section>
  );
}