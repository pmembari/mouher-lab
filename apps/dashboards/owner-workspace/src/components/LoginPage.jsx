export function LoginPage({ username, password, error, loading, onUsernameChange, onPasswordChange, onSubmit }) {
  return (
    <main className="login-page">
      <form className="login-card" onSubmit={onSubmit}>
        <span className="eyebrow">MOUHER / PRIVATE OWNER WORKSPACE</span>
        <h1>Owner sign in</h1>
        <p>Read-only commerce operations, analytics, and reporting.</p>
        <label>Username<input autoComplete="username" value={username} onChange={(event) => onUsernameChange(event.target.value)} placeholder="pmembari" required /></label>
        <label>Password<input type="password" autoComplete="current-password" value={password} onChange={(event) => onPasswordChange(event.target.value)} placeholder="1234" required /></label>
        <button className="primary-button" disabled={loading}>{loading ? "Opening workspace..." : "Open dashboard"}</button>
        {error && <p className="error-message" role="alert">{error}</p>}
      </form>
    </main>
  );
}