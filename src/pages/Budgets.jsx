import { useEffect, useMemo, useState } from 'react'
import './Budgets.css'

const BUDGET_PLAN_KEY = 'pennypilot-budget-plan-v2'

const AVAILABLE_CATEGORIES = [
  'Food',
  'Shopping',
  'Transport',
  'Entertainment',
  'Other',
]

const starterCategories = [
  { id: 'Food', category: 'Food', limit: '' },
  { id: 'Shopping', category: 'Shopping', limit: '' },
  { id: 'Transport', category: 'Transport', limit: '' },
  { id: 'Entertainment', category: 'Entertainment', limit: '' },
]

function Budgets({ transactions }) {
  const [budgetPlan, setBudgetPlan] = useState(() => {
    try {
      const savedPlan = localStorage.getItem(BUDGET_PLAN_KEY)

      if (savedPlan) {
        return JSON.parse(savedPlan)
      }
    } catch (error) {
      console.error('Could not load budget plan:', error)
    }

    return null
  })

  const [showSetup, setShowSetup] = useState(false)
  const [draftMonthlyBudget, setDraftMonthlyBudget] = useState('')
  const [draftCategories, setDraftCategories] =
    useState(starterCategories)

  useEffect(() => {
    if (budgetPlan) {
      localStorage.setItem(
        BUDGET_PLAN_KEY,
        JSON.stringify(budgetPlan)
      )
    }
  }, [budgetPlan])

  const openBudgetSetup = () => {
    if (budgetPlan) {
      setDraftMonthlyBudget(
        String(budgetPlan.monthlyBudget)
      )

      setDraftCategories(
        budgetPlan.allocations.map((item) => ({
          ...item,
          limit: String(item.limit),
        }))
      )
    } else {
      setDraftMonthlyBudget('')
      setDraftCategories(starterCategories)
    }

    setShowSetup(true)
  }

  const closeBudgetSetup = () => {
    setShowSetup(false)
  }

  const updateCategoryLimit = (category, value) => {
    setDraftCategories((previousCategories) =>
      previousCategories.map((item) =>
        item.category === category
          ? { ...item, limit: value }
          : item
      )
    )
  }

  const removeCategory = (category) => {
    setDraftCategories((previousCategories) =>
      previousCategories.filter(
        (item) => item.category !== category
      )
    )
  }

  const addCategory = (category) => {
    setDraftCategories((previousCategories) => [
      ...previousCategories,
      {
        id: category,
        category,
        limit: '',
      },
    ])
  }

  const availableCategoriesToAdd =
    AVAILABLE_CATEGORIES.filter(
      (category) =>
        !draftCategories.some(
          (item) => item.category === category
        )
    )

  const draftAllocated = draftCategories.reduce(
    (total, item) =>
      total + (Number(item.limit) || 0),
    0
  )

  const draftMonthlyAmount =
    Number(draftMonthlyBudget) || 0

  const draftUnallocated =
    draftMonthlyAmount - draftAllocated

  const saveBudgetPlan = (event) => {
    event.preventDefault()

    const monthlyBudget =
      Number(draftMonthlyBudget)

    if (!monthlyBudget || monthlyBudget <= 0) {
      alert('Please enter a valid monthly budget.')
      return
    }

    if (draftCategories.length === 0) {
      alert('Please add at least one category.')
      return
    }

    const hasInvalidCategory =
      draftCategories.some(
        (item) =>
          !item.limit || Number(item.limit) <= 0
      )

    if (hasInvalidCategory) {
      alert(
        'Please enter a valid amount for every category.'
      )
      return
    }

    if (draftAllocated > monthlyBudget) {
      alert(
        'Category allocation cannot exceed your monthly budget.'
      )
      return
    }

    const newPlan = {
      monthlyBudget,

      // Existing cycle ko edit ke time preserve karega
      cycleStart: budgetPlan?.cycleStart ?? null,

      allocations: draftCategories.map((item) => ({
        id: item.category,
        category: item.category,
        limit: Number(item.limit),
      })),
    }

    setBudgetPlan(newPlan)

    localStorage.setItem(
      BUDGET_PLAN_KEY,
      JSON.stringify(newPlan)
    )

    setShowSetup(false)
  }

  const handleResetBudget = () => {
    const confirmed = window.confirm(
      'Reset your entire budget plan? Your transactions will not be deleted.'
    )

    if (!confirmed) {
      return
    }

    localStorage.removeItem(BUDGET_PLAN_KEY)
    setBudgetPlan(null)
    setShowSetup(false)
  }

  const handleStartNewMonth = () => {
    const confirmed = window.confirm(
      'Start a new monthly budget cycle? Your limits will stay the same, but budget spending will restart from zero.'
    )

    if (!confirmed) {
      return
    }

    const nextPlan = {
      ...budgetPlan,
      cycleStart: Date.now(),
    }

    localStorage.setItem(
      BUDGET_PLAN_KEY,
      JSON.stringify(nextPlan)
    )

    setBudgetPlan(nextPlan)
  }

  const budgetData = useMemo(() => {
    if (!budgetPlan) {
      return []
    }

    return budgetPlan.allocations.map((budget) => {
      const spent = transactions
        .filter((transaction) => {
          const correctCategory =
            transaction.type === 'Expense' &&
            transaction.category === budget.category

          if (!correctCategory) {
            return false
          }

          // No cycleStart = existing/current data count hoga
          if (!budgetPlan.cycleStart) {
            return true
          }

          // New transactions ka id Date.now() timestamp hai
          return (
            Number(transaction.id) >=
            Number(budgetPlan.cycleStart)
          )
        })
        .reduce(
          (total, transaction) =>
            total + Number(transaction.amount),
          0
        )

      const remaining =
        Number(budget.limit) - spent

      const percentage =
        budget.limit > 0
          ? Math.round(
              (spent / Number(budget.limit)) * 100
            )
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
        remaining,
        percentage,
        status,
      }
    })
  }, [budgetPlan, transactions])

  const totalAllocated = budgetPlan
    ? budgetPlan.allocations.reduce(
        (total, item) =>
          total + Number(item.limit),
        0
      )
    : 0

  const totalSpent = budgetData.reduce(
    (total, item) =>
      total + item.spent,
    0
  )

  const totalUnallocated = budgetPlan
    ? Number(budgetPlan.monthlyBudget) -
      totalAllocated
    : 0

  return (
    <div className="budget-plan-page">

      <div className="budget-plan-header">

        <div>
          <h1>Budgets</h1>

          <p>
            Plan your monthly spending and track
            category limits automatically.
          </p>

          {budgetPlan?.cycleStart && (
            <p className="budget-cycle-note">
              Current cycle started{' '}
              {new Date(
                budgetPlan.cycleStart
              ).toLocaleDateString('en-IN')}
            </p>
          )}
        </div>

        {budgetPlan && (
          <div className="budget-header-actions">

            <button
              className="budget-primary-btn"
              onClick={openBudgetSetup}
            >
              Edit Budget Plan
            </button>

            <button
              className="budget-secondary-btn"
              onClick={handleStartNewMonth}
            >
              Start New Month
            </button>

            <button
              className="budget-danger-btn"
              onClick={handleResetBudget}
            >
              Reset Budget
            </button>

          </div>
        )}

      </div>

      {!budgetPlan ? (

        <div className="budget-empty-state">

          <div className="budget-empty-icon">
            ₹
          </div>

          <h2>
            Create your monthly budget
          </h2>

          <p>
            Set your monthly spending limit,
            allocate money to categories and let
            PennyPilot track everything automatically.
          </p>

          <button
            className="budget-primary-btn"
            onClick={openBudgetSetup}
          >
            Create Monthly Budget
          </button>

        </div>

      ) : (

        <>
          <section className="budget-plan-summary">

            <div className="budget-plan-summary-card">
              <span>Monthly Budget</span>

              <h2>
                ₹
                {Number(
                  budgetPlan.monthlyBudget
                ).toLocaleString('en-IN')}
              </h2>
            </div>

            <div className="budget-plan-summary-card">
              <span>Allocated</span>

              <h2>
                ₹
                {totalAllocated.toLocaleString(
                  'en-IN'
                )}
              </h2>
            </div>

            <div className="budget-plan-summary-card">
              <span>Spent</span>

              <h2>
                ₹
                {totalSpent.toLocaleString(
                  'en-IN'
                )}
              </h2>
            </div>

            <div className="budget-plan-summary-card">
              <span>Unallocated</span>

              <h2>
                ₹
                {totalUnallocated.toLocaleString(
                  'en-IN'
                )}
              </h2>
            </div>

          </section>

          <section className="budget-plan-grid">

            {budgetData.map((budget) => (

              <div
                className="budget-plan-card"
                key={budget.category}
              >

                <div className="budget-plan-card-header">

                  <div>
                    <h3>
                      {budget.category}
                    </h3>

                    <span
                      className={`budget-plan-status status-${budget.status
                        .toLowerCase()
                        .replace(' ', '-')}`}
                    >
                      {budget.status}
                    </span>
                  </div>

                  <strong>
                    {budget.percentage}% used
                  </strong>

                </div>

                <div className="budget-plan-values">

                  <div>
                    <span>Spent</span>

                    <strong>
                      ₹
                      {budget.spent.toLocaleString(
                        'en-IN'
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Limit</span>

                    <strong>
                      ₹
                      {Number(
                        budget.limit
                      ).toLocaleString('en-IN')}
                    </strong>
                  </div>

                  <div>
                    <span>Remaining</span>

                    <strong
                      className={
                        budget.remaining < 0
                          ? 'expense'
                          : ''
                      }
                    >
                      ₹
                      {budget.remaining.toLocaleString(
                        'en-IN'
                      )}
                    </strong>
                  </div>

                </div>

                <div className="budget-plan-progress">

                  <div
                    className={`budget-plan-progress-fill progress-${budget.status
                      .toLowerCase()
                      .replace(' ', '-')}`}
                    style={{
                      width: `${Math.min(
                        budget.percentage,
                        100
                      )}%`,
                    }}
                  />

                </div>

                {budget.status === 'Watch' && (
                  <p className="budget-plan-message watch-message">
                    Spending is starting to rise in
                    this category.
                  </p>
                )}

                {budget.status === 'Warning' && (
                  <p className="budget-plan-message warning-message">
                    You are close to your monthly limit.
                  </p>
                )}

                {budget.status ===
                  'Over Budget' && (
                  <p className="budget-plan-message danger-message">
                    Budget exceeded by ₹
                    {Math.abs(
                      budget.remaining
                    ).toLocaleString('en-IN')}
                    .
                  </p>
                )}

              </div>

            ))}

          </section>
        </>

      )}

      {showSetup && (

        <div className="modal-overlay">

          <div className="modal budget-setup-modal">

            <div className="modal-header">

              <div>
                <h2>
                  {budgetPlan
                    ? 'Edit Monthly Budget'
                    : 'Create Monthly Budget'}
                </h2>

                <p className="budget-modal-subtitle">
                  Set your total budget and allocate
                  it across categories.
                </p>
              </div>

              <button
                type="button"
                className="close-btn"
                onClick={closeBudgetSetup}
              >
                ×
              </button>

            </div>

            <form onSubmit={saveBudgetPlan}>

              <label className="budget-setup-label">

                Total Monthly Budget

                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 25000"
                  value={draftMonthlyBudget}
                  onChange={(event) =>
                    setDraftMonthlyBudget(
                      event.target.value
                    )
                  }
                />

              </label>

              <div className="budget-allocation-summary">

                <div>
                  <span>Allocated</span>

                  <strong>
                    ₹
                    {draftAllocated.toLocaleString(
                      'en-IN'
                    )}
                  </strong>
                </div>

                <div>
                  <span>Unallocated</span>

                  <strong
                    className={
                      draftUnallocated < 0
                        ? 'expense'
                        : ''
                    }
                  >
                    ₹
                    {draftUnallocated.toLocaleString(
                      'en-IN'
                    )}
                  </strong>
                </div>

              </div>

              <div className="budget-category-editor">

                <h3>
                  Category Allocation
                </h3>

                {draftCategories.map((item) => (

                  <div
                    className="budget-category-row"
                    key={item.category}
                  >

                    <span>
                      {item.category}
                    </span>

                    <input
                      type="number"
                      min="1"
                      placeholder="Amount"
                      value={item.limit}
                      onChange={(event) =>
                        updateCategoryLimit(
                          item.category,
                          event.target.value
                        )
                      }
                    />

                    <button
                      type="button"
                      className="budget-remove-btn"
                      onClick={() =>
                        removeCategory(
                          item.category
                        )
                      }
                    >
                      Remove
                    </button>

                  </div>

                ))}

              </div>

              {availableCategoriesToAdd.length >
                0 && (

                <div className="budget-add-category">

                  <span>
                    Add category:
                  </span>

                  <div>
                    {availableCategoriesToAdd.map(
                      (category) => (

                        <button
                          key={category}
                          type="button"
                          onClick={() =>
                            addCategory(
                              category
                            )
                          }
                        >
                          + {category}
                        </button>

                      )
                    )}
                  </div>

                </div>

              )}

              {draftAllocated >
                draftMonthlyAmount && (

                <p className="budget-allocation-error">
                  Your category allocation is ₹
                  {(
                    draftAllocated -
                    draftMonthlyAmount
                  ).toLocaleString('en-IN')}{' '}
                  above your monthly budget.
                </p>

              )}

              <button
                type="submit"
                className="save-btn"
              >
                Save Budget Plan
              </button>

            </form>

          </div>

        </div>

      )}

    </div>
  )
}

export default Budgets