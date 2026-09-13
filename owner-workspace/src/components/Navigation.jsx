const pages = ["overview", "products", "categories", "orders", "users", "inventory"];

export function Navigation({ activePage, onPageChange, onLogout }) {
  return (
    <aside className="sidebar">
      <div className="brand">MOUHER<small>OWNER WORKSPACE</small></div>
      <div className="navigation-group"><span>WORKSPACE</span>{pages.map((page) => <button type="button" className={activePage === page ? "active" : ""} key={page} onClick={() => onPageChange(page)}>{page[0].toUpperCase() + page.slice(1)}</button>)}</div>
      <button type="button" className="logout-button" onClick={onLogout}>Log out</button>
    </aside>
  );
}
