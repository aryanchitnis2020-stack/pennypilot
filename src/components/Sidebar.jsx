function Sidebar({ activePage, setActivePage, user, onLogout, syncStatus, onRetrySync, onDownloadBackup }) {
  const sidebarStyle = {
    width: '240px',
    minWidth: '240px',
    minHeight: '100vh',
    background: '#111827',
    color: '#ffffff',
    padding: '30px 20px',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
  }

  const logoStyle = {
    fontSize: '24px',
    fontWeight: '700',
    marginBottom: '40px',
    color: '#ffffff',
  }

  const navStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  }

  const buttonStyle = {
    width: '100%',
    border: 'none',
    background: 'transparent',
    color: '#9ca3af',
    padding: '14px',
    textAlign: 'left',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '15px',
  }

  const activeButtonStyle = {
    ...buttonStyle,
    background: '#1f2937',
    color: '#ffffff',
  }

  return (
    <aside style={sidebarStyle}>
      <h2 style={logoStyle}>PennyPilot</h2>

      <nav style={navStyle}>
        <button
          style={
            activePage === 'Dashboard'
              ? activeButtonStyle
              : buttonStyle
          }
          onClick={() => setActivePage('Dashboard')}
        >
          Dashboard
        </button>

        <button
          style={
            activePage === 'Transactions'
              ? activeButtonStyle
              : buttonStyle
          }
          onClick={() => setActivePage('Transactions')}
        >
          Transactions
        </button>

        <button
          style={
            activePage === 'Budgets'
              ? activeButtonStyle
              : buttonStyle
          }
          onClick={() => setActivePage('Budgets')}
        >
          Budgets
        </button>

        <button
          style={
            activePage === 'Savings Goals'
              ? activeButtonStyle
              : buttonStyle
          }
          onClick={() => setActivePage('Savings Goals')}
        >
          Savings Goals
        </button>

        <button
          style={
            activePage === 'Recurring Payments'
              ? activeButtonStyle
              : buttonStyle
          }
          onClick={() => setActivePage('Recurring Payments')}
        >
          Recurring Payments
        </button>

        <button
          style={
            activePage === 'Analytics'
              ? activeButtonStyle
              : buttonStyle
          }
          onClick={() => setActivePage('Analytics')}
        >
          Analytics
        </button>

        <button
          style={
            activePage === 'AI Insights'
              ? activeButtonStyle
              : buttonStyle
          }
          onClick={() => setActivePage('AI Insights')}
        >
          AI Insights
        </button>
      </nav>
      <div style={{ marginTop: 'auto', paddingTop: '32px' }}>
        <div style={{ borderTop: '1px solid #374151', paddingTop: '22px', fontSize: '13px' }}>
          <div style={{ fontWeight: 750, overflowWrap: 'anywhere', marginBottom: '5px' }}>{user?.name}</div>
          <div style={{ color: '#9ca3af', fontSize: '11px', overflowWrap: 'anywhere' }}>{user?.email}</div>
          <div style={{ marginTop: '16px', fontSize: '12px', color: syncStatus === 'Saved' ? '#86efac' : '#fcd34d' }}>
            ● {syncStatus}
          </div>
          {syncStatus !== 'Saved' && syncStatus !== 'Saving...' && syncStatus !== 'Signing out...' && (
            <button type="button" onClick={onRetrySync} style={{ ...buttonStyle, padding: '8px 0', color: '#c7d2fe' }}>Retry sync</button>
          )}
          <button type="button" onClick={onDownloadBackup} style={{ ...buttonStyle, padding: '8px 0', color: '#c7d2fe' }}>Download backup</button>
          <button type="button" onClick={onLogout} style={{ ...buttonStyle, marginTop: '10px', background: '#1f2937', color: '#fff', textAlign: 'center' }}>Sign out</button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar