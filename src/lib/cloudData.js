export const DATA_CHANGED_EVENT = 'pennypilot:data-changed'
export const OWNER_KEY = 'pennypilot-active-user-id'

const keys = {
  openingBalance: 'pennypilot-opening-balance-v1',
  transactions: 'pennypilot-transactions',
  budgetPlan: 'pennypilot-budget-plan-v2',
  savingsGoals: 'pennypilot-savings-goals-v1',
  recurringPayments: 'pennypilot-recurring-payments-v1',
}

const parse = (value, fallback) => {
  if (value === null) return fallback
  try { return JSON.parse(value) } catch { return fallback }
}

export function readSnapshot() {
  const balanceText = localStorage.getItem(keys.openingBalance)
  const balance = balanceText === null ? null : Number(balanceText)
  return {
    openingBalance: balance !== null && Number.isFinite(balance) && balance >= 0 ? balance : null,
    transactions: parse(localStorage.getItem(keys.transactions), []),
    budgetPlan: parse(localStorage.getItem(keys.budgetPlan), null),
    savingsGoals: parse(localStorage.getItem(keys.savingsGoals), []),
    recurringPayments: parse(localStorage.getItem(keys.recurringPayments), []),
  }
}

export function hasLocalData(data) {
  return data.openingBalance !== null || data.budgetPlan !== null ||
    data.transactions.length > 0 || data.savingsGoals.length > 0 || data.recurringPayments.length > 0
}

export function hydrateSnapshot(data) {
  const snapshot = data ?? {
    openingBalance: null,
    transactions: [], budgetPlan: null, savingsGoals: [], recurringPayments: [],
  }
  if (snapshot.openingBalance === null) localStorage.removeItem(keys.openingBalance)
  else localStorage.setItem(keys.openingBalance, String(snapshot.openingBalance))
  if (snapshot.budgetPlan === null) localStorage.removeItem(keys.budgetPlan)
  else localStorage.setItem(keys.budgetPlan, JSON.stringify(snapshot.budgetPlan))
  for (const key of ['transactions', 'savingsGoals', 'recurringPayments']) {
    localStorage.setItem(keys[key], JSON.stringify(snapshot[key] ?? []))
  }
}

export function clearSnapshot() {
  Object.values(keys).forEach((key) => localStorage.removeItem(key))
  localStorage.removeItem(OWNER_KEY)
}

// Existing pages keep their local-first state; this event triggers authenticated cloud sync.
export function writeLocalData(key, value) {
  // Mounting a page must not bump the cloud version if nothing changed.
  if (localStorage.getItem(key) === value) return
  localStorage.setItem(key, value)
  window.dispatchEvent(new Event(DATA_CHANGED_EVENT))
}

export function removeLocalData(key) {
  if (localStorage.getItem(key) === null) return
  localStorage.removeItem(key)
  window.dispatchEvent(new Event(DATA_CHANGED_EVENT))
}

export function backupLocalData() {
  const data = readSnapshot()
  if (!hasLocalData(data)) return
  const key = `pennypilot-backup-${new Date().toISOString()}`
  localStorage.setItem(key, JSON.stringify(data))
}

export function downloadLocalBackup() {
  const blob = new Blob([JSON.stringify(readSnapshot(), null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `pennypilot-backup-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function normalizeKeys(value) {
  if (Array.isArray(value)) return value.map(normalizeKeys)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, normalizeKeys(value[key])]))
  }
  return value
}

export function sameSnapshot(left, right) {
  return JSON.stringify(normalizeKeys(left)) === JSON.stringify(normalizeKeys(right))
}
