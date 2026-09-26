import { useEffect, useMemo, useState } from 'react'
import './SavingsGoals.css'

const STORAGE_KEY = 'pennypilot-savings-goals-v1'

function SavingsGoals() {
  const [goals, setGoals] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    name: '',
    target: '',
    saved: '',
    deadline: '',
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals))
  }, [goals])

  const totalTarget = useMemo(
    () => goals.reduce((sum, goal) => sum + Number(goal.target), 0),
    [goals]
  )

  const totalSaved = useMemo(
    () => goals.reduce((sum, goal) => sum + Number(goal.saved), 0),
    [goals]
  )

  const totalRemaining = Math.max(totalTarget - totalSaved, 0)

  const overallProgress =
    totalTarget > 0
      ? Math.min(Math.round((totalSaved / totalTarget) * 100), 100)
      : 0

  const handleSubmit = (event) => {
    event.preventDefault()

    const name = form.name.trim()
    const target = Number(form.target)
    const saved = Number(form.saved)

    if (!name || target <= 0 || saved < 0 || saved > target) {
      alert('Please enter valid goal details.')
      return
    }

    const newGoal = {
      id: Date.now(),
      name,
      target,
      saved,
      deadline: form.deadline,
    }

    setGoals((currentGoals) => [newGoal, ...currentGoals])

    setForm({
      name: '',
      target: '',
      saved: '',
      deadline: '',
    })

    setShowForm(false)
  }

  const addContribution = (id) => {
    const amountText = window.prompt('Enter contribution amount:')

    if (amountText === null) return

    const amount = Number(amountText)

    if (!Number.isFinite(amount) || amount <= 0) {
      alert('Enter a valid contribution amount.')
      return
    }

    setGoals((currentGoals) =>
      currentGoals.map((goal) => ({
        ...goal,
        saved:
          goal.id === id
            ? Math.min(goal.saved + amount, goal.target)
            : goal.saved,
      }))
    )
  }

  const deleteGoal = (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this savings goal?'
    )

    if (!confirmed) return

    setGoals((currentGoals) =>
      currentGoals.filter((goal) => goal.id !== id)
    )
  }

  return (
    <section className="savings-page">
      <div className="savings-header">
        <div>
          <p className="page-eyebrow">Financial planning</p>
          <h1>Savings Goals</h1>
          <p>
            Set targets, track your progress, and stay focused on what
            you are saving for.
          </p>
        </div>

        <button
          className="savings-primary-btn"
          onClick={() => setShowForm(true)}
        >
          + Create Goal
        </button>
      </div>

      <div className="savings-summary">
        <div className="savings-summary-card">
          <span>Total Target</span>
          <strong>₹{totalTarget.toLocaleString('en-IN')}</strong>
        </div>

        <div className="savings-summary-card">
          <span>Total Saved</span>
          <strong>₹{totalSaved.toLocaleString('en-IN')}</strong>
        </div>

        <div className="savings-summary-card">
          <span>Remaining</span>
          <strong>₹{totalRemaining.toLocaleString('en-IN')}</strong>
        </div>

        <div className="savings-summary-card">
          <span>Overall Progress</span>
          <strong>{overallProgress}%</strong>
        </div>
      </div>

      {goals.length === 0 ? (
        <div className="savings-empty">
          <div className="savings-empty-icon">◎</div>
          <h2>No savings goals yet</h2>
          <p>
            Create your first goal and start tracking your progress
            towards something important.
          </p>

          <button
            className="savings-primary-btn"
            onClick={() => setShowForm(true)}
          >
            Create Your First Goal
          </button>
        </div>
      ) : (
        <div className="savings-goals-grid">
          {goals.map((goal) => {
            const progress =
              goal.target > 0
                ? Math.min(
                    Math.round((goal.saved / goal.target) * 100),
                    100
                  )
                : 0

            const remaining = Math.max(
              goal.target - goal.saved,
              0
            )

            const completed = progress >= 100

            return (
              <article className="savings-goal-card" key={goal.id}>
                <div className="goal-card-top">
                  <div>
                    <span className="goal-label">Goal</span>
                    <h2>{goal.name}</h2>
                  </div>

                  <button
                    className="goal-delete-btn"
                    onClick={() => deleteGoal(goal.id)}
                    title="Delete goal"
                  >
                    ×
                  </button>
                </div>

                <div className="goal-amount-row">
                  <div>
                    <span>Saved</span>
                    <strong>
                      ₹{goal.saved.toLocaleString('en-IN')}
                    </strong>
                  </div>

                  <div>
                    <span>Target</span>
                    <strong>
                      ₹{goal.target.toLocaleString('en-IN')}
                    </strong>
                  </div>
                </div>

                <div className="goal-progress-header">
                  <span>{progress}% complete</span>
                  <span>
                    ₹{remaining.toLocaleString('en-IN')} remaining
                  </span>
                </div>

                <div className="goal-progress-track">
                  <div
                    className="goal-progress-fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="goal-card-footer">
                  <div>
                    {goal.deadline ? (
                      <>
                        <span>Target date</span>
                        <strong>
                          {new Date(
                            `${goal.deadline}T00:00:00`
                          ).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </strong>
                      </>
                    ) : (
                      <>
                        <span>Target date</span>
                        <strong>No deadline</strong>
                      </>
                    )}
                  </div>

                  {completed ? (
                    <span className="goal-complete-badge">
                      Completed
                    </span>
                  ) : (
                    <button
                      className="goal-contribute-btn"
                      onClick={() => addContribution(goal.id)}
                    >
                      + Add Contribution
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}

      {showForm && (
        <div
          className="savings-modal-overlay"
          onClick={() => setShowForm(false)}
        >
          <div
            className="savings-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="savings-modal-header">
              <div>
                <p className="page-eyebrow">New goal</p>
                <h2>Create Savings Goal</h2>
              </div>

              <button
                className="goal-delete-btn"
                onClick={() => setShowForm(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label>
                Goal name
                <input
                  type="text"
                  placeholder="e.g. New Laptop"
                  value={form.name}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      name: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Target amount
                <input
                  type="number"
                  min="1"
                  placeholder="100000"
                  value={form.target}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      target: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Already saved
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.saved}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      saved: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Target date
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      deadline: event.target.value,
                    })
                  }
                />
              </label>

              <button
                className="savings-primary-btn savings-save-btn"
                type="submit"
              >
                Create Savings Goal
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}

export default SavingsGoals