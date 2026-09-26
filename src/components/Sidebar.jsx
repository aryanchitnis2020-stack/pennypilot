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
            activePage === 'Analytics'
              ? activeButtonStyle
              : buttonStyle
          }
          onClick={() => setActivePage('Analytics')}
        >
          Analytics
        </button>

        <button
          style={buttonStyle}
          onClick={() => alert('AI Insights coming soon.')}
        >
          AI Insights
        </button>
      </nav>
    </aside>
  )
}

export default Sidebar