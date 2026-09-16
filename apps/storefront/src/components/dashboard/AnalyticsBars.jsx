export function AnalyticsBars({ data = [] }) {
  const maxValue = Math.max(
    ...data.map((item) => Number(item.value) || 0),
    1
  );

  return (
    <div className="analytics-bars">
      {data.map((item) => {
        const value = Number(item.value) || 0;
        const height = Math.max((value / maxValue) * 100, 4);

        return (
          <div className="analytics-bar-item" key={item.label}>
            <div className="analytics-bar-track">
              <div
                className="analytics-bar-fill"
                style={{ height: `${height}%` }}
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