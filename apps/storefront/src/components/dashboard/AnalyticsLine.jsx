export function AnalyticsLine({ data = [] }) {
  const maxValue = Math.max(
    ...data.map((item) => Number(item.value) || 0),
    1
  );

  return (
    <div className="analytics-line">
      {data.map((item) => {
        const value = Number(item.value) || 0;
        const height = Math.max((value / maxValue) * 100, 4);

        return (
          <div className="analytics-line-point" key={item.label}>
            <div className="analytics-line-track">
              <span
                className="analytics-line-dot"
                style={{ bottom: `${height}%` }}
              />
            </div>

            <strong>{value}</strong>
            <span>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}