import { useEffect, useMemo, useState } from 'react'
import './RecurringPayments.css'

const STORAGE_KEY = 'pennypilot-recurring-payments-v1'

const CATEGORY_OPTIONS = [
  'Subscriptions',
  'Rent',
  'EMI',
  'Utilities',
  'Insurance',
  'Other',
]

const FREQUENCY_OPTIONS = ['Weekly', 'Monthly', 'Yearly']

const EMPTY_FORM = {
  name: '',
  amount: '',
  category: 'Subscriptions',
  frequency: 'Monthly',
  nextDue: '',
}

const formatMoney = (amount) =>
  Number(amount || 0).toLocaleString('en-IN')

const formatDate = (dateString) => {
  if (!dateString) return 'No date'

  return new Date(`${dateString}T00:00:00`).toLocaleDateString(
    'en-IN',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }
  )
}

const getDaysUntilDue = (dateString) => {
  if (!dateString) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const dueDate = new Date(`${dateString}T00:00:00`)
  const difference = dueDate.getTime() - today.getTime()

  return Math.ceil(difference / (1000 * 60 * 60 * 24))
}

const getDueLabel = (payment) => {
  if (payment.status === 'Paused') {
    return 'Paused'
  }

  const days = getDaysUntilDue(payment.nextDue)

  if (days === null) return 'No due date'
  if (days < 0) return `${Math.abs(days)} days overdue`
  if (days === 0) return 'Due today'
  if (days === 1) return 'Due tomorrow'
  if (days <= 7) return `Due in ${days} days`

  return 'Upcoming'
}

const getMonthlyEquivalent = (payment) => {
  const amount = Number(payment.amount || 0)

  if (payment.frequency === 'Weekly') {
    return amount * 52 / 12
  }

  if (payment.frequency === 'Yearly') {
    return amount / 12
  }

  return amount
}

function RecurringPayments() {
  const [payments, setPayments] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [form, setForm] = useState(EMPTY_FORM)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payments))
  }, [payments])

  const openCreateForm = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  const openEditForm = (payment) => {
    setEditingId(payment.id)

    setForm({
      name: payment.name,
      amount: String(payment.amount),
      category: payment.category,
      frequency: payment.frequency,
      nextDue: payment.nextDue,
    })

    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const name = form.name.trim()
    const amount = Number(form.amount)

    if (!name) {
      alert('Please enter a payment name.')
      return
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      alert('Please enter a valid amount.')
      return
    }

    if (!form.nextDue) {
      alert('Please select the next due date.')
      return
    }

    if (editingId !== null) {
      setPayments((currentPayments) =>
        currentPayments.map((payment) =>
          payment.id === editingId
            ? {
                ...payment,
                name,
                amount,
                category: form.category,
                frequency: form.frequency,
                nextDue: form.nextDue,
              }
            : payment
        )
      )
    } else {
      const newPayment = {
        id: Date.now(),
        name,
        amount,
        category: form.category,
        frequency: form.frequency,
        nextDue: form.nextDue,
        status: 'Active',
        createdAt: new Date().toISOString(),
      }

      setPayments((currentPayments) => [
        newPayment,
        ...currentPayments,
      ])
    }

    closeForm()
  }

  const toggleStatus = (id) => {
    setPayments((currentPayments) =>
      currentPayments.map((payment) =>
        payment.id === id
          ? {
              ...payment,
              status:
                payment.status === 'Active'
                  ? 'Paused'
                  : 'Active',
            }
          : payment
      )
    )
  }

  const deletePayment = (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this recurring payment?'
    )

    if (!confirmed) return

    setPayments((currentPayments) =>
      currentPayments.filter((payment) => payment.id !== id)
    )
  }

  const filteredPayments = useMemo(() => {
    return payments
      .filter((payment) => {
        const matchesSearch =
          payment.name
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          payment.category
            .toLowerCase()
            .includes(search.toLowerCase())

        const matchesStatus =
          statusFilter === 'All' ||
          payment.status === statusFilter

        const matchesCategory =
          categoryFilter === 'All' ||
          payment.category === categoryFilter

        return (
          matchesSearch &&
          matchesStatus &&
          matchesCategory
        )
      })
      .sort((a, b) => {
        if (!a.nextDue) return 1
        if (!b.nextDue) return -1

        return (
          new Date(`${a.nextDue}T00:00:00`) -
          new Date(`${b.nextDue}T00:00:00`)
        )
      })
  }, [payments, search, statusFilter, categoryFilter])

  const activePayments = payments.filter(
    (payment) => payment.status === 'Active'
  )

  const pausedPayments = payments.filter(
    (payment) => payment.status === 'Paused'
  )

  const upcomingPayments = activePayments.filter((payment) => {
    const days = getDaysUntilDue(payment.nextDue)

    return days !== null && days >= 0 && days <= 7
  })

  const estimatedMonthlyCommitment =
    activePayments.reduce(
      (total, payment) =>
        total + getMonthlyEquivalent(payment),
      0
    )

  return (
    <section className="recurring-page">
      <div className="recurring-header">
        <div>
          <p className="recurring-eyebrow">
            Payment planning
          </p>

          <h1>Recurring Payments</h1>

          <p>
            Keep subscriptions, bills, EMIs, and other
            repeating expenses organized in one place.
          </p>
        </div>

        <button
          className="recurring-primary-btn"
          onClick={openCreateForm}
        >
          + Add Payment
        </button>
      </div>

      <div className="recurring-summary">
        <div className="recurring-summary-card">
          <span>Active Payments</span>
          <strong>{activePayments.length}</strong>
        </div>

        <div className="recurring-summary-card">
          <span>Due in 7 Days</span>
          <strong>{upcomingPayments.length}</strong>
        </div>

        <div className="recurring-summary-card">
          <span>Paused</span>
          <strong>{pausedPayments.length}</strong>
        </div>

        <div className="recurring-summary-card">
          <span>Est. Monthly Commitment</span>
          <strong>
            ₹{formatMoney(Math.round(estimatedMonthlyCommitment))}
          </strong>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="recurring-empty">
          <div className="recurring-empty-icon">↻</div>

          <h2>No recurring payments yet</h2>

          <p>
            Add your rent, subscriptions, EMIs, utilities,
            or other repeating payments to keep track of
            upcoming expenses.
          </p>

          <button
            className="recurring-primary-btn"
            onClick={openCreateForm}
          >
            Add Your First Payment
          </button>
        </div>
      ) : (
        <>
          <div className="recurring-filters">
            <input
              type="text"
              placeholder="Search payments..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Paused">Paused</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(event.target.value)
              }
            >
              <option value="All">All Categories</option>

              {CATEGORY_OPTIONS.map((category) => (
                <option
                  value={category}
                  key={category}
                >
                  {category}
                </option>
              ))}
            </select>
          </div>

          {filteredPayments.length === 0 ? (
            <div className="recurring-no-results">
              No recurring payments match your filters.
            </div>
          ) : (
            <div className="recurring-list">
              {filteredPayments.map((payment) => {
                const dueLabel = getDueLabel(payment)
                const days = getDaysUntilDue(payment.nextDue)

                const isOverdue =
                  payment.status === 'Active' &&
                  days !== null &&
                  days < 0

                const isDueSoon =
                  payment.status === 'Active' &&
                  days !== null &&
                  days >= 0 &&
                  days <= 7

                return (
                  <article
                    className="recurring-payment-card"
                    key={payment.id}
                  >
                    <div className="recurring-card-main">
                      <div className="recurring-card-title-row">
                        <div>
                          <span className="recurring-category">
                            {payment.category}
                          </span>

                          <h2>{payment.name}</h2>
                        </div>

                        <span
                          className={`recurring-status ${
                            payment.status === 'Active'
                              ? 'active'
                              : 'paused'
                          }`}
                        >
                          {payment.status}
                        </span>
                      </div>

                      <div className="recurring-details">
                        <div>
                          <span>Amount</span>
                          <strong>
                            ₹{formatMoney(payment.amount)}
                          </strong>
                        </div>

                        <div>
                          <span>Frequency</span>
                          <strong>
                            {payment.frequency}
                          </strong>
                        </div>

                        <div>
                          <span>Next Due</span>
                          <strong>
                            {formatDate(payment.nextDue)}
                          </strong>
                        </div>

                        <div>
                          <span>Schedule</span>
                          <strong
                            className={
                              isOverdue
                                ? 'recurring-overdue'
                                : isDueSoon
                                ? 'recurring-due-soon'
                                : ''
                            }
                          >
                            {dueLabel}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="recurring-card-actions">
                      <button
                        className="recurring-secondary-btn"
                        onClick={() =>
                          toggleStatus(payment.id)
                        }
                      >
                        {payment.status === 'Active'
                          ? 'Pause'
                          : 'Resume'}
                      </button>

                      <button
                        className="recurring-secondary-btn"
                        onClick={() =>
                          openEditForm(payment)
                        }
                      >
                        Edit
                      </button>

                      <button
                        className="recurring-delete-btn"
                        onClick={() =>
                          deletePayment(payment.id)
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </>
      )}

      {showForm && (
        <div
          className="recurring-modal-overlay"
          onClick={closeForm}
        >
          <div
            className="recurring-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="recurring-modal-header">
              <div>
                <p className="recurring-eyebrow">
                  {editingId !== null
                    ? 'Update payment'
                    : 'New recurring payment'}
                </p>

                <h2>
                  {editingId !== null
                    ? 'Edit Recurring Payment'
                    : 'Add Recurring Payment'}
                </h2>
              </div>

              <button
                className="recurring-close-btn"
                onClick={closeForm}
              >
                ×
              </button>
            </div>

            <form
              className="recurring-form"
              onSubmit={handleSubmit}
            >
              <label>
                Payment name

                <input
                  type="text"
                  placeholder="e.g. Netflix"
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
                Amount

                <input
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="e.g. 649"
                  value={form.amount}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      amount: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Category

                <select
                  value={form.category}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      category: event.target.value,
                    })
                  }
                >
                  {CATEGORY_OPTIONS.map((category) => (
                    <option
                      value={category}
                      key={category}
                    >
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Frequency

                <select
                  value={form.frequency}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      frequency: event.target.value,
                    })
                  }
                >
                  {FREQUENCY_OPTIONS.map((frequency) => (
                    <option
                      value={frequency}
                      key={frequency}
                    >
                      {frequency}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Next due date

                <input
                  type="date"
                  value={form.nextDue}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      nextDue: event.target.value,
                    })
                  }
                />
              </label>

              <button
                className="recurring-save-btn"
                type="submit"
              >
                {editingId !== null
                  ? 'Save Changes'
                  : 'Add Recurring Payment'}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}

export default RecurringPayments