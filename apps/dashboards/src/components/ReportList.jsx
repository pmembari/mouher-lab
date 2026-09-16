import { rowLabel } from "../lib/dashboardMetrics.js";

export function ReportList({ rows = [], valueKey, empty = "No report data yet.", renderMeta }) {
  if (!rows.length) return <p className="muted">{empty}</p>;
  return <div className="report-list">{rows.slice(0, 10).map((row, index) => <div key={row.product_id || row.id || index}><span>{rowLabel(row)}{renderMeta ? <small>{renderMeta(row)}</small> : null}</span><strong>{row[valueKey] || 0}</strong></div>)}</div>;
}
