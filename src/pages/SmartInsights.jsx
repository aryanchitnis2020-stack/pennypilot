import { useMemo } from 'react'
import './SmartInsights.css'

const BUDGET_PLAN_KEY = 'pennypilot-budget-plan-v2'
const SAVINGS_GOALS_KEY = 'pennypilot-savings-goals-v1'
const RECURRING_PAYMENTS_KEY = 'pennypilot-recurring-payments-v1'

const formatMoney = (amount) =>
  `₹${Number(amount || 0).toLocaleString('en-IN')}`

const readStorage = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : fallback
  } catch {
    return fallback
  }
}

const parseDate = (value) => {
  if (!value) return null

  const text = String(value).trim()
  const direct = new Date(text)

  if (!Number.isNaN(direct.getTime())) {
    return direct
  }

  const parts = text.split(/[\/-]/)

  if (parts.length === 3) {
    const [first, second, third] = parts

    if (first.length === 4) {
      return new Date(
        Number(first),
        Number(second) - 1,
        Number(third)
      )
    }

    if (third.length === 4) {
      return new Date(
        Number(third),
        Number(second) - 1,
        Number(first)
      )
    }
  }

  return null
}

const getDaysUntil = (dateString) => {
  if (!dateString) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const dueDate = new Date(`${dateString}T00:00:00`)

  if (Number.isNaN(dueDate.getTime())) return null

  return Math.ceil(
    (dueDate.getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24)
  )
}

function SmartInsights({ transactions = [] }) {
  const data = useMemo(() => {
    const now = new Date()

    const datedTransactions = transactions
      .map((transaction) => ({
        ...transaction,
        parsedDate: parseDate(transaction.date),
      }))
      .filter((transaction) => transaction.parsedDate)

    const currentMonthTransactions = datedTransactions.filter(
      (transaction) =>
        transaction.parsedDate.getMonth() === now.getMonth() &&
        transaction.parsedDate.getFullYear() === now.getFullYear()
    )

    const periodTransactions =
      currentMonthTransactions.length > 0
        ? currentMonthTransactions
        : transactions

    const income = periodTransactions
      .filter((transaction) => transaction.type === 'Income')
      .reduce(
        (total, transaction) =>
          total + Number(transaction.amount || 0),
        0
      )

    const expenses = periodTransactions
      .filter((transaction) => transaction.type === 'Expense')
      .reduce(
        (total, transaction) =>
          total + Number(transaction.amount || 0),
        0
      )

    const netCashFlow = income - expenses

    const expenseRate =
      income > 0 ? Math.round((expenses / income) * 100) : null

    const categoryTotals = periodTransactions
      .filter((transaction) => transaction.type === 'Expense')
      .reduce((totals, transaction) => {
        const category = transaction.category || 'Other'
        totals[category] =
          (totals[category] || 0) +
          Number(transaction.amount || 0)
        return totals
      }, {})

    const categoryEntries = Object.entries(categoryTotals).sort(
      (a, b) => b[1] - a[1]
    )

    const topCategory = categoryEntries[0] || null

    const budgetPlan = readStorage(BUDGET_PLAN_KEY, null)

    const budgetData = budgetPlan
      ? budgetPlan.allocations.map((budget) => {
          const spent = transactions
            .filter((transaction) => {
              if (
                transaction.type !== 'Expense' ||
                transaction.category !== budget.category
              ) {
                return false
              }

              if (!budgetPlan.cycleStart) return true

              return (
                Number(transaction.id) >=
                Number(budgetPlan.cycleStart)
              )
            })
            .reduce(
              (total, transaction) =>
                total + Number(transaction.amount || 0),
              0
            )

          const limit = Number(budget.limit || 0)
          const percentage =
            limit > 0
              ? Math.round((spent / limit) * 100)
              : 0

          let status = 'Safe'

          if (percentage >= 100) {
            status = 'Over Budget'
          } else if (percentage >= 80) {
            status = 'Warning'
          } else if (percentage >= 60) {
            status = 'Watch'
          }

          return {
            ...budget,
            spent,
            limit,
            percentage,
            status,
          }
        })
      : []

    const highestBudgetRisk =
      [...budgetData].sort(
        (a, b) => b.percentage - a.percentage
      )[0] || null

    const totalBudget = Number(budgetPlan?.monthlyBudget || 0)
    const budgetSpent = budgetData.reduce(
      (total, item) => total + item.spent,
      0
    )

    const budgetUsed =
      totalBudget > 0
        ? Math.round((budgetSpent / totalBudget) * 100)
        : null

    const goals = readStorage(SAVINGS_GOALS_KEY, [])

    const totalGoalTarget = goals.reduce(
      (total, goal) => total + Number(goal.target || 0),
      0
    )

    const totalGoalSaved = goals.reduce(
      (total, goal) => total + Number(goal.saved || 0),
      0
    )

    const overallGoalProgress =
      totalGoalTarget > 0
        ? Math.min(
            Math.round(
              (totalGoalSaved / totalGoalTarget) * 100
            ),
            100
          )
        : 0

    const activeGoals = goals.filter(
      (goal) => Number(goal.saved || 0) < Number(goal.target || 0)
    )

    const nearestGoal = [...activeGoals]
      .filter((goal) => goal.deadline)
      .sort(
        (a, b) =>
          new Date(`${a.deadline}T00:00:00`) -
          new Date(`${b.deadline}T00:00:00`)
      )[0] || null

    const recurringPayments = readStorage(
      RECURRING_PAYMENTS_KEY,
      []
    )

    const activeRecurring = recurringPayments.filter(
      (payment) => payment.status === 'Active'
    )

    const monthlyCommitment = activeRecurring.reduce(
      (total, payment) => {
        const amount = Number(payment.amount || 0)

        if (payment.frequency === 'Weekly') {
          return total + (amount * 52) / 12
        }

        if (payment.frequency === 'Yearly') {
          return total + amount / 12
        }

        return total + amount
      },
      0
    )

    const upcomingRecurring = activeRecurring
      .map((payment) => ({
        ...payment,
        daysUntil: getDaysUntil(payment.nextDue),
      }))
      .filter(
        (payment) =>
          payment.daysUntil !== null &&
          payment.daysUntil >= 0 &&
          payment.daysUntil <= 7
      )
      .sort((a, b) => a.daysUntil - b.daysUntil)

    const overdueRecurring = activeRecurring.filter(
      (payment) => {
        const days = getDaysUntil(payment.nextDue)
        return days !== null && days < 0
      }
    )

    const suggestions = []

    if (periodTransactions.length === 0) {
      suggestions.push({
        icon: '📊',
        tone: 'neutral',
        title: 'Add a few transactions',
        text:
          'Record some income and expenses to unlock more personalized insights.',
      })
    }

    if (topCategory) {
      suggestions.push({
        icon: '💸',
        tone: 'purple',
        title: `${topCategory[0]} is your top expense`,
        text: `${formatMoney(
          topCategory[1]
        )} has been recorded in this category for the selected period.`,
      })
    }

    if (highestBudgetRisk && highestBudgetRisk.percentage >= 80) {
      suggestions.push({
        icon:
          highestBudgetRisk.status === 'Over Budget'
            ? '🚨'
            : '⚠️',
        tone:
          highestBudgetRisk.status === 'Over Budget'
            ? 'danger'
            : 'warning',
        title: `${highestBudgetRisk.category} needs attention`,
        text:
          highestBudgetRisk.status === 'Over Budget'
            ? `You are ${formatMoney(
                Math.abs(
                  highestBudgetRisk.limit -
                    highestBudgetRisk.spent
                )
              )} over its budget limit.`
            : `${highestBudgetRisk.percentage}% of this category's budget has been used.`,
      })
    }

    if (netCashFlow > 0) {
      suggestions.push({
        icon: '📈',
        tone: 'success',
        title: 'Positive cash flow',
        text: `Income is higher than recorded expenses by ${formatMoney(
          netCashFlow
        )} for this period.`,
      })
    } else if (periodTransactions.length > 0) {
      suggestions.push({
        icon: '⚠️',
        tone: 'danger',
        title: 'Expenses are higher than income',
        text: `Recorded expenses exceed income by ${formatMoney(
          Math.abs(netCashFlow)
        )} for this period.`,
      })
    }

    if (overallGoalProgress > 0 && overallGoalProgress < 100) {
      suggestions.push({
        icon: '🎯',
        tone: 'success',
        title: 'Keep your savings goals moving',
        text: `Your savings goals are ${overallGoalProgress}% funded overall.`,
      })
    }

    if (upcomingRecurring.length > 0) {
      suggestions.push({
        icon: '🔄',
        tone: 'warning',
        title: `${upcomingRecurring.length} payment${
          upcomingRecurring.length === 1 ? '' : 's'
        } due soon`,
        text: `${upcomingRecurring[0].name} is the next active recurring payment due within 7 days.`,
      })
    }

    if (suggestions.length === 0) {
      suggestions.push({
        icon: '✨',
        tone: 'success',
        title: 'Your dashboard is ready for insights',
        text:
          'Keep recording your financial activity and PennyPilot will update these observations automatically.',
      })
    }

    return {
      periodLabel:
        currentMonthTransactions.length > 0
          ? now.toLocaleDateString('en-IN', {
              month: 'long',
              year: 'numeric',
            })
          : 'Recorded data',
      income,
      expenses,
      netCashFlow,
      expenseRate,
      topCategory,
      budgetPlan,
      budgetData,
      totalBudget,
      budgetSpent,
      budgetUsed,
      goals,
      totalGoalTarget,
      totalGoalSaved,
      overallGoalProgress,
      nearestGoal,
      activeRecurring,
      monthlyCommitment,
      upcomingRecurring,
      overdueRecurring,
      suggestions: suggestions.slice(0, 6),
    }
  }, [transactions])

  return (
    <section className="insights-page">
      <header className="insights-header">
        <div>
          <p className="insights-eyebrow">Smart analysis</p>
          <h1>Smart Financial Insights</h1>
          <p>
            PennyPilot turns your existing activity into simple,
            actionable observations.
          </p>
        </div>

        <div className="insights-period">
          <span>Analysis period</span>
          <strong>{data.periodLabel}</strong>
        </div>
      </header>

      <section className="insights-summary">
        <article className="insight-stat-card">
          <span>Net Cash Flow</span>
          <strong
            className={
              data.netCashFlow >= 0
                ? 'insight-positive'
                : 'insight-negative'
            }
          >
            {formatMoney(data.netCashFlow)}
          </strong>
          <small>Income minus recorded expenses</small>
        </article>

        <article className="insight-stat-card">
          <span>Total Expenses</span>
          <strong>{formatMoney(data.expenses)}</strong>
          <small>
            {data.expenseRate === null
              ? 'No income recorded'
              : `${data.expenseRate}% of income`}
          </small>
        </article>

        <article className="insight-stat-card">
          <span>Top Expense Category</span>
          <strong>
            {data.topCategory ? data.topCategory[0] : '—'}
          </strong>
          <small>
            {data.topCategory
              ? formatMoney(data.topCategory[1])
              : 'Add expenses to see a pattern'}
          </small>
        </article>

        <article className="insight-stat-card">
          <span>Recurring Commitment</span>
          <strong>
            {formatMoney(Math.round(data.monthlyCommitment))}
          </strong>
          <small>Estimated monthly active payments</small>
        </article>
      </section>

      <section className="insights-main-grid">
        <div className="insights-panel">
          <div className="insights-panel-header">
            <div>
              <p className="insights-panel-kicker">What stands out</p>
              <h2>Your financial signals</h2>
            </div>
            <span className="insights-live-badge">Live</span>
          </div>

          <div className="insights-list">
            {data.suggestions.map((item, index) => (
              <article
                className={`insight-item tone-${item.tone}`}
                key={`${item.title}-${index}`}
              >
                <div className="insight-item-icon">{item.icon}</div>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="insights-panel">
          <div className="insights-panel-header">
            <div>
              <p className="insights-panel-kicker">Budget health</p>
              <h2>Budget overview</h2>
            </div>
          </div>

          {data.budgetPlan ? (
            <div className="budget-health">
              <div className="budget-health-total">
                <div>
                  <span>Monthly budget</span>
                  <strong>{formatMoney(data.totalBudget)}</strong>
                </div>
                <div>
                  <span>Spent</span>
                  <strong>{formatMoney(data.budgetSpent)}</strong>
                </div>
              </div>

              <div className="insights-progress">
                <div
                  style={{
                    width: `${Math.min(data.budgetUsed || 0, 100)}%`,
                  }}
                />
              </div>

              <p className="insights-progress-label">
                {data.budgetUsed}% of the monthly budget used
              </p>

              <div className="budget-health-list">
                {data.budgetData.map((budget) => (
                  <div
                    className="budget-health-row"
                    key={budget.category}
                  >
                    <div>
                      <strong>{budget.category}</strong>
                      <span>
                        {formatMoney(budget.spent)} /{' '}
                        {formatMoney(budget.limit)}
                      </span>
                    </div>
                    <b
                      className={`budget-health-status status-${budget.status
                        .toLowerCase()
                        .replace(' ', '-')}`}
                    >
                      {budget.percentage}%
                    </b>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="insights-empty">
              <span>₹</span>
              <h3>No budget plan yet</h3>
              <p>
                Create a monthly budget to unlock category-level
                budget insights here.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="insights-bottom-grid">
        <div className="insights-panel">
          <div className="insights-panel-header">
            <div>
              <p className="insights-panel-kicker">Savings</p>
              <h2>Goal progress</h2>
            </div>
          </div>

          {data.goals.length > 0 ? (
            <>
              <div className="goal-insight-total">
                <div>
                  <span>Total saved</span>
                  <strong>
                    {formatMoney(data.totalGoalSaved)}
                  </strong>
                </div>
                <div>
                  <span>Overall progress</span>
                  <strong>{data.overallGoalProgress}%</strong>
                </div>
              </div>

              <div className="insights-progress goal-progress">
                <div
                  style={{
                    width: `${data.overallGoalProgress}%`,
                  }}
                />
              </div>

              {data.nearestGoal && (
                <div className="nearest-goal">
                  <span>Next target</span>
                  <strong>{data.nearestGoal.name}</strong>
                  <small>
                    {formatMoney(
                      Math.max(
                        Number(data.nearestGoal.target) -
                          Number(data.nearestGoal.saved),
                        0
                      )
                    )}{' '}
                    remaining
                    {data.nearestGoal.deadline
                      ? ` • target ${new Date(
                          `${data.nearestGoal.deadline}T00:00:00`
                        ).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}`
                      : ''}
                  </small>
                </div>
              )}
            </>
          ) : (
            <div className="insights-empty compact">
              <span>◎</span>
              <h3>No savings goals yet</h3>
              <p>
                Add a goal to make your savings progress part of
                your financial picture.
              </p>
            </div>
          )}
        </div>

        <div className="insights-panel">
          <div className="insights-panel-header">
            <div>
              <p className="insights-panel-kicker">Upcoming</p>
              <h2>Recurring payments</h2>
            </div>
          </div>

          {data.activeRecurring.length > 0 ? (
            <div className="upcoming-list">
              {data.upcomingRecurring.length > 0 ? (
                data.upcomingRecurring
                  .slice(0, 4)
                  .map((payment) => (
                    <div
                      className="upcoming-row"
                      key={payment.id}
                    >
                      <div>
                        <strong>{payment.name}</strong>
                        <span>{payment.category}</span>
                      </div>
                      <div className="upcoming-amount">
                        <strong>
                          {formatMoney(payment.amount)}
                        </strong>
                        <span>
                          {payment.daysUntil === 0
                            ? 'Due today'
                            : payment.daysUntil === 1
                            ? 'Due tomorrow'
                            : `Due in ${payment.daysUntil} days`}
                        </span>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="insights-empty compact">
                  <span>✓</span>
                  <h3>No payments due in 7 days</h3>
                  <p>
                    Your active recurring payments currently have
                    no near-term due dates.
                  </p>
                </div>
              )}

              {data.overdueRecurring.length > 0 && (
                <div className="overdue-note">
                  ⚠️ {data.overdueRecurring.length} active payment
                  {data.overdueRecurring.length === 1 ? '' : 's'} overdue.
                </div>
              )}
            </div>
          ) : (
            <div className="insights-empty compact">
              <span>↻</span>
              <h3>No active recurring payments</h3>
              <p>
                Add subscriptions, bills or EMIs to track upcoming
                commitments here.
              </p>
            </div>
          )}
        </div>
      </section>

      <footer className="insights-footer-note">
        <span>ℹ</span>
        <p>
          These insights are calculated from the data currently
          stored in PennyPilot. They are observations, not
          financial advice.
        </p>
      </footer>
    </section>
  )
}

export default SmartInsights
