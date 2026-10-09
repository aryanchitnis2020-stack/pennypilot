import test from 'node:test';
import assert from 'node:assert/strict';
import { validSnapshot } from '../src/validation.js';

const sample = () => ({
  openingBalance: 0,
  transactions: [{ id: 1720000000000, title: 'Salary', amount: 5000, type: 'Income', category: 'Salary', date: 'Jul 3', createdAt: '2026-07-03T00:00:00.000Z' }],
  budgetPlan: { monthlyBudget: 2000, cycleStart: null, allocations: [{ category: 'Food', limit: 1200 }] },
  savingsGoals: [{ id: 1720000000001, name: 'Laptop', target: 10000, saved: 500, deadline: '' }],
  recurringPayments: [{ id: 1720000000002, name: 'Netflix', amount: 199, category: 'Subscriptions', frequency: 'Monthly', nextDue: '2026-10-15', status: 'Active', createdAt: '2026-10-01T00:00:00.000Z' }],
});

test('accepts a valid full PennyPilot snapshot', () => assert.equal(validSnapshot(sample()), true));
test('accepts a fresh account snapshot', () => assert.equal(validSnapshot({ openingBalance: null, transactions: [], budgetPlan: null, savingsGoals: [], recurringPayments: [] }), true));
test('accepts legacy budgets without cycleStart', () => { const data=sample(); delete data.budgetPlan.cycleStart; assert.equal(validSnapshot(data), true); });
test('rejects negative balance', () => { const data=sample(); data.openingBalance=-10; assert.equal(validSnapshot(data), false); });
test('rejects invalid transaction type', () => { const data=sample(); data.transactions[0].type='HACK'; assert.equal(validSnapshot(data), false); });
test('rejects invalid recurring payment status', () => { const data=sample(); data.recurringPayments[0].status='UNSAFE'; assert.equal(validSnapshot(data), false); });
test('rejects oversized transaction collections', () => { const data=sample(); data.transactions=Array(3001).fill(data.transactions[0]); assert.equal(validSnapshot(data), false); });
test('rejects savings exceeding target', () => { const data=sample(); data.savingsGoals[0].saved=20000; assert.equal(validSnapshot(data), false); });
