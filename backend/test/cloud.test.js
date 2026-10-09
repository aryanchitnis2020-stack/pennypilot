import test from 'node:test';
import assert from 'node:assert/strict';
import { hasLocalData, sameSnapshot } from '../../src/lib/cloudData.js';

const empty = { openingBalance: null, transactions: [], budgetPlan: null, savingsGoals: [], recurringPayments: [] };

test('empty data is not considered an existing local account', () => {
  assert.equal(hasLocalData(empty), false);
});
test('zero opening balance is a deliberate setup', () => {
  assert.equal(hasLocalData({ ...empty, openingBalance: 0 }), true);
});
test('JSONB key reordering does not cause a false cloud conflict', () => {
  const first = { ...empty, transactions: [{ id: 123, title: 'Food', amount: 30, category: 'Food' }] };
  const reordered = { transactions: [{ category: 'Food', amount: 30, title: 'Food', id: 123 }], recurringPayments: [], savingsGoals: [], budgetPlan: null, openingBalance: null };
  assert.equal(sameSnapshot(first, reordered), true);
});
test('real transaction changes are detected', () => {
  const first = { ...empty, transactions: [{ id: 123, amount: 30 }] };
  const second = { ...empty, transactions: [{ id: 123, amount: 50 }] };
  assert.equal(sameSnapshot(first, second), false);
});
