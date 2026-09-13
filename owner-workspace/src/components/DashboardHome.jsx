import { FunnelChart, TrendChart } from "./Charts.jsx";
import { ReportList } from "./ReportList.jsx";
import { asNumber, exportCsv, money, percent, rowLabel, stockCount } from "../lib/dashboardMetrics.js";

function Metric({ label, value, detail, tone = "" }) { return <article className={`metric ${tone}`}><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>; }
function Panel({ title, children, wide = false, action }) { return <section className={`panel ${wide ? "wide" : ""}`}><div className="panel-heading"><h2>{title}</h2>{action || <span>REPORT</span>}</div>{children}</section>; }

function orderRevenue(orders) {
  return orders.reduce((sum, order) => sum + asNumber(order.total || order.total_paid || order.summary?.paid_total), 0);
}

function statusRows(rows, key = "status") {
  const counts = new Map();
  for (const row of rows) {
    const value = row[key] || "unknown";
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return [...counts].map(([name, count]) => ({ id: name, name, count })).sort((a, b) => b.count - a.count);
}

export function DashboardHome({ analytics, products, orders, customers }) {
  const funnel = analytics?.funnel || {};
  const lowStock = products.filter((product) => stockCount(product) > 0 && stockCount(product) <= 5);
  const outOfStock = products.filter((product) => stockCount(product) <= 0);
  const attention = [...outOfStock.map((row) => ({ ...row, reason: "Out of stock", severity: "High", stock: stockCount(row) })), ...lowStock.map((row) => ({ ...row, reason: "Low stock", severity: "Medium", stock: stockCount(row) }))];
  const today = new Date().toISOString().slice(0, 10);
  const changedToday = [...orders, ...products, ...customers].filter((row) => String(row.updated_at || row.created_at || "").startsWith(today)).length;
  const daily = analytics?.daily || [];
  const devices = analytics?.devices || [];
  const locations = analytics?.locations || [];
  const revenue = asNumber(analytics?.gross_revenue ?? analytics?.revenue ?? orderRevenue(orders));
  const purchaseCount = asNumber(funnel.purchases || analytics?.purchase_count || orders.length);
  const aov = purchaseCount ? revenue / purchaseCount : 0;
  return <><section className="metric-grid"><Metric label="Visitors" value={analytics?.visitors || 0} detail={`${analytics?.range_days || 30}-day selected period`} /><Metric label="Conversion" value={percent(funnel.purchases, funnel.product_views)} detail={`${funnel.purchases || 0} purchases from ${funnel.product_views || 0} views`} /><Metric label="Gross revenue" value={money(revenue, analytics?.currency || orders[0]?.currency_code)} detail={`${money(aov, analytics?.currency || orders[0]?.currency_code)} average order`} /><Metric label="Needs attention" value={attention.length} detail="low stock, out of stock, stale signals" tone={attention.length ? "warning" : ""} /></section><section className="content-grid"><Panel title="Traffic and conversion trend" wide action={<button className="export-button" type="button" onClick={() => exportCsv("mouher-daily-analytics.csv", [["date", "events", "visitors", "purchases"], ...daily.map((row) => [row.date, row.events ?? row.total ?? 0, row.visitors ?? 0, row.purchases ?? 0])])}>Export CSV</button>}><TrendChart rows={daily} /><div className="insight-strip"><span>{analytics?.events || 0} total events</span><span>{analytics?.account_visitors || 0} account visitors</span><span>{Math.max(0, asNumber(funnel.checkouts) - asNumber(funnel.purchases))} checkout drop-off</span></div></Panel><Panel title="Commerce funnel" action={<button className="export-button" type="button" onClick={() => exportCsv("mouher-funnel.csv", [["step", "value"], ["product_views", funnel.product_views || 0], ["adds", funnel.adds || 0], ["checkouts", funnel.checkouts || 0], ["purchases", funnel.purchases || 0]])}>Export CSV</button>}><FunnelChart funnel={funnel} /></Panel><Panel title="What changed today"><p className="big-number">{changedToday}</p><p className="muted">Products, orders, and customers created or updated on {today}.</p></Panel><Panel title="Attention queue" action={<button className="export-button" type="button" onClick={() => exportCsv("mouher-attention.csv", [["item", "reason", "severity", "stock"], ...attention.map((row) => [rowLabel(row), row.reason, row.severity, row.stock])])} disabled={!attention.length}>Export CSV</button>}><ReportList rows={attention} valueKey="stock" empty="No low-stock products in the current page." renderMeta={(row) => `${row.reason} / ${row.severity}`} /></Panel><Panel title="Top sold products" action={<button className="export-button" type="button" onClick={() => exportCsv("mouher-top-sold-products.csv", [["product", "units", "revenue", "stock"], ...(analytics?.top_sold_products || []).map((row) => [rowLabel(row), row.sold_units || row.units || 0, row.revenue || 0, row.stock || ""])])} disabled={!analytics?.top_sold_products?.length}>Export CSV</button>}><ReportList rows={analytics?.top_sold_products} valueKey="sold_units" renderMeta={(row) => row.revenue ? money(row.revenue, analytics?.currency) : "units sold"} /></Panel><Panel title="Top wishlisted products"><ReportList rows={analytics?.top_wishlisted_products} valueKey="wishlists" renderMeta={(row) => row.stock_state || "wishlist demand"} /></Panel><Panel title="Order status"><ReportList rows={statusRows(orders)} valueKey="count" empty="No order status data yet." /></Panel><Panel title="Device mix"><ReportList rows={devices.map((row) => ({ id: row.device || row.name, name: row.device || row.name, count: row.count || row.events }))} valueKey="count" empty="No device data yet." /></Panel><Panel title="Geographic mix"><ReportList rows={locations.map((row) => ({ id: row.country || row.region || row.city, name: [row.city, row.region, row.country].filter(Boolean).join(", "), count: row.count || row.events }))} valueKey="count" empty="No location data yet." /></Panel><Panel title="Permission boundary"><p className="muted">{analytics ? "Live Django analytics and commerce data. Reports are read-only until audited owner mutations are available." : "Local preview. Start Django and Medusa for live reports."}</p></Panel></section></>;
}
