import type { TransactionWithCategory } from './types'

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Rango de fechas (inclusive) de un mes calendario. month: 1-12 */
export function getMonthBounds(year: number, month: number) {
  const from = new Date(year, month - 1, 1)
  const to = new Date(year, month, 0)
  return { from: toISODate(from), to: toISODate(to) }
}

/** Rango de fechas (inclusive) de un trimestre calendario. quarter: 1-4 */
export function getQuarterBounds(year: number, quarter: number) {
  const startMonth = (quarter - 1) * 3
  const from = new Date(year, startMonth, 1)
  const to = new Date(year, startMonth + 3, 0)
  return { from: toISODate(from), to: toISODate(to) }
}

export interface PeriodPoint {
  label: string
  income: number
  expenses: number
  balance: number
}

/** Agrupa transacciones de UN mes en buckets semanales (Sem 1, Sem 2...). */
export function groupByWeekOfMonth(
  transactions: TransactionWithCategory[],
  year: number,
  month: number // 1-12
): PeriodPoint[] {
  const daysInMonth = new Date(year, month, 0).getDate()
  const bucketCount = Math.ceil(daysInMonth / 7)
  const buckets: PeriodPoint[] = Array.from({ length: bucketCount }, (_, i) => ({
    label: `Sem ${i + 1}`,
    income: 0,
    expenses: 0,
    balance: 0,
  }))

  for (const t of transactions) {
    const day = Number(t.date.slice(8, 10))
    const idx = Math.min(bucketCount - 1, Math.floor((day - 1) / 7))
    if (t.categories?.type === 'ingreso') buckets[idx].income += t.amount_usd
    else if (t.categories?.type === 'gasto') buckets[idx].expenses += t.amount_usd
  }
  buckets.forEach((b) => (b.balance = b.income - b.expenses))
  return buckets
}

/** Agrupa transacciones en buckets mensuales, arrancando en (year, startMonth). */
export function groupByMonthRange(
  transactions: TransactionWithCategory[],
  year: number,
  startMonth: number, // 0-indexed (0 = enero)
  count: number
): PeriodPoint[] {
  const buckets: PeriodPoint[] = Array.from({ length: count }, (_, i) => {
    const d = new Date(year, startMonth + i, 1)
    return { label: d.toLocaleDateString('es-VE', { month: 'short' }), income: 0, expenses: 0, balance: 0 }
  })

  for (const t of transactions) {
    const d = new Date(`${t.date}T00:00:00`)
    const idx = d.getMonth() - startMonth + (d.getFullYear() - year) * 12
    if (idx < 0 || idx >= count) continue
    if (t.categories?.type === 'ingreso') buckets[idx].income += t.amount_usd
    else if (t.categories?.type === 'gasto') buckets[idx].expenses += t.amount_usd
  }
  buckets.forEach((b) => (b.balance = b.income - b.expenses))
  return buckets
}

export interface MonthlyPoint {
  month: string // 'YYYY-MM'
  label: string // 'ene 2026'
  income: number
  expenses: number
  balance: number
}

/** Agrupa transacciones por mes calendario y suma ingresos/gastos en USD. */
export function groupByMonth(transactions: TransactionWithCategory[]): MonthlyPoint[] {
  const map = new Map<string, { income: number; expenses: number }>()

  for (const t of transactions) {
    const month = t.date.slice(0, 7) // 'YYYY-MM'
    const entry = map.get(month) ?? { income: 0, expenses: 0 }

    if (t.categories?.type === 'ingreso') entry.income += t.amount_usd
    else if (t.categories?.type === 'gasto') entry.expenses += t.amount_usd

    map.set(month, entry)
  }

  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { income, expenses }]) => ({
      month,
      label: new Date(`${month}-01T00:00:00`).toLocaleDateString('es-VE', {
        month: 'short',
        year: 'numeric',
      }),
      income,
      expenses,
      balance: income - expenses,
    }))
}