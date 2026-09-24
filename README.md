# PennyPilot

PennyPilot is a personal finance management web application built to help users track income, expenses, budgets, and spending patterns from a simple and interactive dashboard.

> PennyPilot is currently under active development. The current version stores data locally in the browser. Authentication and database integration are planned for the full-stack version.

---

## Features

### Dashboard
- Opening balance setup
- Current balance calculation
- Income and expense tracking
- Recorded savings rate
- Spending overview
- Recent transactions
- Monthly budget overview

### Transactions
- Add income and expenses
- Edit transactions
- Delete transactions
- Search transactions
- Filter by transaction type
- Filter by category
- Automatic dashboard updates

### Budget Management
- Create monthly budget
- Allocate budget across categories
- Edit budget plan
- Reset budget
- Start a new monthly cycle
- Track spent and remaining amount
- Budget usage percentage
- Safe, Watch, Warning and Over Budget states

### Advanced Analytics
- Income vs Expenses visualization
- Report period filtering
- Category-wise spending analysis
- Net cash flow
- Savings rate analysis
- Largest expense detection
- Largest spending category
- Transaction summary

---

## Tech Stack

- React
- Vite
- JavaScript
- CSS
- Recharts
- LocalStorage
- Git & GitHub

---

## How PennyPilot Works

PennyPilot currently stores financial data inside the user's browser using LocalStorage.

The dashboard calculates:

Current Balance = Opening Balance + Income - Expenses

Opening Balance is not counted as income.

Analytics uses recorded transactions to calculate spending patterns and financial reports.

---

## Getting Started

Clone the repository:

```bash
git clone https://github.com/aryanchitnis2020-stack/pennypilot.git