import { useEffect, useState } from 'react'

import './App.css'



import {

  AreaChart,

  Area,

  XAxis,

  YAxis,

  Tooltip,

  ResponsiveContainer,

} from 'recharts'



import Sidebar from './components/Sidebar'

import Transactions from './pages/Transactions'

import Budgets from './pages/Budgets'

import Analytics from './pages/Analytics'
import SavingsGoals from './pages/SavingsGoals'



const STORAGE_KEY = 'pennypilot-transactions'

const BUDGET_STORAGE_KEY = 'pennypilot-budget-plan-v2'

const OPENING_BALANCE_KEY = 'pennypilot-opening-balance-v1'



const formatMoney = (amount) =>

  Number(amount || 0).toLocaleString('en-IN')



function App() {

  const [activePage, setActivePage] = useState('Dashboard')

  const [showForm, setShowForm] = useState(false)



  // A missing key means setup has not been completed yet. Zero is a valid balance.

  const [openingBalance, setOpeningBalance] = useState(() => {

    try {

      const saved = localStorage.getItem(OPENING_BALANCE_KEY)

      if (saved === null) return null

      const value = Number(saved)

      return Number.isFinite(value) && value >= 0 ? value : null

    } catch (error) {

      console.error('Could not load opening balance:', error)

      return null

    }

  })

  const [showOpeningSetup, setShowOpeningSetup] = useState(

    openingBalance === null

  )

  const [openingBalanceInput, setOpeningBalanceInput] = useState(

    openingBalance === null ? '' : String(openingBalance)

  )



  // NEW USER: no sample transactions.

  // RETURNING USER: load their saved transactions.

  const [transactions, setTransactions] = useState(() => {

    try {

      const saved = localStorage.getItem(STORAGE_KEY)



      if (saved) {

        const parsed = JSON.parse(saved)



        if (Array.isArray(parsed)) {

          return parsed

        }

      }

    } catch (error) {

      console.error('Could not load transactions:', error)

    }



    return []

  })



  const [dashboardBudgetPlan, setDashboardBudgetPlan] =

    useState(() => {

      try {

        const saved = localStorage.getItem(BUDGET_STORAGE_KEY)

        return saved ? JSON.parse(saved) : null

      } catch (error) {

        console.error('Could not load budget plan:', error)

        return null

      }

    })



  const [title, setTitle] = useState('')

  const [amount, setAmount] = useState('')

  const [type, setType] = useState('Expense')

  const [category, setCategory] = useState('Food')



  // Persist the amount only after setup (including an explicit ₹0 setup).

  useEffect(() => {

    if (openingBalance === null) return

    try {

      localStorage.setItem(OPENING_BALANCE_KEY, String(openingBalance))

    } catch (error) {

      console.error('Could not save opening balance:', error)

    }

  }, [openingBalance])



  const openOpeningBalanceEditor = () => {

    setOpeningBalanceInput(

      openingBalance === null ? '' : String(openingBalance)

    )

    setShowOpeningSetup(true)

  }



  const saveOpeningBalance = (event) => {

    event.preventDefault()

    const value = Number(openingBalanceInput)

    if (

      openingBalanceInput.trim() === '' ||

      !Number.isFinite(value) ||

      value < 0

    ) {

      alert('Enter a valid opening balance of ₹0 or more.')

      return

    }

    setOpeningBalance(value)

    setShowOpeningSetup(false)

  }



  const startWithZeroBalance = () => {

    setOpeningBalance(0)

    setOpeningBalanceInput('0')

    setShowOpeningSetup(false)

  }



  // Save transactions whenever they change.

  useEffect(() => {

    try {

      localStorage.setItem(

        STORAGE_KEY,

        JSON.stringify(transactions)

      )

    } catch (error) {

      console.error('Could not save transactions:', error)

    }

  }, [transactions])



  // Refresh budget whenever user returns to Dashboard.

  useEffect(() => {

    if (activePage !== 'Dashboard') {

      return

    }



    try {

      const saved = localStorage.getItem(BUDGET_STORAGE_KEY)



      setDashboardBudgetPlan(

        saved ? JSON.parse(saved) : null

      )

    } catch (error) {

      console.error('Could not refresh budget plan:', error)

      setDashboardBudgetPlan(null)

    }

  }, [activePage])



  // -----------------------------

  // DASHBOARD TOTALS

  // -----------------------------



  const totalIncome = transactions

    .filter((transaction) => transaction.type === 'Income')

    .reduce(

      (total, transaction) =>

        total + Number(transaction.amount || 0),

      0

    )



  const totalExpenses = transactions

    .filter((transaction) => transaction.type === 'Expense')

    .reduce(

      (total, transaction) =>

        total + Number(transaction.amount || 0),

      0

    )



  // Opening balance is starting money, not new income or savings.

  const netCashFlow = totalIncome - totalExpenses

  const currentBalance = (openingBalance ?? 0) + netCashFlow



  // Recorded-data savings rate (not a bank statement or a monthly metric).

  const savingsRate =

    totalIncome > 0

      ? Math.round((netCashFlow / totalIncome) * 100)

      : null



  // -----------------------------

  // REAL SPENDING OVERVIEW

  // -----------------------------

  // Group the user's actual expenses by category.

  // No manually entered sample graph values.



  const expensesByCategory = transactions

    .filter((transaction) => transaction.type === 'Expense')

    .reduce((totals, transaction) => {

      const transactionCategory =

        transaction.category || 'Other'



      totals[transactionCategory] =

        (totals[transactionCategory] || 0) +

        Number(transaction.amount || 0)



      return totals

    }, {})



  const spendingData = Object.entries(expensesByCategory)

    .map(([categoryName, expense]) => ({

      category: categoryName,

      expense,

    }))

    .sort((first, second) => second.expense - first.expense)



  const hasSpendingData = spendingData.length > 0



  // -----------------------------

  // DASHBOARD MONTHLY BUDGET

  // -----------------------------



  const dashboardBudgetData =

    dashboardBudgetPlan?.allocations?.map((budget) => {

      const spent = transactions

        .filter((transaction) => {

          const correctCategory =

            transaction.type === 'Expense' &&

            transaction.category === budget.category



          if (!correctCategory) {

            return false

          }



          if (!dashboardBudgetPlan.cycleStart) {

            return true

          }



          return (

            Number(transaction.id) >=

            Number(dashboardBudgetPlan.cycleStart)

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



      return {

        ...budget,

        spent,

        limit,

        percentage,

        remaining: limit - spent,

      }

    }) || []



  // -----------------------------

  // TRANSACTION ACTIONS

  // -----------------------------



  const handleSubmit = (event) => {

    event.preventDefault()



    if (!title.trim()) {

      alert('Please enter a transaction title.')

      return

    }



    if (!amount || Number(amount) <= 0) {

      alert('Please enter a valid amount.')

      return

    }



    const now = new Date()



    const newTransaction = {

      id: Date.now(),

      title: title.trim(),

      amount: Number(amount),

      type,

      category,

      date: now.toLocaleDateString('en-US', {

        month: 'short',

        day: 'numeric',

      }),

      createdAt: now.toISOString(),

    }



    setTransactions((previousTransactions) => [

      newTransaction,

      ...previousTransactions,

    ])



    setTitle('')

    setAmount('')

    setType('Expense')

    setCategory('Food')

    setShowForm(false)

  }



  const handleEditTransaction = (updatedTransaction) => {

    setTransactions((previousTransactions) =>

      previousTransactions.map((transaction) =>

        transaction.id === updatedTransaction.id

          ? updatedTransaction

          : transaction

      )

    )

  }



  const handleDeleteTransaction = (id) => {

    setTransactions((previousTransactions) =>

      previousTransactions.filter(

        (transaction) => transaction.id !== id

      )

    )

  }



  // -----------------------------

  // APP UI

  // -----------------------------



  return (

    <div className="app">

      <Sidebar

        activePage={activePage}

        setActivePage={setActivePage}

      />



      <main className="main">

        {activePage === 'Transactions' ? (

          <Transactions

            transactions={transactions}

            onEdit={handleEditTransaction}

            onDelete={handleDeleteTransaction}

          />

        ) : activePage === 'Budgets' ? (

          <Budgets transactions={transactions} />

        ) : activePage === 'Analytics' ? (

          <Analytics transactions={transactions} />

        ) : activePage === 'Savings Goals' ? (

          <SavingsGoals />
        ) : (

          <>

            {/* DASHBOARD HEADER */}



            <header className="topbar">

              <div>

                <h1>Your financial overview</h1>

                <p>Your balance is based on your opening amount and recorded transactions.</p>

              </div>



              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>

                <button

                  type="button"

                  className="view-all"

                  onClick={openOpeningBalanceEditor}

                  style={{ padding: '10px 14px' }}

                >

                  {openingBalance === null

                    ? 'Set Opening Balance'

                    : 'Edit Opening Balance'}

                </button>

                <button

                  type="button"

                  className="add-btn"

                  onClick={() => setShowForm(true)}

                >

                  + Add Transaction

                </button>

              </div>

            </header>



            {/* DASHBOARD CARDS */}



            <section className="cards">

              <div className="card">

                <p>Current Balance</p>



                <h2>₹{formatMoney(currentBalance)}</h2>



                <span>

                  Opening ₹{formatMoney(openingBalance ?? 0)} + income − expenses

                </span>

              </div>



              <div className="card">

                <p>Income</p>



                <h2>₹{formatMoney(totalIncome)}</h2>



                <span>Total recorded income</span>

              </div>



              <div className="card">

                <p>Expenses</p>



                <h2>₹{formatMoney(totalExpenses)}</h2>



                <span>Total recorded expenses</span>

              </div>



              <div className="card">

                <p>Recorded Savings Rate</p>



                <h2>{savingsRate === null ? '—' : `${savingsRate}%`}</h2>



                <span>

                  {totalIncome > 0

                    ? `₹${formatMoney(netCashFlow)} income minus expenses`

                    : 'Add income to calculate your savings rate'}

                </span>

              </div>

            </section>



            {/* GRAPH + MONTHLY BUDGET */}



            <section className="dashboard-grid">

              {/* LIVE SPENDING GRAPH */}



              <div className="panel">

                <h3>Spending Overview</h3>



                <p

                  style={{

                    color: '#6b7280',

                    fontSize: '13px',

                    marginTop: '6px',

                  }}

                >

                  Your recorded expenses by category

                </p>



                {hasSpendingData ? (

                  <div className="chart-container">

                    <ResponsiveContainer

                      width="100%"

                      height="100%"

                    >

                      <AreaChart

                        data={spendingData}

                        margin={{

                          top: 12,

                          right: 16,

                          left: 0,

                          bottom: 8,

                        }}

                      >

                        <XAxis

                          dataKey="category"

                          tick={{ fontSize: 12 }}

                        />



                        <YAxis

                          tick={{ fontSize: 12 }}

                        />



                        <Tooltip

                          formatter={(value) => [

                            `₹${formatMoney(value)}`,

                            'Expenses',

                          ]}

                        />



                        <Area

                          type="monotone"

                          dataKey="expense"

                          stroke="#111827"

                          fill="#e5e7eb"

                          strokeWidth={3}

                        />

                      </AreaChart>

                    </ResponsiveContainer>

                  </div>

                ) : (

                  <div

                    style={{

                      minHeight: '260px',

                      display: 'flex',

                      flexDirection: 'column',

                      alignItems: 'center',

                      justifyContent: 'center',

                      textAlign: 'center',

                      gap: '12px',

                      padding: '24px',

                    }}

                  >

                    <h4

                      style={{

                        margin: 0,

                        color: '#111827',

                      }}

                    >

                      No spending data yet

                    </h4>



                    <p

                      style={{

                        margin: 0,

                        color: '#6b7280',

                        maxWidth: '300px',

                      }}

                    >

                      Add your first expense to see

                      your spending overview.

                    </p>



                    <button

                      className="add-btn"

                      onClick={() => setShowForm(true)}

                    >

                      + Add First Expense

                    </button>

                  </div>

                )}

              </div>



              {/* LIVE MONTHLY BUDGET */}



              <div className="panel">

                <div className="section-header">

                  <div>

                    <h3>Monthly Budget</h3>



                    {dashboardBudgetPlan && (

                      <p>

                        ₹

                        {formatMoney(

                          dashboardBudgetPlan.monthlyBudget

                        )}{' '}

                        monthly plan

                      </p>

                    )}

                  </div>



                  <button

                    className="view-all"

                    onClick={() => setActivePage('Budgets')}

                  >

                    Manage

                  </button>

                </div>



                {!dashboardBudgetPlan ? (

                  <div

                    style={{

                      padding: '35px 0',

                    }}

                  >

                    <p

                      style={{

                        color: '#6b7280',

                        marginBottom: '18px',

                      }}

                    >

                      No monthly budget created yet.

                    </p>



                    <button

                      className="add-btn"

                      onClick={() =>

                        setActivePage('Budgets')

                      }

                    >

                      Create Budget

                    </button>

                  </div>

                ) : (

                  dashboardBudgetData

                    .slice(0, 4)

                    .map((budget) => (

                      <div

                        className="budget"

                        key={budget.category}

                      >

                        <div>

                          <span>{budget.category}</span>



                          <span>

                            ₹{formatMoney(budget.spent)}

                            {' / '}

                            ₹{formatMoney(budget.limit)}

                          </span>

                        </div>



                        <progress

                          value={Math.min(

                            budget.spent,

                            budget.limit

                          )}

                          max={budget.limit || 1}

                        />



                        <div>

                          <span>

                            {budget.percentage}% used

                          </span>



                          <span

                            className={

                              budget.remaining < 0

                                ? 'expense'

                                : ''

                            }

                          >

                            ₹{formatMoney(budget.remaining)}{' '}

                            remaining

                          </span>

                        </div>

                      </div>

                    ))

                )}

              </div>

            </section>



            {/* RECENT TRANSACTIONS */}



            <section className="transactions-panel">

              <div className="section-header">

                <div>

                  <h3>Recent Transactions</h3>



                  <p>Your latest money activity</p>

                </div>



                <button

                  className="view-all"

                  onClick={() =>

                    setActivePage('Transactions')

                  }

                >

                  View All

                </button>

              </div>



              {transactions.length === 0 ? (

                <div

                  style={{

                    padding: '35px 0',

                    textAlign: 'center',

                  }}

                >

                  <h4

                    style={{

                      marginBottom: '8px',

                    }}

                  >

                    No transactions yet

                  </h4>



                  <p

                    style={{

                      color: '#6b7280',

                      marginBottom: '18px',

                    }}

                  >

                    Add your first transaction to get started.

                  </p>



                  <button

                    className="add-btn"

                    onClick={() => setShowForm(true)}

                  >

                    + Add Transaction

                  </button>

                </div>

              ) : (

                transactions

                  .slice(0, 5)

                  .map((transaction) => (

                    <div

                      className="transaction"

                      key={transaction.id}

                    >

                      <div>

                        <h4>{transaction.title}</h4>



                        <p>

                          {transaction.category}

                          {' • '}

                          {transaction.date}

                        </p>

                      </div>



                      <span

                        className={

                          transaction.type === 'Income'

                            ? 'income'

                            : 'expense'

                        }

                      >

                        {transaction.type === 'Income'

                          ? '+'

                          : '-'}

                        ₹{formatMoney(transaction.amount)}

                      </span>

                    </div>

                  ))

              )}

            </section>

          </>

        )}

      </main>



      {/* FIRST-TIME SETUP + LATER EDIT (same form) */}

      {showOpeningSetup && (

        <div className="modal-overlay">

          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="opening-balance-heading">

            <div className="modal-header">

              <h2 id="opening-balance-heading">

                {openingBalance === null

                  ? 'Welcome to PennyPilot'

                  : 'Edit Opening Balance'}

              </h2>

              {openingBalance !== null && (

                <button

                  type="button"

                  className="close-btn"

                  onClick={() => setShowOpeningSetup(false)}

                  aria-label="Close opening balance setup"

                >

                  ×

                </button>

              )}

            </div>

            <p style={{ color: '#6b7280', lineHeight: 1.6, marginBottom: '18px' }}>

              {openingBalance === null

                ? 'How much money did you have before you started recording transactions? Enter your starting amount, or begin with ₹0.'

                : 'Update your starting amount. This will change Current Balance, but will not change recorded income, expenses or savings rate.'}

            </p>

            <form className="transaction-form" onSubmit={saveOpeningBalance}>

              <label>

                Opening Balance (₹)

                <input

                  type="number"

                  min="0"

                  step="0.01"

                  placeholder="e.g. 10000"

                  value={openingBalanceInput}

                  onChange={(event) => setOpeningBalanceInput(event.target.value)}

                />

              </label>

              <button type="submit" className="save-btn">

                {openingBalance === null ? 'Save & Continue' : 'Save Opening Balance'}

              </button>

              {openingBalance === null && (

                <button

                  type="button"

                  className="view-all"

                  onClick={startWithZeroBalance}

                  style={{ width: '100%', padding: '12px' }}

                >

                  Start with ₹0

                </button>

              )}

            </form>

          </div>

        </div>

      )}



      {/* ADD TRANSACTION MODAL */}



      {showForm && (

        <div className="modal-overlay">

          <div className="modal">

            <div className="modal-header">

              <h2>Add Transaction</h2>



              <button

                type="button"

                className="close-btn"

                onClick={() => setShowForm(false)}

              >

                ×

              </button>

            </div>



            <form

              className="transaction-form"

              onSubmit={handleSubmit}

            >

              <label>

                Title



                <input

                  type="text"

                  placeholder="e.g. Lunch"

                  value={title}

                  onChange={(event) =>

                    setTitle(event.target.value)

                  }

                  required

                />

              </label>



              <label>

                Amount



                <input

                  type="number"

                  min="1"

                  step="0.01"

                  placeholder="e.g. 500"

                  value={amount}

                  onChange={(event) =>

                    setAmount(event.target.value)

                  }

                  required

                />

              </label>



              <label>

                Type



                <select

                  value={type}

                  onChange={(event) => {

                    const nextType = event.target.value



                    setType(nextType)



                    setCategory(

                      nextType === 'Income'

                        ? 'Salary'

                        : 'Food'

                    )

                  }}

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

                  value={category}

                  onChange={(event) =>

                    setCategory(event.target.value)

                  }

                >

                  {type === 'Income' ? (

                    <>

                      <option value="Salary">

                        Salary

                      </option>



                      <option value="Other">

                        Other

                      </option>

                    </>

                  ) : (

                    <>

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



                      <option value="Other">

                        Other

                      </option>

                    </>

                  )}

                </select>

              </label>



              <button

                type="submit"

                className="save-btn"

              >

                Save Transaction

              </button>

            </form>

          </div>

        </div>

      )}

    </div>

  )

}



export default App