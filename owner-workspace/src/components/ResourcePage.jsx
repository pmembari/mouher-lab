import { useMemo, useState } from "react";
import { asNumber, compactDate, exportCsv, money, rowLabel, stockCount } from "../lib/dashboardMetrics.js";

const pageConfig = {
  products: { label: "Products", columns: ["Product", "Status", "Category", "Stock", "Updated"], filters: ["all", "active", "draft", "low-stock", "out-of-stock"] },
  categories: { label: "Categories", columns: ["Category", "Products", "Stock", "Low stock", "Revenue"], filters: ["all", "low-stock", "performing"] },
  orders: { label: "Orders", columns: ["Order", "Status", "Payment", "Customer", "Total", "Created"], filters: ["all", "pending", "completed", "canceled", "paid"] },
  users: { label: "Customers", columns: ["Customer", "Email", "Orders", "Value", "Created"], filters: ["all", "repeat", "new"] },
  inventory: { label: "Inventory", columns: ["Item", "Stocked", "Reserved", "Available", "Location"], filters: ["all", "low-stock", "out-of-stock", "reserved"] },
};

function rowStatus(row, page) {
  if (page === "products") return stockCount(row) <= 0 ? "out-of-stock" : stockCount(row) <= 5 ? "low-stock" : String(row.status || "active").toLowerCase();
  if (page === "orders") return String(row.status || row.fulfillment_status || row.payment_status || "pending").toLowerCase();
  if (page === "users") return asNumber(row.orders_count ?? row.order_count) > 1 ? "repeat" : "new";
  if (page === "inventory") return stockCount(row) <= 0 ? "out-of-stock" : stockCount(row) <= 5 ? "low-stock" : asNumber(row.reserved_quantity) > 0 ? "reserved" : "available";
  if (page === "categories") return asNumber(row.low_stock) > 0 ? "low-stock" : asNumber(row.revenue || row.orders) > 0 ? "performing" : "all";
  return "all";
}

function categoryName(row) {
  const category = row.categories?.[0] || row.category || row.collection;
  return category?.name || category?.title || category || "-";
}

function cell(row, page, column) {
  if (page === "products") {
    if (column === "Product") return rowLabel(row);
    if (column === "Status") return <span className={`status-pill ${rowStatus(row, page)}`}>{rowStatus(row, page)}</span>;
    if (column === "Category") return categoryName(row);
    if (column === "Stock") return stockCount(row);
    return compactDate(row.updated_at || row.created_at);
  }
  if (page === "categories") {
    if (column === "Category") return row.name;
    if (column === "Products") return row.count || 0;
    if (column === "Stock") return row.stock || 0;
    if (column === "Low stock") return row.low_stock || 0;
    return money(row.revenue || 0, row.currency_code);
  }
  if (page === "orders") {
    if (column === "Order") return row.display_id || row.id;
    if (column === "Status") return <span className={`status-pill ${rowStatus(row, page)}`}>{row.status || row.fulfillment_status || "-"}</span>;
    if (column === "Payment") return row.payment_status || "-";
    if (column === "Customer") return row.customer?.email || row.email || row.customer_email || "-";
    if (column === "Total") return money(row.total || row.total_paid || row.summary?.paid_total, row.currency_code);
    return compactDate(row.created_at);
  }
  if (page === "inventory") {
    const stocked = asNumber(row.stocked_quantity ?? row.inventory_quantity);
    const reserved = asNumber(row.reserved_quantity);
    if (column === "Item") return rowLabel(row);
    if (column === "Stocked") return stocked;
    if (column === "Reserved") return reserved;
    if (column === "Available") return stocked - reserved;
    return row.location_name || row.stock_location_id || "-";
  }
  if (column === "Customer") return `${row.first_name || ""} ${row.last_name || ""}`.trim() || rowLabel(row);
  if (column === "Email") return row.email || "-";
  if (column === "Orders") return row.orders_count ?? row.order_count ?? "-";
  if (column === "Value") return money(row.total_spend || row.lifetime_value || row.order_total, row.currency_code);
  return compactDate(row.created_at);
}

function csvCell(row, page, column) {
  if (column === "Status") return rowStatus(row, page);
  return cell(row, page, column);
}

function summary(page, rows) {
  if (page === "products") return [{ label: "Products", value: rows.length }, { label: "Low stock", value: rows.filter((row) => stockCount(row) > 0 && stockCount(row) <= 5).length }, { label: "Out of stock", value: rows.filter((row) => stockCount(row) <= 0).length }];
  if (page === "orders") return [{ label: "Orders", value: rows.length }, { label: "Revenue", value: money(rows.reduce((sum, row) => sum + asNumber(row.total || row.total_paid), 0), rows[0]?.currency_code) }, { label: "Paid", value: rows.filter((row) => row.payment_status === "paid").length }];
  if (page === "users") return [{ label: "Customers", value: rows.length }, { label: "Repeat", value: rows.filter((row) => asNumber(row.orders_count ?? row.order_count) > 1).length }, { label: "New", value: rows.filter((row) => rowStatus(row, page) === "new").length }];
  if (page === "inventory") return [{ label: "Items", value: rows.length }, { label: "Stocked", value: rows.reduce((sum, row) => sum + stockCount(row), 0) }, { label: "Reserved", value: rows.reduce((sum, row) => sum + asNumber(row.reserved_quantity), 0) }];
  return [{ label: "Categories", value: rows.length }, { label: "Products", value: rows.reduce((sum, row) => sum + asNumber(row.count), 0) }, { label: "Low stock", value: rows.reduce((sum, row) => sum + asNumber(row.low_stock), 0) }];
}

export function ResourcePage({ page, rows }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [pageNumber, setPageNumber] = useState(1);
  const [selected, setSelected] = useState(null);
  const config = pageConfig[page] || pageConfig.products;
  const filteredRows = useMemo(() => rows.filter((row) => {
    const matchesSearch = JSON.stringify(row).toLowerCase().includes(query.toLowerCase());
    const status = rowStatus(row, page);
    const matchesFilter = filter === "all" || status === filter || (filter === "paid" && row.payment_status === "paid");
    return matchesSearch && matchesFilter;
  }), [rows, query, filter, page]);
  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const visibleRows = filteredRows.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
  const csvRows = [config.columns, ...filteredRows.map((row) => config.columns.map((column) => csvCell(row, page, column)))];
  return <section className="resource-page"><div className="resource-heading"><div><span className="eyebrow">READ-ONLY OWNER RESOURCE</span><h2>{config.label}</h2><p>{filteredRows.length} visible rows from {rows.length} loaded records.</p></div><div className="resource-actions"><input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPageNumber(1); }} placeholder={`Search ${config.label.toLowerCase()}...`} /><select value={filter} onChange={(event) => { setFilter(event.target.value); setPageNumber(1); }}>{config.filters.map((item) => <option value={item} key={item}>{item.replaceAll("-", " ")}</option>)}</select><button type="button" className="export-button" onClick={() => exportCsv(`mouher-${page}.csv`, csvRows)} disabled={!filteredRows.length}>Export CSV</button></div></div><div className="resource-summary">{summary(page, rows).map((item) => <article key={item.label}><span>{item.label}</span><strong>{item.value}</strong></article>)}</div><div className="table-wrap"><table><thead><tr>{config.columns.map((column) => <th key={column}>{column}</th>)}<th>Detail</th></tr></thead><tbody>{visibleRows.length ? visibleRows.map((row, index) => <tr key={row.id || row.slug || index}>{config.columns.map((column) => <td key={column}>{cell(row, page, column)}</td>)}<td><button type="button" className="link-button" onClick={() => setSelected(row)}>View</button></td></tr>) : <tr><td colSpan={config.columns.length + 1}>No data matches this view.</td></tr>}</tbody></table></div><div className="pagination"><button type="button" disabled={pageNumber <= 1} onClick={() => setPageNumber((value) => value - 1)}>Previous</button><span>{pageNumber} / {pageCount}</span><button type="button" disabled={pageNumber >= pageCount} onClick={() => setPageNumber((value) => value + 1)}>Next</button></div>{selected && <aside className="detail-drawer" role="dialog" aria-label={`${page} detail`}><div><h3>{rowLabel(selected)}</h3><button type="button" className="link-button" onClick={() => setSelected(null)}>Close</button></div><dl className="detail-list">{config.columns.map((column) => <div key={column}><dt>{column}</dt><dd>{cell(selected, page, column)}</dd></div>)}</dl><pre>{JSON.stringify(selected, null, 2)}</pre></aside>}</section>;
}
