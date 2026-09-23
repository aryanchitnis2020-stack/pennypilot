function Sidebar({ activePage, setActivePage }) {
  const sidebarStyle = {
    width: '240px',
    minWidth: '240px',
    minHeight: '100vh',
    background: '#111827',
    color: '#ffffff',
    padding: '30px 20px',
    flexShrink: 0,
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
  const pages = ['Dashboard', 'Transactions', 'Budgets', 'Analytics']

  return (
    <aside style={sidebarStyle}>
      <h2 style={logoStyle}>PennyPilot</h2>
      <nav style={navStyle} aria-label="Main navigation">
        {pages.map((page) => (
          <button
            key={page}
            type="button"
            style={activePage === page ? activeButtonStyle : buttonStyle}
            onClick={() => setActivePage(page)}
            aria-current={activePage === page ? 'page' : undefined}
          >
            {page}
          </button>
        ))}
        <button type="button" style={{ ...buttonStyle, cursor: 'not-allowed', opacity: 0.65 }} disabled>
          AI Insights · Soon
        </button>
      </nav>
    </aside>
  )
}

export default Sidebar
