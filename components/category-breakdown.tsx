'use client'

import type { TransactionWithCategory } from '@/lib/types'

interface Props {
  transactions: TransactionWithCategory[]
}

export function CategoryBreakdown({ transactions }: Props) {
  const expenses = transactions.filter((t) => t.categories?.type === 'gasto')
  const total = expenses.reduce((sum, t) => sum + t.amount_usd, 0)

  const byCategory = new Map<string, { name: string; total: number; color: string }>()
  for (const t of expenses) {
    const key = t.categories?.name ?? 'Otros'
    const existing = byCategory.get(key)
    const color = t.categories?.color ?? 'var(--expense)'
    if (existing) {
      existing.total += t.amount_usd
    } else {
      byCategory.set(key, { name: key, total: t.amount_usd, color })
    }
  }

  const rows = [...byCategory.values()].sort((a, b) => b.total - a.total)

  if (rows.length === 0 || total === 0) {
    return <p className="text-sm text-[var(--muted)]">Sin gastos registrados este mes.</p>
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const pct = Math.round((row.total / total) * 100)
        return (
          <div key={row.name}>
            <div className="mb-1 flex items-baseline justify-between text-sm">
              <span>{row.name}</span>
              <span className="tabular-nums text-[var(--muted)]">
                {row.total.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} · {pct}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: 'var(--border)' }}>
              <div
                className="h-full rounded-full transition-[width]"
                style={{ width: `${pct}%`, background: row.color }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}