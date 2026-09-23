import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import './Analytics.css'

const PERIODS = [
  { value: 'all', label: 'All recorded' },
  { value: 'month', label: 'This month' },
  { value: '3', label: 'Last 3 months' },
  { value: '6', label: 'Last 6 months' },
  { value: '12', label: 'Last 12 months' },
]

const PIE_COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#8b5cf6', '#ef4444', '#0891b2', '#db2777']

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

// Old transactions may have a display-only date such as "Sep 14".
// Without a year we cannot reliably put them in a monthly report.
function datedAt(transaction) {
  const raw = transaction?.createdAt
  if (typeof raw !== 'string' || !/^\d{4}-\d\d-\d\dT/.test(raw)) return null
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? null : date
}

function monthStart(date, monthsAgo = 0) {
  return new Date(date.getFullYear(), date.getMonth() - monthsAgo, 1)
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function sumOf(transactions) {
  return transactions.reduce((sum, t) => {
    const amount = Number(t.amount)
    return sum + (Number.isFinite(amount) && amount > 0 ? amount : 0)
  }, 0)
}

function buildMonthlyRows(transactions, now, period) {
  // All-time cards may include undated/older transactions; this chart only
  // shows the latest 12 calendar months for which precise dates are known.
  const months = period === 'all' ? 12 : period === 'month' ? 1 : Number(period)
  const rows = Array.from({ length: months }, (_, i) => {
    const date = monthStart(now, months - i - 1)
    return {
      key: monthKey(date),
      month: date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
      income: 0,
      expenses: 0,
    }
  })
  const byMonth = new Map(rows.map((row) => [row.key, row]))

  transactions.forEach((transaction) => {
    const date = datedAt(transaction)
    if (!date || date > now) return
    const row = byMonth.get(monthKey(date))
    if (!row) return
    const amount = Number(transaction.amount)
    if (!Number.isFinite(amount) || amount <= 0) return
    if (transaction.type === 'Income') row.income += amount
    if (transaction.type === 'Expense') row.expenses += amount
  })

  return rows
}

export default function Analytics({ transactions = [] }) {
  const [period, setPeriod] = useState('all')

  // A frozen reference date for this render keeps all calculations aligned.
  const report = useMemo(() => {
    const now = new Date()
    const firstMonth = period === 'all' ? null : monthStart(now, period === 'month' ? 0 : Number(period) - 1)
    const validTransactions = Array.isArray(transactions) ? transactions : []
    const undatedCount = validTransactions.filter((t) => !datedAt(t)).length

    const filtered = validTransactions.filter((t) => {
      if (period === 'all') return true
      const date = datedAt(t)
      return date !== null && date >= firstMonth && date <= now
    })
    const incomeTransactions = filtered.filter((t) => t.type === 'Income')
    const expenseTransactions = filtered.filter((t) => t.type === 'Expense')
    const income = sumOf(incomeTransactions)
    const expenses = sumOf(expenseTransactions)
    const net = income - expenses
    const savingsRate = income > 0 ? (net / income) * 100 : null

    const categoriesMap = new Map()
    expenseTransactions.forEach((t) => {
      const category = t.category?.trim() || 'Other'
      const amount = Number(t.amount)
      if (!Number.isFinite(amount) || amount <= 0) return
      categoriesMap.set(category, (categoriesMap.get(category) || 0) + amount)
    })
    const categories = [...categoriesMap.entries()]
      .map(([name, amount]) => ({ name, amount, share: expenses > 0 ? (amount / expenses) * 100 : 0 }))
      .sort((a, b) => b.amount - a.amount)

    const monthly = buildMonthlyRows(validTransactions, now, period)
    const datedChartCount = validTransactions.filter((t) => {
      const date = datedAt(t)
      return date && date <= now && date >= monthStart(now, monthly.length - 1) && (t.type === 'Income' || t.type === 'Expense')
    }).length
    const largestExpense = expenseTransactions
      .filter((t) => Number.isFinite(Number(t.amount)) && Number(t.amount) > 0)
      .reduce((largest, t) => (!largest || Number(t.amount) > Number(largest.amount) ? t : largest), null)

    return {
      filteredCount: filtered.length,
      undatedCount,
      income,
      expenses,
      net,
      savingsRate,
      categories,
      monthly,
      datedChartCount,
      largestExpense,
    }
  }, [period, transactions])

  return (
    <div className="analytics-page">
      <header className="analytics-header">
        <div>
          <p className="analytics-eyebrow">PENNYPILOT / REPORTS</p>
          <h1>Advanced Analytics</h1>
          <p>Explore your recorded money activity. Opening balance is not counted as income.</p>
        </div>
        <label className="analytics-period">
          Report period
          <select value={period} onChange={(event) => setPeriod(event.target.value)}>
            {PERIODS.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </label>
      </header>

      {report.undatedCount > 0 && (
        <div className="analytics-date-note" role="status">
          {report.undatedCount} older transaction{report.undatedCount === 1 ? '' : 's'} lack{report.undatedCount === 1 ? 's' : ''} a full date.
          {period === 'all'
            ? ' Included in all-recorded totals and category spending, but not the monthly chart.'
            : ' Excluded from this date-filtered report.'}
        </div>
      )}

      <section className="analytics-summary" aria-label="Financial summary">
        <article className="analytics-stat">
          <span>Income</span>
          <strong>{money(report.income)}</strong>
          <small>Recorded in selected period</small>
        </article>
        <article className="analytics-stat">
          <span>Expenses</span>
          <strong>{money(report.expenses)}</strong>
          <small>Recorded in selected period</small>
        </article>
        <article className="analytics-stat">
          <span>Net cash flow</span>
          <strong className={report.net < 0 ? 'analytics-negative' : ''}>{money(report.net)}</strong>
          <small>Income minus expenses</small>
        </article>
        <article className="analytics-stat">
          <span>Recorded savings rate</span>
          <strong>{report.savingsRate === null ? '—' : `${report.savingsRate.toFixed(1)}%`}</strong>
          <small>{report.savingsRate === null ? 'Add income to calculate' : 'Net cash flow ÷ income'}</small>
        </article>
      </section>

      <section className="analytics-charts">
        <article className="analytics-panel analytics-trend">
          <div className="analytics-panel-title">
            <div>
              <h2>Income vs expenses</h2>
              <p>{period === 'all' ? 'Recent 12 calendar months · transactions with full dates' : 'Calendar months in your selected period'}</p>
            </div>
          </div>
          {report.datedChartCount === 0 ? (
            <div className="analytics-empty">No dated transactions in this chart period yet.</div>
          ) : (
            <div className="analytics-chart-area">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={report.monthly} margin={{ top: 8, right: 6, left: 0, bottom: 4 }}>
                  <CartesianGrid stroke="#eef0f4" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} width={55} tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k` : value} />
                  <Tooltip formatter={(value, name) => [money(value), name === 'income' ? 'Income' : 'Expenses']} />
                  <Legend formatter={(value) => value === 'income' ? 'Income' : 'Expenses'} />
                  <Bar dataKey="income" fill="#16a34a" radius={[5, 5, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="expenses" fill="#2563eb" radius={[5, 5, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>

        <article className="analytics-panel">
          <div className="analytics-panel-title">
            <div>
              <h2>Spending by category</h2>
              <p>Share of recorded expenses</p>
            </div>
          </div>
          {report.categories.length === 0 ? (
            <div className="analytics-empty">No expenses in this period yet.</div>
          ) : (
            <div className="analytics-chart-area analytics-pie-area">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={report.categories} dataKey="amount" nameKey="name" cx="50%" cy="50%" innerRadius={62} outerRadius={98} paddingAngle={2}>
                    {report.categories.map((item, index) => (
                      <Cell key={item.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [money(value), name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>
      </section>

      <section className="analytics-bottom">
        <article className="analytics-panel">
          <div className="analytics-panel-title">
            <div>
              <h2>Category breakdown</h2>
              <p>Where your recorded expenses went</p>
            </div>
          </div>
          {report.categories.length === 0 ? (
            <div className="analytics-empty analytics-empty-small">Add an expense to see your category breakdown.</div>
          ) : (
            <div className="analytics-category-list">
              {report.categories.map((category, index) => (
                <div className="analytics-category" key={category.name}>
                  <div className="analytics-category-head">
                    <span className="analytics-category-name"><i style={{ background: PIE_COLORS[index % PIE_COLORS.length] }} />{category.name}</span>
                    <strong>{money(category.amount)} <small>({category.share.toFixed(1)}%)</small></strong>
                  </div>
                  <div className="analytics-track"><div style={{ width: `${category.share}%`, background: PIE_COLORS[index % PIE_COLORS.length] }} /></div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="analytics-panel">
          <div className="analytics-panel-title">
            <div>
              <h2>At a glance</h2>
              <p>Facts from your selected transactions</p>
            </div>
          </div>
          <dl className="analytics-facts">
            <div><dt>Recorded transactions</dt><dd>{report.filteredCount}</dd></div>
            <div><dt>Largest spending category</dt><dd>{report.categories[0]?.name ?? '—'}</dd></div>
            <div><dt>Largest single expense</dt><dd>{report.largestExpense ? money(report.largestExpense.amount) : '—'}</dd></div>
            <div><dt>Largest expense description</dt><dd>{report.largestExpense?.title || '—'}</dd></div>
          </dl>
          <p className="analytics-disclaimer">These figures reflect transactions recorded in PennyPilot, not a linked bank account or financial advice.</p>
        </article>
      </section>
    </div>
  )
}
