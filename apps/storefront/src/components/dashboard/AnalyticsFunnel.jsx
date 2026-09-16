export function AnalyticsFunnel({ title, rows = [] }) {
  const maximum = Math.max(
    1,
    ...rows.map((row) => Number(row.value) || 0)
  );

  return (
    <section
      className="analytics-chart analytics-funnel"
      aria-label={title}
    >
      <h3>{title}</h3>

      {rows.map((row) => (
        <div
          className="analytics-funnel-row"
          key={row.label}
        >
          <div>
            <span>{row.label}</span>
            <strong>{row.value}</strong>
          </div>

          <i
            style={{
              width: `${((Number(row.value) || 0) / maximum) * 100
                }%`,
            }}
          />
        </div>
      ))}
    </section>
  );
}