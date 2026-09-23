import { useMemo, useState } from 'react'

function Transactions({ transactions, onEdit, onDelete }) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')

  const [editingTransaction, setEditingTransaction] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editType, setEditType] = useState('Expense')
  const [editCategory, setEditCategory] = useState('Food')

  const categories = [
    'All',
    'Food',
    'Shopping',
    'Transport',
    'Entertainment',
    'Salary',
    'Other',
  ]

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesSearch =
        transaction.title
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        transaction.category
          .toLowerCase()
          .includes(search.toLowerCase())

      const matchesType =
        typeFilter === 'All' ||
        transaction.type === typeFilter

      const matchesCategory =
        categoryFilter === 'All' ||
        transaction.category === categoryFilter

      return (
        matchesSearch &&
        matchesType &&
        matchesCategory
      )
    })
  }, [
    transactions,
    search,
    typeFilter,
    categoryFilter,
  ])

  const startEditing = (transaction) => {
    setEditingTransaction(transaction)
    setEditTitle(transaction.title)
    setEditAmount(transaction.amount)
    setEditType(transaction.type)
    setEditCategory(transaction.category)
  }

  const closeEditModal = () => {
    setEditingTransaction(null)
  }

  const saveEditedTransaction = (event) => {
    event.preventDefault()

    if (!editTitle.trim()) {
      alert('Please enter a title.')
      return
    }

    if (!editAmount || Number(editAmount) <= 0) {
      alert('Please enter a valid amount.')
      return
    }

    onEdit({
      ...editingTransaction,
      title: editTitle.trim(),
      amount: Number(editAmount),
      type: editType,
      category: editCategory,
    })

    closeEditModal()
  }

  const deleteTransaction = (transaction) => {
    const confirmed = window.confirm(
      `Delete "${transaction.title}"?`
    )

    if (confirmed) {
      onDelete(transaction.id)
    }
  }

  return (
    <div className="transactions-page">

      <div className="transactions-page-header">
        <div>
          <h1>Transactions</h1>
          <p>
            Search, filter and manage all your money activity.
          </p>
        </div>

        <div className="transaction-count">
          {filteredTransactions.length} transactions
        </div>
      </div>

      <div className="transaction-tools">

        <input
          className="transaction-search"
          type="text"
          placeholder="Search title or category..."
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
        />

        <select
          value={typeFilter}
          onChange={(event) =>
            setTypeFilter(event.target.value)
          }
        >
          <option value="All">
            All Types
          </option>

          <option value="Income">
            Income
          </option>

          <option value="Expense">
            Expense
          </option>
        </select>

        <select
          value={categoryFilter}
          onChange={(event) =>
            setCategoryFilter(event.target.value)
          }
        >
          {categories.map((category) => (
            <option
              key={category}
              value={category}
            >
              {category === 'All'
                ? 'All Categories'
                : category}
            </option>
          ))}
        </select>

      </div>

      <div className="transactions-table">

        <div className="transaction-table-head">
          <span>Transaction</span>
          <span>Category</span>
          <span>Type</span>
          <span>Amount</span>
          <span>Actions</span>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="empty-transactions">
            <h3>No transactions found</h3>
            <p>
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          filteredTransactions.map((transaction) => (
            <div
              className="transaction-table-row"
              key={transaction.id}
            >

              <div>
                <strong>
                  {transaction.title}
                </strong>

                <small>
                  {transaction.date}
                </small>
              </div>

              <span>
                {transaction.category}
              </span>

              <span
                className={
                  transaction.type === 'Income'
                    ? 'type-badge income-badge'
                    : 'type-badge expense-badge'
                }
              >
                {transaction.type}
              </span>

              <strong
                className={
                  transaction.type === 'Income'
                    ? 'income'
                    : 'expense'
                }
              >
                {transaction.type === 'Income'
                  ? '+'
                  : '-'}
                ₹
                {Number(
                  transaction.amount
                ).toLocaleString('en-IN')}
              </strong>

              <div className="transaction-actions">

                <button
                  className="edit-transaction-btn"
                  onClick={() =>
                    startEditing(transaction)
                  }
                >
                  Edit
                </button>

                <button
                  className="delete-transaction-btn"
                  onClick={() =>
                    deleteTransaction(transaction)
                  }
                >
                  Delete
                </button>

              </div>

            </div>
          ))
        )}

      </div>

      {editingTransaction && (
        <div className="modal-overlay">

          <div className="modal">

            <div className="modal-header">

              <h2>
                Edit Transaction
              </h2>

              <button
                className="close-btn"
                type="button"
                onClick={closeEditModal}
              >
                ×
              </button>

            </div>

            <form
              className="transaction-form"
              onSubmit={saveEditedTransaction}
            >

              <label>
                Title

                <input
                  type="text"
                  value={editTitle}
                  onChange={(event) =>
                    setEditTitle(event.target.value)
                  }
                />
              </label>

              <label>
                Amount

                <input
                  type="number"
                  min="1"
                  value={editAmount}
                  onChange={(event) =>
                    setEditAmount(event.target.value)
                  }
                />
              </label>

              <label>
                Type

                <select
                  value={editType}
                  onChange={(event) =>
                    setEditType(event.target.value)
                  }
                >
                  <option value="Expense">
                    Expense
                  </option>

                  <option value="Income">
                    Income
                  </option>
                </select>
              </label>

              <label>
                Category

                <select
                  value={editCategory}
                  onChange={(event) =>
                    setEditCategory(event.target.value)
                  }
                >
                  <option value="Food">
                    Food
                  </option>

                  <option value="Shopping">
                    Shopping
                  </option>

                  <option value="Transport">
                    Transport
                  </option>

                  <option value="Entertainment">
                    Entertainment
                  </option>

                  <option value="Salary">
                    Salary
                  </option>

                  <option value="Other">
                    Other
                  </option>
                </select>
              </label>

              <button
                className="save-btn"
                type="submit"
              >
                Save Changes
              </button>

            </form>

          </div>

        </div>
      )}

    </div>
  )
}

export default Transactions