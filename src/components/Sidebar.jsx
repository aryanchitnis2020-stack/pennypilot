function Sidebar({ activePage, setActivePage }) {
  const sidebarStyle = {
    width: '240px',
    minWidth: '240px',
    minHeight: '100vh',
    background: '#0f172a',
    color: '#ffffff',
    padding: '30px 18px',
    flexShrink: 0,
    boxSizing: 'border-box',
  }

  const logoStyle = {
    fontSize: '25px',
    fontWeight: '800',
    margin: '0 0 42px',
    color: '#ffffff',
    letterSpacing: '-0.5px',
  }

  const navStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  }

  const buttonStyle = {
    width: '100%',
    minHeight: '46px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    border: '1px solid transparent',
    outline: 'none',
    appearance: 'none',
    WebkitAppearance: 'none',
    background: 'transparent',
    color: '#94a3b8',
    padding: '12px 14px',
    textAlign: 'left',
    borderRadius: '12px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '14px',
    fontWeight: '600',
    lineHeight: '1.2',
    textDecoration: 'none',
    userSelect: 'none',
    transition: 'all 0.2s ease',
  }

  const activeButtonStyle = {
    ...buttonStyle,
    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
    color: '#ffffff',
    boxShadow: '0 8px 20px rgba(79, 70, 229, 0.28)',
  }

  const iconStyle = {
    width: '20px',
    minWidth: '20px',
    textAlign: 'center',
    fontSize: '16px',
  }

  const items = [
    ['Dashboard', '⌂'],
    ['Transactions', '↕'],
    ['Budgets', '▣'],
    ['Savings Goals', '◎'],
    ['Recurring Payments', '↻'],
    ['Analytics', '▥'],
  ]

  return (
    <aside style={sidebarStyle}>
      <h2 style={logoStyle}>PennyPilot</h2>

      <nav style={navStyle}>
        {items.map(([label, icon]) => (
          <button
            key={label}
            type="button"
            style={activePage === label ? activeButtonStyle : buttonStyle}
            onClick={() => setActivePage(label)}
            onMouseEnter={(e) => {
              if (activePage !== label) {
                e.currentTarget.style.background = '#172033'
                e.currentTarget.style.color = '#e2e8f0'
              }
            }}
            onMouseLeave={(e) => {
              if (activePage !== label) {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = '#94a3b8'
              }
            }}
          >
            <span style={iconStyle}>{icon}</span>
            <span>{label}</span>
          </button>
        ))}

        <button
          type="button"
          style={buttonStyle}
          onClick={() => alert('AI Insights coming soon.')}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#172033'
            e.currentTarget.style.color = '#e2e8f0'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = '#94a3b8'
          }}
        >
          <span style={iconStyle}>✦</span>
          <span>AI Insights</span>
        </button>
      </nav>
    </aside>
  )
}

export default Sidebar
