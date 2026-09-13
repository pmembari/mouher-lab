import { asNumber, compactDate } from "../lib/dashboardMetrics.js";

export function TrendChart({ rows, valueKey = "events", label = "Daily activity trend" }) {
  const points = rows.length ? rows : Array.from({ length: 7 }, (_, index) => ({ date: `Day ${index + 1}`, events: 0 }));
  const valueFor = (row) => asNumber(row[valueKey] ?? row.events ?? row.total ?? row.count);
  const maximum = Math.max(1, ...points.map(valueFor));
  return <div><div className="trend-chart" aria-label={label}>{points.map((row) => <div className="trend-column" key={row.date}><i title={`${row.date}: ${valueFor(row)}`} style={{ height: `${Math.max(4, (valueFor(row) / maximum) * 100)}%` }} /><span>{compactDate(row.date)}</span></div>)}</div><table className="chart-table"><thead><tr><th>Date</th><th>Value</th></tr></thead><tbody>{points.map((row) => <tr key={row.date}><td>{row.date}</td><td>{valueFor(row)}</td></tr>)}</tbody></table></div>;
}

export function FunnelChart({ funnel = {} }) {
  const rows = [["Product views", funnel.product_views], ["Added to cart", funnel.adds], ["Checkout", funnel.checkouts], ["Purchase", funnel.purchases]];
  const maximum = Math.max(1, asNumber(funnel.product_views));
  return <div className="funnel-chart" aria-label="Commerce funnel">{rows.map(([label, value]) => <div key={label}><div><span>{label}</span><strong>{value || 0}</strong></div><i style={{ width: `${Math.min(100, ((value || 0) / maximum) * 100)}%` }} /></div>)}</div>;
}
