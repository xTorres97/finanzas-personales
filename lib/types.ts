export type CurrencyCode = 'USD' | 'VES' | 'EUR'
export type CategoryType = 'ingreso' | 'gasto'

export interface Category {
  id: string
  household_id: string
  name: string
  type: CategoryType
  icon: string | null
  color: string | null
  sort_order: number
  is_savings: boolean
  is_debt: boolean
}

export interface SavingsWithdrawal {
  id: string
  household_id: string
  category_id: string
  subcategory_id: string | null
  amount: number
  created_at: string
}

export interface Debt {
  id: string
  household_id: string
  name: string
  principal_amount: number
  currency: CurrencyCode
  due_date: string | null
  created_at: string
}

export interface DebtPayment {
  id: string
  debt_id: string
  amount: number
  created_at: string
}

export interface Subcategory {
  id: string
  category_id: string
  name: string
  sort_order: number
}

export interface Transaction {
  id: string
  household_id: string
  category_id: string
  subcategory_id: string | null
  amount: number
  currency: CurrencyCode
  exchange_rate: number | null
  amount_usd: number
  description: string | null
  date: string // ISO date
  created_by: string | null
  created_at: string
}

export interface SavingsGoal {
  id: string
  household_id: string
  name: string
  target_amount: number
  current_amount: number
  currency: CurrencyCode
  target_date: string | null
}

/** Fila de `transactions` con el join `categories(name, type, color)`. */
export interface TransactionWithCategory extends Transaction {
  categories: Pick<Category, 'name' | 'type' | 'color'> | null
}

export interface GoalContribution {
  id: string
  goal_id: string
  amount: number
  created_at: string
}

export interface MonthlySummary {
  month: string // 'YYYY-MM'
  totalIncome: number
  totalExpenses: number
  balance: number
  byCategory: { categoryId: string; categoryName: string; total: number; color: string | null }[]
}