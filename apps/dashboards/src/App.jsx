import { useMemo, useState } from "react";
import { DashboardHome, LoginPage, Navigation, ResourcePage } from "./components/index.js";
import { endOwnerSession, hasOwnerSession, isValidOwner, startOwnerSession, OWNER_PASSWORD } from "./lib/ownerAuth.js";
import { loadOwnerWorkspace } from "./lib/ownerApi.js";
import { deriveCategories } from "./lib/dashboardMetrics.js";

export default function App() {
  const [authenticated, setAuthenticated] = useState(hasOwnerSession);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState("overview");
  const [days, setDays] = useState(30);
  const [workspace, setWorkspace] = useState(null);
  const products = workspace?.products?.data || [];
  const orders = workspace?.orders?.data || [];
  const customers = workspace?.customers?.data || [];
  const inventory = workspace?.inventory?.data || [];
  const analytics = workspace?.analytics;
  const categories = useMemo(() => deriveCategories(products, analytics), [products, analytics]);

  async function login(event) {
    event.preventDefault();
    if (!isValidOwner(username, password)) return setError("Invalid owner username or password.");
    setLoading(true); setError("");
    try { startOwnerSession(); setWorkspace(await loadOwnerWorkspace(password, days)); setAuthenticated(true); setPassword(""); }
    catch (reason) { endOwnerSession(); setError(reason.message); }
    finally { setLoading(false); }
  }

  async function changeRange(event) {
    const nextDays = Number(event.target.value); setDays(nextDays);
    if (!workspace || workspace.source === "local-preview") return;
    setLoading(true); setError("");
    try { setWorkspace(await loadOwnerWorkspace(OWNER_PASSWORD, nextDays)); } catch (reason) { setError(reason.message); } finally { setLoading(false); }
  }

  if (!authenticated) return <LoginPage username={username} password={password} error={error} loading={loading} onUsernameChange={setUsername} onPasswordChange={setPassword} onSubmit={login} />;
  const resources = { products, categories, orders, users: customers, inventory };
  const rows = resources[page] || [];
  return <div className="app-shell"><Navigation activePage={page} onPageChange={setPage} onLogout={() => { endOwnerSession(); setAuthenticated(false); setWorkspace(null); }} /><main className="main-content"><header className="topbar"><div><span className="eyebrow">OWNER DASHBOARD / {page.toUpperCase()}</span><h1>{page === "overview" ? "Business overview" : `${page[0].toUpperCase()}${page.slice(1)} register`}</h1></div><div className="top-controls"><label>Report range <select value={days} onChange={changeRange}><option value="7">7 days</option><option value="30">30 days</option><option value="90">90 days</option></select></label><span className="owner-badge">pmembari</span></div></header>{workspace?.source === "local-preview" && <div className="notice-message">Owner API is not configured. Set VITE_MOUHER_API_URL for live Medusa reports.</div>}{error && <div className="error-message">{error}</div>}{loading && <div className="loading-message">Refreshing owner data...</div>}{page === "overview" ? <DashboardHome analytics={analytics} products={products} orders={orders} customers={customers} inventory={inventory} /> : <ResourcePage page={page} rows={rows} analytics={analytics} />}</main></div>;
}
