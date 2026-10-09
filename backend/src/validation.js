const money = (value, allowZero = false) =>
  typeof value === "number" && Number.isFinite(value) &&
  value >= (allowZero ? 0 : Number.EPSILON) && value <= 1_000_000_000_000;
const label = (value, max = 120) =>
  typeof value === "string" && value.trim().length > 0 && value.length <= max;
const optionalText = (value, max = 80) =>
  value == null || (typeof value === "string" && value.length <= max);
const id = (value) => Number.isSafeInteger(value) && value >= 0;

export function validSnapshot(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return false;
  if (data.openingBalance !== null && !money(data.openingBalance, true)) return false;
  if (!Array.isArray(data.transactions) || data.transactions.length > 3000) return false;
  if (!Array.isArray(data.savingsGoals) || data.savingsGoals.length > 500) return false;
  if (!Array.isArray(data.recurringPayments) || data.recurringPayments.length > 500) return false;

  if (!data.transactions.every((t) => t && id(t.id) && label(t.title) &&
    money(t.amount) && ["Income", "Expense"].includes(t.type) &&
    label(t.category, 80) && optionalText(t.date, 80) &&
    optionalText(t.createdAt, 80))) return false;

  if (data.budgetPlan !== null) {
    const b = data.budgetPlan;
    if (!b || typeof b !== "object" || !money(b.monthlyBudget) ||
      (b.cycleStart != null && !id(b.cycleStart)) ||
      !Array.isArray(b.allocations) || b.allocations.length > 30 ||
      !b.allocations.every((a) => a && label(a.category, 80) && money(a.limit))) return false;
  }

  if (!data.savingsGoals.every((g) => g && id(g.id) && label(g.name) &&
    money(g.target) && money(g.saved, true) && g.saved <= g.target &&
    optionalText(g.deadline, 40))) return false;

  if (!data.recurringPayments.every((p) => p && id(p.id) && label(p.name) &&
    money(p.amount) && label(p.category, 80) &&
    ["Weekly", "Monthly", "Yearly"].includes(p.frequency) &&
    /^\d{4}-\d{2}-\d{2}$/.test(p.nextDue ?? "") &&
    ["Active", "Paused"].includes(p.status) &&
    optionalText(p.createdAt, 80))) return false;

  return true;
}

